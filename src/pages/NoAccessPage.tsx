import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Shown when a user is authenticated (Supabase session exists)
 * but has NO company membership and is NOT a platform-level user.
 * This enforces the rule: every user must be registered through
 * OnboardingWizard or invited by a tenant admin.
 */
export default function NoAccessPage() {
  const { t } = useTranslation();

  const handleSignOut = async () => {
    const { supabase } = await import('../services/supabase');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-10 text-center shadow-xl space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
          {t('no_org_access', 'No Organization Access')}
        </h1>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {t('no_org_access_desc', 'Your account is not linked to any organization on ZIEN. Access is restricted to registered members only.')}
        </p>

        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            {t('how_to_get_access', 'How to get access')}
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5">
            <li>-- {t('ask_admin_invite', 'Ask your company admin to send you an invitation')}</li>
            <li>-- {t('register_as_founder', 'If you are a company founder, register through the onboarding wizard')}</li>
            <li>-- {t('contact_support_email', 'Contact support at support@zien-ai.app')}</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => window.location.href = '/register'}
            className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors"
          >
            {t('register_company', 'Register Company')}
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 px-5 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
          >
            {t('sign_out', 'Sign Out')}
          </button>
        </div>
      </div>
    </div>
  );
}
