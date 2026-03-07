import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, checkMembership } from '../supabase';

/**
 * ZIEN Auth Routes — Invite-Only System
 * 
 * POST /api/auth/verify-turnstile       — Verify Turnstile token
 * GET  /api/auth/me                     — Get current user profile + memberships
 * POST /api/auth/check-email            — Check if email is allowed to register
 * POST /api/auth/register               — Register a new user (must be in allowed_signups)
 * POST /api/auth/register-company       — Register a company + create GM account (OnboardingWizard)
 * POST /api/auth/invite                 — Invite a user to a company (GM only)
 * POST /api/auth/accept-invite          — Accept an invitation using token
 * POST /api/auth/set-password           — Set/reset password for existing user
 */
export async function handleAuth(
  request: Request,
  env: Env,
  path: string,
): Promise<Response> {
  if (path === '/api/auth/verify-turnstile' && request.method === 'POST') {
    return verifyTurnstile(request, env);
  }

  if (path === '/api/auth/me' && request.method === 'GET') {
    return getMe(request, env);
  }

  if (path === '/api/auth/check-email' && request.method === 'POST') {
    return checkEmail(request, env);
  }

  if (path === '/api/auth/register' && request.method === 'POST') {
    return registerUser(request, env);
  }

  if (path === '/api/auth/register-company' && request.method === 'POST') {
    return registerCompany(request, env);
  }

  if (path === '/api/auth/invite' && request.method === 'POST') {
    return inviteUser(request, env);
  }

  if (path === '/api/auth/accept-invite' && request.method === 'POST') {
    return acceptInvite(request, env);
  }

  if (path === '/api/auth/set-password' && request.method === 'POST') {
    return setPassword(request, env);
  }

  return errorResponse('Not found', 404);
}

async function verifyTurnstile(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { token?: string };
  if (!body.token) return errorResponse('Missing token');

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: body.token,
    }),
  });

  const result = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
  if (!result.success) {
    return errorResponse('Turnstile verification failed', 403);
  }

  return jsonResponse({ success: true });
}

async function getMe(request: Request, env: Env): Promise<Response> {
  const { userId, email, supabase } = await requireAuth(request, env);
  const admin = createAdminClient(env);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Use admin client to bypass RLS on company_members
  const { data: memberships } = await admin
    .from('company_members')
    .select('*, companies(id, name, slug, status)')
    .eq('user_id', userId)
    .eq('status', 'active');

  return jsonResponse({
    user: { id: userId, email },
    profile,
    memberships: memberships ?? [],
  });
}

// ─── CHECK EMAIL ────────────────────────────────────────────────────────────
// Check if an email is allowed to signup (pre-registration check)
async function checkEmail(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { email?: string };
  if (!body.email) return errorResponse('Missing email');

  const admin = createAdminClient(env);
  const email = body.email.toLowerCase().trim();

  const { data } = await admin
    .from('allowed_signups')
    .select('id, email, company_id, role, status, full_name')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  if (!data) {
    return jsonResponse({ allowed: false, message: 'This email is not authorized to register. Please contact your company administrator.' });
  }

  return jsonResponse({ allowed: true, role: data.role, full_name: data.full_name });
}

