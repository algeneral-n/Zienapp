import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare, Send, Loader2, TicketCheck, Headphones, Bell, Database,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { API_URL } from './shared';

const ChatBuilder = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; ts: number }[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: prompt, ts: Date.now() }]);
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${API_URL}/api/ai/rare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt, mode: 'build', agentType: 'gm', language: 'ar' }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `HTTP ${res.status}`); }
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response || 'No response', ts: Date.now() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `⚠ Error: ${err.message}`, ts: Date.now() }]);
    } finally { setSending(false); }
  };

  const quickCommands = [
    { label: 'Platform Health', cmd: 'أعطني تقرير كامل عن حالة المنصة والخدمات' },
    { label: 'Debug Issues', cmd: 'ما هي المشاكل الحالية في المنصة وكيف أحلها؟' },
    { label: 'Build Service', cmd: 'أريد بناء خدمة جديدة. ما الخطوات المطلوبة؟' },
    { label: 'Security Audit', cmd: 'أجر فحص أمني شامل للمنصة وأبلغني بالنتائج' },
    { label: 'Optimize', cmd: 'كيف يمكنني تحسين أداء المنصة؟' },
    { label: 'Client Fix', cmd: 'عميل يواجه مشكلة في الوصول. ما الحل؟' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
        <MessageSquare size={20} className="text-blue-600" /> RARE Ops Chat Builder
      </h2>
      <p className="text-xs text-zinc-500">Real-time AI-powered operations. Debug, build, fix, and manage your platform directly.</p>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-2">
        {quickCommands.map((qc, i) => (
          <button key={i} onClick={() => { setInput(qc.cmd); }} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full hover:bg-blue-100 transition-all">
            {qc.label}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
              <div className="text-center">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                <p className="font-bold">RARE Ops Chat</p>
                <p className="text-xs mt-1">Ask me to build, debug, fix, or optimize anything in the platform.</p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader2 size={16} className="animate-spin text-blue-600" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Build, debug, fix... (connected to real RARE AI)"
            disabled={sending}
          />
          <button onClick={sendMessage} disabled={sending || !input.trim()} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Support & Tickets ──────────────────────────────────────────────────────

const SupportTickets = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) setTickets(data);
      } catch { /* table may not exist yet */ }
      setLoading(false);
    };
    fetchTickets();
    const channel = supabase.channel('tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const statusColor = (s: string) => {
    if (s === 'open') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (s === 'in_progress') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (s === 'resolved') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-zinc-100 text-zinc-600';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
        <TicketCheck size={20} className="text-orange-600" /> Support & Tickets
      </h2>
      <p className="text-xs text-zinc-500">Customer requests, issues, and support tickets from all tenants.</p>

      {loading ? (
        <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-zinc-400" /></div>
      ) : tickets.length > 0 ? (
        <div className="space-y-2">
          {tickets.map((t, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-start justify-between">
              <div>
                <p className="font-bold text-sm">{t.subject || `Ticket #${t.id?.slice(0, 8)}`}</p>
                <p className="text-xs text-zinc-500 mt-1">{t.description?.slice(0, 120)}...</p>
                <p className="text-[10px] text-zinc-400 mt-2">{t.email || t.user_id} — {new Date(t.created_at).toLocaleDateString('ar-SA')}</p>
              </div>
              <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${statusColor(t.status)}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center">
          <Headphones size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="font-bold text-sm text-zinc-400">No tickets yet</p>
          <p className="text-xs text-zinc-400 mt-1">When clients submit support requests, they'll appear here in real-time.</p>
        </div>
      )}
    </div>
  );
};

// ─── Voice Control ──────────────────────────────────────────────────────────


const VoiceControl = () => {
  const { t } = useTranslation();
  const [voiceConfig, setVoiceConfig] = useState<any>(null);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const loadVoice = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const hdrs = { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json', 'x-company-id': 'platform' };
        const [configRes, callsRes, analyticsRes] = await Promise.all([
          fetch(`${API_URL}/api/voice/config`, { headers: hdrs }),
          fetch(`${API_URL}/api/voice/calls`, { headers: hdrs }),
          fetch(`${API_URL}/api/voice/analytics`, { headers: hdrs }),
        ]);
        if (configRes.ok) setVoiceConfig((await configRes.json()).config);
        if (callsRes.ok) setCallLogs((await callsRes.json()).calls || []);
        if (analyticsRes.ok) setAnalytics((await analyticsRes.json()).summary);
      } catch { }
    };
    loadVoice();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Headphones className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-black">{t('voice_ai_control')}</h2>
      </div>

      {/* Voice Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('total_calls'), value: analytics.totalCalls, cls: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' },
            { label: t('completed'), value: analytics.completed, cls: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' },
            { label: t('missed'), value: analytics.missed, cls: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' },
            { label: t('avg_duration'), value: `${analytics.avgDuration}s`, cls: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' },
          ].map(s => (
            <div key={s.label} className={`${s.cls} rounded-2xl p-6 border`}>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
              <p className="text-3xl font-black">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Voice Config */}
      {voiceConfig && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold mb-4">Voice Agent Configuration</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-zinc-500">Agent Name:</span> <span className="font-bold">{voiceConfig.agent_name}</span></div>
            <div><span className="text-zinc-500">Voice ID:</span> <span className="font-mono text-xs">{voiceConfig.voice_id}</span></div>
            <div><span className="text-zinc-500">Language:</span> <span className="font-bold">{voiceConfig.language}</span></div>
            <div><span className="text-zinc-500">Max Duration:</span> <span className="font-bold">{voiceConfig.max_call_duration}s</span></div>
            <div><span className="text-zinc-500">Status:</span> <span className={`font-bold ${voiceConfig.is_active ? 'text-green-600' : 'text-red-600'}`}>{voiceConfig.is_active ? 'Active' : 'Inactive'}</span></div>
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Recent Calls ({callLogs.length})</h3>
        <div className="space-y-2">
          {callLogs.slice(0, 10).map((call: any) => (
            <div key={call.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${call.status === 'completed' ? 'bg-green-500' : call.status === 'missed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className="font-medium text-sm">{call.caller_id || 'Unknown'}</span>
                <span className="text-xs text-zinc-500">{call.direction}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>{call.duration_seconds}s</span>
                <span>{call.sentiment || '-'}</span>
                <span>{new Date(call.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {callLogs.length === 0 && <p className="text-zinc-500 text-sm">{t('no_call_logs')}</p>}
        </div>
      </div>
    </div>
  );
};

// ─── Incidents & Alerts ─────────────────────────────────────────────────────


const IncidentsAlerts = () => {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const admin = supabase;
        const { data } = await admin.from('platform_incidents').select('*').order('created_at', { ascending: false }).limit(50);
        setIncidents(data || []);
      } catch { }
      setLoading(false);
    };
    loadIncidents();
  }, []);

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'text-red-600';
      case 'investigating': return 'text-orange-600';
      case 'mitigated': return 'text-yellow-600';
      case 'resolved': case 'auto_resolved': return 'text-green-600';
      default: return 'text-zinc-500';
    }
  };

  const resolveIncident = async (id: string) => {
    await supabase.from('platform_incidents').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-black">{t('incidents_alerts')}</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('open'), value: incidents.filter(i => i.status === 'open').length, cls: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' },
          { label: t('investigating'), value: incidents.filter(i => i.status === 'investigating').length, cls: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' },
          { label: t('mitigated'), value: incidents.filter(i => i.status === 'mitigated').length, cls: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' },
          { label: t('resolved'), value: incidents.filter(i => ['resolved', 'auto_resolved'].includes(i.status)).length, cls: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' },
        ].map(s => (
          <div key={s.label} className={`${s.cls} rounded-2xl p-6 border`}>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
            <p className="text-3xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Incidents list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold mb-4">{t('recent_incidents')}</h3>
        {loading ? <p className="text-zinc-500">Loading...</p> : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${severityColor(incident.severity)}`}>{incident.severity}</span>
                    <span className={`text-xs font-bold ${statusColor(incident.status)}`}>{incident.status}</span>
                    <span className="text-xs text-zinc-500">{incident.category}</span>
                  </div>
                  <p className="font-bold text-sm">{incident.title}</p>
                  {incident.description && <p className="text-xs text-zinc-500 mt-1">{incident.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {incident.auto_fix_available && incident.status === 'open' && (
                    <button
                      onClick={() => resolveIncident(incident.id)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"
                    >{t('auto_fix')}</button>
                  )}
                  {incident.status === 'open' && (
                    <button
                      onClick={() => resolveIncident(incident.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                    >{t('resolve')}</button>
                  )}
                  <span className="text-[10px] text-zinc-500">{new Date(incident.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {incidents.length === 0 && <p className="text-zinc-500 text-sm">No incidents recorded</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Provisioning Operations ────────────────────────────────────────────────


const ProvisioningOps = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const { data } = await supabase
          .from('provisioning_jobs')
          .select('*, companies(name)')
          .order('created_at', { ascending: false })
          .limit(50);
        setJobs(data || []);
      } catch { }
      setLoading(false);
    };
    loadJobs();
  }, []);

  const retryJob = async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_URL}/api/provision/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'queued', error_message: null } : j));
    } catch { }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'done': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'queued': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-zinc-500 bg-zinc-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-black">Provisioning Operations</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: jobs.length, color: 'zinc' },
          { label: 'Queued', value: jobs.filter(j => j.status === 'queued').length, color: 'yellow' },
          { label: 'Running', value: jobs.filter(j => j.status === 'running').length, color: 'blue' },
          { label: 'Completed', value: jobs.filter(j => j.status === 'done').length, color: 'green' },
          { label: 'Failed', value: jobs.filter(j => j.status === 'error').length, color: 'red' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 dark:bg-${s.color}-950/20 rounded-2xl p-6 border border-${s.color}-200 dark:border-${s.color}-800`}>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
            <p className="text-3xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Provisioning Jobs</h3>
        {loading ? <p className="text-zinc-500">Loading...</p> : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor(job.status)}`}>{job.status}</span>
                    <span className="text-xs text-zinc-500">{job.companies?.name || job.company_id?.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span>Step: <strong>{job.current_step || '-'}</strong></span>
                    <span>Progress: <strong>{job.completed_steps}/{job.total_steps}</strong></span>
                    {/* Progress bar */}
                    <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${job.total_steps ? (job.completed_steps / job.total_steps) * 100 : 0}%` }} />
                    </div>
                  </div>
                  {job.error_message && <p className="text-xs text-red-500 mt-1">{job.error_message}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'error' && (
                    <button
                      onClick={() => retryJob(job.id)}
                      className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700"
                    >{t('retry')}</button>
                  )}
                  <span className="text-[10px] text-zinc-500">{new Date(job.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-zinc-500 text-sm">{t('no_provisioning_jobs')}</p>}
          </div>
        )}
      </div>
    </div>
  );
};


export { ChatBuilder, SupportTickets, VoiceControl, IncidentsAlerts, ProvisioningOps };
