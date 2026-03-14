import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserPlus, Search, Send, Loader2, Power,
} from 'lucide-react';
import {
  listTenants,
} from '../../services/founderService';
import { LoadingState, ErrorState, founderFetch } from './shared';

const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'employee', companyId: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await founderFetch('/api/founder/users');
        setUsers(data.users || []);
      } catch (e: any) {
        try {
          const { tenants } = await listTenants(1, 200);
          setCompanies(tenants || []);
          const allMembers: any[] = [];
          for (const tenant of tenants.slice(0, 20)) {
            allMembers.push(...((tenant as any).members || []).map((m: any) => ({ ...m, companyName: tenant.name, companyId: tenant.id })));
          }
          setUsers(allMembers);
        } catch {
          setError(e.message || 'Failed to load users');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = users.filter(u =>
    (u.email || u.full_name || u.user_id || u.companyName || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteData.email.trim()) return;
    setActionLoading('invite');
    try {
      await founderFetch('/api/invite', 'POST', {
        email: inviteData.email,
        role: inviteData.role,
        companyId: inviteData.companyId || undefined,
      });
      setShowInvite(false);
      setInviteData({ email: '', role: 'employee', companyId: '' });
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleRoleChange = async (userId: string, companyId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await founderFetch(`/api/founder/users/${userId}/role`, 'PATCH', { role: newRole, companyId });
      setUsers(prev => prev.map(u => u.user_id === userId || u.id === userId ? { ...u, role: newRole, role_code: newRole } : u));
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleSuspendUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await founderFetch(`/api/founder/users/${userId}/suspend`, 'POST', {});
      setUsers(prev => prev.map(u => (u.user_id === userId || u.id === userId) ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u));
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const ROLES = ['founder', 'super_admin', 'company_owner', 'company_gm', 'company_admin', 'hr_manager', 'accountant', 'employee', 'viewer'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('user_management')}</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowInvite(!showInvite)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
            <UserPlus size={14} /> {t('invite_user')}
          </button>
          <span className="text-xs text-zinc-500 font-bold">{users.length} {t('total_users')}</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input type="text" placeholder={t('search_users')} value={search} onChange={e => setSearch(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium" />
          </div>
        </div>
      </div>

      {/* Invite User Form */}
      {showInvite && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-black uppercase tracking-tight text-sm">{t('invite_user')}</h3>
          <div className="grid grid-cols-3 gap-4">
            <input placeholder={t('email')} type="email" value={inviteData.email} onChange={e => setInviteData({ ...inviteData, email: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
            <select value={inviteData.role} onChange={e => setInviteData({ ...inviteData, role: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium">
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').toUpperCase()}</option>)}
            </select>
            <select value={inviteData.companyId} onChange={e => setInviteData({ ...inviteData, companyId: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium">
              <option value="">{t('select_company')}</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowInvite(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">{t('cancel')}</button>
            <button onClick={handleInvite} disabled={actionLoading === 'invite'} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
              {actionLoading === 'invite' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {t('send_invite')}
            </button>
          </div>
        </div>
      )}

      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800/50">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('user')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('role')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('company')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_users_found')}</td></tr>
                ) : filtered.slice(0, 100).map((user, i) => (
                  <tr key={user.id || i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-xs text-blue-600">
                          {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{user.full_name || user.email || user.user_id?.substring(0, 8)}</p>
                          {user.email && <p className="text-[10px] text-zinc-500">{user.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role || user.role_code || 'employee'}
                        onChange={e => handleRoleChange(user.user_id || user.id, user.companyId || user.company_id, e.target.value)}
                        disabled={actionLoading === (user.user_id || user.id)}
                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-lg px-2 py-1 border-none cursor-pointer"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-500">{user.companyName || user.company_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        user.status === 'invited' ? 'bg-blue-500/10 text-blue-500' :
                          user.status === 'suspended' ? 'bg-red-500/10 text-red-500' :
                            'bg-zinc-200/50 text-zinc-500'
                        }`}>{user.status || 'unknown'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSuspendUser(user.user_id || user.id)}
                        disabled={actionLoading === (user.user_id || user.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold ${user.status === 'suspended' ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-red-50 text-red-600'}`}
                        title={user.status === 'suspended' ? t('reinstate') : t('suspend')}
                      >
                        {actionLoading === (user.user_id || user.id) ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Maintenance Panel ──────────────────────────────────────────────────────


export { UserManagement };
