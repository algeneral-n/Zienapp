// supabase/functions/register_company/index.ts
// Updated for unified schema: uses `companies` and `company_members` tables
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-max-age": "86400",
};

interface RegisterCompanyBody {
  company_name: string;
  company_name_ar?: string;
  company_type_code?: string;
  industry?: string;
  owner_name: string;
  owner_email: string;
  owner_phone?: string;
  country_code?: string;
  city?: string;
  business_license_url?: string;
  accepted_undertaking: boolean;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function requireString(v: unknown, field: string): string {
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new Error(`Missing/invalid field: ${field}`);
  }
  return v.trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const raw = (await req.json()) as Partial<RegisterCompanyBody>;

    const company_name = requireString(raw.company_name, "company_name");
    const owner_name = requireString(raw.owner_name, "owner_name");
    const owner_email = requireString(raw.owner_email, "owner_email");

    if (raw.accepted_undertaking !== true) {
      return json(400, { error: "undertaking_not_accepted" });
    }

    if (!/^.+@.+\..+$/.test(owner_email)) {
      return json(400, { error: "invalid_email" });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRoleKey) {
      return json(500, { error: "missing_supabase_env" });
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) Resolve company_type_id from code (optional)
    let company_type_id: string | null = null;
    if (raw.company_type_code) {
      const { data: ct } = await admin
        .from("company_types")
        .select("id")
        .eq("code", raw.company_type_code)
        .maybeSingle();
      company_type_id = ct?.id ?? null;
    }

    // 2) Generate unique slug
    let slug = slugify(company_name);
    const { data: existing } = await admin
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 3) Invite owner (creates auth user if not exists)
    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
      owner_email,
      {
        data: {
          full_name: owner_name,
          role: "company_gm",
        },
      }
    );

    if (inviteErr) {
      return json(400, { error: "invite_failed", details: inviteErr.message });
    }

    const userId = inviteData.user?.id;
    if (!userId) {
      return json(500, { error: "invite_missing_user" });
    }

    // 4) Create company
    const { data: company, error: companyErr } = await admin
      .from("companies")
      .insert({
        name: company_name,
        name_ar: raw.company_name_ar,
        slug,
        company_type_id,
        industry: raw.industry,
        status: "pending_review",
        country_code: raw.country_code ?? "AE",
        city: raw.city,
        business_license_url: raw.business_license_url,
        owner_user_id: userId,
      })
      .select("id")
      .single();

    if (companyErr) {
      return json(400, {
        error: "company_insert_failed",
        details: companyErr.message,
      });
    }

    // 5) Create membership (owner = company_gm)
    const { error: memberErr } = await admin.from("company_members").insert({
      company_id: company.id,
      user_id: userId,
      role_code: "company_gm",
      status: "active",
      is_primary: true,
      created_by: userId,
    });

    if (memberErr) {
      // Rollback company
      await admin.from("companies").delete().eq("id", company.id);
      return json(400, {
        error: "member_insert_failed",
        details: memberErr.message,
      });
    }

    // 6) Trigger provisioning (optional — can also be done client-side)
    // The Worker's /api/provision/start endpoint will handle the full flow
    // Here we just return the company ID for the client to call provision

    return json(200, {
      ok: true,
      company_id: company.id,
      slug,
      invited_user_id: userId,
    });
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e);
    return json(400, { error: "bad_request", details });
  }
});
