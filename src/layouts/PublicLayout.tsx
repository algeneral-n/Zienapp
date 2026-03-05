import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import FloatingActions from '../components/FloatingActions';
import { useAuth } from '../contexts/AuthContext';

/**
 * Layout for all public-facing pages (landing, features, FAQ, contact, etc.)
 * Shows the public Header and the RARE AI floating widget in guest-safe mode.
 * Passes page context to FloatingActions for context-aware AI responses.
 */
export default function PublicLayout() {
    const { user } = useAuth();
    const location = useLocation();

    // Derive page key from path for AI context
    const pageKey = location.pathname.replace(/^\//, '') || 'landing';

    return (
        <div className="relative min-h-screen">
            <Header />
            <FloatingActions
                user={user}
                pageContext={{ pageType: 'public' as const, pageKey }}
            />
            <Outlet />
        </div>
    );
}
