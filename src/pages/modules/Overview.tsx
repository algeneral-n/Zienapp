import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, Users, Truck, MessageSquare, 
  TrendingUp, TrendingDown, Clock, AlertCircle,
  BrainCircuit
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, expenses: 2400 },
  { name: 'Feb', revenue: 3000, expenses: 1398 },
  { name: 'Mar', revenue: 2000, expenses: 9800 },
  { name: 'Apr', revenue: 2780, expenses: 3908 },
  { name: 'May', revenue: 1890, expenses: 4800 },
  { name: 'Jun', revenue: 2390, expenses: 3800 },
];

const StatCard = ({ title, value, change, trend, icon: Icon }: any) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
        <Icon size={20} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
        {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}
      </div>
    </div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{title}</p>
    <h3 className="text-2xl font-black tracking-tight">{value}</h3>
  </div>
);

export default function Overview() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Business Overview</h1>
          <p className="text-sm text-zinc-500 font-medium">Welcome back, John. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all">
            Export Report
          </button>
          <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all">
            Quick Action
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value="124,500 AED" change="+12.5%" trend="up" icon={BarChart3} />
        <StatCard title="Active Employees" value="42" change="+3" trend="up" icon={Users} />
        <StatCard title="Pending Deliveries" value="8" change="-2" trend="down" icon={Truck} />
        <StatCard title="Open Tasks" value="15" change="+5" trend="up" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black uppercase tracking-tight">Revenue vs Expenses</h3>
            <select className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-1">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 text-white p-8 rounded-[40px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
              <BrainCircuit size={24} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 leading-tight">RARE AI Insights</h3>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Action Required</span>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  Payroll data for 3 employees is incomplete. Complete it before the cycle ends in 2 days.
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Opportunity</span>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  Logistics efficiency is up 15%. Consider expanding your fleet to Abu Dhabi.
                </p>
              </div>
            </div>
            <button className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
              Open RARE Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
