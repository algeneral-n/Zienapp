import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap, Shield, Loader2, ToggleLeft, ToggleRight, Plus, Edit3, Trash2, Save, X, Megaphone, Calendar, Target,
  Route, Wallet, ShieldCheck, CheckCircle, XCircle, Clock, Globe, Eye,
} from 'lucide-react';
import {
  listAIPolicies, createAIPolicy, updateAIPolicy, listFeatureFlags, createFeatureFlag, updateFeatureFlag, createAnnouncement,
} from '../../services/founderService';
import { supabase } from '../../services/supabase';
import { LoadingState, ErrorState, founderFetch } from './shared';

type AITab = 'agents' | 'policies' | 'flags' | 'routing' | 'budgets' | 'actions' | 'reviews';

const TAB_META: Record<AITab, { label: string; icon: typeof Zap }> = {
  agents: { label: 'agents', icon: Zap },
  policies: { label: 'policies', icon: Shield },
  flags: { label: 'feature_flags', icon: ToggleRight },
  routing: { label: 'model_routing', icon: Route },
  budgets: { label: 'budgets', icon: Wallet },
  actions: { label: 'action_policies', icon: ShieldCheck },
  reviews: { label: 'reviews', icon: Shield },
};

const AIBuilder = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AITab>('agents');
  const [agents, setAgents] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [routingRules, setRoutingRules] = useState<any[]>([]);
  const [budgetPolicies, setBudgetPolicies] = useState<any[]>([]);
  const [actionPolicies, setActionPolicies] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [showCreateFlag, setShowCreateFlag] = useState(false);
  const [showCreateRouting, setShowCreateRouting] = useState(false);
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showCreateAction, setShowCreateAction] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ name: '', description: '', policy_type: 'rate_limit', rules: '{}', applies_to: 'all', priority: 10 });
  const [newFlag, setNewFlag] = useState({ flag_key: '', name: '', description: '', is_enabled: false, rollout_percentage: 100 });
  const [newRouting, setNewRouting] = useState({ agent_type: '', mode: '', model_name: 'gpt-4o-mini', priority: 10, is_active: true });
  const [newBudget, setNewBudget] = useState({ company_id: '', daily_token_limit: 100000, monthly_token_limit: 2000000, alert_threshold_percent: 80, is_active: true });
  const [newAction, setNewAction] = useState({ agent_type: '', action_mode: '', permission_tier: 'suggest', min_role_level: 3, preferred_model: '', require_confirmation: false });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [agentData, policyData, flagData, { data: routing }, { data: budgets }, { data: actions }] = await Promise.all([
          founderFetch('/api/ai/agents').catch(() => ({ agents: [] })),
          listAIPolicies().catch(() => ({ policies: [] })),
          listFeatureFlags().catch(() => ({ flags: [] })),
          supabase.from('ai_model_routing_rules').select('*').order('priority', { ascending: false }),
          supabase.from('ai_budget_policies').select('*').order('created_at', { ascending: false }),
          supabase.from('ai_action_policies').select('*').eq('is_active', true).order('min_role_level'),
        ]);
        setAgents(agentData.agents || []);
        setPolicies(policyData.policies || []);
        setFlags(flagData.flags || []);
        setRoutingRules(routing || []);
        setBudgetPolicies(budgets || []);
        setActionPolicies(actions || []);
        // Load pending reviews (may fail if no company context, that's ok)
        try {
          const { data: rev } = await supabase.from('ai_action_reviews').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(50);
          setReviews(rev || []);
        } catch { /* non-critical */ }
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
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(TAB_META) as AITab[]).map(t2 => {
          const meta = TAB_META[t2];
          const count = t2 === 'agents' ? agents.length : t2 === 'policies' ? policies.length : t2 === 'flags' ? flags.length : t2 === 'routing' ? routingRules.length : t2 === 'budgets' ? budgetPolicies.length : t2 === 'actions' ? actionPolicies.length : reviews.length;
          return (
            <button key={t2} onClick={() => setTab(t2)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${tab === t2 ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
              {t(meta.label)} ({count})
            </button>
          );
        })}
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

      {/* Model Routing Tab */}
      {tab === 'routing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{t('model_routing_desc') || 'AI model routing rules determine which model is used for each agent/mode combination. Higher priority wins.'}</p>
            <button onClick={() => setShowCreateRouting(!showCreateRouting)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shrink-0">
              <Plus size={14} /> New Rule
            </button>
          </div>
          {showCreateRouting && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input placeholder="Agent type (or * for all)" value={newRouting.agent_type} onChange={e => setNewRouting({ ...newRouting, agent_type: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <input placeholder="Mode (or * for all)" value={newRouting.mode} onChange={e => setNewRouting({ ...newRouting, mode: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <select value={newRouting.model_name} onChange={e => setNewRouting({ ...newRouting, model_name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm">
                  {['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-mini', 'o1-preview'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="number" placeholder="Priority" value={newRouting.priority} onChange={e => setNewRouting({ ...newRouting, priority: Number(e.target.value) })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateRouting(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{t('cancel')}</button>
                <button
                  onClick={async () => {
                    setActionLoading('createRouting');
                    try {
                      const { error: err } = await supabase.from('ai_model_routing_rules').insert({
                        agent_type: newRouting.agent_type || '*',
                        mode: newRouting.mode || '*',
                        model_name: newRouting.model_name,
                        priority: newRouting.priority,
                        is_active: newRouting.is_active,
                      }).select().single();
                      if (err) throw err;
                      const { data } = await supabase.from('ai_model_routing_rules').select('*').order('priority', { ascending: false });
                      setRoutingRules(data || []);
                      setShowCreateRouting(false);
                      setNewRouting({ agent_type: '', mode: '', model_name: 'gpt-4o-mini', priority: 10, is_active: true });
                    } catch (e: any) { alert(e.message); }
                    finally { setActionLoading(null); }
                  }}
                  disabled={actionLoading === 'createRouting'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {actionLoading === 'createRouting' ? <Loader2 size={14} className="animate-spin" /> : t('create')}
                </button>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('agent_type')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('mode')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('model')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('priority')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {routingRules.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_routing_rules')}</td></tr>
                ) : routingRules.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold">{r.agent_type || '*'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-500">{r.mode || '*'}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-600/10">{r.model_name}</span></td>
                    <td className="px-6 py-4 text-xs font-medium">{r.priority}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={async () => {
                          setActionLoading(r.id);
                          await supabase.from('ai_model_routing_rules').update({ is_active: !r.is_active }).eq('id', r.id);
                          setRoutingRules(prev => prev.map(x => x.id === r.id ? { ...x, is_active: !r.is_active } : x));
                          setActionLoading(null);
                        }}
                        disabled={actionLoading === r.id}
                        className="p-1"
                      >
                        {r.is_active ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} className="text-zinc-400" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={async () => {
                          setActionLoading(r.id + '-del');
                          await supabase.from('ai_model_routing_rules').delete().eq('id', r.id);
                          setRoutingRules(prev => prev.filter(x => x.id !== r.id));
                          setActionLoading(null);
                        }}
                        disabled={actionLoading === r.id + '-del'}
                        className="p-1 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {tab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{t('budget_desc') || 'AI budget policies control daily and monthly token limits per company.'}</p>
            <button onClick={() => setShowCreateBudget(!showCreateBudget)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shrink-0">
              <Plus size={14} /> New Budget
            </button>
          </div>
          {showCreateBudget && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input placeholder="Company ID (blank = platform-wide)" value={newBudget.company_id} onChange={e => setNewBudget({ ...newBudget, company_id: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <input type="number" placeholder="Daily limit" value={newBudget.daily_token_limit} onChange={e => setNewBudget({ ...newBudget, daily_token_limit: Number(e.target.value) })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <input type="number" placeholder="Monthly limit" value={newBudget.monthly_token_limit} onChange={e => setNewBudget({ ...newBudget, monthly_token_limit: Number(e.target.value) })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <input type="number" placeholder="Alert at %" value={newBudget.alert_threshold_percent} onChange={e => setNewBudget({ ...newBudget, alert_threshold_percent: Number(e.target.value) })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateBudget(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{t('cancel')}</button>
                <button
                  onClick={async () => {
                    setActionLoading('createBudget');
                    try {
                      const row: any = {
                        daily_token_limit: newBudget.daily_token_limit,
                        monthly_token_limit: newBudget.monthly_token_limit,
                        alert_threshold_percent: newBudget.alert_threshold_percent,
                        is_active: true,
                      };
                      if (newBudget.company_id.trim()) row.company_id = newBudget.company_id.trim();
                      const { error: err } = await supabase.from('ai_budget_policies').insert(row);
                      if (err) throw err;
                      const { data } = await supabase.from('ai_budget_policies').select('*').order('created_at', { ascending: false });
                      setBudgetPolicies(data || []);
                      setShowCreateBudget(false);
                      setNewBudget({ company_id: '', daily_token_limit: 100000, monthly_token_limit: 2000000, alert_threshold_percent: 80, is_active: true });
                    } catch (e: any) { alert(e.message); }
                    finally { setActionLoading(null); }
                  }}
                  disabled={actionLoading === 'createBudget'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {actionLoading === 'createBudget' ? <Loader2 size={14} className="animate-spin" /> : t('create')}
                </button>
              </div>
            </div>
          )}
          {budgetPolicies.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">{t('no_budgets') || 'No budget policies configured.'}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgetPolicies.map(b => (
                <div key={b.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold">{b.company_id ? `Company: ${b.company_id.slice(0, 8)}...` : 'Platform-wide'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setActionLoading(b.id);
                          await supabase.from('ai_budget_policies').update({ is_active: !b.is_active }).eq('id', b.id);
                          setBudgetPolicies(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x));
                          setActionLoading(null);
                        }}
                        disabled={actionLoading === b.id}
                        className="p-1"
                      >
                        {b.is_active ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} className="text-zinc-400" />}
                      </button>
                      <button
                        onClick={async () => {
                          setActionLoading(b.id + '-del');
                          await supabase.from('ai_budget_policies').delete().eq('id', b.id);
                          setBudgetPolicies(prev => prev.filter(x => x.id !== b.id));
                          setActionLoading(null);
                        }}
                        disabled={actionLoading === b.id + '-del'}
                        className="p-1 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('daily_limit')}</div>
                      <div className="text-lg font-black mt-1">{b.daily_token_limit === -1 ? 'Unlimited' : (b.daily_token_limit || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('monthly_limit')}</div>
                      <div className="text-lg font-black mt-1">{b.monthly_token_limit === -1 ? 'Unlimited' : (b.monthly_token_limit || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  {b.alert_threshold_percent && (
                    <p className="text-[10px] text-zinc-500 mt-3">Alert at {b.alert_threshold_percent}% usage</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Policies Tab */}
      {tab === 'actions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{t('action_policy_desc') || 'Action policies determine permission tiers, confirmation requirements, and model preferences for each agent + mode combination.'}</p>
            <button onClick={() => setShowCreateAction(!showCreateAction)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shrink-0">
              <Plus size={14} /> New Policy
            </button>
          </div>
          {showCreateAction && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input placeholder="Agent type (or * for all)" value={newAction.agent_type} onChange={e => setNewAction({ ...newAction, agent_type: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <input placeholder="Action mode (or * for all)" value={newAction.action_mode} onChange={e => setNewAction({ ...newAction, action_mode: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <select value={newAction.permission_tier} onChange={e => setNewAction({ ...newAction, permission_tier: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm">
                  {['auto_execute', 'suggest', 'require_approval', 'deny'].map(t2 => <option key={t2} value={t2}>{t2.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input type="number" placeholder="Min role level" value={newAction.min_role_level} onChange={e => setNewAction({ ...newAction, min_role_level: Number(e.target.value) })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <input placeholder="Preferred model (optional)" value={newAction.preferred_model} onChange={e => setNewAction({ ...newAction, preferred_model: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm" />
                <label className="flex items-center gap-2 px-3">
                  <input type="checkbox" checked={newAction.require_confirmation} onChange={e => setNewAction({ ...newAction, require_confirmation: e.target.checked })} className="rounded" />
                  <span className="text-xs font-bold">Require Confirmation</span>
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateAction(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{t('cancel')}</button>
                <button
                  onClick={async () => {
                    setActionLoading('createAction');
                    try {
                      const row: any = {
                        agent_type: newAction.agent_type || '*',
                        action_mode: newAction.action_mode || '*',
                        permission_tier: newAction.permission_tier,
                        min_role_level: newAction.min_role_level,
                        require_confirmation: newAction.require_confirmation,
                        is_active: true,
                      };
                      if (newAction.preferred_model.trim()) row.preferred_model = newAction.preferred_model.trim();
                      const { error: err } = await supabase.from('ai_action_policies').insert(row);
                      if (err) throw err;
                      const { data } = await supabase.from('ai_action_policies').select('*').eq('is_active', true).order('min_role_level');
                      setActionPolicies(data || []);
                      setShowCreateAction(false);
                      setNewAction({ agent_type: '', action_mode: '', permission_tier: 'suggest', min_role_level: 3, preferred_model: '', require_confirmation: false });
                    } catch (e: any) { alert(e.message); }
                    finally { setActionLoading(null); }
                  }}
                  disabled={actionLoading === 'createAction'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {actionLoading === 'createAction' ? <Loader2 size={14} className="animate-spin" /> : t('create')}
                </button>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('scope')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('agent')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('mode')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('tier')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('min_role')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('model')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('confirm')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {actionPolicies.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_action_policies')}</td></tr>
                ) : actionPolicies.map(a => {
                  const tierColors: Record<string, string> = {
                    auto_execute: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
                    suggest: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
                    require_approval: 'bg-red-50 text-red-600 dark:bg-red-500/10',
                    deny: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                  };
                  return (
                    <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-xs">{a.company_id ? 'Company' : 'Platform'}</td>
                      <td className="px-4 py-3 text-xs font-bold">{a.agent_type || '*'}</td>
                      <td className="px-4 py-3 text-xs">{a.action_mode || '*'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tierColors[a.permission_tier] || ''}`}>{a.permission_tier}</span></td>
                      <td className="px-4 py-3 text-xs font-medium">{a.min_role_level}</td>
                      <td className="px-4 py-3 text-xs font-mono">{a.preferred_model || '—'}</td>
                      <td className="px-4 py-3">{a.require_confirmation ? <ShieldCheck size={14} className="text-amber-500" /> : <span className="text-zinc-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            setActionLoading(a.id + '-del');
                            await supabase.from('ai_action_policies').update({ is_active: false }).eq('id', a.id);
                            setActionPolicies(prev => prev.filter(x => x.id !== a.id));
                            setActionLoading(null);
                          }}
                          disabled={actionLoading === a.id + '-del'}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews Tab — Pending AI Action Approvals */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-500">{t('review_desc') || 'Pending AI actions that require manager approval before execution.'}</p>
          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
              <CheckCircle size={32} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-sm text-zinc-500 font-medium">{t('no_pending_reviews') || 'No pending reviews. All clear.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-600 dark:bg-amber-500/10">{r.permission_tier || 'require_approval'}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{r.agent_type || '—'} / {r.action_mode || '—'}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{r.action_code || r.payload?.prompt?.slice(0, 120) || 'AI Action'}</p>
                      {r.payload?.prompt && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{r.payload.prompt}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(r.created_at).toLocaleString()}</span>
                        {r.requested_model && <span className="font-mono">{r.requested_model}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          setActionLoading(r.id);
                          try {
                            await founderFetch('/api/ai/approve-action', 'POST', { reviewId: r.id, companyId: r.company_id, decision: 'approved' });
                            setReviews(prev => prev.filter(x => x.id !== r.id));
                          } catch (e: any) { alert(e.message); }
                          finally { setActionLoading(null); }
                        }}
                        disabled={actionLoading === r.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading === r.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        {t('approve')}
                      </button>
                      <button
                        onClick={async () => {
                          setActionLoading(r.id);
                          try {
                            await founderFetch('/api/ai/approve-action', 'POST', { reviewId: r.id, companyId: r.company_id, decision: 'denied' });
                            setReviews(prev => prev.filter(x => x.id !== r.id));
                          } catch (e: any) { alert(e.message); }
                          finally { setActionLoading(null); }
                        }}
                        disabled={actionLoading === r.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading === r.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        {t('deny')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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


// InternalMarketing is the same as MarketingSystem (tenant-facing campaigns)
const InternalMarketing = MarketingSystem;

export { AIBuilder, MarketingSystem, InternalMarketing };
