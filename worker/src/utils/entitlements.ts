/**
 * Entitlement Engine — checks and enforces feature quotas per company.
 *
 * Uses the entitlements table to verify a company has quota for a feature
 * before allowing an operation. Atomic increment via DB function.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppError } from './errors';

export interface EntitlementCheck {
    allowed: boolean;
    reason: 'unlimited' | 'within_quota' | 'quota_exceeded' | 'no_entitlement';
    featureCode: string;
    quotaLimit?: number;
    quotaUsed?: number;
    remaining?: number;
}

export interface IncrementResult {
    success: boolean;
    reason?: string;
    quotaUsed?: number;
    quotaLimit?: number;
}

/**
 * Check if a company has remaining quota for a feature code.
 * Does NOT increment — read-only check.
 */
export async function checkEntitlement(
    adminClient: SupabaseClient,
    companyId: string,
    featureCode: string,
): Promise<EntitlementCheck> {
    const { data, error } = await adminClient.rpc('check_entitlement', {
        _company_id: companyId,
        _feature_code: featureCode,
    });

    if (error) {
        console.error('Entitlement check failed:', error.message);
        // Fail-open: allow if the entitlement system is down
        return { allowed: true, reason: 'unlimited', featureCode };
    }

    return {
        allowed: data.allowed,
        reason: data.reason,
        featureCode: data.feature_code,
        quotaLimit: data.quota_limit,
        quotaUsed: data.quota_used,
        remaining: data.remaining,
    };
}

/**
 * Atomically increment usage for a feature and check quota in one call.
 * Returns success=false if quota would be exceeded (does NOT increment in that case).
 */
export async function incrementUsage(
    adminClient: SupabaseClient,
    companyId: string,
    featureCode: string,
    amount: number = 1,
): Promise<IncrementResult> {
    const { data, error } = await adminClient.rpc('increment_entitlement_usage', {
        _company_id: companyId,
        _feature_code: featureCode,
        _amount: amount,
    });

    if (error) {
        console.error('Usage increment failed:', error.message);
        // Fail-open: treat as success if DB is unreachable
        return { success: true };
    }

    return {
        success: data.success,
        reason: data.reason,
        quotaUsed: data.quota_used,
        quotaLimit: data.quota_limit,
    };
}

/**
 * Enforce an entitlement check — throws AppError if not allowed.
 * Use this in route handlers before performing the operation.
 */
export async function requireEntitlement(
    adminClient: SupabaseClient,
    companyId: string,
    featureCode: string,
): Promise<void> {
    const check = await checkEntitlement(adminClient, companyId, featureCode);

    if (!check.allowed) {
        const detail = check.reason === 'quota_exceeded'
            ? `Quota exceeded for ${featureCode}: ${check.quotaUsed}/${check.quotaLimit}`
            : `No entitlement for feature: ${featureCode}`;

        throw new AppError('FORBIDDEN', detail, {
            featureCode,
            reason: check.reason,
            quotaLimit: check.quotaLimit,
            quotaUsed: check.quotaUsed,
        });
    }
}

/**
 * Check + increment in one step. Throws if quota exceeded.
 * Use when the action is the consumption (e.g., AI call = 1 token used).
 */
export async function consumeEntitlement(
    adminClient: SupabaseClient,
    companyId: string,
    featureCode: string,
    amount: number = 1,
): Promise<void> {
    const result = await incrementUsage(adminClient, companyId, featureCode, amount);

    if (!result.success) {
        throw new AppError('FORBIDDEN', `Quota exceeded for ${featureCode}`, {
            featureCode,
            reason: result.reason,
            quotaLimit: result.quotaLimit,
            quotaUsed: result.quotaUsed,
        });
    }
}