// ─── REGISTER USER ──────────────────────────────────────────────────────────
// Creates a new user account via Supabase Admin API (bypasses disabled signups)
// Only works for emails in allowed_signups table
async function registerUser(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
  };

  if (!body.email || !body.password) {
    return errorResponse('Missing email or password');
  }

  const admin = createAdminClient(env);
  const email = body.email.toLowerCase().trim();

  // 1. Verify email is in allowed_signups (pending status)
  const { data: allowed } = await admin
    .from('allowed_signups')
    .select('*')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  if (!allowed) {
    return errorResponse('This email is not authorized to register. Only invited users can create accounts.', 403);
  }

  // 2. Check if invite has expired
  if (allowed.expires_at && new Date(allowed.expires_at) < new Date()) {
    await admin.from('allowed_signups').update({ status: 'expired' }).eq('id', allowed.id);
    return errorResponse('This invitation has expired. Please request a new one.', 410);
  }

  // 3. Create user via Admin API (bypasses email confirmation + disabled signups)
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true, // Auto-confirm since they were invited
    user_metadata: {
      full_name: body.full_name || allowed.full_name || '',
      phone: body.phone || '',
      platform_role: allowed.role === 'platform_admin' ? 'platform_admin' : 'user',
    },
  });

  if (createError) {
    // User might already exist (e.g. from OAuth)
    if (createError.message?.includes('already been registered')) {
      // Mark allowed_signup as used
      await admin.from('allowed_signups').update({ status: 'used', used_at: new Date().toISOString() }).eq('id', allowed.id);
      return jsonResponse({ success: true, message: 'Account already exists. Please log in.', existing: true });
    }
    return errorResponse(`Registration failed: ${createError.message}`, 500);
  }

  // 4. Create profile
  await admin.from('profiles').upsert({
    id: newUser.user.id,
    email,
    full_name: body.full_name || allowed.full_name || '',
    phone: body.phone || '',
    avatar_url: '',
    platform_role: allowed.role === 'platform_admin' ? 'platform_admin' : 'user',
  });

  // 5. Add to company if company_id exists
  if (allowed.company_id) {
    await admin.from('company_members').insert({
      company_id: allowed.company_id,
      user_id: newUser.user.id,
      role_code: allowed.role || 'employee',
      status: 'active',
      is_primary: false,
      joined_at: new Date().toISOString(),
    });
  }

  // 6. Mark allowed_signup as used
  await admin.from('allowed_signups').update({
    status: 'used',
    used_at: new Date().toISOString(),
  }).eq('id', allowed.id);

  // 7. Add to platform_roles if platform role
  if (allowed.role === 'platform_admin' || allowed.role === 'platform_support') {
    await admin.from('platform_roles').upsert({
      user_id: newUser.user.id,
      role_code: allowed.role,
    });
  }

  return jsonResponse({
    success: true,
    user: { id: newUser.user.id, email: newUser.user.email },
    message: 'Account created successfully. You can now log in.',
  });
}

// ─── REGISTER COMPANY ───────────────────────────────────────────────────────
// Called by OnboardingWizard: creates company + GM user + starts provisioning
// This is the ONLY public registration endpoint (no auth required)
async function registerCompany(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    // Company info
    company_name: string;
    company_name_ar?: string;
    industry?: string;
    company_type?: string;
    company_size?: string;
    cr_number?: string;
    tax_number?: string;
    address?: string;
    city?: string;
    country?: string;
    // GM info
    gm_email: string;
    gm_password: string;
    gm_name: string;
    gm_phone?: string;
    // Modules & billing
    selected_modules?: string[];
    billing_cycle?: string;
    // Turnstile
    turnstile_token?: string;
  };

  if (!body.company_name || !body.gm_email || !body.gm_password || !body.gm_name) {
    return errorResponse('Missing required fields: company_name, gm_email, gm_password, gm_name');
  }

  const admin = createAdminClient(env);
  const gmEmail = body.gm_email.toLowerCase().trim();

  // 1. Verify Turnstile if provided
  if (body.turnstile_token && env.TURNSTILE_SECRET_KEY) {
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: body.turnstile_token }),
    });
    const turnstileResult = (await turnstileRes.json()) as { success: boolean };
    if (!turnstileResult.success) {
      return errorResponse('Captcha verification failed', 403);
    }
  }

  // 2. Check email not already used
  const { data: existingUser } = await admin.auth.admin.listUsers();
  const alreadyExists = existingUser?.users?.find(
    (u: { email?: string }) => u.email?.toLowerCase() === gmEmail,
  );

  let userId: string;

  if (alreadyExists) {
    // If user exists but has no company, allow them to register a company
    const { data: existingMembership } = await admin
      .from('company_members')
      .select('id')
      .eq('user_id', alreadyExists.id)
      .eq('status', 'active')
      .limit(1);

    if (existingMembership && existingMembership.length > 0) {
      return errorResponse('This email already has an active company. Please log in.', 409);
    }

    userId = alreadyExists.id;
    // Update password if needed
    await admin.auth.admin.updateUserById(userId, { password: body.gm_password });
  } else {
    // 3. Create GM user via Admin API
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: gmEmail,
      password: body.gm_password,
      email_confirm: true,
      user_metadata: {
        full_name: body.gm_name,
        phone: body.gm_phone || '',
        platform_role: 'user',
      },
    });

    if (createError) {
      return errorResponse(`Failed to create account: ${createError.message}`, 500);
    }
    userId = newUser.user.id;
  }

  // 4. Create profile
  await admin.from('profiles').upsert({
    id: userId,
    email: gmEmail,
    full_name: body.gm_name,
    phone: body.gm_phone || '',
    platform_role: 'user',
  });

  // 5. Create company
  const slug = body.company_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  const { data: company, error: companyErr } = await admin.from('companies').insert({
    name: body.company_name,
    name_ar: body.company_name_ar || '',
    slug: `${slug}-${Date.now().toString(36)}`,
    industry: body.industry || '',
    company_type: body.company_type || 'startup',
    company_size: body.company_size || 'small',
    cr_number: body.cr_number || '',
    tax_number: body.tax_number || '',
    address: body.address || '',
    city: body.city || '',
    country: body.country || 'SA',
    owner_user_id: userId,
    status: 'pending_payment',
  }).select().single();

  if (companyErr) {
    return errorResponse(`Failed to create company: ${companyErr.message}`, 500);
  }

  // 6. Add GM as company member
  await admin.from('company_members').insert({
    company_id: company.id,
    user_id: userId,
    role_code: 'company_gm',
    status: 'active',
    is_primary: true,
    joined_at: new Date().toISOString(),
  });

  // 7. Add GM email to allowed_signups (mark as used)
  await admin.from('allowed_signups').upsert({
    email: gmEmail,
    company_id: company.id,
    role: 'company_gm',
    full_name: body.gm_name,
    status: 'used',
    used_at: new Date().toISOString(),
  }, { onConflict: 'email,company_id' });

  // 8. Activate selected modules
  if (body.selected_modules && body.selected_modules.length > 0) {
    const moduleInserts = body.selected_modules.map((mod: string) => ({
      company_id: company.id,
      module_key: mod,
      is_active: true,
    }));
    await admin.from('company_modules').insert(moduleInserts);
  }

  return jsonResponse({
    success: true,
    company: { id: company.id, name: company.name, slug: company.slug },
    user: { id: userId, email: gmEmail },
    message: 'Company registered successfully. You can now log in.',
    next_step: 'login',
  });
}

