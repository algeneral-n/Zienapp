// ─── Unified Role Hierarchy ──────────────────────────────────────────────────
// Single source of truth for role levels across the entire ZIEN platform.
// Used by: worker routes (ai, accounting, control-room, integrations, billing, provision)
//          web frontend (Sidebar, ProtectedRoute, FloatingActions)
// NEVER duplicate this map in another file. Import from here.

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

/** Get the numeric level for a role string. Defaults to 10 (client_user) for unknown roles. */
export function getRoleLevel(role: string | null | undefined): number {
  if (!role) return 10;
  return ROLE_LEVEL[role] ?? 10;
}

// ─── Action Levels ──────────────────────────────────────────────────────────
// Standardized thresholds for gating actions across all modules.

export const ACTION_LEVEL = {
  /** View dashboards, lists, own data */
  VIEW: 10,
  /** View team/department data */
  VIEW_TEAM: 35,
  /** Create/edit non-sensitive records (tasks, projects, attendance) */
  EDIT_BASIC: 35,
  /** Access module admin panels (HR list, invoice list, reports) */
  MODULE_READ: 45,
  /** Create/edit financial, HR, or integration records */
  MODULE_WRITE: 60,
  /** Approve requests, manage members, configure integrations */
  APPROVE: 65,
  /** Company-wide settings, provisioning, billing, RARE Senate */
  ADMIN: 85,
  /** Platform-level operations, founder actions */
  PLATFORM: 95,
} as const;

// ─── Module Access Matrix ───────────────────────────────────────────────────
// Minimum role level to access each module. Used by Sidebar and ProtectedRoute.

export const MODULE_ACCESS: Record<string, { read: number; write: number }> = {
  dashboard: { read: 10, write: 85 },
  hr: { read: 45, write: 60 },
  accounting: { read: 45, write: 60 },
  logistics: { read: 35, write: 55 },
  crm: { read: 45, write: 55 },
  projects: { read: 35, write: 45 },
  store: { read: 35, write: 55 },
  chat: { read: 15, write: 15 },
  meetings: { read: 15, write: 35 },
  rare: { read: 55, write: 85 },
  integrations: { read: 55, write: 75 },
  portal_builder: { read: 85, write: 85 },
  academy: { read: 10, write: 65 },
  help: { read: 10, write: 65 },
};

// ─── AI Agent Access Matrix ─────────────────────────────────────────────────
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

// ─── AI Action Classification ───────────────────────────────────────────────
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

// ─── Permission Check Utilities ─────────────────────────────────────────────

/** Check if role has at least the given level */
export function hasLevel(role: string | null | undefined, minLevel: number): boolean {
  return getRoleLevel(role) >= minLevel;
}

/** Check if role can access a module in read mode */
export function canReadModule(role: string | null | undefined, moduleCode: string): boolean {
  const mod = MODULE_ACCESS[moduleCode];
  if (!mod) return false;
  return getRoleLevel(role) >= mod.read;
}

/** Check if role can access a module in write mode */
export function canWriteModule(role: string | null | undefined, moduleCode: string): boolean {
  const mod = MODULE_ACCESS[moduleCode];
  if (!mod) return false;
  return getRoleLevel(role) >= mod.write;
}

/** Check if role can use a specific AI agent */
export function canAccessAgent(role: string | null | undefined, agentType: string): boolean {
  const minLevel = AGENT_MIN_LEVEL[agentType];
  if (minLevel === undefined) return false;
  return getRoleLevel(role) >= minLevel;
}

/** Check if role can perform a specific AI action mode */
export function canPerformAction(role: string | null | undefined, actionMode: string): boolean {
  const minLevel = AI_ACTION_LEVEL[actionMode];
  if (minLevel === undefined) return false;
  return getRoleLevel(role) >= minLevel;
}

/** Full AI permission check: role must pass both agent access AND action level */
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
