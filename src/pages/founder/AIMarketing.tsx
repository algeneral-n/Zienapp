import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap, Shield, Loader2, ToggleLeft, ToggleRight, Plus, Edit3, Trash2, Save, X, Megaphone, Calendar, Target,
} from 'lucide-react';
import {
  listAIPolicies, createAIPolicy, updateAIPolicy, listFeatureFlags, createFeatureFlag, updateFeatureFlag, createAnnouncement,
} from '../../services/founderService';
import { supabase } from '../../services/supabase';
import { LoadingState, ErrorState } from './shared';

const AIBuilder = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'agents' | 'policies' | 'flags'>('agents');
  const [agents, setAgents] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [showCreateFlag, setShowCreateFlag] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ name: '', description: '', policy_type: 'rate_limit', rules: '{}', applies_to: 'all', priority: 10 });
  const [newFlag, setNewFlag] = useState({ flag_key: '', name: '', description: '', is_enabled: false, rollout_percentage: 100 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [agentData, policyData, flagData] = await Promise.all([
          founderFetch('/api/ai/agents').catch(() => ({ agents: [] })),
          listAIPolicies().catch(() => ({ policies: [] })),
          listFeatureFlags().catch(() => ({ flags: [] })),
        ]);
        setAgents(agentData.agents || []);
        setPolicies(policyData.policies || []);
        setFlags(flagData.flags || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load AI data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreatePolicy = async () => {
    if (!newPolicy.name.trim()) return;
    setActionLoading('createPolicy');
    try {
      let rules = {};
      try { rules = JSON.parse(newPolicy.rules); } catch { /* keep empty */ }
      const { policy } = await createAIPolicy({ ...newPolicy, rules });
      setPolicies(prev => [...prev, policy]);
      setShowCreatePolicy(false);
      setNewPolicy({ name: '', description: '', policy_type: 'rate_limit', rules: '{}', applies_to: 'all', priority: 10 });
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleTogglePolicy = async (id: string, isActive: boolean) => {
    setActionLoading(id);
    try {
      await updateAIPolicy(id, { is_active: !isActive });
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, is_active: !isActive } : p));
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleCreateFlag = async () => {
    if (!newFlag.flag_key.trim() || !newFlag.name.trim()) return;
    setActionLoading('createFlag');
    try {
      const { flag } = await createFeatureFlag(newFlag);
      setFlags(prev => [...prev, flag]);
      setShowCreateFlag(false);
      setNewFlag({ flag_key: '', name: '', description: '', is_enabled: false, rollout_percentage: 100 });
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleToggleFlag = async (id: string, isEnabled: boolean) => {
    setActionLoading(id);
    try {
      await updateFeatureFlag(id, { is_enabled: !isEnabled });
      setFlags(prev => prev.map(f => f.id === id ? { ...f, is_enabled: !isEnabled } : f));
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('rare_ai_builder')}</h2>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['agents', 'policies', 'flags'] as const).map(t2 => (
          <button key={t2} onClick={() => setTab(t2)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${tab === t2 ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
            {t2 === 'agents' ? `${t('agents')} (${agents.length})` : t2 === 'policies' ? `${t('policies')} (${policies.length})` : `${t('feature_flags')} (${flags.length})`}
          </button>
        ))}
      </div>

      {/* Agents Tab */}
      {tab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-black uppercase tracking-tight mb-6">{t('active_agents')} ({agents.length})</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {agents.map((agent: any) => (
                <div key={agent.code || agent.type} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-between group">
                  <div>
                    <span className="text-sm font-bold uppercase tracking-tight">{agent.name || agent.code}</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Min role: {agent.minRole || '—'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${agent.accessible ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'}`}>{agent.accessible ? 'Active' : 'Restricted'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 text-white p-8 rounded-[40px] flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Zap size={32} /></div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">{t('global_ai_model')}</h3>
            <p className="text-zinc-400 text-sm mb-4">OpenAI GPT-4o</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{agents.length} {t('agents_configured')}</p>
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {tab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCreatePolicy(!showCreatePolicy)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
              <Plus size={14} /> {t('new_policy')}
            </button>
          </div>
          {showCreatePolicy && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder={t('policy_name')} value={newPolicy.name} onChange={e => setNewPolicy({ ...newPolicy, name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <select value={newPolicy.policy_type} onChange={e => setNewPolicy({ ...newPolicy, policy_type: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm">
                  {['rate_limit', 'content_filter', 'cost_limit', 'access_control', 'data_retention'].map(t2 => <option key={t2} value={t2}>{t2.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <input placeholder={t('description')} value={newPolicy.description} onChange={e => setNewPolicy({ ...newPolicy, description: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
              <textarea placeholder='Rules JSON: {"max_queries_per_hour": 100}' rows={3} value={newPolicy.rules} onChange={e => setNewPolicy({ ...newPolicy, rules: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-mono resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreatePolicy(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{t('cancel')}</button>
                <button onClick={handleCreatePolicy} disabled={actionLoading === 'createPolicy'} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
                  {actionLoading === 'createPolicy' ? <Loader2 size={14} className="animate-spin" /> : t('create')}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {policies.map(p => (
              <div key={p.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{p.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{p.policy_type}</span>
                  </div>
                  {p.description && <p className="text-xs text-zinc-500 mt-1">{p.description}</p>}
                </div>
                <button onClick={() => handleTogglePolicy(p.id, p.is_active)} disabled={actionLoading === p.id} className="p-2">
                  {p.is_active ? <ToggleRight size={24} className="text-emerald-600" /> : <ToggleLeft size={24} className="text-zinc-400" />}
                </button>
              </div>
            ))}
            {policies.length === 0 && <p className="text-sm text-zinc-400 text-center py-8">{t('no_policies')}</p>}
          </div>
        </div>
      )}

      {/* Feature Flags Tab */}
      {tab === 'flags' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateFlag(!showCreateFlag)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
              <Plus size={14} /> {t('new_flag')}
            </button>
          </div>
          {showCreateFlag && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="flag_key (snake_case)" value={newFlag.flag_key} onChange={e => setNewFlag({ ...newFlag, flag_key: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-mono" />
                <input placeholder={t('flag_name')} value={newFlag.name} onChange={e => setNewFlag({ ...newFlag, name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
              </div>
              <input placeholder={t('description')} value={newFlag.description} onChange={e => setNewFlag({ ...newFlag, description: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-zinc-500">{t('rollout')}: {newFlag.rollout_percentage}%</label>
                <input type="range" min={0} max={100} value={newFlag.rollout_percentage} onChange={e => setNewFlag({ ...newFlag, rollout_percentage: Number(e.target.value) })} className="flex-1" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateFlag(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{t('cancel')}</button>
                <button onClick={handleCreateFlag} disabled={actionLoading === 'createFlag'} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
                  {actionLoading === 'createFlag' ? <Loader2 size={14} className="animate-spin" /> : t('create')}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {flags.map(f => (
              <div key={f.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{f.name}</span>
                    <code className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{f.flag_key}</code>
                    <span className="text-[10px] text-zinc-500">{f.rollout_percentage}% rollout</span>
                  </div>
                  {f.description && <p className="text-xs text-zinc-500 mt-1">{f.description}</p>}
                </div>
                <button onClick={() => handleToggleFlag(f.id, f.is_enabled)} disabled={actionLoading === f.id} className="p-2">
                  {f.is_enabled ? <ToggleRight size={24} className="text-emerald-600" /> : <ToggleLeft size={24} className="text-zinc-400" />}
                </button>
              </div>
            ))}
            {flags.length === 0 && <p className="text-sm text-zinc-400 text-center py-8">{t('no_feature_flags')}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Marketing (REAL DATA from marketing_campaigns + platform_announcements) ─


const MarketingSystem = () => {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'email', status: 'draft', target_audience: 'all_tenants', subject: '', body: '' });

  useEffect(() => {
    (async () => {
      try {
        const [{ data: c, error: e1 }, { data: a, error: e2 }] = await Promise.all([
          supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }).limit(20),
          supabase.from('platform_announcements').select('*').order('created_at', { ascending: false }).limit(10),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;
        setCampaigns(c || []);
        setAnnouncements(a || []);
      } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  const handleCreateCampaign = async () => {
    const { error: err } = await supabase.from('marketing_campaigns').insert({
      ...newCampaign,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    });
    if (!err) {
      setShowCreateCampaign(false);
      setNewCampaign({ name: '', type: 'email', status: 'draft', target_audience: 'all_tenants', subject: '', body: '' });
      const { data } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }).limit(20);
      setCampaigns(data || []);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((s, c) => s + (c.opened_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('marketing_campaigns')}</h2>
        <button onClick={() => setShowCreateCampaign(!showCreateCampaign)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Megaphone size={14} /> {t('new_campaign')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('total_campaigns'), value: String(campaigns.length), icon: Megaphone, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: t('active'), value: String(activeCampaigns), icon: Zap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: t('emails_sent'), value: totalSent.toLocaleString(), icon: Globe, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
          { label: t('open_rate'), value: totalSent > 0 ? `${Math.round((totalOpened / totalSent) * 100)}%` : '—', icon: Eye, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {showCreateCampaign && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-black uppercase tracking-tight text-sm">{t('create_campaign')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder={t('campaign_name')} value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
            <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notification</option>
            </select>
          </div>
          <input placeholder={t('subject')} value={newCampaign.subject} onChange={e => setNewCampaign({ ...newCampaign, subject: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
          <textarea placeholder={t('body')} rows={3} value={newCampaign.body} onChange={e => setNewCampaign({ ...newCampaign, body: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateCampaign(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">{t('cancel')}</button>
            <button onClick={handleCreateCampaign} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700">{t('save_draft')}</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('campaign')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('type')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('sent')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('created')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {campaigns.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_campaigns')}</td></tr>
            ) : campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{c.name}</td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase">{c.type}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : c.status === 'sent' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-200/50 text-zinc-500'}`}>{c.status}</span></td>
                <td className="px-6 py-4 text-xs font-medium">{c.sent_count || 0}</td>
                <td className="px-6 py-4 text-xs text-zinc-400">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {announcements.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
          <h3 className="font-black uppercase tracking-tight mb-4 text-sm">{t('platform_announcements')}</h3>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{a.body?.substring(0, 100)}{a.body?.length > 100 ? '…' : ''}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${a.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'}`}>
                  {a.is_active ? 'Live' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Integration Control (Founder manages catalog + tenant integrations) ────


export { AIBuilder, MarketingSystem };
