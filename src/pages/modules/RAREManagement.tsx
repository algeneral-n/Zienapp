import React, { useState, useEffect } from 'react';
import {
  Brain, Shield, BarChart3, Settings, History,
  AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight,
  Zap, Bot, Activity, Users, Lock, Loader2
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';
// TODO: Replace direct supabase calls with aiGovernanceService when /api/ai/governance endpoints are created

interface AgentDef {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'extended' | 'platform';
  minRole: string;
}

// Static agent definitions — system architecture, not business data
const AGENT_DEFS: AgentDef[] = [
  { id: 'accounting', name: 'Accounting Agent', description: 'Journal entries, financial reports, VAT compliance', category: 'core', minRole: 'accountant' },
  { id: 'hr', name: 'HR Agent', description: 'Employee records, leave, attendance, payroll', category: 'core', minRole: 'hr_officer' },
  { id: 'sales', name: 'Sales Agent', description: 'Lead management, pipeline, forecasting', category: 'core', minRole: 'sales_rep' },
  { id: 'fleet', name: 'Fleet & Logistics Agent', description: 'Vehicle tracking, routes, deliveries', category: 'core', minRole: 'supervisor' },
  { id: 'meetings', name: 'Meetings Agent', description: 'Scheduling, summaries, action items', category: 'core', minRole: 'employee' },
  { id: 'gm', name: 'GM Agent', description: 'Executive summaries, cross-department insights', category: 'core', minRole: 'assistant_gm' },
  { id: 'secretary', name: 'Secretary Agent', description: 'Correspondence, documents, admin coordination', category: 'core', minRole: 'executive_secretary' },
  { id: 'crm', name: 'CRM Agent', description: 'Customer profiles, retention, support tickets', category: 'core', minRole: 'sales_rep' },
  { id: 'general', name: 'General Help Agent', description: 'Platform help, navigation, troubleshooting', category: 'extended', minRole: 'client_user' },
  { id: 'marketing', name: 'Marketing Agent', description: 'Campaigns, SEO, content, audience segmentation', category: 'extended', minRole: 'supervisor' },
  { id: 'projects', name: 'Projects Agent', description: 'Task allocation, milestones, resource planning', category: 'extended', minRole: 'employee' },
  { id: 'store', name: 'Store & POS Agent', description: 'Inventory, catalog, pricing analytics', category: 'extended', minRole: 'employee' },
  { id: 'inventory', name: 'Inventory Agent', description: 'Stock levels, reorder points, batch tracking', category: 'extended', minRole: 'supervisor' },
  { id: 'maintenance', name: 'Maintenance Agent', description: 'Preventive schedules, work orders, asset tracking', category: 'extended', minRole: 'supervisor' },
  { id: 'legal', name: 'Legal Compliance Agent', description: 'Contract review, regulatory compliance, policies', category: 'extended', minRole: 'department_manager' },
  { id: 'quality', name: 'Quality Assurance Agent', description: 'QC procedures, ISO, inspections', category: 'extended', minRole: 'supervisor' },
  { id: 'training', name: 'Training Agent', description: 'Onboarding, skills assessment, certifications', category: 'extended', minRole: 'employee' },
  { id: 'procurement', name: 'Procurement Agent', description: 'Vendor management, POs, bid comparison', category: 'extended', minRole: 'supervisor' },
  { id: 'finance', name: 'Financial Planning Agent', description: 'Cash flow, investment analysis, modeling', category: 'extended', minRole: 'accountant' },
  { id: 'safety', name: 'Workplace Safety Agent', description: 'Incident reporting, safety audits, risk assessment', category: 'extended', minRole: 'supervisor' },
  { id: 'support', name: 'Customer Support Agent', description: 'Ticket management, SLA tracking, templates', category: 'extended', minRole: 'employee' },
  { id: 'analytics', name: 'Business Analytics Agent', description: 'Data visualization, trends, KPI monitoring', category: 'extended', minRole: 'department_manager' },
  { id: 'integrations', name: 'Integrations Agent', description: 'API config, data sync, webhook management', category: 'extended', minRole: 'department_manager' },
  { id: 'founder', name: 'Founder Agent', description: 'Tenant analytics, revenue, platform health', category: 'platform', minRole: 'platform_admin' },
];

const ACTION_LEVELS = [
  { level: 'read_only', label: 'Read Only', description: 'Help, analyze, report queries', color: 'text-blue-600 bg-blue-50', minLevel: 20 },
  { level: 'suggest', label: 'Suggest', description: 'AI can suggest actions', color: 'text-amber-600 bg-amber-50', minLevel: 30 },
  { level: 'modify', label: 'Modify', description: 'AI can execute write operations', color: 'text-orange-600 bg-orange-50', minLevel: 60 },
  { level: 'sensitive', label: 'Sensitive', description: 'Payroll runs, terminations, approvals', color: 'text-red-600 bg-red-50', minLevel: 85 },
];

export default function RAREManagement() {
  const { company } = useCompany();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('core');
  const [activeTab, setActiveTab] = useState<'agents' | 'permissions' | 'usage' | 'settings'>('agents');

  // Real data state
  const [agentUsage, setAgentUsage] = useState<Record<string, { count: number; lastUsed?: string }>>({});
  const [totalTokens, setTotalTokens] = useState(0);
  const [deniedCount, setDeniedCount] = useState(0);
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(AGENT_DEFS.map(a => [a.id, true]))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;

    // Fetch agent usage stats from ai_usage_logs
    const fetchUsage = async () => {
      // Per-agent query counts
      const { data: logs } = await supabase
        .from('ai_usage_logs')
        .select('agent, tokens_used, denied, created_at')
        .eq('company_id', company.id);

      const usageMap: Record<string, { count: number; lastUsed?: string }> = {};
      let tokens = 0;
      let denied = 0;

      (logs ?? []).forEach((log: any) => {
        const agent = log.agent || 'general';
        if (!usageMap[agent]) usageMap[agent] = { count: 0 };
        usageMap[agent].count += 1;
        if (!usageMap[agent].lastUsed || log.created_at > usageMap[agent].lastUsed!) {
          usageMap[agent].lastUsed = log.created_at;
        }
        tokens += log.tokens_used || 0;
        if (log.denied) denied += 1;
      });

      setAgentUsage(usageMap);
      setTotalTokens(tokens);
      setDeniedCount(denied);

      // Fetch enabled/disabled state from company_ai_settings if exists
      const { data: settings } = await supabase
        .from('company_ai_settings')
        .select('agent_id, enabled')
        .eq('company_id', company.id);

      if (settings && settings.length > 0) {
        const map: Record<string, boolean> = {};
        AGENT_DEFS.forEach(a => { map[a.id] = true; });
        settings.forEach((s: any) => { map[s.agent_id] = s.enabled; });
        setEnabledAgents(map);
      }

      setLoading(false);
    };

    fetchUsage();
  }, [company?.id]);

  const toggleAgent = async (id: string) => {
    const next = !enabledAgents[id];
    setEnabledAgents(prev => ({ ...prev, [id]: next }));
    if (company?.id) {
      await supabase.from('company_ai_settings').upsert({ company_id: company.id, agent_id: id, enabled: next }, { onConflict: 'company_id,agent_id' });
    }
  };

  const totalUsage = Object.values(agentUsage).reduce((s, a) => s + a.count, 0);
  const enabledCount = Object.values(enabledAgents).filter(Boolean).length;

  const formatLastUsed = (iso?: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} day(s) ago`;
  };

  const formatTokens = (t: number) => t >= 1_000_000 ? `${(t / 1_000_000).toFixed(1)}M` : t >= 1_000 ? `${(t / 1_000).toFixed(1)}K` : String(t);

  const categories = [
    { key: 'core', label: 'Core Business Agents', count: AGENT_DEFS.filter(a => a.category === 'core').length },
    { key: 'extended', label: 'Extended Agents', count: AGENT_DEFS.filter(a => a.category === 'extended').length },
    { key: 'platform', label: 'Platform Agents', count: AGENT_DEFS.filter(a => a.category === 'platform').length },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">RARE AI Management</h1>
          <p className="text-zinc-500 mt-1 text-sm">Configure AI agents, permissions, and usage policies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-600/10 rounded-xl text-blue-600 text-xs font-bold">
            <Bot size={14} className="inline mr-1" /> {enabledCount}/{AGENT_DEFS.length} Active
          </div>
          <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 text-xs font-bold">
            <Activity size={14} className="inline mr-1" /> {totalUsage.toLocaleString()} Total Queries
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {(['agents', 'permissions', 'usage', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
          >
            {tab === 'agents' && <Brain size={14} className="inline mr-2" />}
            {tab === 'permissions' && <Shield size={14} className="inline mr-2" />}
            {tab === 'usage' && <BarChart3 size={14} className="inline mr-2" />}
            {tab === 'settings' && <Settings size={14} className="inline mr-2" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {categories.map(cat => (
            <div key={cat.key} className="border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
              <button
                onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
                className="w-full flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  {expandedCategory === cat.key ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="font-bold text-sm">{cat.label}</span>
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">{cat.count}</span>
                </div>
              </button>
              {expandedCategory === cat.key && (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {AGENT_DEFS.filter(a => a.category === cat.key).map(agent => {
                    const usage = agentUsage[agent.id];
                    const enabled = enabledAgents[agent.id] ?? true;
                    return (
                      <div key={agent.id} className="p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'}`}>
                            <Bot size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-sm">{agent.name}</div>
                            <div className="text-xs text-zinc-500">{agent.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{usage?.count || 0} queries</div>
                            {usage?.lastUsed && <div className="text-[10px] text-zinc-400">{formatLastUsed(usage.lastUsed)}</div>}
                          </div>
                          <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-mono text-zinc-500">
                            <Lock size={10} className="inline mr-1" />{agent.minRole}
                          </div>
                          <button
                            onClick={() => toggleAgent(agent.id)}
                            className={`w-12 h-6 rounded-full transition-all relative ${enabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${enabled ? 'left-6' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACTION_LEVELS.map(al => (
              <div key={al.level} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${al.color}`}>{al.label}</span>
                  <span className="text-xs text-zinc-500">Min Level: {al.minLevel}</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{al.description}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-amber-800 dark:text-amber-400">Sensitive Action Audit</div>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  All sensitive actions (approve, delete, transfer, payroll_run, terminate) are logged to a separate audit trail with user identity, timestamp, and full context. These logs are immutable and retained for compliance.
                </p>
              </div>
            </div>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-xs uppercase tracking-widest text-zinc-500">
              Role Access Matrix
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="py-2 pr-4 font-bold">Role</th>
                    <th className="py-2 px-2">Read Only</th>
                    <th className="py-2 px-2">Suggest</th>
                    <th className="py-2 px-2">Modify</th>
                    <th className="py-2 px-2">Sensitive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {[
                    { role: 'Founder', levels: [true, true, true, true] },
                    { role: 'Platform Admin', levels: [true, true, true, true] },
                    { role: 'Company GM', levels: [true, true, true, true] },
                    { role: 'Assistant GM', levels: [true, true, true, true] },
                    { role: 'Dept Manager', levels: [true, true, true, false] },
                    { role: 'Supervisor', levels: [true, true, true, false] },
                    { role: 'Employee', levels: [true, true, false, false] },
                    { role: 'Trainee', levels: [true, false, false, false] },
                    { role: 'Client User', levels: [true, false, false, false] },
                  ].map(row => (
                    <tr key={row.role}>
                      <td className="py-2 pr-4 font-bold">{row.role}</td>
                      {row.levels.map((allowed, i) => (
                        <td key={i} className="py-2 px-2 text-center">
                          {allowed ? <CheckCircle size={14} className="text-emerald-500 inline" /> : <XCircle size={14} className="text-red-400 inline" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total Queries</div>
              <div className="text-2xl font-black mt-2">{totalUsage.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Active Agents</div>
              <div className="text-2xl font-black mt-2">{enabledCount}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Tokens Used</div>
              <div className="text-2xl font-black mt-2">{loading ? '-' : formatTokens(totalTokens)}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Denied Requests</div>
              <div className="text-2xl font-black mt-2 text-red-500">{loading ? '-' : deniedCount}</div>
            </div>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-xs uppercase tracking-widest text-zinc-500">
              Top Agents by Usage
            </div>
            <div className="p-4 space-y-3">
              {AGENT_DEFS
                .map(a => ({ ...a, usageCount: agentUsage[a.id]?.count || 0 }))
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 8)
                .map(agent => {
                  const maxCount = Math.max(...AGENT_DEFS.map(a => agentUsage[a.id]?.count || 0), 1);
                  return (
                    <div key={agent.id} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-bold truncate">{agent.name.replace(' Agent', '')}</div>
                      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${(agent.usageCount / maxCount) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-bold text-zinc-500 w-12 text-right">{agent.usageCount}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-sm">AI Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Model</label>
                <select className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium">
                  <option>Gemini 2.0 Flash</option>
                  <option disabled>GPT-4o (coming soon)</option>
                  <option disabled>Claude 3.5 (coming soon)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Temperature</label>
                <input type="range" min="0" max="100" defaultValue="70" className="w-full" />
                <div className="text-xs text-zinc-500 mt-1">0.7 — Balanced creativity</div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Max Tokens per Response</label>
                <input type="number" defaultValue={4096} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Response Language</label>
                <select className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium">
                  <option>Auto-detect from query</option>
                  <option>Always Arabic</option>
                  <option>Always English</option>
                </select>
              </div>
            </div>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-sm">Safety & Compliance</h3>
            <div className="space-y-3">
              {[
                { label: 'Log all sensitive actions to audit trail', enabled: true },
                { label: 'Require confirmation for modify/sensitive actions', enabled: true },
                { label: 'Block AI from accessing financial data for non-finance roles', enabled: true },
                { label: 'Auto-translate responses to user language', enabled: true },
                { label: 'Enable usage rate limiting (100 queries/user/day)', enabled: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm">{s.label}</span>
                  <div className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${s.enabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${s.enabled ? 'left-6' : 'left-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
