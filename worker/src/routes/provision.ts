import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient } from '../supabase';
import {
  matchBlueprint,
  composeProvisioningPlan,
  executeProvisioningV2,
  type ProvisioningContext,
} from '../engines/provisioningV2';

/**
 * Provisioning routes:
 *   POST /api/provision/start           — kick off provisioning (v1 legacy)
 *   POST /api/provision/v2/start        — kick off provisioning v2 (3-layer)
 *   POST /api/provision/v2/preview      — preview provisioning plan (dry-run)
 *   GET  /api/provision/status/:id      — check provisioning job status
 *   POST /api/provision/retry           — retry a failed provisioning job
 *   GET  /api/provision/blueprints      — list available blueprints
 *   POST /api/provision/estimate-price  — estimate dynamic price (legacy)
 *   POST /api/pricing/generate-quote    — generate dynamic pricing quote
 *   GET  /api/pricing/quote/:id         — get quote by ID
 *   POST /api/pricing/rules             — CRUD pricing rules (founder only)
 */
export async function handleProvision(
  request: Request,
  env: Env,
  path: string,
): Promise<Response> {
  const { userId, supabase } = await requireAuth(request, env);

  // ── v2 provisioning routes ─────────────────────────────────────────────
  if (path === '/api/provision/v2/start' && request.method === 'POST') {
    return startProvisioningV2(request, env, userId, supabase);
  }

  if (path === '/api/provision/v2/preview' && request.method === 'POST') {
    return previewProvisioningV2(request, env, userId, supabase);
  }

  // ── Dynamic pricing routes ─────────────────────────────────────────────
  if (path === '/api/pricing/generate-quote' && request.method === 'POST') {
    return generateDynamicQuote(request, env, userId, supabase);
  }

  const quoteMatch = path.match(/^\/api\/pricing\/quote\/([0-9a-f-]+)$/);
  if (quoteMatch && request.method === 'GET') {
    return getQuote(quoteMatch[1], env, userId, supabase);
  }

  if (path === '/api/pricing/rules' && request.method === 'GET') {
    return listPricingRules(env, supabase);
  }

  // ── Legacy v1 routes (still active) ────────────────────────────────────
  if (path === '/api/provision/start' && request.method === 'POST') {
    return startProvisioning(request, env, userId, supabase);
  }

  if (path === '/api/provision/retry' && request.method === 'POST') {
    return retryProvisioning(request, env, userId, supabase);
  }

  if (path === '/api/provision/blueprints' && request.method === 'GET') {
    return listBlueprints(request, env, supabase);
  }

  if (path === '/api/provision/estimate-price' && request.method === 'POST') {
    return estimatePrice(request, env, supabase);
  }

  // GET /api/provision/status/<jobId>
  const statusMatch = path.match(/^\/api\/provision\/status\/([0-9a-f-]+)$/);
  if (statusMatch && request.method === 'GET') {
    return getProvisioningStatus(statusMatch[1], userId, supabase);
  }

  return errorResponse('Not found', 404);
}

async function startProvisioning(
  request: Request,
  env: Env,
  userId: string,
  userSupabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    companyId: string;
    blueprintId?: string;
    idempotencyKey?: string;
  };

  if (!body.companyId) return errorResponse('Missing companyId');

  // Idempotency check
  if (body.idempotencyKey) {
    const { data: existing } = await userSupabase
      .from('provisioning_jobs')
      .select('id, status')
      .eq('idempotency_key', body.idempotencyKey)
      .maybeSingle();

    if (existing) {
      return jsonResponse({ jobId: existing.id, status: existing.status, idempotent: true });
    }
  }

  // Verify user is company admin
  const { data: company } = await userSupabase
    .from('companies')
    .select('id, company_type_id, owner_user_id')
    .eq('id', body.companyId)
    .single();

  if (!company) return errorResponse('Company not found', 404);
  if (company.owner_user_id !== userId) {
    return errorResponse('Only the company owner can provision', 403);
  }

  // Find blueprint
  const adminClient = createAdminClient(env);
  let blueprintId = body.blueprintId;

  if (!blueprintId && company.company_type_id) {
    const { data: blueprint } = await adminClient
      .from('blueprints')
      .select('id')
      .eq('company_type_id', company.company_type_id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    blueprintId = blueprint?.id;
  }

  // Count steps
  let totalSteps = 3; // base: validate + finalize + modules
  if (blueprintId) {
    const { count } = await adminClient
      .from('blueprint_seed_packs')
      .select('*', { count: 'exact', head: true })
      .eq('blueprint_id', blueprintId);
    totalSteps += (count ?? 0); // +1 per seed pack
  }

  // Create job
  const { data: job, error } = await adminClient
    .from('provisioning_jobs')
    .insert({
      company_id: body.companyId,
      blueprint_id: blueprintId,
      status: 'pending',
      total_steps: totalSteps,
      idempotency_key: body.idempotencyKey,
      requested_by: userId,
      snapshot: { company_type_id: company.company_type_id },
    })
    .select('id, status')
    .single();

  if (error) return errorResponse(error.message, 500);

  // Execute provisioning asynchronously (non-blocking)
  // In production, this would be a Durable Object or Queue
  executeProvisioning(adminClient, job.id, body.companyId, blueprintId).catch((err) =>
    console.error('Provisioning failed:', err),
  );

  return jsonResponse({ jobId: job.id, status: 'pending' }, 202);
}

