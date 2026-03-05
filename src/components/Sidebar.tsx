import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Users, BarChart3, Truck, 
  MessageSquare, ShoppingBag, Briefcase, BrainCircuit,
  Settings, HelpCircle, GraduationCap, FileText,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { motion } from 'motion/react';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { id: 'hr', icon: Users, label: 'HR Management', path: '/dashboard/hr' },
  { id: 'accounting', icon: BarChart3, label: 'Accounting', path: '/dashboard/accounting' },
  { id: 'logistics', icon: Truck, label: 'Logistics', path: '/dashboard/logistics' },
  { id: 'crm', icon: Briefcase, label: 'CRM & Projects', path: '/dashboard/crm' },
  { id: 'store', icon: ShoppingBag, label: 'Global Store', path: '/dashboard/store' },
  { id: 'meetings', icon: MessageSquare, label: 'Meetings & Chat', path: '/dashboard/meetings' },
  { id: 'rare', icon: BrainCircuit, label: 'RARE AI', path: '/dashboard/rare' },
  { id: 'academy', icon: GraduationCap, label: 'Academy', path: '/dashboard/academy' },
  { id: 'help', icon: HelpCircle, label: 'Help Center', path: '/dashboard/help' },
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (c: boolean) => void }) {
  const { t } = useTranslation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      className="h-screen bg-[var(--bg-primary)] border-r border-[var(--border-soft)] flex flex-col sticky top-0"
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-lg">Z</div>
            <span className="text-lg font-black tracking-tighter uppercase">Zien</span>
          </div>
        )}
        {collapsed && <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-lg mx-auto">Z</div>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative
              ${isActive 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}
            `}
          >
            <item.icon size={20} className={collapsed ? 'mx-auto' : ''} />
            {!collapsed && <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all group">
          <LogOut size={20} className={collapsed ? 'mx-auto' : ''} />
          {!collapsed && <span className="text-sm font-bold uppercase tracking-tight">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
