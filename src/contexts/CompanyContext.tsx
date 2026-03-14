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
    /** Granular permission codes for current user in selected company */
    permissions: string[];
    /** Loading state */
    isLoading: boolean;
    /** Switch to a different company */
    switchCompany: (companyId: string) => Promise<void>;
    /** Convenience: current role in the selected company */
    role: CompanyRole | null;
    /** Check if a module is active for the selected company */
    hasModule: (moduleCode: string) => boolean;
    /** Check if user has a specific permission code */
    hasPermission: (permCode: string) => boolean;
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
        role: (row.role_code ?? row.role) as CompanyRole,
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
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load all companies the user belongs to
    useEffect(() => {
        if (!user) {
            setCompanies([]);
            setCompany(null);
            setMembership(null);
            setModules([]);
            setDepartments([]);
            setPermissions([]);
            setIsLoading(false);
            return;
        }

        (async () => {
            setIsLoading(true);

            // Fetch memberships via worker API (bypasses RLS recursion)
            const API_URL = import.meta.env.VITE_API_URL || '';
            const session = (await supabase.auth.getSession()).data.session;
            let memberRows: Record<string, unknown>[] | null = null;

            if (API_URL && session?.access_token) {
                try {
                    const res = await fetch(`${API_URL}/api/auth/me`, {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                    });
                    if (res.ok) {
                        const json = await res.json();
                        memberRows = (json as { memberships?: Record<string, unknown>[] }).memberships ?? null;
                    }
                } catch {
                    // Fall through to direct query
                }
            }

            // Fallback: direct Supabase query (works when RLS is fixed)
            if (!memberRows) {
                const { data } = await supabase
                    .from('company_members')
                    .select('*, companies(*)')
                    .eq('user_id', user.id)
                    .eq('status', 'active');
                memberRows = data as Record<string, unknown>[] | null;
            }

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
            setAllMemberships(memberships);

            // Restore last active company or pick first / primary
            const savedId = localStorage.getItem(COMPANY_KEY);
            const primaryMembership = memberRows.find((m: Record<string, unknown>) => m.is_primary);
            const activeId =
                (savedId && companiesMap.has(savedId) ? savedId : null) ??
                (primaryMembership?.company_id as string | undefined) ??
                companyList[0]?.id;

            if (activeId) {
                const id = activeId as string;
                const activeCompany = companiesMap.get(id)!;
                const activeMembership = memberships.get(id) ?? null;
                setCompany(activeCompany);
                setMembership(activeMembership);
                localStorage.setItem(COMPANY_KEY, id);

                // Load modules
                const { data: modRows } = await supabase
                    .from('company_modules')
                    .select('*, modules_catalog(code)')
                    .eq('company_id', id)
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
                    .eq('company_id', id)
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

                // Load user permissions via DB function
                const { data: permRows } = await supabase
                    .rpc('user_effective_permissions', {
                        _user_id: user.id,
                        _company_id: id,
                    });
                setPermissions((permRows ?? []).map((r: { code: string }) => r.code));
            }

            setIsLoading(false);
        })();
    }, [user]);

    // Keep a ref of all memberships keyed by company_id for selectCompany
    const [allMemberships, setAllMemberships] = useState<Map<string, CompanyMember>>(new Map());

    async function selectCompany(comp: Company, userId?: string, membershipsCache?: Map<string, CompanyMember>) {
        setCompany(comp);
        localStorage.setItem(COMPANY_KEY, comp.id);

        const cache = membershipsCache ?? allMemberships;
        const cached = cache.get(comp.id);
        if (cached) {
            setMembership(cached);
            return;
        }

        // Fallback: query via API
        if (userId) {
            const API_URL = import.meta.env.VITE_API_URL || '';
            const session = (await supabase.auth.getSession()).data.session;
            if (API_URL && session?.access_token) {
                try {
                    const res = await fetch(`${API_URL}/api/auth/me`, {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                    });
                    if (res.ok) {
                        const json = await res.json();
                        const rows = (json as { memberships?: Record<string, unknown>[] }).memberships ?? [];
                        const match = rows.find((r: Record<string, unknown>) => r.company_id === comp.id);
                        setMembership(match ? mapMember(match) : null);
                        return;
                    }
                } catch { /* fall through */ }
            }

            // Direct fallback
            const { data: memberRow } = await supabase
                .from('company_members')
                .select('*')
                .eq('company_id', comp.id)
                .eq('user_id', userId)
                .eq('status', 'active')
                .maybeSingle();

            setMembership(memberRow ? mapMember(memberRow as Record<string, unknown>) : null);
        }
    }

    const switchCompany = async (companyId: string) => {
        const comp = companies.find((c) => c.id === companyId);
        if (!comp || !user) return;
        setIsLoading(true);
        await selectCompany(comp, user.id);

        // Reload modules + departments + permissions
        const [modRes, deptRes, permRes] = await Promise.all([
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
            supabase
                .rpc('user_effective_permissions', {
                    _user_id: user.id,
                    _company_id: companyId,
                }),
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

        setPermissions((permRes.data ?? []).map((r: { code: string }) => r.code));

        setIsLoading(false);
    };

    const hasModule = (moduleCode: string): boolean =>
        (modules as (CompanyModule & { _code?: string })[]).some(
            (m) => m._code === moduleCode && m.isActive,
        );

    const hasPermission = (permCode: string): boolean =>
        permissions.includes(permCode);

    const role = membership?.role ?? null;

    return (
        <CompanyContext.Provider
            value={{
                company,
                membership,
                companies,
                modules,
                departments,
                permissions,
                isLoading,
                switchCompany,
                role,
                hasModule,
                hasPermission,
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
