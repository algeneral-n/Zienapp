import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3, Users, Truck, MessageSquare,
  TrendingUp, TrendingDown, Clock, AlertCircle,
  BrainCircuit, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

const StatCard = ({ title, value, change, trend, icon: Icon }: any) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
        <Icon size={20} />
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}
        </div>
      )}
    </div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{title}</p>
    <h3 className="text-2xl font-black tracking-tight">{value}</h3>
  </div>
);

export default function Overview() {
  const { company, role } = useCompany();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, employees: 0, deliveries: 0, tasks: 0 });
  const [chartData, setChartData] = useState<{ name: string; revenue: number; expenses: number }[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (!company?.id) return;
    const cid = company.id;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Fetch real stats in parallel
        const [empRes, taskRes, logRes, invRes, expRes] = await Promise.all([
          supabase.from('company_members').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('status', 'active'),
          supabase.from('projects').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('status', 'active'),
          supabase.from('logistics_tasks').select('id', { count: 'exact', head: true }).eq('company_id', cid).in('status', ['pending', 'in_transit']),
          supabase.from('invoices').select('total_amount, created_at').eq('company_id', cid).eq('status', 'paid'),
          supabase.from('invoices').select('total_amount, created_at').eq('company_id', cid).eq('type', 'expense'),
        ]);

        if (cancelled) return;

        const totalRevenue = (invRes.data ?? []).reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
        const totalExpenses = (expRes.data ?? []).reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);

        setStats({
          revenue: totalRevenue,
          employees: empRes.count ?? 0,
          deliveries: logRes.count ?? 0,
          tasks: taskRes.count ?? 0,
        });

        // Build monthly chart from real invoices
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const monthlyData: { name: string; revenue: number; expenses: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const rev = (invRes.data ?? [])
            .filter((r: any) => { const c = new Date(r.created_at); return c >= d && c <= monthEnd; })
            .reduce((s: number, r: any) => s + (Number(r.total_amount) || 0), 0);
          const exp = (expRes.data ?? [])
            .filter((r: any) => { const c = new Date(r.created_at); return c >= d && c <= monthEnd; })
            .reduce((s: number, r: any) => s + (Number(r.total_amount) || 0), 0);
          monthlyData.push({ name: months[d.getMonth()], revenue: rev, expenses: exp });
        }
        setChartData(monthlyData);

        // Build simple insights from real data
        const realInsights: string[] = [];
        if ((logRes.count ?? 0) > 0) realInsights.push(`${logRes.count} delivery tasks are pending or in transit.`);
        if ((taskRes.count ?? 0) > 5) realInsights.push(`${taskRes.count} active projects require attention.`);
        if (totalRevenue > 0 && totalExpenses > totalRevenue * 0.8) realInsights.push('Expenses are above 80% of revenue. Review cost structure.');
        if (realInsights.length === 0) realInsights.push('All systems nominal. No action items detected.');
        setInsights(realInsights);
      } catch (err) {
        console.error('Overview load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [company?.id]);

  const fmtCurrency = (n: number) => n.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' AED';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Business Overview</h1>
          <p className="text-sm text-zinc-500 font-medium">
            Welcome back, {profile?.full_name?.split(' ')[0] || role || 'User'}. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={fmtCurrency(stats.revenue)} icon={BarChart3} />
        <StatCard title="Active Employees" value={stats.employees} icon={Users} />
        <StatCard title="Pending Deliveries" value={stats.deliveries} icon={Truck} />
        <StatCard title="Active Projects" value={stats.tasks} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black uppercase tracking-tight">Revenue vs Expenses</h3>
            <span className="bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-1">
              Last 6 Months
            </span>
          </div>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={0.1} fill="#ef4444" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400 text-sm">No financial data yet</div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 text-white p-8 rounded-[40px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <BrainCircuit size={24} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 leading-tight">RARE AI Insights</h3>
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <div key={idx} className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={14} className="text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Insight</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
              Open RARE Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
