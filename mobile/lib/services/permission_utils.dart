// ============================================================================
// ZIEN Mobile — Permission Utilities (Riverpod)
// Mirrors: web/src/lib/permissions.ts — SINGLE SOURCE OF TRUTH
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/enums.dart';
import 'company_providers.dart';

// ─── Role Level Map ──────────────────────────────────────────────────────────
// Must match web/src/lib/permissions.ts ROLE_LEVEL exactly.

const Map<String, int> roleLevel = {
  // Platform roles
  'founder': 100,
  'platform_admin': 95,
  'platform_support': 80,
  // Company roles
  'company_gm': 90,
  'assistant_gm': 85,
  'executive_secretary': 75,
  'department_manager': 65,
  'hr_officer': 60,
  'accountant': 60,
  'supervisor': 55,
  'senior_employee': 45,
  'sales_rep': 45,
  'employee': 35,
  'field_employee': 35,
  'driver': 30,
  'new_hire': 20,
  'trainee': 15,
  'client_user': 10,
};

// ─── Action Level Thresholds ─────────────────────────────────────────────────

class ActionLevel {
  static const int view = 10;
  static const int viewTeam = 35;
  static const int editBasic = 35;
  static const int moduleRead = 45;
  static const int moduleWrite = 60;
  static const int approve = 65;
  static const int admin = 85;
  static const int platform = 95;
}

// ─── Module Access Matrix ────────────────────────────────────────────────────

class ModuleAccess {
  final int read;
  final int write;
  const ModuleAccess(this.read, this.write);
}

const Map<String, ModuleAccess> moduleAccess = {
  'dashboard': ModuleAccess(10, 85),
  'hr': ModuleAccess(45, 60),
  'accounting': ModuleAccess(45, 60),
  'logistics': ModuleAccess(35, 55),
  'crm': ModuleAccess(45, 55),
  'projects': ModuleAccess(35, 45),
  'store': ModuleAccess(35, 55),
  'meetings': ModuleAccess(15, 35),
  'rare': ModuleAccess(55, 85),
  'integrations': ModuleAccess(55, 75),
  'portal_builder': ModuleAccess(85, 85),
  'academy': ModuleAccess(10, 65),
  'help': ModuleAccess(10, 65),
};

// ─── AI Agent Access Matrix ──────────────────────────────────────────────────

const Map<String, int> agentMinLevel = {
  'general': 10,
  'meetings': 35,
  'projects': 35,
  'employee': 35,
  'sales': 45,
  'fleet': 45,
  'store': 45,
  'crm': 50,
  'marketing': 55,
  'hr': 60,
  'accounting': 60,
  'logistics': 55,
  'legal': 65,
  'compliance': 65,
  'audit': 65,
  'investors': 85,
  'security': 75,
  'procurement': 55,
  'secretary': 75,
  'gm': 85,
  'director': 90,
  'founder': 95,
  'cto': 90,
  'cfo': 90,
};

// ─── AI Action Classification ────────────────────────────────────────────────

const Map<String, int> aiActionLevel = {
  'help': 10,
  'analyze': 35,
  'report': 45,
  'act': 55,
  'approve': 65,
  'delete': 75,
  'transfer': 85,
  'payroll_run': 85,
  'terminate': 85,
};

// ─── Utility Functions ───────────────────────────────────────────────────────

/// Get the numeric level for a role string. Defaults to 10 for unknown.
int getRoleLevel(String? role) {
  if (role == null || role.isEmpty) return 10;
  return roleLevel[role] ?? 10;
}

/// Get level from CompanyRole enum directly.
int getRoleLevelFromEnum(CompanyRole? role) {
  return role?.level ?? 10;
}

/// Check if role meets a minimum level.
bool hasLevel(String? role, int minLevel) {
  return getRoleLevel(role) >= minLevel;
}

/// Check if role can read a module.
bool canReadModule(String? role, String moduleCode) {
  final mod = moduleAccess[moduleCode];
  if (mod == null) return false;
  return getRoleLevel(role) >= mod.read;
}

