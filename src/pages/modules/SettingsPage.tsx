import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';
import { Settings, Globe, Palette, Bell, Shield, Building2, Save, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Francais' },
  { code: 'es', label: 'Espanol' },
  { code: 'de', label: 'Deutsch' },
  { code: 'tr', label: 'Turkce' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ur', label: 'اردو' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Portugues' },
  { code: 'nl', label: 'Nederlands' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const { company, role } = useCompany();
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security'>('general');
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
  );
  const [saved, setSaved] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifAI, setNotifAI] = useState(true);

  const isAdmin = role === 'company_gm' || role === 'executive_secretary';

  const handleSave = async () => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18n_lang', language);

    localStorage.setItem('theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else if (theme === 'light') document.documentElement.classList.remove('dark');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }

    if (user) {
      await supabase.from('profiles').update({ locale: language }).eq('id', user.id);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'general' as const, label: t('settings_general', 'General'), icon: Settings },
    { id: 'notifications' as const, label: t('settings_notifications', 'Notifications'), icon: Bell },
    { id: 'security' as const, label: t('settings_security', 'Security'), icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-blue-600" size={28} />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('settings', 'Settings')}</h1>
      </div>

      <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-tight transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t('language', 'Language')}</h2>
            </div>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full max-w-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-600"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t('theme', 'Theme')}</h2>
            </div>
            <div className="flex gap-3">
              {(['light', 'dark', 'system'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setTheme(opt)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-tight transition-all ${
                    theme === opt
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {t(`theme_${opt}`, opt.charAt(0).toUpperCase() + opt.slice(1))}
                </button>
              ))}
            </div>
          </div>

          {isAdmin && company && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t('company_settings', 'Company Settings')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500 block mb-1">{t('company_name', 'Company Name')}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{company.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">{t('timezone', 'Timezone')}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{company.timezone}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">{t('currency', 'Currency')}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{company.currencyCode}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">{t('country', 'Country')}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{company.countryCode}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          {[
            { key: 'email', label: t('notif_email', 'Email Notifications'), val: notifEmail, set: setNotifEmail },
            { key: 'push', label: t('notif_push', 'Push Notifications'), val: notifPush, set: setNotifPush },
            { key: 'ai', label: t('notif_ai', 'AI Activity Alerts'), val: notifAI, set: setNotifAI },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</span>
              <button
                onClick={() => item.set(!item.val)}
                className={`w-11 h-6 rounded-full transition-colors relative ${item.val ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.val ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t('security', 'Security')}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">{t('change_password', 'Change Password')}</p>
                <p className="text-zinc-500 text-xs">{t('change_password_desc', 'Update your account password')}</p>
              </div>
              <button
                onClick={async () => {
                  if (user?.email) {
                    await supabase.auth.resetPasswordForEmail(user.email);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  }
                }}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold text-xs uppercase tracking-tight transition-colors"
              >
                {t('send_reset_link', 'Send Reset Link')}
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">{t('two_factor', 'Two-Factor Authentication')}</p>
                <p className="text-zinc-500 text-xs">{t('two_factor_desc', 'Add an extra layer of security')}</p>
              </div>
              <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 uppercase">{t('coming_soon', 'Coming Soon')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm uppercase tracking-tight transition-colors shadow-lg shadow-blue-600/20"
        >
          {saved ? <Check size={18} /> : <Save size={18} />}
          {saved ? t('saved', 'Saved') : t('save_changes', 'Save Changes')}
        </button>
      </div>
    </div>
  );
}