async function executeProvisioning(
  adminClient: import('@supabase/supabase-js').SupabaseClient,
  jobId: string,
  companyId: string,
  blueprintId?: string,
): Promise<void> {
  const updateJob = async (updates: Record<string, unknown>) =>
    adminClient.from('provisioning_jobs').update(updates).eq('id', jobId);

  try {
    // Step 1: Validate
    await updateJob({ status: 'validating', current_step: 'Validating company', step_index: 0, started_at: new Date().toISOString() });

    const { data: company } = await adminClient
      .from('companies')
      .select('id, company_type_id')
      .eq('id', companyId)
      .single();

    if (!company) throw new Error('Company not found');

    // Step 2: Apply modules
    await updateJob({ status: 'applying_modules', current_step: 'Activating modules', step_index: 1 });

    if (blueprintId) {
      const { data: bpModules } = await adminClient
        .from('blueprint_modules')
        .select('module_id, default_config_json')
        .eq('blueprint_id', blueprintId);

      for (const bm of bpModules ?? []) {
        await adminClient.from('company_modules').upsert(
          {
            company_id: companyId,
            module_id: bm.module_id,
            is_active: true,
            config: bm.default_config_json ?? {},
          },
          { onConflict: 'company_id,module_id' },
        );
      }
    }

    // Step 3: Seed data
    await updateJob({ status: 'seeding', current_step: 'Applying seed data', step_index: 2 });

    if (blueprintId) {
      const { data: seedPacks } = await adminClient
        .from('blueprint_seed_packs')
        .select('seed_packs(kind, payload_json), apply_order')
        .eq('blueprint_id', blueprintId)
        .order('apply_order');

      for (const sp of seedPacks ?? []) {
        const pack = sp.seed_packs as unknown as { kind: string; payload_json: Record<string, unknown> };
        if (!pack) continue;

        if (pack.kind === 'roles' && (pack.payload_json as { departments?: string[] }).departments) {
          for (const name of (pack.payload_json as { departments: string[] }).departments) {
            await adminClient.from('departments').upsert(
              { company_id: companyId, name, is_active: true },
              { onConflict: 'company_id,name' },
            );
          }
        }

        if (pack.kind === 'tax_config' && (pack.payload_json as { taxes?: unknown[] }).taxes) {
          for (const tax of (pack.payload_json as { taxes: Array<{ name: string; rate: number; country_code: string; is_active: boolean }> }).taxes) {
            await adminClient.from('tax_settings').insert({
              company_id: companyId,
              country_code: tax.country_code,
              tax_name: tax.name,
              tax_rate: tax.rate,
              is_active: tax.is_active,
            });
          }
        }
      }
    }

    // Step 4: Finalize
    await updateJob({
      status: 'completed',
      current_step: 'Done',
      step_index: 3,
      completed_at: new Date().toISOString(),
    });

    // Activate the company
    await adminClient
      .from('companies')
      .update({ status: 'active' })
      .eq('id', companyId)
      .eq('status', 'pending_review');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateJob({
      status: 'failed',
      error_message: message,
      logs: [message],
    });
  }
}

