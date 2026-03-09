// ─── usePermissions Hook ─────────────────────────────────────────────────────
// Central frontend permission hook. Replaces all ad-hoc role checks.
// Uses the shared permission resolver from src/lib/permissions.ts.

import { useMemo } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getRoleLevel,
  hasLevel,
  canReadModule,
  canWriteModule,
  canAccessAgent,
  canPerformAction,
  checkAIPermission,
  ACTION_LEVEL,
} from '../lib/permissions';

export interface PermissionsAPI {
  /** Current role string */
  role: string | null;
  /** Numeric level for the current role */
  level: number;
  /** Whether the current user is a platform-level admin (founder / platform_admin) */
  isPlatform: boolean;
  /** Whether the current user is company GM or higher */
  isAdmin: boolean;
  /** Whether the current user can manage team (supervisor+) */
  isManager: boolean;
  /** Whether the company has an active subscription */
  hasActiveSubscription: boolean;
  /** Check if user meets a minimum level */
  hasLevel: (minLevel: number) => boolean;
  /** Check if user can read a specific module (role + module activation + subscription) */
  canReadModule: (moduleCode: string) => boolean;
  /** Check if user can write to a specific module */
  canWriteModule: (moduleCode: string) => boolean;
  /** Check if user can use a specific AI agent */
  canAccessAgent: (agentType: string) => boolean;
  /** Check if user can perform a specific AI action */
  canPerformAction: (actionMode: string) => boolean;
  /** Full AI permission check */
  checkAI: (agentType: string, actionMode: string) => { allowed: boolean; reason?: string };
}

export function usePermissions(): PermissionsAPI {
  const { role, membership, hasModule, company } = useCompany();
  const { profile } = useAuth();

  // Determine effective role: company role takes precedence, then platform role
  const effectiveRole = useMemo(() => {
    if (role) return role as string;
    if (profile && (profile as any).platformRole) return (profile as any).platformRole;
    return null;
  }, [role, profile]);

  const level = useMemo(() => getRoleLevel(effectiveRole), [effectiveRole]);

  // Check subscription status (platform users bypass)
  const hasActiveSubscription = useMemo(() => {
    if (level >= ACTION_LEVEL.PLATFORM) return true; // founders/platform_admins always pass
    if (!company) return false;
    const status = (company as any).subscriptionStatus;
    return !status || status === 'active' || status === 'trialing' || status === 'past_due';
  }, [company, level]);

  return useMemo(
    () => ({
      role: effectiveRole,
      level,
      isPlatform: level >= ACTION_LEVEL.PLATFORM,
      isAdmin: level >= ACTION_LEVEL.ADMIN,
      isManager: level >= 55,
      hasActiveSubscription,
      hasLevel: (min: number) => hasLevel(effectiveRole, min),
      canReadModule: (mod: string) => {
        // Combined check: role permission + module activated for company
        const roleOk = canReadModule(effectiveRole, mod);
        const moduleOk = level >= ACTION_LEVEL.PLATFORM || hasModule(mod);
        return roleOk && moduleOk;
      },
      canWriteModule: (mod: string) => {
        const roleOk = canWriteModule(effectiveRole, mod);
        const moduleOk = level >= ACTION_LEVEL.PLATFORM || hasModule(mod);
        return roleOk && moduleOk;
      },
      canAccessAgent: (agent: string) => canAccessAgent(effectiveRole, agent),
      canPerformAction: (action: string) => canPerformAction(effectiveRole, action),
      checkAI: (agent: string, action: string) => checkAIPermission(effectiveRole, agent, action),
    }),
    [effectiveRole, level, hasActiveSubscription, hasModule],
  );
}
