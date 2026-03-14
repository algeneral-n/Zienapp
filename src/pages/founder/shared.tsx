/**
 * Founder shared components & utilities
 */
import React from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';

const API = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

// ─── Authenticated Fetch for Founder Routes ─────────────────────────────────

export async function founderFetch<T = any>(
    path: string,
    method: string = 'GET',
    body?: unknown,
): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
    };

    const init: RequestInit = { method, headers };
    if (body && method !== 'GET') {
        init.body = JSON.stringify(body);
    }

    const res = await fetch(`${API}${path}`, init);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error || res.statusText);
    }
    return res.json() as Promise<T>;
}

// ─── Shared UI States ────────────────────────────────────────────────────────

export const LoadingState = () => (
    <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
);

export const ErrorState = ({ message }: { message: string }) => (
    <div className="text-center py-20">
        <p className="text-red-500 text-sm font-medium">{message}</p>
    </div>
);

export const UnavailableState = ({ feature }: { feature: string }) => (
    <div className="text-center py-20">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            {feature} is currently unavailable
        </p>
    </div>
);

export const API_URL = API;

// ─── Reusable UI Components ─────────────────────────────────────────────────

export function ConfirmDialog({ open, title, message, danger, onConfirm, onCancel }: {
    open: boolean;
    title: string;
    message: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
            <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-black uppercase tracking-tighter mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{message}</p>
                <div className="flex items-center justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Confirm</button>
                </div>
            </div>
        </div>
    );
}

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'xs' }) {
    const colorMap: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        connected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        running: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        operational: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        degraded: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        overdue: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        past_due: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        disconnected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        cancelled: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
        stopped: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    };
    const colors = colorMap[status] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
    const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]';
    return (
        <span className={`${colors} ${sizeClasses} rounded-full font-bold uppercase tracking-widest inline-block`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

export function TabBar({ tabs, active, onChange }: {
    tabs: Array<{ key: string; label: string; count?: number }>;
    active: string;
    onChange: (key: string) => void;
}) {
    return (
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl overflow-x-auto">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${active === tab.key ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-full text-[9px]">{tab.count}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

export function SectionHeader({ title, subtitle, action }: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">{title}</h2>
                {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

export function StatCard({ label, value, icon: Icon, color = 'blue', sub }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color?: 'blue' | 'emerald' | 'violet' | 'amber' | 'red' | 'zinc';
    sub?: string;
}) {
    const iconColors: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    };
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
                    <Icon size={18} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
            </div>
            <p className="text-2xl font-black tracking-tight">{value}</p>
            {sub && <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>}
        </div>
    );
}

export function HealthDot({ status }: { status: string }) {
    const colorMap: Record<string, string> = {
        healthy: 'bg-emerald-500',
        connected: 'bg-emerald-500',
        operational: 'bg-emerald-500',
        running: 'bg-emerald-500',
        degraded: 'bg-amber-500 animate-pulse',
        warning: 'bg-amber-500 animate-pulse',
        error: 'bg-red-500 animate-pulse',
        disconnected: 'bg-red-500',
        critical: 'bg-red-500 animate-pulse',
        stopped: 'bg-zinc-400',
    };
    return <div className={`w-2.5 h-2.5 rounded-full ${colorMap[status] || 'bg-zinc-400'}`} />;
}