// ─── INVITE USER ────────────────────────────────────────────────────────────
// GM invites a team member to their company
async function inviteUser(request: Request, env: Env): Promise<Response> {
  const { userId, supabase } = await requireAuth(request, env);
  const admin = createAdminClient(env);

  const body = (await request.json()) as {
    email: string;
    role?: string;
    full_name?: string;
    company_id: string;
  };

  if (!body.email || !body.company_id) {
    return errorResponse('Missing email or company_id');
  }

  // 1. Verify caller is GM of the company
  const membership = await checkMembership(env, userId, body.company_id);

  if (!membership || membership.role !== 'company_gm') {
    return errorResponse('Only the company GM can invite users', 403);
  }

  const email = body.email.toLowerCase().trim();
  const role = body.role || 'employee';

  // 2. Check if already invited
  const { data: existing } = await admin
    .from('allowed_signups')
    .select('id, status')
    .eq('email', email)
    .eq('company_id', body.company_id)
    .maybeSingle();

  if (existing && existing.status === 'used') {
    return errorResponse('This user has already registered', 409);
  }

  // 3. Create/update allowed_signup entry
  const { data: invite, error: inviteErr } = await admin
    .from('allowed_signups')
    .upsert({
      email,
      company_id: body.company_id,
      role,
      full_name: body.full_name || '',
      invited_by: userId,
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'email,company_id' })
    .select()
    .single();

  if (inviteErr) {
    return errorResponse(`Failed to create invitation: ${inviteErr.message}`, 500);
  }

  // 4. Also create in company_invitations for the UI
  await admin.from('company_invitations').upsert({
    company_id: body.company_id,
    email,
    role,
    invited_name: body.full_name || '',
    token: invite.token,
    status: 'pending',
    invited_by: userId,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: 'company_id,email' }).catch(() => { });

  // 5. Get company name for the email
  const { data: companyData } = await admin
    .from('companies')
    .select('name')
    .eq('id', body.company_id)
    .single();
  const companyName = companyData?.name || 'ZIEN Platform';

  // 6. Send invitation email via Resend API
  let emailSent = false;
  if (env.RESEND_API_KEY) {
    const acceptUrl = `https://app.zien-ai.app/auth/accept-invite?token=${invite.token}`;
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: env.RESEND_FROM_EMAIL || 'ZIEN Platform <noreply@zien-ai.app>',
          to: [email],
          subject: `You're invited to join ${companyName} on ZIEN Platform`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
              <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <img src="https://app.zien-ai.app/zien-logo.png" alt="ZIEN" style="height: 48px; margin-bottom: 16px;" />
                  <h1 style="color: #1e293b; font-size: 24px; margin: 0;">You're Invited! 🎉</h1>
                </div>
                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                  ${body.full_name ? `Hi ${body.full_name},` : 'Hello,'}<br><br>
                  You've been invited to join <strong>${companyName}</strong> on <strong>ZIEN Platform</strong> as <strong>${role}</strong>.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${acceptUrl}" style="display: inline-block; background: #2563eb; color: white; font-weight: bold; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px;">
                    Accept Invitation
                  </a>
                </div>
                <p style="color: #94a3b8; font-size: 13px; text-align: center;">
                  This invitation expires in 30 days.<br>
                  If you didn't expect this email, you can safely ignore it.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                  Powered by ZIEN Platform · Powered by RARE AI
                </p>
              </div>
            </div>
          `,
        }),
      });
      emailSent = emailRes.ok;
      if (!emailRes.ok) {
        console.error('Resend error:', await emailRes.text());
      }
    } catch (e) {
      console.error('Email send error:', e);
    }
  }

  return jsonResponse({
    success: true,
    invitation: {
      id: invite.id,
      email,
      token: invite.token,
      expires_at: invite.expires_at,
    },
    email_sent: emailSent,
    message: emailSent
      ? `Invitation sent to ${email}`
      : `Invitation created for ${email} (email delivery requires RESEND_API_KEY)`,
  });
}

// ─── ACCEPT INVITE ──────────────────────────────────────────────────────────
// Public endpoint: validate invitation token and register
async function acceptInvite(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    token: string;
    password: string;
    full_name?: string;
    phone?: string;
  };

  if (!body.token || !body.password) {
    return errorResponse('Missing token or password');
  }

  const admin = createAdminClient(env);

  // 1. Find the invitation
  const { data: invite } = await admin
    .from('allowed_signups')
    .select('*')
    .eq('token', body.token)
    .eq('status', 'pending')
    .maybeSingle();

  if (!invite) {
    return errorResponse('Invalid or expired invitation', 404);
  }

  // 2. Check expiry
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await admin.from('allowed_signups').update({ status: 'expired' }).eq('id', invite.id);
    return errorResponse('This invitation has expired', 410);
  }

  // 3. Create user
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      full_name: body.full_name || invite.full_name || '',
      phone: body.phone || '',
      platform_role: 'user',
    },
  });

  let userId: string;
  if (createError) {
    if (createError.message?.includes('already been registered')) {
      // User exists—look up their ID
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const found = existingUsers?.users?.find(
        (u: { email?: string }) => u.email?.toLowerCase() === invite.email.toLowerCase(),
      );
      if (!found) return errorResponse('Account error', 500);
      userId = found.id;
      // Update password
      await admin.auth.admin.updateUserById(userId, { password: body.password });
    } else {
      return errorResponse(`Registration failed: ${createError.message}`, 500);
    }
  } else {
    userId = newUser.user.id;
  }

  // 4. Create profile
  await admin.from('profiles').upsert({
    id: userId,
    email: invite.email,
    full_name: body.full_name || invite.full_name || '',
    phone: body.phone || '',
    platform_role: 'user',
  });

  // 5. Add to company
  if (invite.company_id) {
    await admin.from('company_members').upsert({
      company_id: invite.company_id,
      user_id: userId,
      role_code: invite.role || 'employee',
      status: 'active',
      is_primary: false,
      joined_at: new Date().toISOString(),
    }, { onConflict: 'company_id,user_id' });
  }

  // 6. Mark as used
  await admin.from('allowed_signups').update({
    status: 'used',
    used_at: new Date().toISOString(),
  }).eq('id', invite.id);

  // Also update company_invitations
  await admin.from('company_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('token', body.token)
    .catch(() => { });

  return jsonResponse({
    success: true,
    user: { id: userId, email: invite.email },
    message: 'Account created. You can now log in.',
  });
}

// ─── SET PASSWORD ───────────────────────────────────────────────────────────
// Allows authenticated user to set/change their password
async function setPassword(request: Request, env: Env): Promise<Response> {
  const { userId } = await requireAuth(request, env);
  const admin = createAdminClient(env);

  const body = (await request.json()) as { password: string };
  if (!body.password || body.password.length < 8) {
    return errorResponse('Password must be at least 8 characters');
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: body.password,
  });

  if (error) {
    return errorResponse(`Failed to set password: ${error.message}`, 500);
  }

  return jsonResponse({ success: true, message: 'Password updated successfully' });
}
