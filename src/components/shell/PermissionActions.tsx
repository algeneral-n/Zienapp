// ─── PermissionActions ───────────────────────────────────────────────────────
// Renders a set of action buttons, each gated behind a permission check.
// Buttons that the user lacks permission for are hidden (not disabled).

import React from 'react';
import { Loader2 } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import type { ActionDef } from './types';

interface PermissionActionsProps {
  actions: ActionDef[];
}

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700',
  secondary:
    'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-blue-600/50',
  danger:
    'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white',
};

export function PermissionActions({ actions }: PermissionActionsProps) {
  const { hasPermission } = usePermissions();

  const visible = actions.filter(
    (a) => !a.permission || hasPermission(a.permission),
  );

  if (visible.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {visible.map((action) => (
        <button
          key={action.key}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 ${
            VARIANT_CLASSES[action.variant || 'primary']
          }`}
        >
          {action.loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            action.icon && <action.icon size={16} />
          )}
          {action.label}
        </button>
      ))}
    </div>
  );
}
