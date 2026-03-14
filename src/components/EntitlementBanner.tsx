// ─── EntitlementBanner ────────────────────────────────────────────────────────
// Shows a warning banner when a feature's quota is exceeded or near the limit.
// Usage:
//   <EntitlementBanner featureCode="ai_tokens" />
//   <EntitlementBanner featureCode="modules" onUpgrade={() => navigate('/billing')} />

import React, { useEffect, useState } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EntitlementStatus {
    allowed: boolean;
    reason?: string;
    quota_limit?: number;
    quota_used?: number;
    remaining?: number;
}

interface Props {
    featureCode: string;
    /** Optional callback when user clicks the upgrade action */
    onUpgrade?: () => void;
    className?: string;
}

export function EntitlementBanner({ featureCode, onUpgrade, className = '' }: Props) {
    const { t } = useTranslation();
    const { company } = useCompany();
    const [status, setStatus] = useState<EntitlementStatus | null>(null);

    useEffect(() => {
        if (!company?.id) return;

        const token = localStorage.getItem('supabase_access_token');
        if (!token) return;

        const apiBase = import.meta.env.VITE_WORKER_URL || '';
        fetch(`${apiBase}/api/entitlements/check?companyId=${encodeURIComponent(company.id)}&featureCode=${encodeURIComponent(featureCode)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setStatus(data); })
            .catch(() => {/* fail silently — entitlements are fail-open */ });
    }, [company?.id, featureCode]);

    // Don't render anything if we have no data or the feature is allowed with plenty of room
    if (!status) return null;
    if (status.allowed && (status.remaining === undefined || status.remaining > 10)) return null;

    const exceeded = !status.allowed;
    const nearLimit = status.allowed && status.remaining !== undefined && status.remaining <= 10;

    if (!exceeded && !nearLimit) return null;

    return (
        <div
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${exceeded
                    ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                } ${className}`}
        >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">
                {exceeded
                    ? t('entitlement_exceeded', { feature: featureCode, defaultValue: `Your ${featureCode} quota has been exceeded. Upgrade your plan to continue.` })
                    : t('entitlement_near_limit', { feature: featureCode, remaining: status.remaining, defaultValue: `You have ${status.remaining} ${featureCode} remaining.` })}
            </span>
            {onUpgrade && (
                <button
                    onClick={onUpgrade}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-3 py-1 text-xs font-semibold shadow-sm transition hover:bg-white dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                    {t('upgrade', { defaultValue: 'Upgrade' })}
                    <ArrowUpRight className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
