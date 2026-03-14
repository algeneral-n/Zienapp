/**
 * Tenant Lifecycle State Machine
 *
 * Manages company status transitions with validation, logging, and domain events.
 * Transition rules are stored in DB (tenant_transition_rules) and cached.
 *
 * States: draft → pending_review → provisioning → trialing → active → restricted → suspended → churned → archived
 *         pending_review → rejected → pending_review (re-evaluate)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from './errors';
import { emitDomainEvent } from './domainEvents';

// ─── Types ──────────────────────────────────────────────────────────────────

export type TenantStatus =
    | 'draft'
    | 'pending_review'
    | 'provisioning'
    | 'trialing'
    | 'active'
    | 'restricted'
    | 'suspended'
    | 'churned'
    | 'archived'
    | 'rejected';

export interface TransitionRule {
    fromStatus: string;
    toStatus: string;
    allowedBy: string[];
    autoTrigger: string | null;
    description: string;
}

export interface TransitionRequest {
    companyId: string;
    toStatus: TenantStatus;
    actorUserId: string;
    actorRole: string;      // role_code or 'system'
    reason?: string;
    metadata?: Record<string, unknown>;
}

export interface TransitionResult {
    success: boolean;
    fromStatus: TenantStatus;
    toStatus: TenantStatus;
    transitionId: string;
}

// ─── Rule Cache ─────────────────────────────────────────────────────────────

let _rulesCache: TransitionRule[] | null = null;
let _rulesCacheTime = 0;
const RULES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function loadTransitionRules(adminClient: SupabaseClient): Promise<TransitionRule[]> {
    if (_rulesCache && Date.now() - _rulesCacheTime < RULES_CACHE_TTL) {
        return _rulesCache;
    }

    const { data, error } = await adminClient
        .from('tenant_transition_rules')
        .select('from_status, to_status, allowed_by, auto_trigger, description');

    if (error || !data) {
        // If rules can't be loaded, use empty list (deny all)
        console.error('Failed to load transition rules:', error?.message);
        return [];
    }

    _rulesCache = data.map((r: any) => ({
        fromStatus: r.from_status,
        toStatus: r.to_status,
        allowedBy: r.allowed_by || [],
        autoTrigger: r.auto_trigger,
        description: r.description,
    }));
    _rulesCacheTime = Date.now();
    return _rulesCache;
}

// ─── Core Transition ────────────────────────────────────────────────────────

/**
 * Validate and execute a tenant status transition.
 * Checks: rule exists, actor is authorized, logs transition, emits event.
 */
export async function transitionTenantStatus(
    adminClient: SupabaseClient,
    env: any,
    req: TransitionRequest,
): Promise<TransitionResult> {
    // 1. Get current status
    const { data: company, error: fetchErr } = await adminClient
        .from('companies')
        .select('status')
        .eq('id', req.companyId)
        .single();

    if (fetchErr || !company) {
        throw new AppError('NOT_FOUND', 'Company not found');
    }

    const fromStatus = company.status as TenantStatus;

    if (fromStatus === req.toStatus) {
        throw new AppError('CONFLICT', `Company is already in status: ${fromStatus}`);
    }

    // 2. Load transition rules
    const rules = await loadTransitionRules(adminClient);
    const rule = rules.find(r => r.fromStatus === fromStatus && r.toStatus === req.toStatus);

    if (!rule) {
        throw new AppError(
            'VALIDATION',
            `Transition from '${fromStatus}' to '${req.toStatus}' is not allowed`,
            { fromStatus, toStatus: req.toStatus },
        );
    }

    // 3. Check actor authorization
    const isSystem = req.actorRole === 'system';
    const isAllowed = isSystem || rule.allowedBy.includes(req.actorRole);

    if (!isAllowed) {
        throw new AppError(
            'FORBIDDEN',
            `Role '${req.actorRole}' cannot trigger transition: ${fromStatus} → ${req.toStatus}`,
            { allowedBy: rule.allowedBy },
        );
    }

    // 4. Execute transition
    const { error: updateErr } = await adminClient
        .from('companies')
        .update({ status: req.toStatus, updated_at: new Date().toISOString() })
        .eq('id', req.companyId);

    if (updateErr) {
        throw new AppError('INTERNAL', 'Failed to update company status');
    }

    // 5. Log transition
    const { data: transition } = await adminClient
        .from('tenant_status_transitions')
        .insert({
            company_id: req.companyId,
            from_status: fromStatus,
            to_status: req.toStatus,
            reason: req.reason,
            actor_user_id: isSystem ? null : req.actorUserId,
            metadata: req.metadata || {},
        })
        .select('id')
        .single();

    // 6. Emit domain event (fire-and-forget)
    emitDomainEvent(env, {
        eventName: `tenant.status.${req.toStatus}`,
        entityType: 'company',
        entityId: req.companyId,
        companyId: req.companyId,
        actorUserId: isSystem ? undefined : req.actorUserId,
        payload: { fromStatus, toStatus: req.toStatus, reason: req.reason },
    });

    return {
        success: true,
        fromStatus,
        toStatus: req.toStatus,
        transitionId: transition?.id || '',
    };
}

// ─── Convenience Functions ──────────────────────────────────────────────────

/**
 * Auto-restrict a tenant when usage limits are exceeded.
 * Called by entitlement engine when hard limit is hit.
 */
export async function autoRestrict(
    adminClient: SupabaseClient,
    env: any,
    companyId: string,
    reason: string,
): Promise<TransitionResult | null> {
    try {
        return await transitionTenantStatus(adminClient, env, {
            companyId,
            toStatus: 'restricted',
            actorUserId: '',
            actorRole: 'system',
            reason,
            metadata: { autoTrigger: 'quota_exceeded' },
        });
    } catch {
        // If transition is not valid (e.g., company not active), skip silently
        return null;
    }
}

/**
 * Auto-suspend a tenant when payment fails.
 * Called by billing webhook handler.
 */
export async function autoSuspend(
    adminClient: SupabaseClient,
    env: any,
    companyId: string,
    reason: string,
): Promise<TransitionResult | null> {
    try {
        return await transitionTenantStatus(adminClient, env, {
            companyId,
            toStatus: 'suspended',
            actorUserId: '',
            actorRole: 'system',
            reason,
            metadata: { autoTrigger: 'payment_failed' },
        });
    } catch {
        return null;
    }
}

/**
 * Get the list of valid transitions from the current status.
 * Used by UI to show available actions.
 */
export async function getAvailableTransitions(
    adminClient: SupabaseClient,
    companyId: string,
    actorRole: string,
): Promise<Array<{ toStatus: string; description: string }>> {
    const { data: company } = await adminClient
        .from('companies')
        .select('status')
        .eq('id', companyId)
        .single();

    if (!company) return [];

    const rules = await loadTransitionRules(adminClient);
    return rules
        .filter(r => r.fromStatus === company.status)
        .filter(r => actorRole === 'system' || r.allowedBy.includes(actorRole))
        .map(r => ({ toStatus: r.toStatus, description: r.description }));
}

/**
 * Clear cached transition rules (e.g., after admin updates rules).
 */
export function clearTransitionRulesCache(): void {
    _rulesCache = null;
    _rulesCacheTime = 0;
}
