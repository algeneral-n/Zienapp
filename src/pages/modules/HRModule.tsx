import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Users, Calendar, Clock, CreditCard,
  UserPlus, FileText, CheckCircle2, XCircle,
  BarChart3, Loader2, X, Target, Building2, CalendarClock, Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCompany } from '../../contexts/CompanyContext';
import { hrService } from '../../services/hrService';
import { invitationService } from '../../services/invitationService';

// ─── Employees ──────────────────────────────────────────────────────────
const EmployeeList = () => {
  const { company } = useCompany();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'employee', full_name: '' });

  const fetchEmployees = async () => {
    if (!company?.id) return;
    try {
      const result = await hrService.listEmployees({ status: 'active' });
      setEmployees(result.data ?? []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [company?.id]);

  const handleInvite = async () => {
    if (!company?.id || !form.email) return;
    setSaving(true);
    try {
      const { error } = await invitationService.invite({
        companyId: company.id,
        email: form.email,
        role: form.role,
        invitedName: form.full_name || undefined,
        invitedBy: 'system',
      });
      if (!error) {
        setShowCreate(false);
        setForm({ email: '', role: 'employee', full_name: '' });
      }
    } catch (err) {
      console.error('Failed to invite:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Employees</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all">
          <UserPlus size={16} /> Add Employee
        </button>
      </div>

      {/* Invite Employee Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-tight">Invite Employee</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input id="emp-name" name="fullName" autoComplete="name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input id="emp-email" name="email" autoComplete="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" type="email" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <select id="emp-role" name="role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr_admin">HR Admin</option>
                <option value="accountant">Accountant</option>
              </select>
            </div>
            <button onClick={handleInvite} disabled={saving || !form.email} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">
              {saving ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Employee</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Role</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Department</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {employees.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">No employees found</td></tr>
            ) : employees.map((emp: any) => (
              <tr key={emp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                      {(emp.company_members?.profiles?.full_name ?? emp.profiles?.full_name ?? '?').charAt(0)}
                    </div>
                    <span className="text-sm font-bold">{emp.company_members?.profiles?.full_name ?? emp.profiles?.full_name ?? 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">{emp.company_members?.role || emp.role || emp.job_title}</td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">{emp.departments?.name ?? '-'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-bold uppercase tracking-widest">{emp.status}</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-zinc-400 hover:text-blue-600 transition-colors"><FileText size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Attendance ─────────────────────────────────────────────────────────
const Attendance = () => {
  const { company } = useCompany();
  const [stats, setStats] = useState({ present: 0, total: 0, late: 0, onLeave: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    const today = new Date().toISOString().slice(0, 10);
    (async () => {
      try {
        const [empResult, attResult, leaveResult] = await Promise.all([
          hrService.listEmployees({ status: 'active', limit: 1 }),
          hrService.listAttendance({ from: today, to: today, limit: 500 }),
          hrService.listLeaves({ status: 'approved' }),
        ]);
        const totalCount = empResult.total || 0;
        const presentCount = attResult.total || attResult.data.length;
        const lateCount = attResult.data.filter((a) => {
          const h = new Date(a.check_in).getHours();
          return h >= 9;
        }).length;
        const leaveCount = leaveResult.data.filter(l => l.start_date <= today && l.end_date >= today).length;
        setStats({ present: presentCount, total: totalCount, late: lateCount, onLeave: leaveCount });
      } catch (err) {
        console.error('Failed to load attendance stats:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [company?.id]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Attendance Tracking</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Today's Presence</p>
          <p className="text-3xl font-black">{pct}%</p>
          <div className="mt-4 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Late Arrivals</p>
          <p className="text-3xl font-black">{stats.late}</p>
          {stats.late > 0 && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">Requires Review</p>}
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">On Leave</p>
          <p className="text-3xl font-black">{stats.onLeave}</p>
          <p className="text-[10px] text-zinc-400 font-bold mt-2 uppercase tracking-widest">Planned Today</p>
        </div>
      </div>
    </div>
  );
};

// ─── Leave Management ───────────────────────────────────────────────────
const LeaveManagement = () => {
  const { company } = useCompany();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    (async () => {
      try {
        const result = await hrService.listLeaves({ limit: 20 });
        setRequests(result.data ?? []);
      } catch (err) {
        console.error('Failed to load leaves:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [company?.id]);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await hrService.reviewLeave(id, { status });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.error('Failed to review leave:', err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Leave Requests</h2>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm">No leave requests</div>
        ) : requests.map((req: any) => (
          <div key={req.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-lg">
                {(req.profiles?.full_name ?? '?').charAt(0)}
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-tight">{req.profiles?.full_name ?? 'Unknown'}</h4>
                <p className="text-xs text-zinc-500 font-medium">{req.leave_type} Leave - {req.days} Days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {req.status === 'pending' ? (
                <>
                  <button onClick={() => handleAction(req.id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    <XCircle size={20} />
                  </button>
                  <button onClick={() => handleAction(req.id, 'approved')} className="p-2 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                    <CheckCircle2 size={20} />
                  </button>
                </>
              ) : (
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                  }`}>{req.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Payroll ────────────────────────────────────────────────────────────
const Payroll = () => {
  const { company } = useCompany();
  const [payroll, setPayroll] = useState({ count: 0, total: 0, verified: 0 });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchPayroll = async () => {
    if (!company?.id) return;
    try {
      const [empResult, payResult] = await Promise.all([
        hrService.listEmployees({ status: 'active', limit: 1 }),
        hrService.listPayroll(),
      ]);
      const empCount = empResult.total || 0;
      const records = payResult.payroll ?? [];
      const total = records.reduce((s: number, r: any) => s + (Number(r.net_amount || r.base_salary) || 0), 0);
      const verified = records.filter((r: any) => r.status === 'verified' || r.status === 'paid').length;
      setPayroll({ count: empCount, total, verified });
    } catch (err) {
      console.error('Failed to load payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayroll(); }, [company?.id]);

  const handleRunPayroll = async () => {
    if (!company?.id) return;
    setRunning(true);
    try {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await hrService.runPayroll(period);
      await fetchPayroll();
    } catch (err) {
      console.error('Failed to run payroll:', err);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  const verifiedPct = payroll.count > 0 ? Math.round((payroll.verified / payroll.count) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Payroll Processing</h2>
        <button onClick={handleRunPayroll} disabled={running} className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
          <CreditCard size={16} /> {running ? 'Processing...' : 'Run Payroll'}
        </button>
      </div>
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 text-center">
        <div className="w-20 h-20 bg-blue-600/10 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <BarChart3 size={40} />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight mb-2">Next Payroll Cycle</h3>
        <p className="text-zinc-500 font-medium mb-8">
          {payroll.count} Employees - Estimated {payroll.total.toLocaleString()} AED
        </p>
        <div className="max-w-md mx-auto h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600" style={{ width: `${verifiedPct}%` }} />
        </div>
        <p className="mt-4 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{verifiedPct}% of data verified</p>
      </div>
    </div>
  );
};

// ─── KPIs & Goals ───────────────────────────────────────────────────
const KPIGoals = () => {
  const { company } = useCompany();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', targetValue: 100, unit: '%', dueDate: '', category: 'performance' });

  useEffect(() => {
    if (!company?.id) return;
    (async () => {
      try {
        const data = await hrService.listGoals({});
        setGoals(data || []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [company?.id]);

  const handleCreate = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      const goal = await hrService.createGoal({
        employeeId: 'all',
        title: form.title,
        description: form.description || undefined,
        targetValue: form.targetValue,
        unit: form.unit,
        dueDate: form.dueDate || undefined,
        category: form.category,
      });
      setGoals(prev => [goal, ...prev]);
      setShowCreate(false);
      setForm({ title: '', description: '', targetValue: 100, unit: '%', dueDate: '', category: 'performance' });
    } catch (err: any) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleUpdateProgress = async (id: string, currentValue: number) => {
    try {
      const updated = await hrService.updateGoal(id, { currentValue });
      setGoals(prev => prev.map(g => g.id === id ? updated : g));
    } catch { /* empty */ }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">KPIs & Goals</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-tight">Create Goal</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Goal title" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: Number(e.target.value) })} placeholder="Target" className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
                <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Unit" className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              </div>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
                {['performance', 'sales', 'quality', 'attendance', 'growth', 'custom'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={handleCreate} disabled={saving || !form.title} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Goals</p>
          <p className="text-3xl font-black">{goals.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Completed</p>
          <p className="text-3xl font-black text-emerald-600">{goals.filter(g => g.status === 'completed').length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">In Progress</p>
          <p className="text-3xl font-black text-blue-600">{goals.filter(g => g.status === 'in_progress' || g.status === 'active').length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm">No goals defined yet</div>
        ) : goals.map((g: any) => {
          const pct = g.target_value > 0 ? Math.min(100, Math.round(((g.current_value || 0) / g.target_value) * 100)) : 0;
          return (
            <div key={g.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-sm">{g.title}</h4>
                  {g.description && <p className="text-xs text-zinc-500">{g.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${g.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : g.status === 'in_progress' || g.status === 'active' ? 'bg-blue-500/10 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>{g.status}</span>
                  {g.category && <span className="text-[10px] text-zinc-400 font-bold uppercase">{g.category}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold w-24 text-right">{g.current_value || 0}/{g.target_value} {g.unit}</span>
                {g.status !== 'completed' && (
                  <input type="number" className="w-20 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs" placeholder="Update" onKeyDown={e => { if (e.key === 'Enter') handleUpdateProgress(g.id, Number((e.target as HTMLInputElement).value)); }} />
                )}
              </div>
              {g.due_date && <p className="text-[10px] text-zinc-400 mt-2">Due: {new Date(g.due_date).toLocaleDateString()}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Departments ────────────────────────────────────────────────────────
const Departments = () => {
  const { company } = useCompany();
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });

  useEffect(() => {
    if (!company?.id) return;
    (async () => {
      try {
        const data = await hrService.listDepartments();
        setDepts(data || []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [company?.id]);

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const dept = await hrService.createDepartment({ name: form.name, code: form.code || undefined });
      setDepts(prev => [...prev, dept]);
      setShowCreate(false);
      setForm({ name: '', code: '' });
    } catch (err: any) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Departments</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700">
          <Plus size={16} /> New Department
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Department name" className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Code (e.g. ENG)" className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.name} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {depts.length === 0 ? (
          <div className="col-span-full text-center py-8 text-zinc-400 text-sm">No departments created yet</div>
        ) : depts.map(d => (
          <div key={d.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center"><Building2 size={18} /></div>
              <div>
                <h4 className="font-bold text-sm">{d.name}</h4>
                {d.code && <p className="text-[10px] text-zinc-400 font-mono">{d.code}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{d.employeeCount || 0} employees</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${d.is_active !== false ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>{d.is_active !== false ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Shifts ─────────────────────────────────────────────────────────────
const Shifts = () => {
  const { company } = useCompany();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({ employeeId: '', shiftDate: '', startTime: '09:00', endTime: '17:00', breakMinutes: 60, shiftType: 'regular', notes: '' });

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!company?.id) return;
    (async () => {
      try {
        const [shiftData, empData] = await Promise.all([
          hrService.listShifts({ from: today }),
          hrService.listEmployees({ status: 'active', limit: 200 }),
        ]);
        setShifts(shiftData || []);
        setEmployees(empData.data || []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [company?.id]);

  const handleCreate = async () => {
    if (!form.employeeId || !form.shiftDate) return;
    setSaving(true);
    try {
      const shift = await hrService.createShift({
        employeeId: form.employeeId,
        shiftDate: form.shiftDate,
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: form.breakMinutes,
        shiftType: form.shiftType,
        notes: form.notes || undefined,
      });
      setShifts(prev => [shift, ...prev]);
      setShowCreate(false);
      setForm({ employeeId: '', shiftDate: '', startTime: '09:00', endTime: '17:00', breakMinutes: 60, shiftType: 'regular', notes: '' });
    } catch (err: any) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Shift Management</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700">
          <Plus size={16} /> Assign Shift
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.company_members?.profiles?.full_name || e.profiles?.full_name || e.id}</option>)}
            </select>
            <input type="date" value={form.shiftDate} onChange={e => setForm({ ...form, shiftDate: e.target.value })} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            <input type="number" value={form.breakMinutes} onChange={e => setForm({ ...form, breakMinutes: Number(e.target.value) })} placeholder="Break (min)" className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            <select value={form.shiftType} onChange={e => setForm({ ...form, shiftType: e.target.value })} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
              {['regular', 'morning', 'evening', 'night', 'overtime'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.employeeId} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">
              {saving ? 'Creating...' : 'Assign Shift'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Time</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Break</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {shifts.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">No shifts scheduled</td></tr>
            ) : shifts.map(s => (
              <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{s.shift_date}</td>
                <td className="px-6 py-4 text-xs font-bold text-blue-600 uppercase">{s.shift_type}</td>
                <td className="px-6 py-4 text-xs">{s.start_time} – {s.end_time}</td>
                <td className="px-6 py-4 text-xs text-zinc-500">{s.break_minutes} min</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function HRModule() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { icon: Users, label: 'Employees', path: '' },
          { icon: Clock, label: 'Attendance', path: 'attendance' },
          { icon: Calendar, label: 'Leave', path: 'leave' },
          { icon: CreditCard, label: 'Payroll', path: 'payroll' },
          { icon: Target, label: 'KPIs', path: 'kpis' },
          { icon: Building2, label: 'Departments', path: 'departments' },
          { icon: CalendarClock, label: 'Shifts', path: 'shifts' },
        ].map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end
            className={({ isActive }) => `
              flex items-center gap-2 px-6 py-3 rounded-2xl transition-all whitespace-nowrap
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-blue-600/50'}
            `}
          >
            <item.icon size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Routes>
          <Route path="/" element={<EmployeeList />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<LeaveManagement />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/kpis" element={<KPIGoals />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/shifts" element={<Shifts />} />
        </Routes>
      </motion.div>
    </div>
  );
}
