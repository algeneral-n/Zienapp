// ─── GenericDetail ───────────────────────────────────────────────────────────
// Detail view with side tabs. Used for entity detail pages (employee, invoice, etc.).
// Matches ZIEN design system: rounded-3xl cards, uppercase headers, pill tabs.

import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import type { DetailTab } from './types';

interface GenericDetailProps {
    /** Page title */
    title: string;
    /** Subtitle / breadcrumb text */
    subtitle?: string;
    /** Tab definitions */
    tabs: DetailTab[];
    /** Whether the detail data is still loading */
    loading?: boolean;
    /** Action buttons in the header */
    actions?: React.ReactNode;
    /** Show a back button (default true) */
    showBack?: boolean;
}

export function GenericDetail({
    title,
    subtitle,
    tabs,
    loading = false,
    actions,
    showBack = true,
}: GenericDetailProps) {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? '');

    const visibleTabs = tabs.filter(
        (t) => !t.permission || hasPermission(t.permission),
    );

    const activeContent = visibleTabs.find((t) => t.key === activeTab)?.content;

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ─── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {showBack && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">{title}</h2>
                        {subtitle && (
                            <p className="text-xs text-zinc-500 font-medium">{subtitle}</p>
                        )}
                    </div>
                </div>
                {actions}
            </div>

            {/* ─── Tabs + Content ──────────────────────────────────────────────── */}
            {visibleTabs.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.key
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-blue-600/50'
                                }`}
                        >
                            {tab.icon && <tab.icon size={16} />}
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 p-8">
                {activeContent}
            </div>
        </div>
    );
}
