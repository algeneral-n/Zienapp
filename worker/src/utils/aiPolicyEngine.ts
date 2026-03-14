// ─── AI Policy Engine ────────────────────────────────────────────────────────
// Enforces ai_action_policies, budget limits, model routing, and confirmation
// requirements before every AI call. Replaces scattered hardcoded checks.

import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from './errors';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PolicyDecision {
    allowed: boolean;
    tier: 'auto_execute' | 'suggest' | 'require_approval' | 'deny';
    model: string;
    requireConfirmation: boolean;
    reason?: string;
    budgetStatus?: BudgetStatus;
    maxTokens?: number;
}

export interface BudgetStatus {
    allowed: boolean;
    reason?: string;
    dailyUsed?: number;
    dailyLimit?: number;
    monthlyUsed?: number;
    monthlyLimit?: number;
    alert?: boolean;
}

interface PolicyRow {
    id: string;
    company_id: string | null;
    module_code: string | null;
    agent_type: string | null;
    action_mode: string;
    min_role_level: number;
    permission_tier: string;
    require_confirmation: boolean;
    budget_limit_daily: number | null;
    budget_limit_monthly: number | null;
    max_tokens_per_call: number | null;
    preferred_model: string | null;
    is_active: boolean;
}

// ─── Policy Resolution ─────────────────────────────────────────────────────

/**
 * Evaluate all applicable policies for a given AI call.
 * Resolution order: company+agent+mode > company+agent > company+mode > company+* > platform.
 */
export async function evaluatePolicy(
    adminClient: SupabaseClient,
    params: {
        companyId: string;
        agentType: string;
        actionMode: string;
        roleLevel: number;
    },
): Promise<PolicyDecision> {
    const { companyId, agentType, actionMode, roleLevel } = params;

    // Load applicable policies (company-specific + platform-wide)
    const { data: policies } = await adminClient
        .from('ai_action_policies')
        .select('*')
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .eq('is_active', true);

    if (!policies || policies.length === 0) {
        // No policies defined — fall back to allow with default model
        return {
            allowed: true,
            tier: 'auto_execute',
            model: 'gpt-4o-mini',
            requireConfirmation: false,
        };
    }

    // Find best matching policy (most specific wins)
    const matched = findBestPolicy(policies as PolicyRow[], companyId, agentType, actionMode);

    if (!matched) {
        return {
            allowed: true,
            tier: 'auto_execute',
            model: 'gpt-4o-mini',
            requireConfirmation: false,
        };
    }

    // Check role level
    if (roleLevel < matched.min_role_level) {
        return {
            allowed: false,
            tier: 'deny',
            model: matched.preferred_model || 'gpt-4o-mini',
            requireConfirmation: false,
            reason: `Minimum role level ${matched.min_role_level} required (you have ${roleLevel})`,
        };
    }

    // Check if tier is deny
    if (matched.permission_tier === 'deny') {
        return {
            allowed: false,
            tier: 'deny',
            model: matched.preferred_model || 'gpt-4o-mini',
            requireConfirmation: false,
            reason: 'Action denied by policy',
        };
    }

    return {
        allowed: true,
        tier: matched.permission_tier as PolicyDecision['tier'],
        model: matched.preferred_model || 'gpt-4o-mini',
        requireConfirmation: matched.require_confirmation,
        maxTokens: matched.max_tokens_per_call ?? undefined,
    };
}

/**
 * Check AI budget for a company. Uses DB function for atomic counting.
 */
export async function checkAIBudget(
    adminClient: SupabaseClient,
    companyId: string,
): Promise<BudgetStatus> {
    try {
        const { data, error } = await adminClient.rpc('check_ai_budget', {
            _company_id: companyId,
        });

        if (error || !data) {
            // Fail-open: if budget check fails, allow the call
            return { allowed: true, reason: 'budget_check_unavailable' };
        }

        return {
            allowed: data.allowed,
            reason: data.reason,
            dailyUsed: data.daily_used,
            dailyLimit: data.daily_limit === -1 ? undefined : data.daily_limit,
            monthlyUsed: data.monthly_used,
            monthlyLimit: data.monthly_limit === -1 ? undefined : data.monthly_limit,
            alert: data.alert,
        };
    } catch {
        return { allowed: true, reason: 'budget_check_error' };
    }
}

