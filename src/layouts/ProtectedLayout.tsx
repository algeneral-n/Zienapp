import { Outlet, useLocation } from 'react-router-dom';
import FloatingActions from '../components/FloatingActions';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

/**
 * Layout for all authenticated/protected pages (portal, dashboard, client, etc.)
 * No public Header — each sub-page manages its own chrome.
 * Injects company context into the RARE AI floating widget.
 */
export default function ProtectedLayout() {
    const { user } = useAuth();
    const { company, membership, modules } = useCompany();
    const location = useLocation();

    const pageKey = location.pathname.replace(/^\//, '') || 'dashboard';
    const activeModuleCodes = (modules || [])
        .filter((m: { isActive?: boolean }) => m.isActive)
        .map((m: { moduleCode?: string; moduleId?: string }) => m.moduleCode || m.moduleId || '');

    return (
        <div className="relative min-h-screen">
            <FloatingActions
                user={user}
                pageContext={{
                    pageType: 'protected' as const,
                    pageKey,
                    companyId: company?.id,
                    role: membership?.role,
                    modules: activeModuleCodes,
                }}
            />
            <Outlet />
        </div>
    );
}
