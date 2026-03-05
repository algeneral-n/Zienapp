export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

export enum ThemeVariant {
  PRISM = 'prism',
  PULSE = 'pulse',
  NEON = 'neon',
  EDITORIAL = 'editorial',
  BRUTALIST = 'brutalist',
  LIGHT_BLUE = 'light-blue',
  GLASSY_CLEAR = 'glassy-clear',
  DARK_GREEN = 'dark-green'
}

export type Language = 
  | 'ar' | 'en' | 'fr' | 'es' | 'de' 
  | 'tr' | 'ru' | 'zh' | 'ja' | 'ko' 
  | 'hi' | 'ur' | 'it' | 'pt' | 'nl';

export enum CompanyStatus {
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  RESTRICTED = 'restricted',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected'
}

export enum UserRole {
  FOUNDER = 'founder',
  PLATFORM_ADMIN = 'platform_admin',
  PLATFORM_SUPPORT = 'platform_support',
  COMPANY_GM = 'company_gm',
  EXECUTIVE_SECRETARY = 'executive_secretary',
  DEPARTMENT_MANAGER = 'department_manager',
  SUPERVISOR = 'supervisor',
  EMPLOYEE = 'employee',
  CLIENT_USER = 'client_user'
}

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'pending_approval';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string;
  name?: string;
  companyName?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  typeId: string;
  status: CompanyStatus;
  email: string;
  ownerUserId?: string;
  createdAt: string;
}

export interface CompanyType {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string;
}

export interface Module {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  isCore: boolean;
  isPaidAddon: boolean;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  priceAed: number;
  billingInterval: 'monthly' | 'yearly';
  maxUsers: number;
  maxUsagePerService: number;
}

export type AIReport = {
  id: string;
  companyId: string;
  agentType: 'accounting' | 'hr' | 'sales' | 'fleet' | 'meetings' | 'gm' | 'secretary' | 'founder';
  query: string;
  response: string;
  metadata?: any;
  createdAt: string;
}

export type RAREMode = 'help' | 'analyze' | 'act' | 'report';

export interface RAREContext {
  pageCode: string;
  moduleCode?: string;
  userRole: UserRole;
  companyName: string;
  language: Language;
  theme: ThemeMode;
  selectedEntityId?: string;
  mode?: RAREMode;
  additionalData?: any;
}

export interface RAREQuickAction {
  id: string;
  label: string;
  mode: RAREMode;
  prompt: string;
}

export interface AuditLog {
  id: string;
  companyId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  createdAt: string;
}
