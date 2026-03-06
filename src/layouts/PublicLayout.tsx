import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingActions from '../components/FloatingActions';
import { useAuth } from '../contexts/AuthContext';

/**
 * Layout for all public-facing pages (landing, features, FAQ, contact, etc.)
 * Shows the public Header, Footer and the RARE AI floating widget in guest-safe mode.
 * Passes page context to FloatingActions for context-aware AI responses.
 */
export default function PublicLayout() {
    const { user } = useAuth();
    const location = useLocation();

    // Derive page key from path for AI context
    const pageKey = location.pathname.replace(/^\//, '') || 'landing';

    return (
        <div className="relative min-h-screen flex flex-col">
            <Header />
            <div className="flex-1">
                <Outlet />
            </div>
            <Footer />
            <FloatingActions
                user={user}
                pageContext={{ pageType: 'public' as const, pageKey }}
            />
        </div>
    );
}
