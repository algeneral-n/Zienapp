import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import type {
    Company,
    CompanyMember,
    CompanyRole,
    CompanyModule,
    Department,
} from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompanyContextValue {
    /** Currently selected company */
    company: Company | null;
    /** Current user's membership in the selected company */
    membership: CompanyMember | null;
    /** All companies the user belongs to */
    companies: Company[];
    /** Active modules for the selected company */
    modules: CompanyModule[];
    /** Departments in the selected company */
    departments: Department[];
    /** Loading state */
    isLoading: boolean;
    /** Switch to a different company */
    switchCompany: (companyId: string) => Promise<void>;
    /** Convenience: current role in the selected company */
    role: CompanyRole | null;
    /** Check if a module is active for the selected company */
    hasModule: (moduleCode: string) => boolean;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

// ─── Helpers to map snake_case DB rows → camelCase TS types ──────────────────

function mapCompany(row: Record<string, unknown>): Company {
    return {
        id: row.id as string,
        name: row.name as string,
        nameAr: row.name_ar as string | undefined,
        slug: row.slug as string,
        companyTypeId: row.company_type_id as string | undefined,
        industry: row.industry as string | undefined,
        status: row.status as Company['status'],
        countryCode: (row.country_code as string) ?? 'AE',
        city: row.city as string | undefined,
        address: row.address as string | undefined,
        phone: row.phone as string | undefined,
        email: row.email as string | undefined,
        timezone: (row.timezone as string) ?? 'Asia/Dubai',
        currencyCode: (row.currency_code as string) ?? 'AED',
        taxMode: (row.tax_mode as string) ?? 'country_default',
        logoUrl: row.logo_url as string | undefined,
        businessLicenseUrl: row.business_license_url as string | undefined,
        responsiblePersonIdUrl: row.responsible_person_id_url as string | undefined,
        brandingTheme: (row.branding_theme as string) ?? 'prism',
        brandingMode: (row.branding_mode as string) ?? 'system',
        branding: (row.branding as Record<string, unknown>) ?? {},
        ownerUserId: row.owner_user_id as string,
        settings: (row.settings as Record<string, unknown>) ?? {},
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

function mapMember(row: Record<string, unknown>): CompanyMember {
    return {
        id: row.id as string,
        companyId: row.company_id as string,
        userId: row.user_id as string,
        role: row.role as CompanyRole,
        departmentId: row.department_id as string | undefined,
        branchId: row.branch_id as string | undefined,
        status: row.status as CompanyMember['status'],
        isPrimary: row.is_primary as boolean,
        joinedAt: row.joined_at as string,
        createdBy: row.created_by as string | undefined,
    };
}

// ─── Provider ────────────────────────────────────────────────────────────────

const COMPANY_KEY = 'zien:activeCompanyId';

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [company, setCompany] = useState<Company | null>(null);
    const [membership, setMembership] = useState<CompanyMember | null>(null);
    const [modules, setModules] = useState<CompanyModule[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load all companies the user belongs to
    useEffect(() => {
        if (!user) {
            setCompanies([]);
            setCompany(null);
            setMembership(null);
            setModules([]);
            setDepartments([]);
            setIsLoading(false);
            return;
        }

        (async () => {
            setIsLoading(true);

            // Get all memberships for this user
            const { data: memberRows } = await supabase
                .from('company_members')
                .select('*, companies(*)')
                .eq('user_id', user.id)
                .eq('status', 'active');

            if (!memberRows?.length) {
                // Also check if user owns any company directly
                const { data: ownedRows } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('owner_user_id', user.id);

                if (ownedRows?.length) {
                    const mapped = ownedRows.map((r) => mapCompany(r));
                    setCompanies(mapped);
                    const savedId = localStorage.getItem(COMPANY_KEY);
                    const active = mapped.find((c) => c.id === savedId) ?? mapped[0];
                    await selectCompany(active, user.id);
                }
                setIsLoading(false);
                return;
            }

            // Build companies list from the joined result
            const companiesMap = new Map<string, Company>();
            const memberships = new Map<string, CompanyMember>();

            for (const row of memberRows) {
                const companyRow = row.companies as Record<string, unknown>;
                const comp = mapCompany(companyRow);
                companiesMap.set(comp.id, comp);
                memberships.set(comp.id, mapMember(row));
            }

            const companyList = Array.from(companiesMap.values());
            setCompanies(companyList);

            // Restore last active company or pick first / primary
            const savedId = localStorage.getItem(COMPANY_KEY);
            const primaryMembership = memberRows.find((m: Record<string, unknown>) => m.is_primary);
            const activeId =
                (savedId && companiesMap.has(savedId) ? savedId : null) ??
                primaryMembership?.company_id ??
                companyList[0]?.id;

            if (activeId) {
                const activeCompany = companiesMap.get(activeId)!;
                const activeMembership = memberships.get(activeId) ?? null;
                setCompany(activeCompany);
                setMembership(activeMembership);
                localStorage.setItem(COMPANY_KEY, activeId);

                // Load modules
                const { data: modRows } = await supabase
                    .from('company_modules')
                    .select('*, modules_catalog(code)')
                    .eq('company_id', activeId)
                    .eq('is_active', true);

                setModules(
                    (modRows ?? []).map((r: Record<string, unknown>) => ({
                        id: r.id as string,
                        companyId: r.company_id as string,
                        moduleId: r.module_id as string,
                        isActive: r.is_active as boolean,
                        config: (r.config as Record<string, unknown>) ?? {},
                        activatedAt: r.activated_at as string,
                        _code: (r.modules_catalog as Record<string, unknown>)?.code as string,
                    })) as (CompanyModule & { _code?: string })[],
                );

                // Load departments
                const { data: deptRows } = await supabase
                    .from('departments')
                    .select('*')
                    .eq('company_id', activeId)
                    .eq('is_active', true);

                setDepartments(
                    (deptRows ?? []).map((r: Record<string, unknown>) => ({
                        id: r.id as string,
                        companyId: r.company_id as string,
                        code: r.code as string | undefined,
                        name: r.name as string,
                        managerId: r.manager_id as string | undefined,
                        isActive: r.is_active as boolean,
                    })),
                );
            }

            setIsLoading(false);
        })();
    }, [user]);

    async function selectCompany(comp: Company, userId?: string) {
        setCompany(comp);
        localStorage.setItem(COMPANY_KEY, comp.id);

        if (userId) {
            const { data: memberRow } = await supabase
                .from('company_members')
                .select('*')
                .eq('company_id', comp.id)
                .eq('user_id', userId)
                .eq('status', 'active')
                .maybeSingle();

            setMembership(memberRow ? mapMember(memberRow) : null);
        }
    }

    const switchCompany = async (companyId: string) => {
        const comp = companies.find((c) => c.id === companyId);
        if (!comp || !user) return;
        setIsLoading(true);
        await selectCompany(comp, user.id);

        // Reload modules + departments
        const [modRes, deptRes] = await Promise.all([
            supabase
                .from('company_modules')
                .select('*, modules_catalog(code)')
                .eq('company_id', companyId)
                .eq('is_active', true),
            supabase
                .from('departments')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true),
        ]);

        setModules(
            (modRes.data ?? []).map((r: Record<string, unknown>) => ({
                id: r.id as string,
                companyId: r.company_id as string,
                moduleId: r.module_id as string,
                isActive: r.is_active as boolean,
                config: (r.config as Record<string, unknown>) ?? {},
                activatedAt: r.activated_at as string,
                _code: (r.modules_catalog as Record<string, unknown>)?.code as string,
            })) as (CompanyModule & { _code?: string })[],
        );

        setDepartments(
            (deptRes.data ?? []).map((r: Record<string, unknown>) => ({
                id: r.id as string,
                companyId: r.company_id as string,
                code: r.code as string | undefined,
                name: r.name as string,
                managerId: r.manager_id as string | undefined,
                isActive: r.is_active as boolean,
            })),
        );

        setIsLoading(false);
    };

    const hasModule = (moduleCode: string): boolean =>
        (modules as (CompanyModule & { _code?: string })[]).some(
            (m) => m._code === moduleCode && m.isActive,
        );

    const role = membership?.role ?? null;

    return (
        <CompanyContext.Provider
            value={{
                company,
                membership,
                companies,
                modules,
                departments,
                isLoading,
                switchCompany,
                role,
                hasModule,
            }}
        >
            {children}
        </CompanyContext.Provider>
    );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useCompany(): CompanyContextValue {
    const ctx = useContext(CompanyContext);
    if (!ctx) throw new Error('useCompany must be used inside <CompanyProvider>');
    return ctx;
}