async function getProvisioningStatus(
  jobId: string,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const { data: job, error } = await supabase
    .from('provisioning_jobs')
    .select('id, status, current_step, step_index, total_steps, error_message, started_at, completed_at, requested_by, company_id')
    .eq('id', jobId)
    .single();

  if (error || !job) return errorResponse('Job not found', 404);

  // Ownership check: user must be the requester or a member of the company
  if (job.requested_by !== userId) {
    const { data: membership } = await supabase
      .from('company_members')
      .select('id')
      .eq('company_id', job.company_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (!membership) return errorResponse('Access denied — you do not own this provisioning job', 403);
  }

  return jsonResponse(job);
}

// ─── Retry a failed provisioning job ─────────────────────────────────────────

async function retryProvisioning(
  request: Request,
  env: Env,
  userId: string,
  userSupabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as { jobId: string };
  if (!body.jobId) return errorResponse('Missing jobId');

  const adminClient = createAdminClient(env);

  const { data: job } = await adminClient
    .from('provisioning_jobs')
    .select('id, company_id, blueprint_id, status, requested_by')
    .eq('id', body.jobId)
    .single();

  if (!job) return errorResponse('Job not found', 404);
  if (job.status !== 'failed' && job.status !== 'rolled_back') {
    return errorResponse('Only failed or rolled-back jobs can be retried', 400);
  }
  if (job.requested_by !== userId) {
    // Check if user is company owner
    const { data: company } = await userSupabase
      .from('companies')
      .select('owner_user_id')
      .eq('id', job.company_id)
      .single();
    if (!company || company.owner_user_id !== userId) {
      return errorResponse('Only the job requester or company owner can retry', 403);
    }
  }

  // Reset job status
  await adminClient
    .from('provisioning_jobs')
    .update({
      status: 'pending',
      current_step: null,
      step_index: 0,
      error_message: null,
      started_at: null,
      completed_at: null,
    })
    .eq('id', body.jobId);

  // Execute provisioning asynchronously
  executeProvisioning(adminClient, job.id, job.company_id, job.blueprint_id).catch((err) =>
    console.error('Provisioning retry failed:', err),
  );

  return jsonResponse({ jobId: job.id, status: 'pending', retryAttempt: true }, 202);
}

// ─── List available blueprints ───────────────────────────────────────────────

async function listBlueprints(
  request: Request,
  env: Env,
  _supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const url = new URL(request.url);
  const companyTypeId = url.searchParams.get('companyTypeId');
  const includeInactive = url.searchParams.get('includeInactive') === 'true';

  const adminClient = createAdminClient(env);

  let query = adminClient
    .from('blueprints')
    .select(`
      id, name, version, is_active, company_type_id,
      company_types!inner(code, name_en, name_ar),
      blueprint_modules(
        module_id, is_required,
        modules_catalog!inner(code, name_en, name_ar, tier)
      ),
      blueprint_seed_packs(
        apply_order,
        seed_packs!inner(code, kind, description)
      )
    `)
    .order('name');

  if (companyTypeId) {
    query = query.eq('company_type_id', companyTypeId);
  }
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data: blueprints, error } = await query;

  if (error) return errorResponse(error.message, 500);

  const result = (blueprints ?? []).map((bp: Record<string, unknown>) => ({
    id: bp.id,
    name: bp.name,
    version: bp.version,
    isActive: bp.is_active,
    companyType: bp.company_types,
    modules: ((bp.blueprint_modules as Array<Record<string, unknown>>) ?? []).map((bm) => ({
      ...(bm.modules_catalog as Record<string, unknown>),
      isRequired: bm.is_required,
    })),
    seedPacks: ((bp.blueprint_seed_packs as Array<Record<string, unknown>>) ?? []).map((bsp) => ({
      ...(bsp.seed_packs as Record<string, unknown>),
      applyOrder: bsp.apply_order,
    })),
  }));

  return jsonResponse({ blueprints: result });
}

// ─── Estimate dynamic pricing ────────────────────────────────────────────────

