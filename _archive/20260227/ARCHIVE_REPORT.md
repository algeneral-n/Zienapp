# Archive Report - 2026-02-27

## Files Moved to _archive/20260227/

| File | Original Path | Reason |
|------|--------------|--------|
| Login.tsx | src/pages/Login.tsx | Dead code. Not imported by any active file. Replaced by src/pages/public/LoginPage.tsx. |
| Onboarding.tsx | src/pages/Onboarding.tsx | Dead code. Not imported by any active file. Replaced by OnboardingWizard.tsx. |
| RegisterPage.tsx | src/pages/RegisterPage.tsx | Dead code. Registration flow integrated into LoginPage.tsx. |
| LoginPage.tsx | src/pages/LoginPage.tsx | Dead code. The active login page is at src/pages/public/LoginPage.tsx. |
| mockData.ts.DELETED | src/constants/mockData.ts.DELETED | Previously deleted mock data file. Already marked as deleted. |
| EmployeePortal.tsx.bak | src/pages/EmployeePortal.tsx | Backup of original EmployeePortal before rewrite to real Supabase data. |

## Files Identified as Dead but Not Moved

| File | Path | Reason Not Moved |
|------|------|-----------------|
| accountingService.ts | src/services/accountingService.ts | Confirmed zero imports (dead code). File locked by VS Code editor/OneDrive sync. Benign since no code references it. |

## Verification

- All moved files were confirmed to have ZERO import references in active source code before archiving.
- Grep search confirmed no broken imports after archive operation.
- Vite build passes with 0 errors and 0 warnings after archive.
