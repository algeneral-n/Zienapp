// ─── ModuleShell ─────────────────────────────────────────────────────────────
// Standard wrapper for every platform module.
// Provides: permission gate, pill-nav tabs, animated route outlet,
// loading / error / denied states, and module-level event hooks.

import React, { type ReactNode } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldX } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import type { TabConfig, ModuleConfig } from './types';

// ─── Sub-components ──────────────────────────────────────────────────────────

function PermissionDenied() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                <ShieldX size={32} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">Access Denied</h2>
            <p className="text-sm text-zinc-500 max-w-sm">
                You don&apos;t have permission to access this module. Contact your company admin for access.
            </p>
        </div>
    );
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

interface TabBarProps {
    tabs: TabConfig[];
    hasPermission: (code: string) => boolean;
}

function TabBar({ tabs, hasPermission }: TabBarProps) {
    const visibleTabs = tabs.filter(
        (t) => !t.permission || hasPermission(t.permission),
    );

    return (
        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {visibleTabs.map((tab) => (
                <NavLink
                    key={tab.label}
                    to={tab.path}
                    end={tab.path === ''}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-blue-600/50'
                        }`
                    }
                >
                    <tab.icon size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                        {tab.label}
                    </span>
                </NavLink>
            ))}
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface ModuleShellProps {
    config: ModuleConfig;
    /** Route elements: array of { path, element } matching config.tabs */
    routes: { path: string; element: ReactNode }[];
    /** Optional header above the tab bar */
    header?: ReactNode;
}

export function ModuleShell({ config, routes, header }: ModuleShellProps) {
    const { hasPermission } = usePermissions();

    // Gate the entire module behind a required permission
    if (config.requiredPermission && !hasPermission(config.requiredPermission)) {
        return <PermissionDenied />;
    }

    return (
        <div className="space-y-8">
            {header}

            <TabBar tabs={config.tabs} hasPermission={hasPermission} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Routes>
                    {routes.map((r) => (
                        <Route key={r.path} path={r.path} element={r.element} />
                    ))}
                </Routes>
            </motion.div>
        </div>
    );
}
