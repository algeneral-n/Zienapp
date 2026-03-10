// ============================================================================
// ZIEN Mobile — Unified Enums
// Mirrors: web/src/types.ts enums exactly
// ============================================================================

/// Platform-level roles (cross-tenant)
enum PlatformRole {
  founder('founder'),
  platformAdmin('platform_admin'),
  platformSupport('platform_support'),
  tenantUser('tenant_user');

  const PlatformRole(this.value);
  final String value;

  static PlatformRole fromString(String s) => PlatformRole.values.firstWhere(
    (e) => e.value == s,
    orElse: () => PlatformRole.tenantUser,
  );
}

/// Company-level roles (within a tenant)
/// ⚠️ Levels MUST match web/src/lib/permissions.ts ROLE_LEVEL exactly
enum CompanyRole {
  companyGm('company_gm', 90),
  assistantGm('assistant_gm', 85),
  executiveSecretary('executive_secretary', 75),
  departmentManager('department_manager', 65),
  hrOfficer('hr_officer', 60),
  accountant('accountant', 60),
  supervisor('supervisor', 55),
  seniorEmployee('senior_employee', 45),
  salesRep('sales_rep', 45),
  employee('employee', 35),
  fieldEmployee('field_employee', 35),
  driver('driver', 30),
  newHire('new_hire', 20),
  trainee('trainee', 15),
  clientUser('client_user', 10);

  const CompanyRole(this.value, this.level);
  final String value;
  final int level;

  static CompanyRole fromString(String s) => CompanyRole.values.firstWhere(
    (e) => e.value == s,
    orElse: () => CompanyRole.employee,
  );
}

/// Company lifecycle status
enum CompanyStatus {
  pendingReview('pending_review'),
  active('active'),
  restricted('restricted'),
  suspended('suspended'),
  rejected('rejected');

  const CompanyStatus(this.value);
  final String value;

  static CompanyStatus fromString(String s) => CompanyStatus.values.firstWhere(
    (e) => e.value == s,
    orElse: () => CompanyStatus.pendingReview,
  );
}

/// Member status within a company
enum MemberStatus {
  invited('invited'),
  active('active'),
  suspended('suspended');

  const MemberStatus(this.value);
  final String value;

  static MemberStatus fromString(String s) => MemberStatus.values.firstWhere(
    (e) => e.value == s,
    orElse: () => MemberStatus.invited,
  );
}

/// Module tier classification
enum ModuleTier {
  core('core'),
  addon('addon'),
  premium('premium');

  const ModuleTier(this.value);
  final String value;

  static ModuleTier fromString(String s) => ModuleTier.values.firstWhere(
    (e) => e.value == s,
    orElse: () => ModuleTier.core,
  );
}

/// Provisioning job status
enum JobStatus {
  pending('pending'),
  validating('validating'),
  applyingModules('applying_modules'),
  seeding('seeding'),
  finalizing('finalizing'),
  completed('completed'),
  failed('failed'),
  rolledBack('rolled_back');

  const JobStatus(this.value);
  final String value;

  static JobStatus fromString(String s) => JobStatus.values.firstWhere(
    (e) => e.value == s,
    orElse: () => JobStatus.pending,
  );
}

/// Billing interval
enum BillingInterval {
  monthly('monthly'),
  yearly('yearly');

  const BillingInterval(this.value);
  final String value;
}

/// Subscription lifecycle
enum SubscriptionStatus {
  trialing('trialing'),
  active('active'),
  pastDue('past_due'),
  canceled('canceled'),
  incomplete('incomplete'),
  pendingApproval('pending_approval');

  const SubscriptionStatus(this.value);
  final String value;

  static SubscriptionStatus fromString(String s) => SubscriptionStatus.values
      .firstWhere((e) => e.value == s, orElse: () => SubscriptionStatus.active);
}

/// RARE AI agent types — 24 departments
enum RAREAgentType {
  accounting('accounting'),
  hr('hr'),
  sales('sales'),
  fleet('fleet'),
  meetings('meetings'),
  gm('gm'),
  secretary('secretary'),
  founder('founder'),
  general('general'),
  marketing('marketing'),
  projects('projects'),
  store('store'),
  inventory('inventory'),
  maintenance('maintenance'),
  crm('crm'),
  legal('legal'),
  quality('quality'),
  training('training'),
  procurement('procurement'),
  finance('finance'),
  safety('safety'),
  support('support'),
  analytics('analytics'),
  integrations('integrations');

  const RAREAgentType(this.value);
  final String value;
}

/// RARE interaction modes
enum RAREMode {
  help('help'),
  analyze('analyze'),
  act('act'),
  report('report'),
  approve('approve'),
  delete('delete'),
  transfer('transfer'),
  payrollRun('payroll_run'),
  terminate('terminate');

  const RAREMode(this.value);
  final String value;
}

/// Supported languages (15)
enum AppLanguage {
  ar('ar', 'العربية', true),
  en('en', 'English', false),
  fr('fr', 'Français', false),
  es('es', 'Español', false),
  de('de', 'Deutsch', false),
  tr('tr', 'Türkçe', false),
  ru('ru', 'Русский', false),
  zh('zh', '中文', false),
  ja('ja', '日本語', false),
  ko('ko', '한국어', false),
  hi('hi', 'हिन्दी', false),
  ur('ur', 'اردو', true),
  it('it', 'Italiano', false),
  pt('pt', 'Português', false),
  nl('nl', 'Nederlands', false),
  bn('bn', 'বাংলা', false);

  const AppLanguage(this.code, this.label, this.isRtl);
  final String code;
  final String label;
  final bool isRtl;

  static AppLanguage fromCode(String c) => AppLanguage.values.firstWhere(
    (e) => e.code == c,
    orElse: () => AppLanguage.en,
  );
}
