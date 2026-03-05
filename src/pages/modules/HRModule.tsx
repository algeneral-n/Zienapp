import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  Users, Calendar, Clock, CreditCard, 
  UserPlus, FileText, CheckCircle2, XCircle,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';

// Sub-components
const EmployeeList = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Employees</h2>
      <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all">
        <UserPlus size={16} /> Add Employee
      </button>
    </div>
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
          {[
            { name: 'Ahmed Ali', role: 'Developer', dept: 'Engineering', status: 'Active' },
            { name: 'Sara Smith', role: 'Designer', dept: 'Creative', status: 'Active' },
            { name: 'John Doe', role: 'GM', dept: 'Management', status: 'Active' },
          ].map((emp, i) => (
            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">{emp.name.charAt(0)}</div>
                  <span className="text-sm font-bold">{emp.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-500">{emp.role}</td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-500">{emp.dept}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">{emp.status}</span>
              </td>
              <td className="px-6 py-4">
                <button className="text-zinc-400 hover:text-emerald-500 transition-colors">
                  <FileText size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Attendance = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-black uppercase tracking-tighter">Attendance Tracking</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Today's Presence</p>
        <p className="text-3xl font-black">94%</p>
        <div className="mt-4 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 w-[94%]" />
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Late Arrivals</p>
        <p className="text-3xl font-black">2</p>
        <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">Requires Review</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">On Leave</p>
        <p className="text-3xl font-black">4</p>
        <p className="text-[10px] text-zinc-400 font-bold mt-2 uppercase tracking-widest">Planned Today</p>
      </div>
    </div>
  </div>
);

const LeaveManagement = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-black uppercase tracking-tighter">Leave Requests</h2>
    <div className="space-y-4">
      {[
        { name: 'Ahmed Ali', type: 'Annual', days: 5, status: 'Pending' },
        { name: 'Sara Smith', type: 'Sick', days: 1, status: 'Approved' },
      ].map((req, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-lg">{req.name.charAt(0)}</div>
            <div>
              <h4 className="font-bold uppercase tracking-tight">{req.name}</h4>
              <p className="text-xs text-zinc-500 font-medium">{req.type} Leave • {req.days} Days</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {req.status === 'Pending' ? (
              <>
                <button className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                  <XCircle size={20} />
                </button>
                <button className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                  <CheckCircle2 size={20} />
                </button>
              </>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">{req.status}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Payroll = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Payroll Processing</h2>
      <button className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all">
        <CreditCard size={16} /> Run Payroll
      </button>
    </div>
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 text-center">
      <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <BarChart3 size={40} />
      </div>
      <h3 className="text-xl font-black uppercase tracking-tight mb-2">Next Payroll Cycle</h3>
      <p className="text-zinc-500 font-medium mb-8">February 2026 • 24 Employees • Estimated 145,000 AED</p>
      <div className="max-w-md mx-auto h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 w-[65%]" />
      </div>
      <p className="mt-4 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">65% of data verified</p>
    </div>
  </div>
);

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
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50'}
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
