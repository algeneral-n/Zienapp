import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import {
  PlusCircle, FileText, Download, Edit, Trash2,
  CheckCircle2, AlertCircle, Search, Loader2, DollarSign, Users, TrendingDown,
} from 'lucide-react';

interface Payslip {
  id: string;
  employee_id: string;
  employeeName: string;
  month: string;
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  generatedAt: string;
}

export default function PayrollPage() {
  const { language, t: translate } = useTheme();
  const { company } = useCompany();
  const companyId = company?.id;

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPayslip, setCurrentPayslip] = useState<Payslip | null>(null);
  const [filter, setFilter] = useState('');
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);

  // Fetch payslips from Supabase
  const fetchPayslips = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // Try payroll table first, fallback to company_members based data
      const { data: payrollData, error: payErr } = await supabase
        .from('payroll')
        .select('*, profiles(full_name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (!payErr && payrollData && payrollData.length > 0) {
        setPayslips(payrollData.map((p: any) => ({
          id: p.id,
          employee_id: p.employee_id,
          employeeName: p.profiles?.full_name || p.employee_name || '—',
          month: p.month || new Date(p.pay_period_start || p.created_at).toLocaleString('en', { month: 'long' }),
          year: p.year || new Date(p.pay_period_start || p.created_at).getFullYear(),
          baseSalary: p.base_salary || 0,
          allowances: p.allowances || 0,
          deductions: p.deductions || 0,
          netSalary: p.net_salary || (p.base_salary + p.allowances - p.deductions) || 0,
          paymentStatus: p.status === 'paid' ? 'Paid' : p.status === 'failed' ? 'Failed' : 'Pending',
          generatedAt: p.created_at,
        })));
      } else {
        // Build payslip-like data from company_members + profiles
        const { data: members } = await supabase
          .from('company_members')
          .select('id, user_id, role, salary, profiles(full_name)')
          .eq('company_id', companyId)
          .eq('status', 'active');

        if (members) {
          setPayslips(members.map((m: any) => ({
            id: m.id,
            employee_id: m.user_id,
            employeeName: m.profiles?.full_name || '—',
            month: new Date().toLocaleString('en', { month: 'long' }),
            year: new Date().getFullYear(),
            baseSalary: m.salary || 0,
            allowances: 0,
            deductions: 0,
            netSalary: m.salary || 0,
            paymentStatus: 'Pending',
            generatedAt: new Date().toISOString(),
          })));
        }
      }
    } catch (err) {
      console.error('Payroll fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from('company_members')
      .select('user_id, profiles(full_name)')
      .eq('company_id', companyId)
      .eq('status', 'active');
    if (data) {
      setEmployees(data.map((m: any) => ({ id: m.user_id, name: m.profiles?.full_name || '—' })));
    }
  };

  useEffect(() => { fetchPayslips(); fetchEmployees(); }, [companyId]);

  const handleSavePayslip = async (payslip: Payslip) => {
    if (!companyId) return;
    try {
      if (currentPayslip) {
        // Update existing
        await supabase.from('payroll').update({
          employee_name: payslip.employeeName,
          month: payslip.month,
          year: payslip.year,
          base_salary: payslip.baseSalary,
          allowances: payslip.allowances,
          deductions: payslip.deductions,
          net_salary: payslip.netSalary,
          status: payslip.paymentStatus.toLowerCase(),
        }).eq('id', payslip.id);
      } else {
        // Insert new
        await supabase.from('payroll').insert({
          company_id: companyId,
          employee_id: payslip.employee_id || null,
          employee_name: payslip.employeeName,
          month: payslip.month,
          year: payslip.year,
          base_salary: payslip.baseSalary,
          allowances: payslip.allowances,
          deductions: payslip.deductions,
          net_salary: payslip.netSalary,
          status: payslip.paymentStatus.toLowerCase(),
        });
      }
      fetchPayslips();
    } catch (err) {
      console.error('Payroll save error:', err);
    }
    setIsModalOpen(false);
    setCurrentPayslip(null);
  };

  const handleDeletePayslip = async (id: string) => {
    await supabase.from('payroll').delete().eq('id', id);
    fetchPayslips();
  };

  const filteredPayslips = payslips.filter(p =>
    p.employeeName.toLowerCase().includes(filter.toLowerCase()) ||
    p.month.toLowerCase().includes(filter.toLowerCase()) ||
    p.year.toString().includes(filter.toLowerCase())
  );

  // Summary stats
  const totalBase = payslips.reduce((s, p) => s + p.baseSalary, 0);
  const totalNet = payslips.reduce((s, p) => s + p.netSalary, 0);
  const totalDeductions = payslips.reduce((s, p) => s + p.deductions, 0);
  const paidCount = payslips.filter(p => p.paymentStatus === 'Paid').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">{language === 'ar' ? 'إدارة الرواتب' : 'Payroll Management'}</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: language === 'ar' ? 'إجمالي الرواتب' : 'Total Salary', value: `${totalBase.toLocaleString()} AED`, icon: DollarSign, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
            { label: language === 'ar' ? 'صافي المدفوعات' : 'Net Pay', value: `${totalNet.toLocaleString()} AED`, icon: TrendingDown, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
            { label: language === 'ar' ? 'الخصومات' : 'Deductions', value: `${totalDeductions.toLocaleString()} AED`, icon: AlertCircle, color: 'text-red-500 bg-red-50 dark:bg-red-500/10' },
            { label: language === 'ar' ? 'موظفين' : 'Employees', value: `${payslips.length} (${paidCount} ${language === 'ar' ? 'مدفوع' : 'paid'})`, icon: Users, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
          ].map(s => (
            <div key={s.label} className="glass-card p-5 rounded-2xl">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.color}`}><s.icon size={16} /></div>
              <div className="text-lg font-black">{s.value}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث عن كشوف الرواتب...' : 'Search payslips...'}
              className="pl-10 p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setCurrentPayslip(null); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
          >
            <PlusCircle className="w-5 h-5" />
            {language === 'ar' ? 'إضافة كشف راتب' : 'Add Payslip'}
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
        ) : (
          <div className="glass-card p-6 overflow-x-auto rounded-2xl">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="text-[var(--text-secondary)] uppercase text-sm">
                  <th className="py-3 px-4">{language === 'ar' ? 'الموظف' : 'Employee'}</th>
                  <th className="py-3 px-4">{language === 'ar' ? 'الشهر/السنة' : 'Month/Year'}</th>
                  <th className="py-3 px-4">{language === 'ar' ? 'الراتب الأساسي' : 'Base Salary'}</th>
                  <th className="py-3 px-4">{language === 'ar' ? 'البدلات' : 'Allowances'}</th>
                  <th className="py-3 px-4">{language === 'ar' ? 'الخصومات' : 'Deductions'}</th>
                  <th className="py-3 px-4">{language === 'ar' ? 'صافي الراتب' : 'Net Salary'}</th>
                  <th className="py-3 px-4">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-zinc-400">{language === 'ar' ? 'لا توجد كشوف رواتب' : 'No payslips found'}</td></tr>
                ) : filteredPayslips.map(payslip => (
                  <tr key={payslip.id} className="border-t border-[var(--border-soft)] hover:bg-black/5 transition-colors">
                    <td className="py-3 px-4 font-medium">{payslip.employeeName}</td>
                    <td className="py-3 px-4">{payslip.month} {payslip.year}</td>
                    <td className="py-3 px-4">{payslip.baseSalary.toFixed(2)} AED</td>
                    <td className="py-3 px-4">{payslip.allowances.toFixed(2)} AED</td>
                    <td className="py-3 px-4">{payslip.deductions.toFixed(2)} AED</td>
                    <td className="py-3 px-4 font-bold">{payslip.netSalary.toFixed(2)} AED</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${payslip.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : payslip.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                        {payslip.paymentStatus === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                        {payslip.paymentStatus === 'Pending' && <AlertCircle className="w-3 h-3" />}
                        {language === 'ar' ? (payslip.paymentStatus === 'Paid' ? 'مدفوع' : payslip.paymentStatus === 'Pending' ? 'معلق' : 'فشل') : payslip.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button onClick={() => { setCurrentPayslip(payslip); setIsModalOpen(true); }} className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors" title={language === 'ar' ? 'تعديل' : 'Edit'}><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeletePayslip(payslip.id)} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 transition-colors" title={language === 'ar' ? 'حذف' : 'Delete'}><Trash2 className="w-5 h-5" /></button>
                      <button className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-500/10 text-green-600 transition-colors" title={language === 'ar' ? 'تحميل' : 'Download'}><Download className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <PayslipModal
          payslip={currentPayslip}
          employees={employees}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePayslip}
          language={language}
        />
      )}
    </motion.div>
  );
}

// ─── Payslip Modal ──────────────────────────────────────────────────────────

interface PayslipModalProps {
  payslip: Payslip | null;
  employees: { id: string; name: string }[];
  onClose: () => void;
  onSave: (payslip: Payslip) => void;
  language: string;
}

function PayslipModal({ payslip, employees, onClose, onSave, language }: PayslipModalProps) {
  const [formData, setFormData] = useState<Payslip>(payslip || {
    id: '',
    employee_id: '',
    employeeName: '',
    month: '',
    year: new Date().getFullYear(),
    baseSalary: 0,
    allowances: 0,
    deductions: 0,
    netSalary: 0,
    paymentStatus: 'Pending',
    generatedAt: new Date().toISOString().split('T')[0],
  });

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      netSalary: prev.baseSalary + prev.allowances - prev.deductions,
    }));
  }, [formData.baseSalary, formData.allowances, formData.deductions]);

  const months = [
    { en: 'January', ar: 'يناير' }, { en: 'February', ar: 'فبراير' }, { en: 'March', ar: 'مارس' },
    { en: 'April', ar: 'أبريل' }, { en: 'May', ar: 'مايو' }, { en: 'June', ar: 'يونيو' },
    { en: 'July', ar: 'يوليو' }, { en: 'August', ar: 'أغسطس' }, { en: 'September', ar: 'سبتمبر' },
    { en: 'October', ar: 'أكتوبر' }, { en: 'November', ar: 'نوفمبر' }, { en: 'December', ar: 'ديسمبر' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card p-8 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{payslip ? (language === 'ar' ? 'تعديل كشف الراتب' : 'Edit Payslip') : (language === 'ar' ? 'إضافة كشف راتب' : 'Add Payslip')}</h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'الموظف' : 'Employee'}</label>
            {employees.length > 0 ? (
              <select
                value={formData.employee_id}
                onChange={e => {
                  const emp = employees.find(em => em.id === e.target.value);
                  setFormData({ ...formData, employee_id: e.target.value, employeeName: emp?.name || '' });
                }}
                className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === 'ar' ? 'اختر موظف' : 'Select employee'}</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            ) : (
              <input type="text" value={formData.employeeName} onChange={e => setFormData({ ...formData, employeeName: e.target.value })} className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500" required />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'الشهر' : 'Month'}</label>
              <select value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>
                {months.map(m => <option key={m.en} value={m.en}>{language === 'ar' ? m.ar : m.en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'السنة' : 'Year'}</label>
              <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })} className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'الراتب الأساسي' : 'Base Salary'}</label>
            <input type="number" value={formData.baseSalary} onChange={e => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })} className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'البدلات' : 'Allowances'}</label>
            <input type="number" value={formData.allowances} onChange={e => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })} className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'الخصومات' : 'Deductions'}</label>
            <input type="number" value={formData.deductions} onChange={e => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })} className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'صافي الراتب' : 'Net Salary'}</label>
            <input type="text" value={formData.netSalary.toFixed(2)} className="w-full p-3 rounded-xl glass-card outline-none bg-black/5 cursor-not-allowed" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'حالة الدفع' : 'Payment Status'}</label>
            <select value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as 'Paid' | 'Pending' | 'Failed' })} className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="Pending">{language === 'ar' ? 'معلق' : 'Pending'}</option>
              <option value="Paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
              <option value="Failed">{language === 'ar' ? 'فشل' : 'Failed'}</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold hover:bg-black/5 transition-all">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg">{language === 'ar' ? 'حفظ' : 'Save'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
