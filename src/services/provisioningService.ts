import { supabase } from './supabase';

export interface ProvisioningConfig {
  companyName: string;
  tenantType: string;
  country: string;
  currency: string;
  employees: string;
  needs: string[];
  language: string;
}

export interface ProvisioningResult {
  companyId: string;
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error';
}

export const provisioningService = {
  /**
   * Main entry point for provisioning a new tenant
   */
  async provisionTenant(config: ProvisioningConfig): Promise<ProvisioningResult> {
    console.log('Starting provisioning for:', config.companyName);

    try {
      // 1. Find the best blueprint
      const blueprint = await this.findBestBlueprint(config);
      if (!blueprint) throw new Error('No suitable blueprint found for this configuration.');

      // 2. Create the tenant record
      const { data: tenant, error: tenantError } = await supabase
        .from('companies')
        .insert({
          name: config.companyName,
          company_type_id: blueprint.company_type_id,
          country: config.country,
          currency: config.currency,
          status: 'provisioning'
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 3. Create a provisioning job
      const { data: job, error: jobError } = await supabase
        .from('provisioning_jobs')
        .insert({
          company_id: tenant.id,
          blueprint_id: blueprint.id,
          status: 'queued',
          idempotency_key: `prov_${tenant.id}_${Date.now()}`
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // 4. Start the provisioning process (In a real app, this would be an Edge Function)
      // For this demo, we'll simulate the steps
      this.executeProvisioning(job.id, tenant.id, blueprint.id, config);

      return {
        companyId: tenant.id,
        jobId: job.id,
        status: 'queued'
      };
    } catch (error) {
      console.error('Provisioning failed:', error);
      throw error;
    }
  },

  /**
   * Logic to match the best blueprint based on tenant type and rules
   */
  async findBestBlueprint(config: ProvisioningConfig) {
    // Fetch active blueprints for the tenant type
    const { data: blueprints } = await supabase
      .from('blueprints')
      .select('*, company_types!inner(code)')
      .eq('company_types.code', config.tenantType)
      .eq('is_active', true);

    if (!blueprints || blueprints.length === 0) return null;

    // Simple matching: return the first one for now
    // In a real app, parse rules_json and calculate score
    return blueprints[0];
  },

  /**
   * Simulates the execution of provisioning steps
   */
  async executeProvisioning(jobId: string, companyId: string, blueprintId: string, config: ProvisioningConfig) {
    const updateJob = async (step: string, status: string = 'running', log?: string) => {
      await supabase
        .from('provisioning_jobs')
        .update({ 
          current_step: step, 
          status,
          logs: supabase.rpc('array_append', { col: 'logs', val: log || `Started step: ${step}` })
        })
        .eq('id', jobId);
    };

    try {
      // Step 1: Attach Modules
      await updateJob('attaching_modules', 'running', 'Fetching blueprint modules...');
      const { data: bpModules } = await supabase
        .from('blueprint_modules')
        .select('module_id, default_config_json')
        .eq('blueprint_id', blueprintId);

      if (bpModules) {
        const tenantModules = bpModules.map(bpm => ({
          company_id: companyId,
          module_id: bpm.module_id,
          config_json: bpm.default_config_json,
          status: 'enabled'
        }));

        await supabase.from('company_modules').insert(tenantModules);
      }

      // Step 2: Seed Data
      await updateJob('seeding_data', 'running', 'Applying seed packs...');
      const { data: seedPacks } = await supabase
        .from('blueprint_seed_packs')
        .select('seed_packs(*)')
        .eq('blueprint_id', blueprintId)
        .order('order_index');

      if (seedPacks) {
        for (const pack of seedPacks) {
          const p = pack.seed_packs as any;
          await updateJob(`seeding_${p.code}`, 'running', `Applying ${p.kind}: ${p.code}`);
          // Here you would implement logic to insert into specific tables (roles, coa, etc.)
          // based on p.payload_json
        }
      }

      // Step 3: Finalize
      await updateJob('finalizing', 'done', 'Provisioning completed successfully.');
      await supabase
        .from('companies')
        .update({ status: 'active' })
        .eq('id', companyId);

    } catch (error) {
      console.error('Execution error:', error);
      await updateJob('error', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
