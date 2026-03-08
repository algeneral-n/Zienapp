// ─── Unified Role Hierarchy (Worker copy) ────────────────────────────────────
// IMPORTANT: This is the worker-side copy of src/lib/permissions.ts.
// Keep in sync with the frontend version. Both are the canonical source of truth.

export const ROLE_LEVEL: Record<string, number> = {
  // Platform roles
  founder: 100,
  platform_admin: 95,
  platform_support: 80,

  // Company roles
  company_gm: 90,
  assistant_gm: 85,
  executive_secretary: 75,
  department_manager: 65,
  hr_officer: 60,
  accountant: 60,
  supervisor: 55,
  senior_employee: 45,
  sales_rep: 45,
  employee: 35,
  field_employee: 35,
  driver: 30,
  new_hire: 20,
  trainee: 15,
  client_user: 10,
};

export function getRoleLevel(role: string | null | undefined): number {
  if (!role) return 10;
  return ROLE_LEVEL[role] ?? 10;
}

export const ACTION_LEVEL = {
  VIEW: 10,
  VIEW_TEAM: 35,
  EDIT_BASIC: 35,
  MODULE_READ: 45,
  MODULE_WRITE: 60,
  APPROVE: 65,
  ADMIN: 85,
  PLATFORM: 95,
} as const;

export const MODULE_ACCESS: Record<string, { read: number; write: number }> = {
  dashboard: { read: 10, write: 85 },
  hr: { read: 45, write: 60 },
  accounting: { read: 45, write: 60 },
  logistics: { read: 35, write: 55 },
  crm: { read: 45, write: 55 },
  projects: { read: 35, write: 45 },
  store: { read: 35, write: 55 },
  meetings: { read: 15, write: 35 },
  rare: { read: 55, write: 85 },
  integrations: { read: 55, write: 75 },
  portal_builder: { read: 85, write: 85 },
  academy: { read: 10, write: 65 },
  help: { read: 10, write: 65 },
};

export const AGENT_MIN_LEVEL: Record<string, number> = {
  general: 10,
  meetings: 35,
  projects: 35,
  employee: 35,
  sales: 45,
  fleet: 45,
  store: 45,
  crm: 50,
  marketing: 55,
  hr: 60,
  accounting: 60,
  logistics: 55,
  legal: 65,
  compliance: 65,
  audit: 65,
  investors: 85,
  security: 75,
  procurement: 55,
  secretary: 75,
  gm: 85,
  director: 90,
  founder: 95,
  cto: 90,
  cfo: 90,
};

export const AI_ACTION_LEVEL: Record<string, number> = {
  help: 10,
  analyze: 35,
  report: 45,
  act: 55,
  approve: 65,
  delete: 75,
  transfer: 85,
  payroll_run: 85,
  terminate: 85,
};

export function hasLevel(role: string | null | undefined, minLevel: number): boolean {
  return getRoleLevel(role) >= minLevel;
}

export function canReadModule(role: string | null | undefined, moduleCode: string): boolean {
  const mod = MODULE_ACCESS[moduleCode];
  if (!mod) return false;
  return getRoleLevel(role) >= mod.read;
}

export function canWriteModule(role: string | null | undefined, moduleCode: string): boolean {
  const mod = MODULE_ACCESS[moduleCode];
  if (!mod) return false;
  return getRoleLevel(role) >= mod.write;
}

export function canAccessAgent(role: string | null | undefined, agentType: string): boolean {
  const minLevel = AGENT_MIN_LEVEL[agentType];
  if (minLevel === undefined) return false;
  return getRoleLevel(role) >= minLevel;
}

export function canPerformAction(role: string | null | undefined, actionMode: string): boolean {
  const minLevel = AI_ACTION_LEVEL[actionMode];
  if (minLevel === undefined) return false;
  return getRoleLevel(role) >= minLevel;
}

export function checkAIPermission(
  role: string | null | undefined,
  agentType: string,
  actionMode: string,
): { allowed: boolean; reason?: string } {
  const level = getRoleLevel(role);
  const agentMin = AGENT_MIN_LEVEL[agentType];
  const actionMin = AI_ACTION_LEVEL[actionMode];

  if (agentMin !== undefined && level < agentMin) {
    return { allowed: false, reason: `Role level ${level} cannot access ${agentType} agent (requires ${agentMin})` };
  }
  if (actionMin !== undefined && level < actionMin) {
    return { allowed: false, reason: `Role level ${level} cannot perform ${actionMode} action (requires ${actionMin})` };
  }
  return { allowed: true };
}

// ─── Convenience exports used by route handlers ────────────────────────────

/** Role level >= 55 (supervisor+) can write in most operational modules */
export function hasWriteAccess(role: string | null | undefined): boolean {
  return getRoleLevel(role) >= 55;
}

/** CRM write: level >= 40 */
export function hasCRMWriteAccess(role: string | null | undefined): boolean {
  return getRoleLevel(role) >= 40;
}

/** HR write: level >= 55 */
export function hasHRWriteAccess(role: string | null | undefined): boolean {
  return getRoleLevel(role) >= 55;
}

/** Accounting read: level >= 40 */
export function hasAccountingReadAccess(role: string | null | undefined): boolean {
  return getRoleLevel(role) >= 40;
}

/** Accounting write: level >= 65 */
export function hasAccountingWriteAccess(role: string | null | undefined): boolean {
  return getRoleLevel(role) >= 65;
}
