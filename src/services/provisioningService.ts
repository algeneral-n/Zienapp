import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface ProvisioningConfig {
  companyName: string;
  tenantType: string;
  country: string;
  currency: string;
  employees: string;
  needs: string[];
  language: string;
}

export interface ProvisioningV2Config {
  companyId: string;
  companyTypeId?: string;
  country?: string;
  industry?: string;
  employeeCount?: number;
  requestedModules?: string[];
  requestedIntegrations?: string[];
  legalModel?: string;
  businessSize?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
}

export interface ProvisioningResult {
  tenantId: string;
  companyId: string;
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error' | 'pending';
}

export interface ProvisioningV2Result {
  jobId: string;
  status: string;
  blueprint: {
    id: string | null;
    name?: string;
    confidence: number;
  };
  plan: {
    requiredModules: string[];
    optionalModules: string[];
    defaultDepartments: string[];
    suggestedIntegrations: string[];
    featureFlags: Record<string, boolean>;
    totalSteps: number;
  };
}

export interface ProvisioningPreview {
  preview: true;
  blueprint: {
    id: string | null;
    name?: string;
    confidence: number;
    reason: string;
  };
  plan: {
    requiredModules: Array<{
      moduleCode: string;
      tier: string;
      isRequired: boolean;
      dependsOn: string[];
    }>;
    optionalModules: Array<{
      moduleCode: string;
      tier: string;
      isRequired: boolean;
      dependsOn: string[];
    }>;
    forbiddenCombinations: string[][];
    defaultLimits: Record<string, number>;
    seedPacks: Array<{ seedPackId: string; code: string; kind: string }>;
    suggestedIntegrations: string[];
    defaultDepartments: string[];
    taxModel?: { countryCode: string; taxes: Array<{ name: string; rate: number }> };
    roleMatrix: Array<{ roleCode: string; modules: string[]; permissions: string[] }>;
    featureFlags: Record<string, boolean>;
    totalSteps: number;
  };
}

export interface ProvisioningStatus {
  jobId: string;
  status: string;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  error?: string;
}

export interface QuoteRequest {
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
}

export interface QuoteItem {
  itemType: string;
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface QuoteResult {
  quoteId: string;
  plan: string;
  billingCycle: string;
  currency: string;
  employeeCount: number;
  subtotal: number;
  discount: number;
  total: number;
  validUntil: string;
  items: QuoteItem[];
}

export interface QuoteDetail {
  id: string;
  companyId: string;
  planCode: string;
  billingCycle: string;
  employeeCount: number;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  status: string;
  validUntil: string;
  context: Record<string, unknown>;
  createdAt: string;
  items: QuoteItem[];
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const provisioningService = {
  /**
   * Main entry point for provisioning a new tenant.
   * Creates a company record, then calls the worker API to provision.
   */
  async provisionTenant(config: ProvisioningConfig): Promise<ProvisioningResult> {
    console.log('Starting provisioning for:', config.companyName);

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to provision a company.');

    // 2. Create company record in Supabase
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name_ar: config.companyName,
        name_en: config.companyName,
        owner_user_id: user.id,
        country: config.country,
        currency: config.currency || 'AED',
        status: 'provisioning',
      })
      .select()
      .single();

    if (companyError) throw new Error(`Failed to create company: ${companyError.message}`);

    // 3. Create company_members link (owner = company_gm)
    await supabase.from('company_members').insert({
      company_id: company.id,
      user_id: user.id,
      role: 'company_gm',
      status: 'active',
      is_primary: true,
    });

