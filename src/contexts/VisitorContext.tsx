import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

interface VisitorContextValue {
    /** True when browsing without authentication */
    isVisitor: boolean;
    /**
     * Call before any write/action. If visitor, redirects to /register
     * with a returnUrl so they come back after signup.
     * Returns false for visitors (action should be aborted), true for authenticated users.
     */
    requireAuth: (featureName?: string) => boolean;
}

const VisitorContext = createContext<VisitorContextValue>({
    isVisitor: false,
    requireAuth: () => true,
});

export function VisitorProvider({ isVisitor, children }: { isVisitor: boolean; children: React.ReactNode }) {
    const navigate = useNavigate();

    const requireAuth = (featureName?: string): boolean => {
        if (!isVisitor) return true;
        const returnUrl = window.location.pathname + window.location.search;
        navigate('/register', { state: { returnUrl, feature: featureName } });
        return false;
    };

    return (
        <VisitorContext.Provider value={{ isVisitor, requireAuth }}>
            {children}
        </VisitorContext.Provider>
    );
}

export function useVisitor() {
    return useContext(VisitorContext);
}
