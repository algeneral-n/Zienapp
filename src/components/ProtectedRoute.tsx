import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { VisitorProvider } from '../contexts/VisitorContext';
import VisitorBanner from './VisitorBanner';
import { PlatformRole, type CompanyRole } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** Allowed platform roles (OR logic) */
    platformRoles?: PlatformRole[];
    /** Allowed company roles (OR logic) */
    companyRoles?: CompanyRole[];
    /** Required module code to be active */
    requireModule?: string;
    /** Fallback component when loading */
    loader?: React.ReactNode;
    /** Where to redirect when not authenticated */
    loginPath?: string;
    /** Skip the tenant membership check (for platform-level pages) */
    skipMembershipCheck?: boolean;
    /** Allow unauthenticated visitors to browse in read-only mode */
    allowVisitor?: boolean;
}

/** Platform-level roles that bypass tenant membership requirements */
const PLATFORM_ROLES: PlatformRole[] = [
    PlatformRole.FOUNDER,
    PlatformRole.PLATFORM_ADMIN,
    PlatformRole.PLATFORM_SUPPORT,
];

export default function ProtectedRoute({
    children,
    platformRoles,
    companyRoles,
    requireModule,
    loader,
    loginPath = '/login',
    skipMembershipCheck = false,
    allowVisitor = false,
}: ProtectedRouteProps) {
    const { user, profile, isLoading: authLoading } = useAuth();
    const { membership, company, companies, hasModule, isLoading: companyLoading } = useCompany();

    // Still loading
    if (authLoading || companyLoading) {
        return (
            <>
                {loader ?? (
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </>
        );
    }

    // Not authenticated — visitor mode or redirect
    if (!user) {
        if (allowVisitor) {
            return (
                <VisitorProvider isVisitor={true}>
                    <VisitorBanner />
                    {children}
                </VisitorProvider>
            );
        }
        return <Navigate to={loginPath} replace state={{ denyReason: 'unauthenticated' }} />;
    }

    // ─── Tenant isolation gate ───────────────────────────────────────────
    // Every authenticated user MUST belong to at least one company,
    // unless they have a platform-level role (founder / platform_admin / support).
    const isPlatformUser = profile && PLATFORM_ROLES.includes(profile.platformRole);

    if (!skipMembershipCheck && !isPlatformUser) {
        const hasMembership = companies.length > 0 || !!membership || !!company;
        if (!hasMembership) {
            // Redirect to no-access page
            return <Navigate to="/no-access" replace state={{ denyReason: 'no_company' }} />;
        }
    }

    // Check platform role
    if (platformRoles?.length && profile) {
        if (!platformRoles.includes(profile.platformRole)) {
            return <Navigate to="/no-access" replace state={{ denyReason: 'role_denied', detail: 'platform_role_mismatch' }} />;
        }
    }

    // Check company role
    if (companyRoles?.length && membership) {
        if (!companyRoles.includes(membership.role)) {
            return <Navigate to="/no-access" replace state={{ denyReason: 'role_denied', detail: 'company_role_mismatch' }} />;
        }
    }

    // Check module access
    if (requireModule && !hasModule(requireModule)) {
        return <Navigate to="/no-access" replace state={{ denyReason: 'module_denied', detail: requireModule }} />;
    }

    return <VisitorProvider isVisitor={false}>{children}</VisitorProvider>;
}
