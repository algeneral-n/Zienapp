/**
 * Provisioning v2 Engine — 3-Layer Architecture
 *
 * Layer 1: Matching Engine   — resolves blueprint from context
 * Layer 2: Composition Engine — computes modules, deps, limits, seeds
 * Layer 3: Execution Engine   — validates, creates job, applies, activates
 *
 * This replaces the monolithic provisioning flow with a composable pipeline.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProvisioningContext {
    companyId: string;
    companyTypeId?: string;
    country?: string;
    industry?: string;
    employeeCount?: number;
    requestedModules?: string[];
    requestedIntegrations?: string[];
    legalModel?: string;
    businessSize?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
    requestedBy: string;
    idempotencyKey?: string;
}

export interface MatchResult {
    blueprintId: string | null;
    blueprintName?: string;
    companyTypeCode?: string;
    confidence: number; // 0-1
    matchReason: string;
}

export interface CompositionResult {
    requiredModules: ModuleEntitlement[];
    optionalModules: ModuleEntitlement[];
    forbiddenCombinations: string[][];
    defaultLimits: Record<string, number>;
    seedPacks: SeedPackRef[];
    suggestedIntegrations: string[];
    defaultDepartments: string[];
    taxModel?: TaxModelRef;
    accountingSeed?: AccountingSeedRef;
    roleMatrix: RoleMatrixEntry[];
    featureFlags: Record<string, boolean>;
    totalSteps: number;
}

export interface ModuleEntitlement {
    moduleCode: string;
    moduleId?: string;
    tier: string;
    isRequired: boolean;
    dependsOn: string[];
    defaultConfig: Record<string, unknown>;
}

export interface SeedPackRef {
    seedPackId: string;
    code: string;
    kind: string;
    applyOrder: number;
}

export interface TaxModelRef {
    countryCode: string;
    taxes: Array<{ name: string; rate: number; isActive: boolean }>;
}

export interface AccountingSeedRef {
    chartTemplate: string;
    currencies: string[];
    fiscalYearStart: number; // month 1-12
}

export interface RoleMatrixEntry {
    roleCode: string;
    modules: string[];
    permissions: string[];
}

export interface ProvisioningJob {
    id: string;
    status: string;
    currentStep: string;
    stepIndex: number;
    totalSteps: number;
}

export interface ProvisioningStepResult {
    stepCode: string;
    status: 'completed' | 'failed' | 'skipped';
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    durationMs: number;
    error?: string;
}

// ─── Layer 1: Matching Engine ───────────────────────────────────────────────

export async function matchBlueprint(
    ctx: ProvisioningContext,
    adminClient: SupabaseClient,
): Promise<MatchResult> {
    // Priority 1: exact company_type match
    if (ctx.companyTypeId) {
        const { data: blueprint } = await adminClient
            .from('blueprints')
            .select('id, name, company_type_id, company_types!inner(code)')
            .eq('company_type_id', ctx.companyTypeId)
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (blueprint) {
            return {
                blueprintId: blueprint.id,
                blueprintName: blueprint.name,
                companyTypeCode: (blueprint.company_types as any)?.code,
                confidence: 1.0,
                matchReason: `Exact match on company_type_id=${ctx.companyTypeId}`,
            };
        }
    }

    // Priority 2: match by industry + country + size
    if (ctx.industry) {
        const { data: blueprints } = await adminClient
            .from('blueprints')
            .select('id, name, company_types!inner(code, industry_tags)')
            .eq('is_active', true);

        if (blueprints?.length) {
            // Score each blueprint by how well it matches the context
            const scored = blueprints
                .map((bp: any) => {
                    let score = 0;
                    const tags: string[] = bp.company_types?.industry_tags || [];
                    if (tags.includes(ctx.industry!)) score += 0.6;
                    if (ctx.country && tags.includes(ctx.country)) score += 0.2;
                    if (ctx.businessSize && tags.includes(ctx.businessSize)) score += 0.2;
                    return { ...bp, score };
                })
                .filter((bp: any) => bp.score > 0)
                .sort((a: any, b: any) => b.score - a.score);

            if (scored.length > 0) {
                const best = scored[0];
                return {
                    blueprintId: best.id,
                    blueprintName: best.name,
                    companyTypeCode: best.company_types?.code,
                    confidence: best.score,
                    matchReason: `Industry match: ${ctx.industry}, score=${best.score}`,
                };
            }
        }
    }

    // Priority 3: fallback to default blueprint
    const { data: fallback } = await adminClient
        .from('blueprints')
        .select('id, name')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    return {
        blueprintId: fallback?.id || null,
        blueprintName: fallback?.name,
        confidence: fallback ? 0.3 : 0,
        matchReason: fallback ? 'Default fallback blueprint' : 'No matching blueprint found',
    };
}

// ─── Layer 2: Composition Engine ────────────────────────────────────────────

export async function composeProvisioningPlan(
    ctx: ProvisioningContext,
    matchResult: MatchResult,
    adminClient: SupabaseClient,
): Promise<CompositionResult> {
    const { blueprintId } = matchResult;

    // 1. Resolve required modules from blueprint
    const requiredModules: ModuleEntitlement[] = [];
    const optionalModules: ModuleEntitlement[] = [];

    if (blueprintId) {
        const { data: bpModules } = await adminClient
            .from('blueprint_modules')
            .select('module_id, is_required, default_config_json, modules_catalog!inner(code, name_en, tier)')
            .eq('blueprint_id', blueprintId);

        for (const bm of bpModules ?? []) {
            const mod = bm.modules_catalog as any;
            const entitlement: ModuleEntitlement = {
                moduleCode: mod.code,
                moduleId: bm.module_id,
                tier: mod.tier || 'core',
                isRequired: bm.is_required,
                dependsOn: getModuleDependencies(mod.code),
                defaultConfig: bm.default_config_json ?? {},
            };

            if (bm.is_required) {
                requiredModules.push(entitlement);
            } else {
                optionalModules.push(entitlement);
            }
        }
    }

    // 2. Add explicitly requested modules not already in blueprint
    const allBpCodes = [...requiredModules, ...optionalModules].map(m => m.moduleCode);
    for (const code of ctx.requestedModules ?? []) {
        if (!allBpCodes.includes(code)) {
            const { data: mod } = await adminClient
                .from('modules_catalog')
                .select('id, code, tier')
                .eq('code', code)
                .maybeSingle();

            if (mod) {
                optionalModules.push({
                    moduleCode: mod.code,
                    moduleId: mod.id,
                    tier: mod.tier || 'addon',
                    isRequired: false,
                    dependsOn: getModuleDependencies(mod.code),
                    defaultConfig: {},
                });
            }
        }
    }

    // 3. Resolve seed packs
    const seedPacks: SeedPackRef[] = [];
    if (blueprintId) {
        const { data: bpSeeds } = await adminClient
            .from('blueprint_seed_packs')
            .select('apply_order, seed_packs!inner(id, code, kind)')
            .eq('blueprint_id', blueprintId)
            .order('apply_order');

        for (const bsp of bpSeeds ?? []) {
            const sp = bsp.seed_packs as any;
            seedPacks.push({
                seedPackId: sp.id,
                code: sp.code,
                kind: sp.kind,
                applyOrder: bsp.apply_order,
            });
        }
    }

    // 4. Default departments
    const defaultDepartments = resolveDefaultDepartments(
        [...requiredModules, ...optionalModules].map(m => m.moduleCode),
    );

    // 5. Tax model
    const taxModel = resolveTaxModel(ctx.country);

    // 6. Feature flags
    const featureFlags = resolveFeatureFlags(ctx, matchResult);

    // 7. Role matrix
    const roleMatrix = resolveRoleMatrix([...requiredModules, ...optionalModules].map(m => m.moduleCode));

    // 8. Count total steps
    const totalSteps = 1 + // validate
        1 + // create modules
        seedPacks.length + // seed packs
        (defaultDepartments.length > 0 ? 1 : 0) + // departments
        (taxModel ? 1 : 0) + // tax model
        1; // finalize

    return {
        requiredModules,
        optionalModules,
        forbiddenCombinations: getForbiddenModuleCombinations(),
        defaultLimits: resolveDefaultLimits(ctx.businessSize),
        seedPacks,
        suggestedIntegrations: resolveSuggestedIntegrations(
            [...requiredModules, ...optionalModules].map(m => m.moduleCode),
            ctx.country,
        ),
        defaultDepartments,
        taxModel,
        roleMatrix,
        featureFlags,
        totalSteps,
    };
}

// ─── Layer 3: Execution Engine ──────────────────────────────────────────────

export async function executeProvisioningV2(
    ctx: ProvisioningContext,
    composition: CompositionResult,
    adminClient: SupabaseClient,
    jobId: string,
): Promise<ProvisioningStepResult[]> {
    const results: ProvisioningStepResult[] = [];
    let stepIndex = 0;

    const updateJob = async (updates: Record<string, unknown>) =>
        adminClient.from('provisioning_jobs').update(updates).eq('id', jobId);

    const logStep = async (stepResult: ProvisioningStepResult) => {
        results.push(stepResult);
        await adminClient.from('provisioning_job_steps').insert({
            job_id: jobId,
            step_code: stepResult.stepCode,
            status: stepResult.status,
            input_json: stepResult.input,
            output_json: stepResult.output,
            duration_ms: stepResult.durationMs,
            error_json: stepResult.error ? { message: stepResult.error } : null,
        });
    };

    try {
        // Step 1: Validate
        const validateStart = Date.now();
        await updateJob({ status: 'validating', current_step: 'Validating company', step_index: stepIndex });

        const { data: company } = await adminClient
            .from('companies')
            .select('id, company_type_id, status')
            .eq('id', ctx.companyId)
            .single();

        if (!company) throw new Error('Company not found');
        if (company.status === 'active') throw new Error('Company already provisioned');

        await logStep({
            stepCode: 'validate',
            status: 'completed',
            input: { companyId: ctx.companyId },
            output: { companyStatus: company.status },
            durationMs: Date.now() - validateStart,
        });
        stepIndex++;

        // Step 2: Apply modules
        const modulesStart = Date.now();
        await updateJob({ status: 'applying_modules', current_step: 'Activating modules', step_index: stepIndex });

        const allModules = [...composition.requiredModules, ...composition.optionalModules];
        const appliedModules: string[] = [];

        for (const mod of allModules) {
            if (mod.moduleId) {
                await adminClient.from('company_modules').upsert(
                    {
                        company_id: ctx.companyId,
                        module_id: mod.moduleId,
                        is_active: true,
                        config: mod.defaultConfig,
                    },
                    { onConflict: 'company_id,module_id' },
                );
                appliedModules.push(mod.moduleCode);
            }
        }

        await logStep({
            stepCode: 'apply_modules',
            status: 'completed',
            input: { moduleCount: allModules.length },
            output: { appliedModules },
            durationMs: Date.now() - modulesStart,
        });
        stepIndex++;

        // Step 3: Apply seed packs
        for (const sp of composition.seedPacks) {
            const seedStart = Date.now();
            await updateJob({ status: 'seeding', current_step: `Applying seed: ${sp.code}`, step_index: stepIndex });

            try {
                const { data: seedPack } = await adminClient
                    .from('seed_packs')
                    .select('kind, payload_json')
                    .eq('id', sp.seedPackId)
                    .single();

                if (seedPack) {
                    await applySeedPack(adminClient, ctx.companyId, seedPack.kind, seedPack.payload_json);
                }

                await logStep({
                    stepCode: `seed_${sp.code}`,
                    status: 'completed',
                    input: { seedCode: sp.code, kind: sp.kind },
                    output: { applied: true },
                    durationMs: Date.now() - seedStart,
                });
            } catch (seedError) {
                const msg = seedError instanceof Error ? seedError.message : 'Seed pack failed';
                await logStep({
                    stepCode: `seed_${sp.code}`,
                    status: 'failed',
                    input: { seedCode: sp.code, kind: sp.kind },
                    output: {},
                    durationMs: Date.now() - seedStart,
                    error: msg,
                });
                // Non-fatal: continue with other seeds
            }
            stepIndex++;
        }

        // Step 4: Create departments
        if (composition.defaultDepartments.length > 0) {
            const deptStart = Date.now();
            await updateJob({ status: 'seeding', current_step: 'Creating departments', step_index: stepIndex });

            for (const name of composition.defaultDepartments) {
                await adminClient.from('departments').upsert(
                    { company_id: ctx.companyId, name, is_active: true },
                    { onConflict: 'company_id,name' },
                );
            }

            await logStep({
                stepCode: 'create_departments',
                status: 'completed',
                input: { departments: composition.defaultDepartments },
                output: { count: composition.defaultDepartments.length },
                durationMs: Date.now() - deptStart,
            });
            stepIndex++;
        }

        // Step 5: Apply tax model
        if (composition.taxModel) {
            const taxStart = Date.now();
            await updateJob({ status: 'seeding', current_step: 'Setting up tax model', step_index: stepIndex });

            for (const tax of composition.taxModel.taxes) {
                await adminClient.from('tax_settings').insert({
                    company_id: ctx.companyId,
                    country_code: composition.taxModel.countryCode,
                    tax_name: tax.name,
                    tax_rate: tax.rate,
                    is_active: tax.isActive,
                });
            }

            await logStep({
                stepCode: 'apply_tax_model',
                status: 'completed',
                input: { country: composition.taxModel.countryCode },
                output: { taxCount: composition.taxModel.taxes.length },
                durationMs: Date.now() - taxStart,
            });
            stepIndex++;
        }

        // Step 6: Apply feature flags
        if (Object.keys(composition.featureFlags).length > 0) {
            for (const [flag, value] of Object.entries(composition.featureFlags)) {
                await adminClient.from('feature_flags').upsert(
                    { company_id: ctx.companyId, flag_key: flag, flag_value: value },
                    { onConflict: 'company_id,flag_key' },
                );
            }
        }

        // Final step: Activate
        const finalStart = Date.now();
        await updateJob({ status: 'finalizing', current_step: 'Activating company', step_index: stepIndex });

        await adminClient
            .from('companies')
            .update({ status: 'active' })
            .eq('id', ctx.companyId);

        await logStep({
            stepCode: 'finalize',
            status: 'completed',
            input: { companyId: ctx.companyId },
            output: { status: 'active' },
            durationMs: Date.now() - finalStart,
        });

        // Mark job complete
        await updateJob({
            status: 'completed',
            current_step: 'Done',
            step_index: composition.totalSteps,
            completed_at: new Date().toISOString(),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown provisioning error';

        // Attempt partial rollback
        await rollbackProvisioning(adminClient, ctx.companyId, results);

        await updateJob({
            status: 'failed',
            error_message: message,
            logs: results.map(r => `${r.stepCode}: ${r.status}`),
        });

        throw error;
    }

    return results;
}

// ─── Rollback ───────────────────────────────────────────────────────────────

async function rollbackProvisioning(
    adminClient: SupabaseClient,
    companyId: string,
    completedSteps: ProvisioningStepResult[],
): Promise<void> {
    // Reverse order rollback of completed steps
    const toRollback = completedSteps
        .filter(s => s.status === 'completed')
        .reverse();

    for (const step of toRollback) {
        try {
            switch (step.stepCode) {
                case 'apply_modules':
                    await adminClient.from('company_modules').delete().eq('company_id', companyId);
                    break;
                case 'create_departments':
                    // Only remove auto-created departments
                    const depts = (step.input as any).departments as string[];
                    if (depts?.length) {
                        for (const name of depts) {
                            await adminClient.from('departments').delete()
                                .eq('company_id', companyId).eq('name', name);
                        }
                    }
                    break;
                case 'finalize':
                    await adminClient.from('companies').update({ status: 'pending_review' }).eq('id', companyId);
                    break;
            }
        } catch (rollbackError) {
            console.error(`Rollback failed for step ${step.stepCode}:`, rollbackError);
        }
    }
}

// ─── Seed Pack Application ──────────────────────────────────────────────────

async function applySeedPack(
    adminClient: SupabaseClient,
    companyId: string,
    kind: string,
    payload: Record<string, unknown>,
): Promise<void> {
    const p = payload as any;

    switch (kind) {
        // ─── Legacy: roles (departments as flat array) ──────────────────────
        case 'roles':
            if (p.departments) {
                for (const name of p.departments) {
                    await adminClient.from('departments').upsert(
                        { company_id: companyId, name, is_active: true },
                        { onConflict: 'company_id,name' },
                    );
                }
            }
            break;

        // ─── V2: departments (structured with codes, names, hierarchy) ──────
        case 'departments':
            if (p.departments) {
                for (const dept of p.departments) {
                    await adminClient.from('departments').upsert(
                        {
                            company_id: companyId,
                            code: dept.code,
                            name: dept.name_en,
                            name_ar: dept.name_ar,
                            parent_code: dept.parent_code,
                            sort_order: dept.sort_order ?? 0,
                            is_active: true,
                        },
                        { onConflict: 'company_id,code' },
                    );
                }
            }
            break;

        // ─── V2: channels (auto-create chat channels per taxonomy) ──────────
        case 'channels':
            if (p.channels) {
                for (const ch of p.channels) {
                    // Find department_id if department_code is specified
                    let departmentId = null;
                    if (ch.department_code) {
                        const { data: dept } = await adminClient
                            .from('departments')
                            .select('id')
                            .eq('company_id', companyId)
                            .eq('code', ch.department_code)
                            .single();
                        departmentId = dept?.id ?? null;
                    }

                    // Get the GM's company_member ID for created_by
                    const { data: gmMember } = await adminClient
                        .from('company_members')
                        .select('id, user_id')
                        .eq('company_id', companyId)
                        .eq('is_primary', true)
                        .single();

                    const { data: channel } = await adminClient.from('chat_channels').upsert(
                        {
                            company_id: companyId,
                            name: ch.name_en,
                            description: ch.description_en,
                            channel_type: ch.channel_type || 'group',
                            department_id: departmentId,
                            department_code: ch.department_code,
                            auto_join_roles: ch.auto_join_roles,
                            write_roles: ch.write_roles,
                            is_readonly: ch.is_readonly ?? false,
                            created_by: gmMember?.user_id,
                        },
                        { onConflict: 'company_id,name' },
                    ).select('id').single();

                    // Auto-add GM to channel
                    if (channel?.id && gmMember?.id) {
                        await adminClient.from('chat_channel_members').upsert(
                            { channel_id: channel.id, member_id: gmMember.id, role: 'admin' },
                            { onConflict: 'channel_id,member_id' },
                        );
                    }
                }
            }
            break;

        // ─── V2: workflows (approval chains with steps) ─────────────────────
        case 'workflows':
            if (p.workflows) {
                for (const wf of p.workflows) {
                    // Insert workflow
                    const { data: workflow } = await adminClient.from('approval_workflows').upsert(
                        {
                            company_id: companyId,
                            module_code: wf.module_code,
                            trigger_event: wf.trigger_event,
                            name: wf.name_en,
                            description: wf.name_ar,
                            is_active: true,
                            auto_approve_if: wf.auto_approve_if,
                        },
                        { onConflict: 'company_id,module_code,trigger_event' },
                    ).select('id').single();

                    if (workflow?.id && wf.steps) {
                        // Delete old steps and recreate
                        await adminClient.from('approval_steps')
                            .delete()
                            .eq('workflow_id', workflow.id);

                        for (const step of wf.steps) {
                            await adminClient.from('approval_steps').insert({
                                workflow_id: workflow.id,
                                step_order: step.step_order,
                                approver_role: step.approver_role,
                                timeout_hours: step.sla_hours ?? 48,
                                sla_hours: step.sla_hours ?? 48,
                                auto_action: step.auto_action,
                                is_required: true,
                            });
                        }
                    }
                }
            }
            break;

        // ─── V2: tasks (first-7-days onboarding tasks) ─────────────────────
        case 'tasks':
            if (p.tasks) {
                const now = new Date();
                for (const task of p.tasks) {
                    const dueDate = new Date(now);
                    dueDate.setDate(dueDate.getDate() + (task.day || 1));

                    await adminClient.from('tasks').insert({
                        company_id: companyId,
                        title: task.title_en,
                        description: task.description_en,
                        priority: task.priority || 'medium',
                        status: 'todo',
                        due_date: dueDate.toISOString(),
                        visibility_scope: 'company',
                        tags: [task.category, 'onboarding', `day-${task.day}`],
                    });
                }
            }
            break;

        // ─── V2: ai_policies (AI config per company) ────────────────────────
        case 'ai_policies':
            if (p.policies) {
                await adminClient.from('company_settings').upsert(
                    {
                        company_id: companyId,
                        key: 'ai_policies',
                        value: p.policies,
                    },
                    { onConflict: 'company_id,key' },
                );
            }
            if (p.agents) {
                await adminClient.from('company_settings').upsert(
                    {
                        company_id: companyId,
                        key: 'ai_agents',
                        value: p.agents,
                    },
                    { onConflict: 'company_id,key' },
                );
            }
            if (p.rate_limits) {
                await adminClient.from('company_settings').upsert(
                    {
                        company_id: companyId,
                        key: 'ai_rate_limits',
                        value: p.rate_limits,
                    },
                    { onConflict: 'company_id,key' },
                );
            }
            break;

        // ─── V2: notifications (notification rules) ─────────────────────────
        case 'notifications':
            if (p.rules) {
                for (const rule of p.rules) {
                    await adminClient.from('notification_rules').upsert(
                        {
                            company_id: companyId,
                            event_type: rule.event_type,
                            module_code: rule.module_code,
                            target_scope: rule.target_scope,
                            target_value: rule.target_value,
                            delivery_channels: rule.delivery_channels,
                            message_template_en: rule.message_template_en,
                            message_template_ar: rule.message_template_ar,
                            priority: rule.priority,
                            is_active: true,
                        },
                        { onConflict: 'company_id,event_type,target_scope,target_value' },
                    );
                }
            }
            break;

        // ─── Existing: tax_config ───────────────────────────────────────────
        case 'tax_config':
            if (p.taxes) {
                for (const tax of p.taxes) {
                    await adminClient.from('tax_settings').insert({
                        company_id: companyId,
                        country_code: tax.country_code,
                        tax_name: tax.name,
                        tax_rate: tax.rate,
                        is_active: tax.is_active ?? true,
                    });
                }
            }
            break;

        // ─── Existing: chart_of_accounts ────────────────────────────────────
        case 'chart_of_accounts':
            if (p.accounts) {
                for (const acc of p.accounts) {
                    await adminClient.from('chart_of_accounts').insert({
                        company_id: companyId,
                        account_code: acc.code,
                        account_name: acc.name,
                        account_type: acc.type,
                        parent_code: acc.parent_code,
                        is_active: true,
                    });
                }
            }
            break;

        // ─── Existing: inventory_categories ─────────────────────────────────
        case 'inventory_categories':
            if (p.categories) {
                for (const cat of p.categories) {
                    await adminClient.from('product_categories').insert({
                        company_id: companyId,
                        name: cat.name,
                        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
                    });
                }
            }
            break;

        default:
            console.warn(`Unknown seed pack kind: ${kind}`);
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getModuleDependencies(moduleCode: string): string[] {
    const deps: Record<string, string[]> = {
        payroll: ['hr', 'accounting'],
        pos: ['store', 'accounting'],
        logistics: ['store'],
        store: ['accounting'],
        meetings: ['chat'],
        portal_builder: ['crm'],
        client_portal: ['crm', 'accounting'],
    };
    return deps[moduleCode] ?? [];
}

function getForbiddenModuleCombinations(): string[][] {
    // No forbidden combinations currently, but the structure is ready
    return [];
}

function resolveDefaultDepartments(moduleCodes: string[]): string[] {
    const depts = new Set<string>();
    depts.add('General Management');
    depts.add('Administration');

    if (moduleCodes.includes('hr')) {
        depts.add('Human Resources');
    }
    if (moduleCodes.includes('accounting')) {
        depts.add('Finance');
    }
    if (moduleCodes.includes('crm') || moduleCodes.includes('sales')) {
        depts.add('Sales');
    }
    if (moduleCodes.includes('store')) {
        depts.add('Operations');
    }
    if (moduleCodes.includes('logistics')) {
        depts.add('Logistics');
    }
    if (moduleCodes.includes('projects')) {
        depts.add('Projects');
    }

    return Array.from(depts);
}

function resolveTaxModel(country?: string): TaxModelRef | undefined {
    if (!country) return undefined;

    const taxModels: Record<string, TaxModelRef> = {
        AE: {
            countryCode: 'AE',
            taxes: [
                { name: 'VAT', rate: 5, isActive: true },
            ],
        },
        SA: {
            countryCode: 'SA',
            taxes: [
                { name: 'VAT', rate: 15, isActive: true },
            ],
        },
        US: {
            countryCode: 'US',
            taxes: [
                { name: 'State Sales Tax', rate: 0, isActive: false },
            ],
        },
        GB: {
            countryCode: 'GB',
            taxes: [
                { name: 'VAT (Standard)', rate: 20, isActive: true },
                { name: 'VAT (Reduced)', rate: 5, isActive: true },
            ],
        },
        DE: {
            countryCode: 'DE',
            taxes: [
                { name: 'MwSt (Standard)', rate: 19, isActive: true },
                { name: 'MwSt (Reduced)', rate: 7, isActive: true },
            ],
        },
        EG: {
            countryCode: 'EG',
            taxes: [
                { name: 'VAT', rate: 14, isActive: true },
            ],
        },
        TR: {
            countryCode: 'TR',
            taxes: [
                { name: 'KDV (Standard)', rate: 20, isActive: true },
                { name: 'KDV (Reduced)', rate: 10, isActive: true },
            ],
        },
    };

    return taxModels[country.toUpperCase()];
}

function resolveFeatureFlags(
    ctx: ProvisioningContext,
    matchResult: MatchResult,
): Record<string, boolean> {
    return {
        ai_enabled: true,
        ai_auto_execute: false,
        multi_currency: ctx.country !== 'AE',
        client_portal: (ctx.requestedModules ?? []).includes('crm'),
        employee_portal: true,
        advanced_reporting: (ctx.businessSize === 'large' || ctx.businessSize === 'enterprise'),
        api_access: (ctx.businessSize === 'medium' || ctx.businessSize === 'large' || ctx.businessSize === 'enterprise'),
        custom_branding: (ctx.businessSize !== 'micro'),
        gps_tracking: (ctx.requestedModules ?? []).includes('logistics'),
        pos_enabled: (ctx.requestedModules ?? []).includes('store'),
        meetings_enabled: (ctx.requestedModules ?? []).includes('meetings'),
    };
}

function resolveSuggestedIntegrations(
    moduleCodes: string[],
    country?: string,
): string[] {
    const suggestions: string[] = [];

    if (moduleCodes.includes('accounting')) {
        suggestions.push('stripe');
        if (country === 'AE' || country === 'SA') {
            suggestions.push('network_international');
        }
    }

    if (moduleCodes.includes('crm')) {
        suggestions.push('whatsapp_business');
        suggestions.push('google_calendar');
    }

    if (moduleCodes.includes('hr')) {
        suggestions.push('slack_notifications');
    }

    if (moduleCodes.includes('logistics')) {
        suggestions.push('google_maps');
    }

    if (moduleCodes.includes('meetings')) {
        suggestions.push('vonage_video');
    }

    if (moduleCodes.includes('store')) {
        suggestions.push('cloudflare_r2_storage');
    }

    return [...new Set(suggestions)];
}

function resolveDefaultLimits(businessSize?: string): Record<string, number> {
    const defaults: Record<string, Record<string, number>> = {
        micro: { max_employees: 5, max_storage_gb: 1, ai_monthly_calls: 100 },
        small: { max_employees: 25, max_storage_gb: 5, ai_monthly_calls: 500 },
        medium: { max_employees: 100, max_storage_gb: 25, ai_monthly_calls: 2000 },
        large: { max_employees: 500, max_storage_gb: 100, ai_monthly_calls: 10000 },
        enterprise: { max_employees: -1, max_storage_gb: 500, ai_monthly_calls: -1 }, // -1 = unlimited
    };

    return defaults[businessSize || 'small'] ?? defaults.small;
}

function resolveRoleMatrix(moduleCodes: string[]): RoleMatrixEntry[] {
    const roles: RoleMatrixEntry[] = [
        {
            roleCode: 'company_gm',
            modules: moduleCodes,
            permissions: ['*'],
        },
        {
            roleCode: 'assistant_gm',
            modules: moduleCodes,
            permissions: ['read', 'write', 'approve'],
        },
        {
            roleCode: 'department_head',
            modules: moduleCodes.filter(m => !['billing', 'integrations', 'portal_builder'].includes(m)),
            permissions: ['read', 'write'],
        },
        {
            roleCode: 'employee',
            modules: ['dashboard', 'employee_portal', 'chat'],
            permissions: ['read'],
        },
    ];

    return roles;
}
