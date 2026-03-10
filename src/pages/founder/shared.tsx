import React from 'react';
import { Loader2, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';

export const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

/** Authenticated fetch helper for FounderPage API calls. */
export async function founderFetch(path: string, method: string = 'GET', body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  const companyId = localStorage.getItem('zien:activeCompanyId') || '';
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(companyId ? { 'X-Company-Id': companyId } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export const LoadingState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-12 text-zinc-400">
      <Loader2 className="animate-spin mr-2" size={18} /> {t('loading')}
    </div>
  );
};

export const ErrorState = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-600 text-sm font-medium">
    <AlertTriangle size={16} /> {message}
  </div>
);

export const UnavailableState = ({ feature }: { feature: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
      <Info size={32} className="mb-3 opacity-50" />
      <p className="text-sm font-bold uppercase tracking-widest">{feature}</p>
      <p className="text-xs mt-1">{t('data_not_available')}</p>
    </div>
  );
};
