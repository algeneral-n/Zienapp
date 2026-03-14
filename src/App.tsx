import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { PlatformRole, CompanyRole } from './types';
import { PublicLayout, ProtectedLayout } from './layouts';

// ─── Lazy-loaded pages (code splitting) ─────────────────────────────────

// Public pages
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/public/LoginPage'));
const FeaturesPage = React.lazy(() => import('./pages/public/FeaturesPage'));
const FeatureDetailPage = React.lazy(() => import('./pages/public/FeatureDetailPage'));
const FAQPage = React.lazy(() => import('./pages/public/FAQPage'));
const ContactPage = React.lazy(() => import('./pages/public/ContactPage'));
const IndustriesPage = React.lazy(() => import('./pages/public/IndustriesPage'));
const AcademyPage = React.lazy(() => import('./pages/public/AcademyPage'));
const HelpCenterPage = React.lazy(() => import('./pages/public/HelpCenterPage'));
const LegalPage = React.lazy(() => import('./pages/public/LegalPage'));
const IntegrationsModule = React.lazy(() => import('./pages/modules/IntegrationsModule'));
const AcceptInvitePage = React.lazy(() => import('./pages/public/AcceptInvitePage'));

// Auth pages
const AuthCallback = React.lazy(() => import('./pages/auth/AuthCallback'));
const OnboardingWizard = React.lazy(() => import('./pages/OnboardingWizard'));

// Protected pages
const OwnerDashboard = React.lazy(() => import('./pages/OwnerDashboard'));
const FounderPage = React.lazy(() => import('./pages/FounderPage'));
const EmployeePortal = React.lazy(() => import('./pages/EmployeePortal'));
const ClientPortal = React.lazy(() => import('./pages/ClientPortal'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const NoAccessPage = React.lazy(() => import('./pages/NoAccessPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const GuestVerifyPage = React.lazy(() => import('./pages/GuestVerifyPage'));
const GuestDashboard = React.lazy(() => import('./pages/GuestDashboard'));

// ─── Loading fallback ───────────────────────────────────────────────────

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
);

// ─── Route definitions ──────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ─── Public routes (with Header) ───────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/features/:slug" element={<FeatureDetailPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/industries" element={<IndustriesPage />} />
          <Route path="/academy" element={<AcademyPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/integrations" element={<IntegrationsModule />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<OnboardingWizard />} />
          <Route path="/invite/:token" element={<AcceptInvitePage />} />
        </Route>

        {/* ─── Guest Preview routes ────────────────────────────── */}
        <Route path="/guest" element={<GuestVerifyPage />} />
        <Route path="/guest/preview/*" element={<GuestDashboard />} />

        {/* ─── Auth routes (callback only — no layout chrome) ──── */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/no-access" element={<NoAccessPage />} />

        {/* ─── Protected routes ──────────────────────────────────── */}
        <Route element={<ProtectedLayout />}>
          {/* Dashboard — main tenant application plane */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute allowVisitor>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Employee Portal (legacy — will migrate to /dashboard) */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <EmployeePortal />
              </ProtectedRoute>
            }
          />

          {/* Client Portal */}
          <Route
            path="/client/*"
            element={
              <ProtectedRoute companyRoles={[CompanyRole.CLIENT_USER, CompanyRole.COMPANY_GM, CompanyRole.ASSISTANT_GM, CompanyRole.EXECUTIVE_SECRETARY]}>
                <ClientPortal />
              </ProtectedRoute>
            }
          />

          {/* Founder / Platform Admin control plane */}
          <Route
            path="/owner/*"
            element={
              <ProtectedRoute
                platformRoles={[PlatformRole.FOUNDER, PlatformRole.PLATFORM_ADMIN]}
                skipMembershipCheck
              >
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Founder Page — dedicated control center */}
          <Route
            path="/founder/*"
            element={
              <ProtectedRoute
                platformRoles={[PlatformRole.FOUNDER, PlatformRole.PLATFORM_ADMIN]}
                skipMembershipCheck
              >
                <FounderPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ─── 404 Not Found ─────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

// ─── App root ───────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CompanyProvider>
              <AppRoutes />
            </CompanyProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
