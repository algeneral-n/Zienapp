import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import {
  LayoutDashboard, Users, BarChart3, Truck,
  MessageSquare, ShoppingBag, Briefcase, BrainCircuit,
  Settings, HelpCircle, GraduationCap, FileText,
  ChevronLeft, ChevronRight, LogOut, FolderKanban, Plug, PanelLeft, CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCompany } from '../contexts/CompanyContext';
import { getRoleLevel, MODULE_ACCESS } from '../lib/permissions';

type MenuItem = {
  id: string;
  icon: React.ElementType;
  label: string;
  path: string;
  moduleCode: string; // key into MODULE_ACCESS
};

// Label keys resolved via t() at render time
const menuItems: (Omit<MenuItem, 'label'> & { labelKey: string })[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'nav_dashboard', path: '/dashboard', moduleCode: 'dashboard' },
  { id: 'hr', icon: Users, labelKey: 'nav_hr', path: '/dashboard/hr', moduleCode: 'hr' },
  { id: 'accounting', icon: BarChart3, labelKey: 'nav_accounting', path: '/dashboard/accounting', moduleCode: 'accounting' },
  { id: 'logistics', icon: Truck, labelKey: 'nav_logistics', path: '/dashboard/logistics', moduleCode: 'logistics' },
  { id: 'crm', icon: Briefcase, labelKey: 'nav_crm', path: '/dashboard/crm', moduleCode: 'crm' },
  { id: 'projects', icon: FolderKanban, labelKey: 'nav_projects', path: '/dashboard/projects', moduleCode: 'projects' },
  { id: 'store', icon: ShoppingBag, labelKey: 'nav_store', path: '/dashboard/store', moduleCode: 'store' },
  { id: 'meetings', icon: MessageSquare, labelKey: 'nav_meetings', path: '/dashboard/meetings', moduleCode: 'meetings' },
  { id: 'rare', icon: BrainCircuit, labelKey: 'nav_rare', path: '/dashboard/rare', moduleCode: 'rare' },
  { id: 'integrations', icon: Plug, labelKey: 'nav_integrations', path: '/dashboard/integrations', moduleCode: 'integrations' },
  { id: 'portal-builder', icon: PanelLeft, labelKey: 'nav_portal_builder', path: '/dashboard/portal-builder', moduleCode: 'portal_builder' },
  { id: 'billing', icon: CreditCard, labelKey: 'nav_billing', path: '/dashboard/billing', moduleCode: 'dashboard' },
  { id: 'academy', icon: GraduationCap, labelKey: 'nav_academy', path: '/dashboard/academy', moduleCode: 'academy' },
  { id: 'help', icon: HelpCircle, labelKey: 'nav_help', path: '/dashboard/help', moduleCode: 'help' },
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (c: boolean) => void }) {
  const { t } = useTranslation();
  const { role } = useCompany();

  // Unified permission check from shared permission resolver
  const userLevel = getRoleLevel(role);
  const visibleItems = menuItems.filter(item => {
    const mod = MODULE_ACCESS[item.moduleCode];
    return mod ? userLevel >= mod.read : false;
  }).map(item => ({ ...item, label: t(item.labelKey) }));

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      className="h-screen bg-[var(--bg-primary)] border-r border-[var(--border-soft)] flex flex-col sticky top-0 shadow-[4px_0_20px_rgba(0,0,0,0.05)]"
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={ASSETS.LOGO_PRIMARY} alt="ZIEN Platform" className="h-12 object-contain" {...IMAGE_PROPS} />
          </div>
        )}
        {collapsed && <img src={ASSETS.LOGO_ICON} alt="Z" className="w-10 h-10 mx-auto object-contain" {...IMAGE_PROPS} />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors text-[var(--text-muted)]"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {visibleItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative
              ${isActive
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'}
            `}
          >
            <item.icon size={20} className={collapsed ? 'mx-auto' : ''} />
            {!collapsed && <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-[var(--surface-1)] text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-xl border border-[var(--border-soft)] opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border-soft)]">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all group">
          <LogOut size={20} className={collapsed ? 'mx-auto' : ''} />
          {!collapsed && <span className="text-sm font-bold uppercase tracking-tight">{t('logout')}</span>}
        </button>
      </div>
    </motion.aside>
  );
}
