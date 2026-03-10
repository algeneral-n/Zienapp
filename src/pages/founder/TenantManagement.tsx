import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Plus, Edit3, Power, Loader2,
  ChevronRight, X, Save, Search,
} from 'lucide-react';
import {
  listTenants, getTenant, updateTenant, suspendTenant, reinstateTenant,
} from '../../services/founderService';
import { LoadingState, ErrorState, founderFetch } from './shared';

const TenantManagement = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', name_ar: '', industry: '', country: '', plan_code: 'free' });

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      const { tenants: data } = await listTenants(1, 200);
      setTenants(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  const filtered = tenants.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewDetail = async (tenant: any) => {
    setDetailLoading(true);
    try {
      const { tenant: detail } = await getTenant(tenant.id);
      setSelectedTenant(detail);
      setEditData({ name: detail.name, name_ar: detail.name_ar || '', industry: detail.industry || '', country: detail.country || '', plan_code: detail.plan_code || 'free' });
    } catch {
      setSelectedTenant({ ...tenant, members: [], modules: [] });
      setEditData({ name: tenant.name, name_ar: tenant.name_ar || '', industry: tenant.industry || '', country: tenant.country || '', plan_code: tenant.plan_code || 'free' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTenant) return;
    setActionLoading('save');
    try {
      await updateTenant(selectedTenant.id, editData);
      setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, ...editData } : t));
      setSelectedTenant((prev: any) => ({ ...prev, ...editData }));
      setEditMode(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (tenantId: string) => {
    setActionLoading(tenantId);
    try {
      await suspendTenant(tenantId);
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: 'suspended' } : t));
      if (selectedTenant?.id === tenantId) setSelectedTenant((p: any) => ({ ...p, status: 'suspended' }));
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleReinstate = async (tenantId: string) => {
    setActionLoading(tenantId);
    try {
      await reinstateTenant(tenantId);
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: 'active' } : t));
      if (selectedTenant?.id === tenantId) setSelectedTenant((p: any) => ({ ...p, status: 'active' }));
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.name.trim()) return;
    setActionLoading('create');
    try {
      await founderFetch('/api/founder/tenants', 'POST', newTenant);
      setShowCreate(false);
      setNewTenant({ name: '', name_ar: '', industry: '', country: '', plan_code: 'free' });
      await loadTenants();
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  // Tenant Detail Panel
  if (selectedTenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setSelectedTenant(null); setEditMode(false); }} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
            ← {t('back')}
          </button>
          <div className="flex items-center gap-2">
            {!editMode ? (
              <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
                <Edit3 size={14} /> {t('edit')}
              </button>
            ) : (
              <>
                <button onClick={() => setEditMode(false)} className="px-3 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">{t('cancel')}</button>
                <button onClick={handleSaveEdit} disabled={actionLoading === 'save'} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {actionLoading === 'save' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {t('save')}
                </button>
              </>
            )}
            {selectedTenant.status === 'active' ? (
              <button onClick={() => handleSuspend(selectedTenant.id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700">
                <Power size={14} /> {t('suspend')}
              </button>
            ) : (
              <button onClick={() => handleReinstate(selectedTenant.id)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700">
                <Power size={14} /> {t('reinstate')}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-black text-2xl text-blue-600">
              {(selectedTenant.name || '?').charAt(0)}
            </div>
            <div>
              {editMode ? (
                <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="text-2xl font-black bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-1 border border-zinc-200 dark:border-zinc-700" />
              ) : (
                <h2 className="text-2xl font-black">{selectedTenant.name}</h2>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${selectedTenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : selectedTenant.status === 'suspended' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>{selectedTenant.status}</span>
                <span className="text-xs text-zinc-500">{selectedTenant.plan_code || 'Free'} Plan</span>
                <span className="text-xs text-zinc-500">Since {new Date(selectedTenant.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {editMode ? (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">{t('company_name')} (AR)</label>
                  <input value={editData.name_ar} onChange={e => setEditData({ ...editData, name_ar: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">{t('industry')}</label>
                  <input value={editData.industry} onChange={e => setEditData({ ...editData, industry: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">{t('country')}</label>
                  <input value={editData.country} onChange={e => setEditData({ ...editData, country: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">{t('plan')}</label>
                  <select value={editData.plan_code} onChange={e => setEditData({ ...editData, plan_code: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm">
                    {['free', 'trial', 'starter', 'professional', 'enterprise', 'custom'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 font-bold">{t('industry')}</span>
                    <span className="text-sm font-bold">{selectedTenant.industry || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 font-bold">{t('country')}</span>
                    <span className="text-sm font-bold">{selectedTenant.country || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 font-bold">{t('members')}</span>
                    <span className="text-sm font-bold">{selectedTenant.members?.length || selectedTenant.member_count || 0}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 font-bold">{t('plan')}</span>
                    <span className="text-sm font-bold text-blue-600 uppercase">{selectedTenant.plan_code || 'Free'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 font-bold">{t('subscription_status')}</span>
                    <span className="text-sm font-bold">{selectedTenant.subscription?.status || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 font-bold">{t('ai_queries_30d')}</span>
                    <span className="text-sm font-bold">{selectedTenant.ai_usage_30d?.total_queries || 0}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Members Table */}
        {selectedTenant.members?.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-black uppercase tracking-tight text-sm">{t('members')} ({selectedTenant.members.length})</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('user')}</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('role')}</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {selectedTenant.members.map((m: any) => (
                  <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="px-6 py-3 text-sm font-medium">{m.email || m.user_id?.substring(0, 12)}</td>
                    <td className="px-6 py-3 text-xs font-bold text-blue-600 uppercase">{m.role}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${m.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-200/50 text-zinc-500'}`}>{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Active Modules */}
        {selectedTenant.modules?.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="font-black uppercase tracking-tight text-sm mb-4">{t('active_modules')}</h3>
            <div className="flex flex-wrap gap-2">
              {selectedTenant.modules.filter((m: any) => m.is_active).map((m: any) => (
                <span key={m.module_id} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full uppercase">{m.module_id}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('tenant_management')}</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
            <Plus size={14} /> {t('new_tenant')}
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder={t('search_companies')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Create Tenant Form */}
      {showCreate && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-black uppercase tracking-tight text-sm">{t('create_tenant')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder={t('company_name')} value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
            <input placeholder={`${t('company_name')} (AR)`} value={newTenant.name_ar} onChange={e => setNewTenant({ ...newTenant, name_ar: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
            <input placeholder={t('industry')} value={newTenant.industry} onChange={e => setNewTenant({ ...newTenant, industry: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
            <input placeholder={t('country')} value={newTenant.country} onChange={e => setNewTenant({ ...newTenant, country: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
          </div>
          <select value={newTenant.plan_code} onChange={e => setNewTenant({ ...newTenant, plan_code: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium">
            {['free', 'trial', 'starter', 'professional', 'enterprise'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">{t('cancel')}</button>
            <button onClick={handleCreateTenant} disabled={actionLoading === 'create'} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
              {actionLoading === 'create' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {t('create')}
            </button>
          </div>
        </div>
      )}

      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('company')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('industry')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('plan')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('country')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_companies_found')}</td></tr>
              ) : filtered.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                        {(tenant.name || '?').charAt(0)}
                      </div>
                      <span className="text-sm font-bold">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-zinc-500">{tenant.industry || '—'}</td>
                  <td className="px-6 py-4 text-xs font-bold text-blue-600 uppercase tracking-widest">
                    {tenant.plan_code || tenant.subscription?.plan_code || 'Free'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                      tenant.status === 'suspended' ? 'bg-red-500/10 text-red-500' :
                        tenant.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-zinc-200/50 text-zinc-500'
                      }`}>{tenant.status || 'unknown'}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-zinc-500">{tenant.country || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => handleViewDetail(tenant)} title={t('view')} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-600">
                        <ChevronRight size={14} />
                      </button>
                      {tenant.status === 'active' ? (
                        <button onClick={() => handleSuspend(tenant.id)} disabled={actionLoading === tenant.id} title={t('suspend')} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-600 disabled:opacity-50">
                          {actionLoading === tenant.id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                        </button>
                      ) : (
                        <button onClick={() => handleReinstate(tenant.id)} disabled={actionLoading === tenant.id} title={t('reinstate')} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-zinc-500 hover:text-emerald-600 disabled:opacity-50">
                          {actionLoading === tenant.id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
