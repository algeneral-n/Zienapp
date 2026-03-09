import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';
import { User, Mail, Phone, Camera, Save, Check } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const { role, company } = useCompany();

  const [fullName, setFullName] = useState(profile?.fullName || profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const email = user?.email || '';
  const initials = fullName ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  const roleName = (role || 'member').replace(/_/g, ' ');
  const avatarUrl = profile?.avatarUrl;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      display_name: fullName,
      full_name: fullName,
      phone: phone || null,
    }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!upErr) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      await refreshProfile();
    }
    setAvatarUploading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <User className="text-blue-600" size={28} />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('profile', 'Profile')}</h1>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              disabled={avatarUploading}
            >
              <Camera size={14} className="text-zinc-600 dark:text-zinc-400" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{fullName || email}</h2>
            <p className="text-sm text-zinc-500 uppercase font-bold tracking-widest">{roleName}</p>
            {company && <p className="text-xs text-zinc-400 mt-1">{company.name}</p>}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">{t('full_name', 'Full Name')}</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-600"
                placeholder={t('enter_full_name', 'Enter your full name')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">{t('email', 'Email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">{t('phone', 'Phone')}</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-600"
                placeholder={t('enter_phone', 'Enter phone number')}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm uppercase tracking-tight transition-colors shadow-lg shadow-blue-600/20"
          >
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? t('saved', 'Saved') : saving ? t('saving', 'Saving...') : t('save_changes', 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