/**
 * Resolve the best model for an agent+mode combination.
 * Uses DB routing rules with priority-based fallback.
 */
export async function resolveModel(
    adminClient: SupabaseClient,
    agentType: string,
    mode: string,
): Promise<string> {
    try {
        const { data, error } = await adminClient.rpc('resolve_ai_model', {
            _agent_type: agentType,
            _mode: mode,
        });

        if (error || !data) return 'gpt-4o-mini';
        return data as string;
    } catch {
        return 'gpt-4o-mini';
    }
}

/**
 * Full pre-flight check: policy + budget + model routing.
 * Call this before every AI request.
 */
export async function preflightAICheck(
    adminClient: SupabaseClient,
    params: {
        companyId: string;
        agentType: string;
        actionMode: string;
        roleLevel: number;
    },
): Promise<PolicyDecision> {
    // 1. Evaluate policy
    const decision = await evaluatePolicy(adminClient, params);

    if (!decision.allowed) return decision;

    // 2. Check budget
    const budget = await checkAIBudget(adminClient, params.companyId);
    decision.budgetStatus = budget;

    if (!budget.allowed) {
        return {
            ...decision,
            allowed: false,
            reason: budget.reason === 'daily_limit_exceeded'
                ? `Daily AI limit reached (${budget.dailyUsed}/${budget.dailyLimit})`
                : `Monthly AI limit reached (${budget.monthlyUsed}/${budget.monthlyLimit})`,
        };
    }

    // 3. Resolve model (if policy didn't specify one)
    if (!decision.model || decision.model === 'gpt-4o-mini') {
        const routedModel = await resolveModel(adminClient, params.agentType, params.actionMode);
        decision.model = routedModel;
    }

    return decision;
}

/**
 * Require approval: creates an ai_action_reviews record and throws.
 */
export async function requireApproval(
    adminClient: SupabaseClient,
    params: {
        companyId: string;
        agentType: string;
        actionMode: string;
        prompt: string;
        model: string;
    },
): Promise<void> {
    // Find the matching policy rule ID
    const { data: policy } = await adminClient
        .from('ai_action_policies')
        .select('id')
        .or(`company_id.eq.${params.companyId},company_id.is.null`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

    await adminClient.from('ai_action_reviews').insert({
        company_id: params.companyId,
        policy_rule_id: policy?.id || null,
        action_type: `${params.agentType}.${params.actionMode}`,
        action_payload: { prompt: params.prompt.substring(0, 500) },
        ai_model: params.model,
        status: 'pending',
    });

    throw new AppError('FORBIDDEN', 'This action requires approval before execution. A review request has been created.');
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function findBestPolicy(
    policies: PolicyRow[],
    companyId: string,
    agentType: string,
    actionMode: string,
): PolicyRow | null {
    // Score each policy by specificity
    const scored = policies
        .filter((p) => {
            const agentMatch = !p.agent_type || p.agent_type === '*' || p.agent_type === agentType;
            const modeMatch = !p.action_mode || p.action_mode === '*' || p.action_mode === actionMode;
            return agentMatch && modeMatch;
        })
        .map((p) => {
            let score = 0;
            // Company-specific beats platform-wide
            if (p.company_id === companyId) score += 100;
            // Exact agent match beats wildcard
            if (p.agent_type === agentType) score += 10;
            // Exact mode match beats wildcard
            if (p.action_mode === actionMode) score += 5;
            return { policy: p, score };
        })
        .sort((a, b) => b.score - a.score);

    return scored.length > 0 ? scored[0].policy : null;
}
