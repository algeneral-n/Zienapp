import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../components/ThemeProvider';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { generateRAREAnalysis, RAREAgentType } from '../services/geminiService';
import {
  Clock, Calendar, Wallet, FileText,
  CheckCircle2, AlertCircle, User, LayoutDashboard,
  BarChart3, Users, Globe2, MessageSquare,
  Map as MapIcon, Settings, LogOut, Search,
  Plus, Filter, Download, Bell, Briefcase,
  TrendingUp, ShieldCheck, Zap, Video,
  Truck, Navigation, Smartphone, Car,
  Phone, Send, Menu, X, MoreVertical, ChevronRight,
  Sparkles, Bot, BrainCircuit
} from 'lucide-react';
import PayrollPage from './employee/PayrollPage';

type Tab = 'dashboard' | 'accounting' | 'hr' | 'sales' | 'logistics' | 'chat' | 'payroll';

interface ChatMsg {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  group_id: string | null;
  message: string;
  created_at: string;
}

export default function EmployeePortal() {
  const { language, mode, t: translate } = useTheme();
  const { t } = useTranslation();
  const { company, role, membership } = useCompany();
  const { profile, user } = useAuth();
  const companyId = company?.id;

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ── Real data state ──────────────────────────────────────────────────────
  const [dashStats, setDashStats] = useState({ hours: 0, leaveBalance: 0, nextPayout: 0, activeTasks: 0 });
  const [tasks, setTasks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [accSummary, setAccSummary] = useState({ revenue: 0, expenses: 0, taxDue: 0 });
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [hrStats, setHrStats] = useState({ total: 0, attendanceRate: 0, pendingLeaves: 0 });
  const [documents, setDocuments] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [logTasks, setLogTasks] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // ── Fetch dashboard data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: att } = await supabase.from('attendance').select('check_in,check_out')
        .eq('company_id', companyId).gte('check_in', monthStart);
      let totalHrs = 0;
      (att || []).forEach((a: any) => {
        if (a.check_in && a.check_out) totalHrs += (new Date(a.check_out).getTime() - new Date(a.check_in).getTime()) / 3600000;
      });
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const { count: approvedLeaves } = await supabase.from('leave_requests').select('id', { count: 'exact', head: true })
        .eq('company_id', companyId).eq('status', 'approved').gte('start_date', yearStart);
      const leaveBalance = 30 - (approvedLeaves || 0);
      const { data: payData } = await supabase.from('payroll').select('net_salary')
        .eq('company_id', companyId).order('period_end', { ascending: false }).limit(1);
      const nextPayout = payData?.[0]?.net_salary || 0;
      const { count: taskCount } = await supabase.from('projects').select('id', { count: 'exact', head: true })
        .eq('company_id', companyId).neq('status', 'completed');
      setDashStats({ hours: Math.round(totalHrs * 10) / 10, leaveBalance, nextPayout, activeTasks: taskCount || 0 });
      const { data: projData } = await supabase.from('projects').select('name,status,start_date,end_date')
        .eq('company_id', companyId).neq('status', 'completed').order('created_at', { ascending: false }).limit(5);
      setTasks(projData || []);
    };
    load();
  }, [companyId]);

  // ── Fetch accounting data ────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId || activeTab !== 'accounting') return;
    const load = async () => {
      const { data: invData } = await supabase.from('invoices').select('*')
        .eq('company_id', companyId).order('issued_at', { ascending: false }).limit(50);
      setInvoices(invData || []);
      const paid = (invData || []).filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
      const { data: payD } = await supabase.from('payments').select('amount').eq('company_id', companyId);
      const totalPayments = (payD || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const { data: txData } = await supabase.from('tax_settings').select('*').eq('company_id', companyId).eq('is_active', true);
      setTaxRates(txData || []);
      const avgRate = txData?.length ? txData.reduce((s: number, t: any) => s + Number(t.tax_rate || 0), 0) / txData.length : 0;
      setAccSummary({ revenue: paid, expenses: totalPayments, taxDue: Math.round(paid * avgRate / 100) });
    };
    load();
  }, [companyId, activeTab]);

  // ── Fetch HR data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId || activeTab !== 'hr') return;
    const load = async () => {
      const { data: empData } = await supabase.from('employees').select('id,employee_code,job_title,status,salary_amount,department_id')
        .eq('company_id', companyId).order('created_at', { ascending: false });
      setEmployees(empData || []);
      const total = empData?.length || 0;
      const today = new Date().toISOString().slice(0, 10);
      const { count: presentToday } = await supabase.from('attendance').select('id', { count: 'exact', head: true })
        .eq('company_id', companyId).gte('check_in', today + 'T00:00:00');
      const attendanceRate = total > 0 ? Math.round(((presentToday || 0) / total) * 100) : 0;
      const { count: pendingLeaves } = await supabase.from('leave_requests').select('id', { count: 'exact', head: true })
        .eq('company_id', companyId).eq('status', 'pending');
      setHrStats({ total, attendanceRate, pendingLeaves: pendingLeaves || 0 });
      const { data: docData } = await supabase.from('company_documents').select('title,file_url,category')
        .eq('company_id', companyId).order('created_at', { ascending: false }).limit(5);
      setDocuments(docData || []);
    };
    load();
  }, [companyId, activeTab]);

  // ── Fetch logistics data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId || activeTab !== 'logistics') return;
    const load = async () => {
      const { data: vData } = await supabase.from('vehicles').select('*').eq('company_id', companyId);
      setVehicles(vData || []);
      const { data: ltData } = await supabase.from('logistics_tasks').select('*')
        .eq('company_id', companyId).order('created_at', { ascending: false }).limit(20);
      setLogTasks(ltData || []);
    };
    load();
  }, [companyId, activeTab]);

  // ── Chat: real-time ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId || activeTab !== 'chat') return;
    const load = async () => {
      const { data } = await supabase.from('chats').select('*')
        .eq('company_id', companyId).order('created_at', { ascending: true }).limit(200);
      setMessages((data || []).map((m: any) => ({ id: m.id, sender_id: m.sender_id, receiver_id: m.receiver_id, group_id: m.group_id, message: m.message, created_at: m.created_at })));
    };
    load();
    const channel = supabase
      .channel('chats-' + companyId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats', filter: `company_id=eq.${companyId}` }, (payload) => {
        const m = payload.new as any;
        setMessages(prev => [...prev, { id: m.id, sender_id: m.sender_id, receiver_id: m.receiver_id, group_id: m.group_id, message: m.message, created_at: m.created_at }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, activeTab]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !companyId || !membership) return;
    await supabase.from('chats').insert({ company_id: companyId, sender_id: membership.id, message: chatInput });
    setChatInput('');
  };

  // ── Clock In / Out ───────────────────────────────────────────────────────
  const handleClockToggle = useCallback(async () => {
    if (!companyId) return;
    const { data: emp } = await supabase.from('employees').select('id').eq('company_id', companyId).eq('member_id', membership?.id).single();
    if (!emp) return;
    if (!isClockedIn) {
      await supabase.from('attendance').insert({ company_id: companyId, employee_id: emp.id, check_in: new Date().toISOString(), status: 'present' });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const { data: rec } = await supabase.from('attendance').select('id').eq('employee_id', emp.id).gte('check_in', today + 'T00:00:00').is('check_out', null).order('check_in', { ascending: false }).limit(1);
      if (rec?.[0]) await supabase.from('attendance').update({ check_out: new Date().toISOString() }).eq('id', rec[0].id);
    }
    setIsClockedIn(!isClockedIn);
  }, [companyId, membership, isClockedIn]);

  // ── RARE AI Assistant ────────────────────────────────────────────────────
  const [isRareOpen, setIsRareOpen] = useState(false);
  const [rareQuery, setRareQuery] = useState('');
  const [rareResponse, setRareResponse] = useState('');
  const [isRareLoading, setIsRareLoading] = useState(false);

  const handleRareAsk = async () => {
    if (!rareQuery.trim()) return;
    setIsRareLoading(true);
    setRareResponse('');
    const agentType: RAREAgentType = activeTab === 'dashboard' ? 'gm' :
      activeTab === 'accounting' ? 'accounting' :
        activeTab === 'hr' ? 'hr' :
          activeTab === 'sales' ? 'sales' :
            activeTab === 'logistics' ? 'fleet' : 'secretary';
    const response = await generateRAREAnalysis(agentType, rareQuery, {
      pageCode: 'employee_portal',
      moduleCode: activeTab,
      companyName: company?.name || 'Company',
      userRole: role || 'employee',
      language,
      theme: mode,
      mode: 'analyze',
      additionalData: { activeTab }
    });
    setRareResponse(response);
    setIsRareLoading(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: t('working_hours'), value: `${dashStats.hours}h`, icon: Clock, color: 'text-blue-600', sub: t('this_month') },
                { label: t('leaves_balance'), value: `${dashStats.leaveBalance} ${t('days')}`, icon: Calendar, color: 'text-orange-600', sub: t('remaining_this_year') },
                { label: t('next_payout'), value: `AED ${dashStats.nextPayout.toLocaleString()}`, icon: Wallet, color: 'text-green-600', sub: t('latest_payroll') },
                { label: t('active_tasks'), value: String(dashStats.activeTasks), icon: CheckCircle2, color: 'text-purple-600', sub: t('open_projects') },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4 font-bold text-sm opacity-80">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    {stat.label}
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-xs font-medium mt-1 opacity-60">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{t('active_projects')}</h2>
                  </div>
                  <div className="space-y-4">
                    {tasks.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)]">{t('no_active_projects')}</p>
                    ) : tasks.map((task, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/5 rounded-xl border border-[var(--border-soft)]">
                        <div>
                          <div className="font-bold text-sm">{task.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{task.status}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md inline-block mb-1 ${task.status === 'planning' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                            {task.status}
                          </div>
                          {task.end_date && <div className="text-[10px] text-[var(--text-secondary)]">Due: {new Date(task.end_date).toLocaleDateString()}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="glass-card p-8 bg-blue-600 text-white border-0 relative overflow-hidden">
                  <h2 className="text-xl font-bold mb-4 relative z-10">{t('rare_ai_assistant')}</h2>
                  <p className="text-sm opacity-80 mb-6 relative z-10">
                    {t('rare_ai_desc')}
                  </p>
                  <button
                    onClick={() => setIsRareOpen(true)}
                    className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all relative z-10 flex items-center justify-center gap-2"
                  >
                    <Bot className="w-5 h-5" /> {t('chat_with_rare')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'accounting':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('accounting_finance')}</h2>
              <div className="flex gap-3">
                <button className="glass-card px-4 py-2 flex items-center gap-2 text-sm font-bold">
                  <Download className="w-4 h-4" /> {t('export')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 border-blue-500/20">
                <div className="text-sm font-bold text-blue-600 mb-2 uppercase tracking-wider">{t('total_revenue')}</div>
                <div className="text-3xl font-bold">AED {accSummary.revenue.toLocaleString()}</div>
                <div className="text-xs text-[var(--text-secondary)] font-bold mt-2">{t('from_paid_invoices')}</div>
              </div>
              <div className="glass-card p-6">
                <div className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wider">{t('total_payments')}</div>
                <div className="text-3xl font-bold">AED {accSummary.expenses.toLocaleString()}</div>
                <div className="text-xs text-[var(--text-secondary)] font-bold mt-2">{t('all_recorded_payments')}</div>
              </div>
              <div className="glass-card p-6">
                <div className="text-sm font-bold text-green-600 mb-2 uppercase tracking-wider">{t('estimated_tax')}</div>
                <div className="text-3xl font-bold">AED {accSummary.taxDue.toLocaleString()}</div>
                <div className="text-xs text-[var(--text-secondary)] font-bold mt-2">{taxRates.length} active tax rule{taxRates.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-[var(--border-soft)] flex items-center justify-between">
                <h3 className="font-bold">{t('recent_invoices')}</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} placeholder={t('search_invoices')} className="bg-black/5 border border-[var(--border-soft)] rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-black/5 text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="px-6 py-4">{t('invoice_num')}</th>
                    <th className="px-6 py-4">{t('amount')}</th>
                    <th className="px-6 py-4">{t('status')}</th>
                    <th className="px-6 py-4">{t('date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {invoices.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-[var(--text-secondary)]">{t('no_invoices_found')}</td></tr>
                  ) : invoices.filter(inv => !invoiceSearch || inv.invoice_number?.toLowerCase().includes(invoiceSearch.toLowerCase())).map((inv, i) => (
                    <tr key={i} className="hover:bg-black/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600">{inv.invoice_number}</td>
                      <td className="px-6 py-4 font-bold">AED {Number(inv.total_amount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-green-100 text-green-600' :
                          inv.status === 'pending' || inv.status === 'draft' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                          }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'hr':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('hr_people_ops')}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="glass-card p-6">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">{t('total_employees')}</div>
                    <div className="text-2xl font-bold">{hrStats.total}</div>
                  </div>
                  <div className="glass-card p-6">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">{t('attendance_today')}</div>
                    <div className="text-2xl font-bold">{hrStats.attendanceRate}%</div>
                  </div>
                  <div className="glass-card p-6">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">{t('pending_leave_requests')}</div>
                    <div className="text-2xl font-bold">{hrStats.pendingLeaves}</div>
                  </div>
                </div>

                <div className="glass-card p-8">
                  <h3 className="font-bold mb-6">{t('employee_directory')}</h3>
                  <div className="space-y-4">
                    {employees.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)]">{t('no_employees')}</p>
                    ) : employees.map((emp, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/5 rounded-xl border border-[var(--border-soft)]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                            {(emp.employee_code || 'E')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{emp.job_title || t('employee')}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Code: {emp.employee_code || '-'}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${emp.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                          {emp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> {t('document_vault')}
                  </h3>
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <p className="text-xs text-[var(--text-secondary)]">{t('no_documents')}</p>
                    ) : documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-black/5 rounded-lg text-xs hover:bg-black/10 transition-all cursor-pointer">
                        <span className="truncate">{doc.title}</span>
                        <Download className="w-3 h-3 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'payroll':
        return <PayrollPage />;

      case 'logistics':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('logistics_fleet')}</h2>
            </div>

            {vehicles.length === 0 && logTasks.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Truck className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                <h3 className="font-bold text-lg mb-2">{t('fleet_not_configured')}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{t('fleet_not_configured_desc')}</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card p-6">
                      <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">{t('total_vehicles')}</div>
                      <div className="text-2xl font-bold">{vehicles.length}</div>
                    </div>
                    <div className="glass-card p-6">
                      <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">{t('available')}</div>
                      <div className="text-2xl font-bold text-green-600">{vehicles.filter((v: any) => v.status === 'available').length}</div>
                    </div>
                    <div className="glass-card p-6">
                      <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">{t('active_tasks')}</div>
                      <div className="text-2xl font-bold text-blue-600">{logTasks.filter((t: any) => t.status === 'in_transit').length}</div>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-bold mb-4">{t('vehicles')}</h3>
                    <div className="space-y-3">
                      {vehicles.map((v: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-black/5 rounded-xl border border-[var(--border-soft)]">
                          <div className="flex items-center gap-3">
                            <Car className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-bold text-sm">{v.plate_number}</div>
                              <div className="text-xs text-[var(--text-secondary)]">{v.model || v.type || 'Vehicle'}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${v.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {v.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h3 className="font-bold mb-4">{t('recent_tasks')}</h3>
                    <div className="space-y-3">
                      {logTasks.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)]">{t('no_logistics_tasks')}</p>
                      ) : logTasks.slice(0, 8).map((t: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-black/5 rounded-lg border border-[var(--border-soft)]">
                          <div>
                            <div className="text-xs font-bold">{t.title}</div>
                            <div className="text-[10px] text-[var(--text-secondary)]">{t.pickup_location} → {t.delivery_location}</div>
                          </div>
                          <div className={`text-[9px] font-bold ${t.status === 'delivered' ? 'text-green-500' : t.status === 'in_transit' ? 'text-blue-500' : 'text-orange-500'}`}>
                            {t.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'chat':
        return (
          <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-6">
            {/* Chat Window */}
            <div className="flex-1 glass-card flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[var(--border-soft)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">C</div>
                  <div>
                    <div className="font-bold text-sm">{t('company_chat')}</div>
                    <div className="text-[10px] text-green-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      {t('live')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <MessageSquare className="w-12 h-12 mb-2" />
                    <p className="text-xs font-medium">{t('no_messages_yet')}</p>
                  </div>
                ) : messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender_id === membership?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.sender_id === membership?.id
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-black/5 border border-[var(--border-soft)] rounded-tl-none'
                      }`}>
                      <p>{msg.message}</p>
                      <div className={`text-[10px] mt-2 ${msg.sender_id === membership?.id ? 'text-blue-100' : 'text-[var(--text-muted)]'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-[var(--border-soft)]">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={t('type_message')}
                    className="flex-1 bg-black/5 border border-[var(--border-soft)] p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col lg:flex-row">
      {/* Sidebar - Responsive */}
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-[var(--surface-2)] border-r border-[var(--border-soft)] 
        transition-all duration-300 flex flex-col sticky top-0 h-screen z-50
        hidden lg:flex
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight hidden lg:block">{t('zien_portal')}</span>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
            { id: 'accounting', label: t('accounting'), icon: BarChart3 },
            { id: 'hr', label: t('hr_people'), icon: Users },
            { id: 'payroll', label: t('payroll'), icon: Wallet },
            { id: 'sales', label: t('sales_crm'), icon: TrendingUp },
            { id: 'logistics', label: t('logistics'), icon: Truck },
            { id: 'chat', label: t('messages'), icon: MessageSquare },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'hover:bg-black/5 text-[var(--text-secondary)]'
                }`}
            >
              <item.icon className="w-6 h-6 shrink-0" />
              {isSidebarOpen && <span className="font-bold text-sm hidden lg:block">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-soft)]">
          <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-all">
            <LogOut className="w-6 h-6 shrink-0" />
            {isSidebarOpen && <span className="font-bold text-sm hidden lg:block">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-[var(--surface-1)] border-t border-[var(--border-soft)] px-4 py-2 flex justify-around items-center z-50 backdrop-blur-xl">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'accounting', icon: BarChart3 },
          { id: 'hr', icon: Users },
          { id: 'logistics', icon: Truck },
          { id: 'chat', icon: MessageSquare },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`p-3 rounded-xl ${activeTab === item.id ? 'text-blue-600 bg-blue-600/10' : 'text-[var(--text-secondary)]'}`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <header className="h-20 bg-[var(--surface-1)] border-b border-[var(--border-soft)] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-2 hover:bg-black/5 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold capitalize">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={handleClockToggle}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${isClockedIn
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{isClockedIn ? t('clock_out') : t('clock_in')}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold">{profile?.fullName || user?.name || t('employee')}</div>
                <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{role || 'employee'}</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg" />
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RARE AI Floating Assistant */}
        <AnimatePresence>
          {isRareOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-8 w-96 glass-card shadow-2xl z-[60] flex flex-col overflow-hidden border-blue-500/30"
            >
              <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-6 h-6" />
                  <div>
                    <div className="font-bold text-sm">{t('rare_ai_assistant')}</div>
                    <div className="text-[10px] opacity-80 uppercase tracking-widest">{t('tenant_isolated_role_aware')}</div>
                  </div>
                </div>
                <button onClick={() => setIsRareOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 h-96 overflow-y-auto p-4 space-y-4 bg-white/50 backdrop-blur-sm">
                {rareResponse ? (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-900 leading-relaxed">
                    <div className="prose prose-sm max-w-none">
                      {rareResponse}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <Bot className="w-12 h-12 mb-2" />
                    <p className="text-xs font-medium">{t('rare_assist_prompt', { tab: activeTab })}</p>
                  </div>
                )}
                {isRareLoading && (
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-bold animate-pulse">
                    <Sparkles className="w-4 h-4" /> {t('rare_thinking')}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[var(--border-soft)] bg-white/80">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rareQuery}
                    onChange={(e) => setRareQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRareAsk()}
                    placeholder={t('ask_rare_anything')}
                    className="flex-1 bg-black/5 border border-[var(--border-soft)] p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={handleRareAsk}
                    disabled={isRareLoading}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