async function estimatePrice(
  request: Request,
  env: Env,
  _supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    companyTypeCode?: string;
    employeeCount?: number;
    modules?: string[];
    integrations?: string[];
    countryCode?: string;
  };

  const adminClient = createAdminClient(env);

  // Determine base plan from employee count
  const empCount = body.employeeCount ?? 1;
  let recommendedPlan = 'starter';
  let basePlanMonthly = 99;
  let basePlanYearly = 999;
  let includedSeats = 5;

  if (empCount > 25) {
    recommendedPlan = 'enterprise';
    basePlanMonthly = 799;
    basePlanYearly = 7990;
    includedSeats = 999999; // unlimited
  } else if (empCount > 5) {
    recommendedPlan = 'business';
    basePlanMonthly = 299;
    basePlanYearly = 2990;
    includedSeats = 25;
  }

  // Calculate module add-on costs
  const coreModules = ['hr', 'accounting', 'crm', 'projects', 'chat', 'meetings', 'documents'];
  const requestedModules = body.modules ?? [];
  const addonModules = requestedModules.filter((m) => !coreModules.includes(m));

  // Fetch add-on prices
  const { data: addons } = await adminClient
    .from('pricing_addons')
    .select('code, price_monthly, price_yearly, addon_type, unit_label')
    .eq('is_active', true);

  const moduleAddons: Array<{ code: string; amount: number }> = [];
  let totalModuleAddonCost = 0;

  for (const mod of addonModules) {
    const addonCode = `${mod}_addon`;
    const found = (addons ?? []).find((a: Record<string, unknown>) => a.code === addonCode);
    if (found) {
      moduleAddons.push({ code: addonCode, amount: (found as { price_monthly: number }).price_monthly });
      totalModuleAddonCost += (found as { price_monthly: number }).price_monthly;
    }
  }

  // Seat overage
  const extraSeats = Math.max(0, empCount - includedSeats);
  const seatAddon = (addons ?? []).find((a: Record<string, unknown>) => a.code === 'extra_seats') as { price_per_unit: number } | undefined;
  const seatCost = extraSeats * (seatAddon?.price_per_unit ?? 15);

  // Monthly total
  const monthlyTotal = basePlanMonthly + totalModuleAddonCost + seatCost;
  const yearlyTotal = basePlanYearly + (totalModuleAddonCost + seatCost) * 12;

  return jsonResponse({
    pricing: {
      recommendedPlan,
      monthly: monthlyTotal,
      yearly: yearlyTotal,
      currency: 'AED',
      breakdown: {
        basePlan: { code: recommendedPlan, amount: basePlanMonthly },
        moduleAddons,
        seats: { included: includedSeats, extra: extraSeats, extraCost: seatCost },
        integrations: (body.integrations ?? []).map((code) => ({
          code,
          setupFee: 0,
          monthlyCost: 0,
          note: 'usage-based',
        })),
        aiUsage: {
          included: recommendedPlan === 'enterprise' ? 10000 : recommendedPlan === 'business' ? 1000 : 100,
          monthlyCost: 0,
        },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PROVISIONING V2 ROUTES ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/provision/v2/start — 3-layer provisioning pipeline
 * Body: { companyId, companyTypeId?, country?, industry?, employeeCount?,
 *         requestedModules?, requestedIntegrations?, legalModel?, businessSize?, idempotencyKey? }
 */
async function startProvisioningV2(
  request: Request,
  env: Env,
  userId: string,
  userSupabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as Partial<ProvisioningContext> & { companyId: string };
  if (!body.companyId) return errorResponse('Missing companyId');

  const adminClient = createAdminClient(env);

  // Idempotency check
  if (body.idempotencyKey) {
    const { data: existing } = await adminClient
      .from('provisioning_jobs')
      .select('id, status')
      .eq('idempotency_key', body.idempotencyKey)
      .maybeSingle();

    if (existing) {
      return jsonResponse({ jobId: existing.id, status: existing.status, idempotent: true });
    }
  }

  // Verify user is company owner
  const { data: company } = await userSupabase
    .from('companies')
    .select('id, company_type_id, owner_user_id, country')
    .eq('id', body.companyId)
    .single();

  if (!company) return errorResponse('Company not found', 404);
  if (company.owner_user_id !== userId) {
    return errorResponse('Only the company owner can provision', 403);
  }

  // Build context
  const ctx: ProvisioningContext = {
    companyId: body.companyId,
    companyTypeId: body.companyTypeId ?? company.company_type_id,
    country: body.country ?? company.country,
    industry: body.industry,
    employeeCount: body.employeeCount,
    requestedModules: body.requestedModules,
    requestedIntegrations: body.requestedIntegrations,
    legalModel: body.legalModel,
    businessSize: body.businessSize,
    requestedBy: userId,
    idempotencyKey: body.idempotencyKey,
  };

  // Layer 1: Match blueprint
  const matchResult = await matchBlueprint(ctx, adminClient);

  // Layer 2: Compose plan
  const composition = await composeProvisioningPlan(ctx, matchResult, adminClient);

  // Validate no forbidden module combos
  const allCodes = [...composition.requiredModules, ...composition.optionalModules].map(m => m.moduleCode);
  for (const combo of composition.forbiddenCombinations) {
    if (combo.every(c => allCodes.includes(c))) {
      return errorResponse(
        `Forbidden module combination: ${combo.join(' + ')}`,
        422,
      );
    }
  }

  // Create job record
  const { data: job, error: jobError } = await adminClient
    .from('provisioning_jobs')
    .insert({
      company_id: body.companyId,
      blueprint_id: matchResult.blueprintId,
      status: 'pending',
      total_steps: composition.totalSteps,
      idempotency_key: body.idempotencyKey,
      requested_by: userId,
      snapshot: {
        version: 'v2',
        context: ctx,
        matchResult,
        composition: {
          requiredModules: composition.requiredModules.map(m => m.moduleCode),
          optionalModules: composition.optionalModules.map(m => m.moduleCode),
          seedPacks: composition.seedPacks.map(s => s.code),
          featureFlags: composition.featureFlags,
          totalSteps: composition.totalSteps,
        },
      },
    })
    .select('id, status')
    .single();

  if (jobError) return errorResponse(jobError.message, 500);

  // Layer 3: Execute asynchronously (non-blocking)
  executeProvisioningV2(ctx, composition, adminClient, job.id).catch((err) =>
    console.error('Provisioning v2 failed:', err),
  );

  return jsonResponse(
    {
      jobId: job.id,
      status: 'pending',
      blueprint: {
        id: matchResult.blueprintId,
        name: matchResult.blueprintName,
        confidence: matchResult.confidence,
      },
      plan: {
        requiredModules: composition.requiredModules.map(m => m.moduleCode),
        optionalModules: composition.optionalModules.map(m => m.moduleCode),
        defaultDepartments: composition.defaultDepartments,
        suggestedIntegrations: composition.suggestedIntegrations,
        featureFlags: composition.featureFlags,
        totalSteps: composition.totalSteps,
      },
    },
    202,
  );
}

/**
 * POST /api/provision/v2/preview — dry-run: returns plan without executing
 * Same body as v2/start
 */
async function previewProvisioningV2(
  request: Request,
  env: Env,
  userId: string,
  userSupabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as Partial<ProvisioningContext> & { companyId: string };
  if (!body.companyId) return errorResponse('Missing companyId');

  // Verify user owns company
  const { data: company } = await userSupabase
    .from('companies')
    .select('id, company_type_id, owner_user_id, country')
    .eq('id', body.companyId)
    .single();

  if (!company) return errorResponse('Company not found', 404);
  if (company.owner_user_id !== userId) {
    return errorResponse('Only the company owner can preview', 403);
  }

  const adminClient = createAdminClient(env);

  const ctx: ProvisioningContext = {
    companyId: body.companyId,
    companyTypeId: body.companyTypeId ?? company.company_type_id,
    country: body.country ?? company.country,
    industry: body.industry,
    employeeCount: body.employeeCount,
    requestedModules: body.requestedModules,
    requestedIntegrations: body.requestedIntegrations,
    legalModel: body.legalModel,
    businessSize: body.businessSize,
    requestedBy: userId,
  };

  const matchResult = await matchBlueprint(ctx, adminClient);
  const composition = await composeProvisioningPlan(ctx, matchResult, adminClient);

  return jsonResponse({
    preview: true,
    blueprint: {
      id: matchResult.blueprintId,
      name: matchResult.blueprintName,
      confidence: matchResult.confidence,
      reason: matchResult.matchReason,
    },
    plan: {
      requiredModules: composition.requiredModules,
      optionalModules: composition.optionalModules,
      forbiddenCombinations: composition.forbiddenCombinations,
      defaultLimits: composition.defaultLimits,
      seedPacks: composition.seedPacks,
      suggestedIntegrations: composition.suggestedIntegrations,
      defaultDepartments: composition.defaultDepartments,
      taxModel: composition.taxModel,
      roleMatrix: composition.roleMatrix,
      featureFlags: composition.featureFlags,
      totalSteps: composition.totalSteps,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DYNAMIC PRICING ENGINE ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/pricing/generate-quote — generate a dynamic quote based on context
 * Uses pricing_rules table instead of hardcoded values
 *
 * Body: {
 *   companyId: string,
 *   companyTypeCode?: string,
 *   country?: string,
 *   industry?: string,
 *   employeeCount?: number,
 *   modules?: string[],
 *   integrations?: string[],
 *   businessSize?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise',
 *   billingCycle?: 'monthly' | 'yearly',
 *   couponCode?: string,
 * }
 */
async function generateDynamicQuote(
  request: Request,
  env: Env,
  userId: string,
  _userSupabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    companyId: string;
    companyTypeCode?: string;
    country?: string;
    industry?: string;
    employeeCount?: number;
    modules?: string[];
    integrations?: string[];
    businessSize?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
    billingCycle?: 'monthly' | 'yearly';
    couponCode?: string;
  };

  if (!body.companyId) return errorResponse('Missing companyId');

  const adminClient = createAdminClient(env);
  const empCount = body.employeeCount ?? 1;
  const billingCycle = body.billingCycle ?? 'monthly';

  // ── 1. Load all active pricing rules ────────────────────────────────────
  const { data: rules, error: rulesError } = await adminClient
    .from('pricing_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (rulesError) return errorResponse('Failed to load pricing rules', 500);

  // ── 2. Resolve base plan rule ───────────────────────────────────────────
  const basePlanRules = (rules ?? []).filter(
    (r: any) => r.rule_type === 'base_plan',
  );

  // Find the best-matching base plan based on employee count and conditions
  let selectedPlan = resolveBestPlanRule(basePlanRules, {
    employeeCount: empCount,
    country: body.country,
    companyTypeCode: body.companyTypeCode,
    businessSize: body.businessSize,
  });

  // Fallback if no DB rules exist
  if (!selectedPlan) {
    selectedPlan = getHardcodedBasePlan(empCount);
  }

  // ── 3. Resolve per-module pricing ───────────────────────────────────────
  const moduleRules = (rules ?? []).filter(
    (r: any) => r.rule_type === 'module_addon',
  );

  const requestedModules = body.modules ?? [];
  const coreModuleCodes = selectedPlan.includedModules ?? [];
  const addonModuleCodes = requestedModules.filter(
    (m) => !coreModuleCodes.includes(m),
  );

  const quoteItems: Array<{
    itemType: string;
    itemCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
    metadata?: Record<string, unknown>;
  }> = [];

  // Base plan line item
  const basePriceAmount =
    billingCycle === 'yearly'
      ? selectedPlan.yearlyPrice
      : selectedPlan.monthlyPrice;

  quoteItems.push({
    itemType: 'base_plan',
    itemCode: selectedPlan.planCode,
    description: `${selectedPlan.planName} Plan (${billingCycle})`,
    quantity: 1,
    unitPrice: basePriceAmount,
    totalPrice: basePriceAmount,
    currency: selectedPlan.currency,
  });

  // Module add-on line items
  for (const modCode of addonModuleCodes) {
    const rule = moduleRules.find(
      (r: any) =>
        r.conditions_json?.module_code === modCode ||
        r.rule_key === `module_${modCode}`,
    );

    const modPrice = rule
      ? billingCycle === 'yearly'
        ? (rule as any).output_json?.price_yearly ?? (rule as any).output_json?.price_monthly * 10
        : (rule as any).output_json?.price_monthly ?? 0
      : 0;

    if (modPrice > 0) {
      quoteItems.push({
        itemType: 'module_addon',
        itemCode: modCode,
        description: `${modCode} module add-on (${billingCycle})`,
        quantity: 1,
        unitPrice: modPrice,
        totalPrice: modPrice,
        currency: selectedPlan.currency,
      });
    }
  }

  // ── 4. Seat overage ─────────────────────────────────────────────────────
  const seatRules = (rules ?? []).filter(
    (r: any) => r.rule_type === 'seat_overage',
  );
  const includedSeats = selectedPlan.includedSeats;
  const extraSeats = Math.max(0, empCount - includedSeats);

  if (extraSeats > 0) {
    const seatRule = seatRules[0];
    const perSeatPrice = seatRule
      ? (seatRule as any).output_json?.price_per_seat ?? 15
      : 15;

    quoteItems.push({
      itemType: 'seat_overage',
      itemCode: 'extra_seats',
      description: `${extraSeats} additional seat(s)`,
      quantity: extraSeats,
      unitPrice: perSeatPrice,
      totalPrice: extraSeats * perSeatPrice,
      currency: selectedPlan.currency,
    });
  }

  // ── 5. Integration costs ────────────────────────────────────────────────
  const integrationRules = (rules ?? []).filter(
    (r: any) => r.rule_type === 'integration',
  );

  for (const intCode of body.integrations ?? []) {
    const intRule = integrationRules.find(
      (r: any) =>
        r.conditions_json?.integration_code === intCode ||
        r.rule_key === `integration_${intCode}`,
    );

    if (intRule) {
      const setupFee = (intRule as any).output_json?.setup_fee ?? 0;
      const monthlyCost = (intRule as any).output_json?.price_monthly ?? 0;
      const price = billingCycle === 'yearly' ? monthlyCost * 10 : monthlyCost;

      quoteItems.push({
        itemType: 'integration',
        itemCode: intCode,
        description: `${intCode} integration`,
        quantity: 1,
        unitPrice: price + setupFee,
        totalPrice: price + setupFee,
        currency: selectedPlan.currency,
        metadata: { setupFee, recurringCost: price },
      });
    }
  }

  // ── 6. Discount/coupon rules ────────────────────────────────────────────
  let discountAmount = 0;
  let discountDescription = '';
  const discountRules = (rules ?? []).filter(
    (r: any) => r.rule_type === 'discount',
  );

  if (body.couponCode) {
    const couponRule = discountRules.find(
      (r: any) => r.conditions_json?.coupon_code === body.couponCode,
    );
    if (couponRule) {
      const subtotal = quoteItems.reduce((s, i) => s + i.totalPrice, 0);
      const discountType = (couponRule as any).output_json?.type ?? 'percentage';
      const discountValue = (couponRule as any).output_json?.value ?? 0;

      if (discountType === 'percentage') {
        discountAmount = Math.round(subtotal * (discountValue / 100));
        discountDescription = `${discountValue}% discount (coupon: ${body.couponCode})`;
      } else {
        discountAmount = discountValue;
        discountDescription = `${discountValue} ${selectedPlan.currency} discount (coupon: ${body.couponCode})`;
      }
    }
  }

  // Auto-discounts (e.g., yearly billing gets 2 months free)
  if (billingCycle === 'yearly') {
    const yearlyDiscount = discountRules.find(
      (r: any) => r.conditions_json?.billing_cycle === 'yearly',
    );
    if (yearlyDiscount) {
      const disc = (yearlyDiscount as any).output_json?.value ?? 0;
      const subtotal = quoteItems.reduce((s, i) => s + i.totalPrice, 0);
      const autoDisc = Math.round(subtotal * (disc / 100));
      discountAmount += autoDisc;
      discountDescription += discountDescription
        ? ` + yearly savings (${disc}%)`
        : `Yearly billing savings (${disc}%)`;
    }
  }

  if (discountAmount > 0) {
    quoteItems.push({
      itemType: 'discount',
      itemCode: 'discount',
      description: discountDescription,
      quantity: 1,
      unitPrice: -discountAmount,
      totalPrice: -discountAmount,
      currency: selectedPlan.currency,
    });
  }

  // ── 7. Compute totals ──────────────────────────────────────────────────
  const subtotal = quoteItems
    .filter(i => i.itemType !== 'discount')
    .reduce((s, i) => s + i.totalPrice, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  // ── 8. Persist quote ───────────────────────────────────────────────────
  const { data: quote, error: quoteError } = await adminClient
    .from('pricing_quotes')
    .insert({
      company_id: body.companyId,
      generated_by: userId,
      plan_code: selectedPlan.planCode,
      billing_cycle: billingCycle,
      employee_count: empCount,
      subtotal_amount: subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      currency: selectedPlan.currency,
      status: 'draft',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      context_json: {
        country: body.country,
        industry: body.industry,
        companyTypeCode: body.companyTypeCode,
        businessSize: body.businessSize,
        couponCode: body.couponCode,
      },
    })
    .select('id')
    .single();

  if (quoteError) return errorResponse(quoteError.message, 500);

  // Persist line items
  const lineItems = quoteItems.map((item, idx) => ({
    quote_id: quote.id,
    item_type: item.itemType,
    item_code: item.itemCode,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
    currency: item.currency,
    sort_order: idx,
    metadata_json: item.metadata ?? {},
  }));

  await adminClient.from('pricing_quote_items').insert(lineItems);

  return jsonResponse({
    quoteId: quote.id,
    plan: selectedPlan.planCode,
    billingCycle,
    currency: selectedPlan.currency,
    employeeCount: empCount,
    subtotal,
    discount: discountAmount,
    total: totalAmount,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    items: quoteItems,
  });
}

/**
 * GET /api/pricing/quote/:id — retrieve a previously generated quote
 */
async function getQuote(
  quoteId: string,
  env: Env,
  userId: string,
  _supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const adminClient = createAdminClient(env);

  const { data: quote, error: quoteError } = await adminClient
    .from('pricing_quotes')
    .select(`
      id, company_id, generated_by, plan_code, billing_cycle,
      employee_count, subtotal_amount, discount_amount, total_amount,
      currency, status, valid_until, context_json, created_at,
      pricing_quote_items(
        id, item_type, item_code, description,
        quantity, unit_price, total_price, currency,
        sort_order, metadata_json
      )
    `)
    .eq('id', quoteId)
    .single();

  if (quoteError || !quote) return errorResponse('Quote not found', 404);

  // Ownership check: user must be the quote generator or a member of the company
  if (quote.generated_by !== userId) {
    const { data: membership } = await adminClient
      .from('company_members')
      .select('id')
      .eq('company_id', quote.company_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (!membership) return errorResponse('Access denied — you do not own this quote', 403);
  }

  return jsonResponse({
    quote: {
      id: quote.id,
      companyId: quote.company_id,
      planCode: quote.plan_code,
      billingCycle: quote.billing_cycle,
      employeeCount: quote.employee_count,
      subtotal: quote.subtotal_amount,
      discount: quote.discount_amount,
      total: quote.total_amount,
      currency: quote.currency,
      status: quote.status,
      validUntil: quote.valid_until,
      context: quote.context_json,
      createdAt: quote.created_at,
      items: (quote.pricing_quote_items as any[])?.sort(
        (a: any, b: any) => a.sort_order - b.sort_order,
      ),
    },
  });
}

/**
 * GET /api/pricing/rules — list all pricing rules (for founder dashboard)
 */
async function listPricingRules(
  env: Env,
  _supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const adminClient = createAdminClient(env);

  const { data: rules, error } = await adminClient
    .from('pricing_rules')
    .select('*')
    .order('rule_type')
    .order('priority', { ascending: false });

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ rules: rules ?? [] });
}

// ─── Dynamic Pricing Helpers ────────────────────────────────────────────────

interface ResolvedPlan {
  planCode: string;
  planName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  includedSeats: number;
  includedModules: string[];
  currency: string;
}

function resolveBestPlanRule(
  basePlanRules: any[],
  context: {
    employeeCount: number;
    country?: string;
    companyTypeCode?: string;
    businessSize?: string;
  },
): ResolvedPlan | null {
  if (!basePlanRules.length) return null;

  for (const rule of basePlanRules) {
    const cond = rule.conditions_json ?? {};
    const out = rule.output_json ?? {};

    // Check employee range
    if (cond.min_employees != null && context.employeeCount < cond.min_employees) continue;
    if (cond.max_employees != null && context.employeeCount > cond.max_employees) continue;

    // Check country
    if (cond.country && context.country && cond.country !== context.country) continue;

    // Check company type
    if (cond.company_type_code && context.companyTypeCode && cond.company_type_code !== context.companyTypeCode) continue;

    // Check business size
    if (cond.business_size && context.businessSize && cond.business_size !== context.businessSize) continue;

    return {
      planCode: out.plan_code ?? rule.rule_key ?? 'custom',
      planName: out.plan_name ?? 'Custom Plan',
      monthlyPrice: out.price_monthly ?? 0,
      yearlyPrice: out.price_yearly ?? 0,
      includedSeats: out.included_seats ?? 5,
      includedModules: out.included_modules ?? ['hr', 'accounting', 'crm'],
      currency: out.currency ?? 'AED',
    };
  }

  return null;
}

function getHardcodedBasePlan(employeeCount: number): ResolvedPlan {
  if (employeeCount > 25) {
    return {
      planCode: 'enterprise',
      planName: 'Enterprise',
      monthlyPrice: 799,
      yearlyPrice: 7990,
      includedSeats: 999999,
      includedModules: ['hr', 'accounting', 'crm', 'projects', 'chat', 'meetings', 'documents', 'store', 'logistics'],
      currency: 'AED',
    };
  }
  if (employeeCount > 5) {
    return {
      planCode: 'business',
      planName: 'Business',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      includedSeats: 25,
      includedModules: ['hr', 'accounting', 'crm', 'projects', 'chat', 'meetings', 'documents'],
      currency: 'AED',
    };
  }
  return {
    planCode: 'starter',
    planName: 'Starter',
    monthlyPrice: 99,
    yearlyPrice: 999,
    includedSeats: 5,
    includedModules: ['hr', 'accounting', 'crm', 'chat'],
    currency: 'AED',
  };
}