/// Check if role can write to a module.
bool canWriteModule(String? role, String moduleCode) {
  final mod = moduleAccess[moduleCode];
  if (mod == null) return false;
  return getRoleLevel(role) >= mod.write;
}

/// Check if role can use a specific AI agent.
bool canAccessAgent(String? role, String agentType) {
  final minLevel = agentMinLevel[agentType];
  if (minLevel == null) return false;
  return getRoleLevel(role) >= minLevel;
}

/// Check if role can perform a specific AI action mode.
bool canPerformAction(String? role, String actionMode) {
  final minLevel = aiActionLevel[actionMode];
  if (minLevel == null) return false;
  return getRoleLevel(role) >= minLevel;
}

/// Full AI permission check — role must pass both agent + action level.
({bool allowed, String? reason}) checkAIPermission(
  String? role,
  String agentType,
  String actionMode,
) {
  final level = getRoleLevel(role);
  final agentMin = agentMinLevel[agentType];
  final actionMin = aiActionLevel[actionMode];

  if (agentMin != null && level < agentMin) {
    return (
      allowed: false,
      reason:
          'Role level $level cannot access $agentType agent (requires $agentMin)',
    );
  }
  if (actionMin != null && level < actionMin) {
    return (
      allowed: false,
      reason:
          'Role level $level cannot perform $actionMode action (requires $actionMin)',
    );
  }
  return (allowed: true, reason: null);
}

/// Get all module codes accessible (read) by the given role.
List<String> getAccessibleModules(String? role) {
  final level = getRoleLevel(role);
  return moduleAccess.entries
      .where((e) => level >= e.value.read)
      .map((e) => e.key)
      .toList();
}

/// Get all module codes writable by the given role.
List<String> getWritableModules(String? role) {
  final level = getRoleLevel(role);
  return moduleAccess.entries
      .where((e) => level >= e.value.write)
      .map((e) => e.key)
      .toList();
}

// ─── Riverpod Providers ──────────────────────────────────────────────────────

/// Current user's role as a String (derived from CompanyRole enum in company_providers).
final currentRoleStringProvider = Provider<String?>((ref) {
  final companyRole = ref.watch(currentRoleProvider);
  return companyRole?.name;
});

/// Current user's numeric level.
final currentLevelProvider = Provider<int>((ref) {
  final role = ref.watch(currentRoleStringProvider);
  return getRoleLevel(role);
});

/// Whether current user is platform-level (founder/admin/support).
final isPlatformUserProvider = Provider<bool>((ref) {
  return ref.watch(currentLevelProvider) >= 80;
});

/// Whether current user is admin-level (GM+).
final isAdminProvider = Provider<bool>((ref) {
  return ref.watch(currentLevelProvider) >= ActionLevel.admin;
});

/// Whether current user is manager-level (department_manager+).
final isManagerProvider = Provider<bool>((ref) {
  return ref.watch(currentLevelProvider) >= 65;
});

/// Family provider: can read specific module?
final canReadModuleProvider = Provider.family<bool, String>((ref, module) {
  return canReadModule(ref.watch(currentRoleStringProvider), module);
});

/// Family provider: can write to specific module?
final canWriteModuleProvider = Provider.family<bool, String>((ref, module) {
  return canWriteModule(ref.watch(currentRoleStringProvider), module);
});

/// Family provider: can access specific AI agent?
final canAccessAgentProvider = Provider.family<bool, String>((ref, agent) {
  return canAccessAgent(ref.watch(currentRoleStringProvider), agent);
});

/// Family provider: can perform specific AI action?
final canPerformActionProvider = Provider.family<bool, String>((ref, action) {
  return canPerformAction(ref.watch(currentRoleStringProvider), action);
});

/// All readable modules for current user.
final accessibleModulesProvider = Provider<List<String>>((ref) {
  return getAccessibleModules(ref.watch(currentRoleStringProvider));
});