    // 4. Call Worker provisioning API with retry
    const idempotencyKey = `prov_${company.id}_${Date.now()}`;
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/provision/start`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            companyId: company.id,
            idempotencyKey,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error((err as any).error || `Provisioning API returned ${res.status}`);
        }

        const data = await res.json() as { jobId: string; status: string };
        return {
          tenantId: company.id,
          companyId: company.id,
          jobId: data.jobId,
          status: data.status as ProvisioningResult['status'],
        };
      } catch (apiError: any) {
        lastError = apiError;
        console.warn(`Provisioning attempt ${attempt}/${MAX_RETRIES} failed:`, apiError.message);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * attempt)); // exponential-ish backoff
        }
      }
    }

    // All retries failed — fallback to direct provisioning
    console.warn('Worker API unavailable after retries, falling back to direct provisioning:', lastError?.message);
    return this.fallbackProvisioning(company.id, config);
  },

  /**
   * Poll provisioning status via the worker API
   */
  async getStatus(jobId: string): Promise<ProvisioningStatus> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/provision/status/${jobId}`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
      const data = await res.json() as any;
      return {
        jobId: data.id || jobId,
        status: data.status,
        currentStep: data.current_step || '',
        totalSteps: data.total_steps || 3,
        completedSteps: data.completed_steps || 0,
        error: data.error_message,
      };
    } catch {
      // Fallback: check directly from Supabase
      const { data } = await supabase
        .from('provisioning_jobs')
        .select('id, status, current_step, total_steps')
        .eq('id', jobId)
        .single();

      return {
        jobId,
        status: data?.status || 'error',
        currentStep: data?.current_step || '',
        totalSteps: data?.total_steps || 3,
        completedSteps: 0,
        error: data?.status === 'error' ? 'Provisioning failed' : undefined,
      };
    }
  },

  /**
   * Fallback direct provisioning when the worker API is unavailable
   */
  async fallbackProvisioning(companyId: string, config: ProvisioningConfig): Promise<ProvisioningResult> {
    // Create a provisioning job
    const { data: job, error: jobError } = await supabase
      .from('provisioning_jobs')
      .insert({
        company_id: companyId,
        status: 'running',
        total_steps: 3,
        current_step: 'attaching_modules',
        idempotency_key: `prov_${companyId}_${Date.now()}`,
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create provisioning job: ${jobError.message}`);
    }

    try {
      // Attach requested modules
      if (config.needs?.length) {
        const { data: moduleCatalog } = await supabase
          .from('modules_catalog')
          .select('id, code')
          .in('code', config.needs);

        if (moduleCatalog?.length) {
          await supabase.from('tenant_modules').upsert(
            moduleCatalog.map(m => ({
              company_id: companyId,
              module_id: m.id,
              is_active: true,
            })),
            { onConflict: 'company_id,module_id' }
          );
        }
      }

      // Create default departments
      const defaultDepts = ['management', 'hr', 'finance', 'operations'];
      await supabase.from('departments').insert(
        defaultDepts.map(d => ({
          company_id: companyId,
          name: d.charAt(0).toUpperCase() + d.slice(1),
          code: d,
        }))
      ).then(() => { }, () => { }); // ignore duplicate errors

      // Finalize
      await supabase.from('provisioning_jobs')
        .update({ status: 'done', current_step: 'complete', completed_steps: 3 })
        .eq('id', job.id);

      await supabase.from('companies')
        .update({ status: 'active' })
        .eq('id', companyId);

      return {
        tenantId: companyId,
        companyId,
        jobId: job.id,
        status: 'done',
      };
    } catch (fallbackErr: any) {
      // Mark job as error
      await supabase.from('provisioning_jobs')
        .update({ status: 'error', error_message: fallbackErr.message })
        .eq('id', job.id);

      throw new Error(`Fallback provisioning failed: ${fallbackErr.message}`);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── PROVISIONING V2 API ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Preview what the v2 provisioning pipeline will do (dry-run).
   * Call this before startV2 to show the plan to the user.
   */
  async previewV2(config: ProvisioningV2Config): Promise<ProvisioningPreview> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/provision/v2/preview`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error((err as any).error || `Preview failed: ${res.status}`);
    }

    return res.json() as Promise<ProvisioningPreview>;
  },

  /**
   * Execute v2 provisioning with the 3-layer engine.
   * Returns immediately with a jobId while provisioning runs async.
   */
  async startV2(config: ProvisioningV2Config): Promise<ProvisioningV2Result> {
    const idempotencyKey = `prov_v2_${config.companyId}_${Date.now()}`;
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/provision/v2/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...config, idempotencyKey }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error((err as any).error || `Provisioning v2 failed: ${res.status}`);
    }

    return res.json() as Promise<ProvisioningV2Result>;
  },

  /**
   * Full v2 provisioning flow:
   * 1. Create company
   * 2. Create company_members link
   * 3. Call v2/start
   */
  async provisionTenantV2(
    config: ProvisioningConfig & {
      industry?: string;
      businessSize?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
      requestedIntegrations?: string[];
    },
  ): Promise<ProvisioningV2Result> {
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to provision.');

    // 2. Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name_ar: config.companyName,
        name_en: config.companyName,
        owner_user_id: user.id,
        country: config.country,
        currency: config.currency || 'AED',
        status: 'provisioning',
      })
      .select()
      .single();

    if (companyError) throw new Error(`Failed to create company: ${companyError.message}`);

    // 3. Create owner membership
    await supabase.from('company_members').insert({
      company_id: company.id,
      user_id: user.id,
      role: 'company_gm',
      status: 'active',
      is_primary: true,
    });

    // 4. Map employee string to number + businessSize
    const empCount = parseInt(config.employees, 10) || 5;
    const businessSize = config.businessSize ?? (
      empCount > 25 ? 'large' : empCount > 5 ? 'medium' : 'small'
    ) as 'micro' | 'small' | 'medium' | 'large' | 'enterprise';

    // 5. Call v2/start
    return this.startV2({
      companyId: company.id,
      country: config.country,
      industry: config.industry,
      employeeCount: empCount,
      requestedModules: config.needs,
      requestedIntegrations: config.requestedIntegrations,
      businessSize,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── DYNAMIC PRICING API ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a dynamic pricing quote. Returns full breakdown with line items.
   */
  async generateQuote(request: QuoteRequest): Promise<QuoteResult> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/pricing/generate-quote`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error((err as any).error || `Quote generation failed: ${res.status}`);
    }

    return res.json() as Promise<QuoteResult>;
  },

  /**
   * Retrieve a previously generated quote by ID.
   */
  async getQuote(quoteId: string): Promise<QuoteDetail> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/pricing/quote/${quoteId}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error((err as any).error || `Quote fetch failed: ${res.status}`);
    }

    const data = await res.json() as { quote: QuoteDetail };
    return data.quote;
  },

  /**
   * List pricing rules (founder dashboard).
   */
  async listPricingRules(): Promise<any[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/pricing/rules`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) return [];
    const data = await res.json() as { rules: any[] };
    return data.rules;
  },
};
