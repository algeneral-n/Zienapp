// ============================================================================
// ZIEN Platform — Unified TypeScript Types
// Matches: supabase/migrations/00001_unified_schema.sql
// ============================================================================

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export type Language =
  | 'ar' | 'en' | 'fr' | 'es' | 'de'
  | 'tr' | 'ru' | 'zh' | 'ja' | 'ko'
  | 'hi' | 'ur' | 'it' | 'pt' | 'nl';

export type ThemeVariant = 'default' | 'glass';

export const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ur', name: 'اردو' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
];

export enum CompanyStatus {
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  RESTRICTED = 'restricted',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum PlatformRole {
  FOUNDER = 'founder',
  PLATFORM_ADMIN = 'platform_admin',
  PLATFORM_SUPPORT = 'platform_support',
  TENANT_USER = 'tenant_user',
}

export enum CompanyRole {
  COMPANY_GM = 'company_gm',
  ASSISTANT_GM = 'assistant_gm',
  EXECUTIVE_SECRETARY = 'executive_secretary',
  DEPARTMENT_MANAGER = 'department_manager',
  SUPERVISOR = 'supervisor',
  SENIOR_EMPLOYEE = 'senior_employee',
  EMPLOYEE = 'employee',
  NEW_HIRE = 'new_hire',
  TRAINEE = 'trainee',
  HR_OFFICER = 'hr_officer',
  ACCOUNTANT = 'accountant',
  SALES_REP = 'sales_rep',
  FIELD_EMPLOYEE = 'field_employee',
  DRIVER = 'driver',
  CLIENT_USER = 'client_user',
}

/** @deprecated Use PlatformRole | CompanyRole instead */
export enum UserRole {
  FOUNDER = 'founder',
  PLATFORM_ADMIN = 'platform_admin',
  PLATFORM_SUPPORT = 'platform_support',
  COMPANY_GM = 'company_gm',
  ASSISTANT_GM = 'assistant_gm',
  EXECUTIVE_SECRETARY = 'executive_secretary',
  DEPARTMENT_MANAGER = 'department_manager',
  SUPERVISOR = 'supervisor',
  SENIOR_EMPLOYEE = 'senior_employee',
  EMPLOYEE = 'employee',
  NEW_HIRE = 'new_hire',
  TRAINEE = 'trainee',
  HR_OFFICER = 'hr_officer',
  ACCOUNTANT = 'accountant',
  SALES_REP = 'sales_rep',
  FIELD_EMPLOYEE = 'field_employee',
  DRIVER = 'driver',
  CLIENT_USER = 'client_user',
}

export type ModuleTier = 'core' | 'addon' | 'premium';

export type JobStatus =
  | 'pending' | 'validating' | 'applying_modules' | 'seeding'
  | 'finalizing' | 'completed' | 'failed' | 'rolled_back';

export type BillingInterval = 'monthly' | 'yearly';

export type SubscriptionStatus =
  | 'trialing' | 'active' | 'past_due' | 'canceled'
  | 'incomplete' | 'pending_approval';

export type MemberStatus = 'invited' | 'active' | 'suspended';

// ─── Platform Entities ───────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  platformRole: PlatformRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleCatalog {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: string;
  tier: ModuleTier;
  dependencies: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface CompanyType {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

// ─── Company Core ────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  companyTypeId?: string;
  industry?: string;
  status: CompanyStatus;
  countryCode: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currencyCode: string;
  taxMode: string;
  logoUrl?: string;
  businessLicenseUrl?: string;
  responsiblePersonIdUrl?: string;
  brandingTheme: string;
  brandingMode: string;
  branding: Record<string, unknown>;
  ownerUserId: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  departmentId?: string;
  branchId?: string;
  status: MemberStatus;
  isPrimary: boolean;
  joinedAt: string;
  createdBy?: string;
}

export interface Department {
  id: string;
  companyId: string;
  code?: string;
  name: string;
  managerId?: string;
  isActive: boolean;
}

// ─── Provisioning ────────────────────────────────────────────────────────────

export interface Blueprint {
  id: string;
  companyTypeId: string;
  name: string;
  version: string;
  rulesJson: Record<string, unknown>;
  isActive: boolean;
}

export interface ProvisioningJob {
  id: string;
  companyId: string;
  blueprintId?: string;
  status: JobStatus;
  currentStep?: string;
  stepIndex: number;
  totalSteps: number;
  logs: string[];
  errorMessage?: string;
  idempotencyKey?: string;
  snapshot: Record<string, unknown>;
  requestedBy?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CompanyModule {
  id: string;
  companyId: string;
  moduleId: string;
  isActive: boolean;
  config: Record<string, unknown>;
  activatedAt: string;
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  billingInterval: BillingInterval;
  maxUsers?: number;
  maxUsagePerService?: number;
  features: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
}

export interface CompanySubscription {
  id: string;
  companyId: string;
  planId?: string;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAt?: string;
}

// ─── Business Modules ────────────────────────────────────────────────────────

export interface Client {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  clientId?: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  totalAmount: number;
  taxAmount: number;
  issuedAt: string;
  dueDate?: string;
  notes?: string;
}

export interface Employee {
  id: string;
  companyId: string;
  memberId?: string;
  employeeCode?: string;
  jobTitle?: string;
  departmentId?: string;
  hireDate?: string;
  salaryAmount?: number;
  status: 'active' | 'on_leave' | 'terminated';
}

export interface Vehicle {
  id: string;
  companyId: string;
  plateNumber: string;
  model?: string;
  type?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
}

export interface LogisticsTask {
  id: string;
  companyId: string;
  assignedTo?: string;
  vehicleId?: string;
  title: string;
  description?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  trackingData?: Record<string, unknown>;
}

// ─── RBAC ────────────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  code: string;
  nameAr?: string;
  nameEn: string;
  description?: string;
  category?: string;
}

export interface FeatureFlag {
  id: string;
  companyId: string;
  flagKey: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export type RAREAgentType =
  | 'accounting' | 'hr' | 'sales' | 'fleet'
  | 'meetings' | 'gm' | 'secretary' | 'founder'
  | 'general' | 'marketing' | 'projects' | 'store'
  | 'inventory' | 'maintenance' | 'crm' | 'legal'
  | 'quality' | 'training' | 'procurement' | 'finance'
  | 'safety' | 'support' | 'analytics' | 'integrations';

export type RAREMode = 'help' | 'analyze' | 'act' | 'report' | 'approve' | 'delete' | 'transfer' | 'payroll_run' | 'terminate';

export interface AIReport {
  id: string;
  companyId: string;
  agentType: RAREAgentType;
  moduleCode?: string;
  reportType?: string;
  content: Record<string, unknown>;
  generatedBy?: string;
  createdAt: string;
}

export interface AIUsageLog {
  id: string;
  companyId: string;
  userId?: string;
  agentType: string;
  mode?: string;
  moduleCode?: string;
  modelName?: string;
  tokensIn: number;
  tokensOut: number;
  queryText?: string;
  responseSummary?: string;
  createdAt: string;
}

export interface RAREContext {
  pageCode: string;
  moduleCode?: string;
  userRole: CompanyRole | PlatformRole;
  companyName: string;
  language: Language;
  theme: ThemeMode;
  selectedEntityId?: string;
  mode?: RAREMode;
  additionalData?: Record<string, unknown>;
}

export interface RAREQuickAction {
  id: string;
  label: string;
  mode: RAREMode;
  prompt: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  companyId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export interface CompanyOnboardingSubmission {
  id: string;
  companyName: string;
  companyNameAr?: string;
  companyTypeId?: string;
  industry?: string;
  gmName?: string;
  gmEmail?: string;
  gmPhone?: string;
  businessLicenseUrl?: string;
  gmIdUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
  submittedBy?: string;
  createdAt: string;
}

// ─── Legacy compat alias ─────────────────────────────────────────────────────

/** @deprecated Use Profile instead */
export type User = {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string;
  name?: string;
  companyName?: string;
}

/** @deprecated Use ModuleCatalog instead */
export type Module = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  tier: ModuleTier;
  icon?: string;
  dependencies: string[];
}
