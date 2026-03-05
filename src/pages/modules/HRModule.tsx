import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Users, Calendar, Clock, CreditCard,
  UserPlus, FileText, CheckCircle2, XCircle,
  BarChart3, Loader2, X
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
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" type="email" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
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

export default function HRModule() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { icon: Users, label: 'Employees', path: '' },
          { icon: Clock, label: 'Attendance', path: 'attendance' },
          { icon: Calendar, label: 'Leave', path: 'leave' },
          { icon: CreditCard, label: 'Payroll', path: 'payroll' },
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
        </Routes>
      </motion.div>
    </div>
  );
}
