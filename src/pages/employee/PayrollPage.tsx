import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { PlusCircle, FileText, Download, Edit, Trash2, CheckCircle2, AlertCircle, Search } from 'lucide-react';

interface Payslip {
  id: string;
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
  const [payslips, setPayslips] = useState<Payslip[]>([
    {
      id: 'ps001',
      employeeName: 'Ahmed Al-Farsi',
      month: 'January',
      year: 2026,
      baseSalary: 10000,
      allowances: 2000,
      deductions: 500,
      netSalary: 11500,
      paymentStatus: 'Paid',
      generatedAt: '2026-01-30'
    },
    {
      id: 'ps002',
      employeeName: 'Fatima Zahra',
      month: 'January',
      year: 2026,
      baseSalary: 8000,
      allowances: 1500,
      deductions: 300,
      netSalary: 9200,
      paymentStatus: 'Pending',
      generatedAt: '2026-01-30'
    }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPayslip, setCurrentPayslip] = useState<Payslip | null>(null);
  const [filter, setFilter] = useState('');

  const handleAddEditPayslip = (payslip: Payslip) => {
    if (currentPayslip) {
      setPayslips(payslips.map(p => p.id === payslip.id ? payslip : p));
    } else {
      setPayslips([...payslips, { ...payslip, id: `ps${payslips.length + 1}` }]);
    }
    setIsModalOpen(false);
    setCurrentPayslip(null);
  };

  const handleDeletePayslip = (id: string) => {
    setPayslips(payslips.filter(p => p.id !== id));
  };

  const filteredPayslips = payslips.filter(p => 
    p.employeeName.toLowerCase().includes(filter.toLowerCase()) ||
    p.month.toLowerCase().includes(filter.toLowerCase()) ||
    p.year.toString().includes(filter.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-[var(--bg-primary)] min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{language === 'ar' ? 'إدارة الرواتب' : 'Payroll Management'}</h1>

        <div className="flex justify-between items-center mb-6">
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
            {language === 'ar' ? 'إضافة كشف راتب جديد' : 'Add New Payslip'}
          </button>
        </div>

        <div className="glass-card p-6 overflow-x-auto">
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
              {filteredPayslips.map(payslip => (
                <tr key={payslip.id} className="border-t border-[var(--border-soft)] hover:bg-black/5">
                  <td className="py-3 px-4 font-medium">{payslip.employeeName}</td>
                  <td className="py-3 px-4">{payslip.month} {payslip.year}</td>
                  <td className="py-3 px-4">{payslip.baseSalary.toFixed(2)} AED</td>
                  <td className="py-3 px-4">{payslip.allowances.toFixed(2)} AED</td>
                  <td className="py-3 px-4">{payslip.deductions.toFixed(2)} AED</td>
                  <td className="py-3 px-4 font-bold">{payslip.netSalary.toFixed(2)} AED</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${payslip.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : payslip.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {payslip.paymentStatus === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                      {payslip.paymentStatus === 'Pending' && <AlertCircle className="w-3 h-3" />}
                      {language === 'ar' ? (payslip.paymentStatus === 'Paid' ? 'مدفوع' : payslip.paymentStatus === 'Pending' ? 'معلق' : 'فشل') : payslip.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    <button 
                      onClick={() => {
                        setCurrentPayslip(payslip);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                      title={language === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeletePayslip(payslip.id)}
                      className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors"
                      title={language === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                      className="p-2 rounded-full hover:bg-green-50 text-green-600 transition-colors"
                      title={language === 'ar' ? 'تحميل كشف الراتب' : 'Download Payslip'}
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <PayslipModal 
          payslip={currentPayslip}
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddEditPayslip}
          language={language}
          translate={translate}
        />
      )}
    </motion.div>
  );
}

interface PayslipModalProps {
  payslip: Payslip | null;
  onClose: () => void;
  onSave: (payslip: Payslip) => void;
  language: string;
  translate: (key: string) => string;
}

function PayslipModal({ payslip, onClose, onSave, language, translate }: PayslipModalProps) {
  const [formData, setFormData] = useState<Payslip>(payslip || {
    id: '',
    employeeName: '',
    month: '',
    year: new Date().getFullYear(),
    baseSalary: 0,
    allowances: 0,
    deductions: 0,
    netSalary: 0,
    paymentStatus: 'Pending',
    generatedAt: new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      netSalary: prev.baseSalary + prev.allowances - prev.deductions
    }));
  }, [formData.baseSalary, formData.allowances, formData.deductions]);

  const months = [
    { en: 'January', ar: 'يناير' }, { en: 'February', ar: 'فبراير' }, { en: 'March', ar: 'مارس' },
    { en: 'April', ar: 'أبريل' }, { en: 'May', ar: 'مايو' }, { en: 'June', ar: 'يونيو' },
    { en: 'July', ar: 'يوليو' }, { en: 'August', ar: 'أغسطس' }, { en: 'September', ar: 'سبتمبر' },
    { en: 'October', ar: 'أكتوبر' }, { en: 'November', ar: 'نوفمبر' }, { en: 'December', ar: 'ديسمبر' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card p-8 rounded-2xl w-full max-w-lg shadow-2xl"
      >
        <h2 className="text-2xl font-bold mb-6">{payslip ? (language === 'ar' ? 'تعديل كشف الراتب' : 'Edit Payslip') : (language === 'ar' ? 'إضافة كشف راتب' : 'Add Payslip')}</h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'اسم الموظف' : 'Employee Name'}</label>
            <input 
              type="text" 
              value={formData.employeeName}
              onChange={e => setFormData({...formData, employeeName: e.target.value})}
              className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'الشهر' : 'Month'}</label>
              <select 
                value={formData.month}
                onChange={e => setFormData({...formData, month: e.target.value})}
                className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {months.map(m => (
                  <option key={m.en} value={m.en}>{language === 'ar' ? m.ar : m.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'السنة' : 'Year'}</label>
              <input 
                type="number" 
                value={formData.year}
                onChange={e => setFormData({...formData, year: parseInt(e.target.value) || 0})}
                className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'الراتب الأساسي' : 'Base Salary'}</label>
            <input 
              type="number" 
              value={formData.baseSalary}
              onChange={e => setFormData({...formData, baseSalary: parseFloat(e.target.value) || 0})}
              className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'البدلات' : 'Allowances'}</label>
            <input 
              type="number" 
              value={formData.allowances}
              onChange={e => setFormData({...formData, allowances: parseFloat(e.target.value) || 0})}
              className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'الخصومات' : 'Deductions'}</label>
            <input 
              type="number" 
              value={formData.deductions}
              onChange={e => setFormData({...formData, deductions: parseFloat(e.target.value) || 0})}
              className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'صافي الراتب' : 'Net Salary'}</label>
            <input 
              type="text" 
              value={formData.netSalary.toFixed(2)}
              className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500 bg-black/5 cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">{language === 'ar' ? 'حالة الدفع' : 'Payment Status'}</label>
            <select 
              value={formData.paymentStatus}
              onChange={e => setFormData({...formData, paymentStatus: e.target.value as 'Paid' | 'Pending' | 'Failed'})}
              className="w-full p-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Pending">{language === 'ar' ? 'معلق' : 'Pending'}</option>
              <option value="Paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
              <option value="Failed">{language === 'ar' ? 'فشل' : 'Failed'}</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold hover:bg-black/5 transition-all"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              {language === 'ar' ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
