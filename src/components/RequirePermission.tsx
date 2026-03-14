// ─── RequirePermission Guard Component ───────────────────────────────────────
// Conditionally renders children based on granular permission codes.
// Usage:
//   <RequirePermission code="hr.write" fallback={<Locked />}>
//     <HREditForm />
//   </RequirePermission>

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface Props {
    /** Permission code to check (e.g. 'hr.write', 'accounting.approve') */
    code: string;
    /** Optional fallback if permission is denied */
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function RequirePermission({ code, fallback = null, children }: Props) {
    const { hasPermission } = usePermissions();

    if (!hasPermission(code)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
