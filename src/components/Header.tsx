import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn, UserPlus, ArrowLeft, Menu, X, Search,
  LayoutDashboard, Star, CreditCard, GraduationCap, HelpCircle, Mail, MessageCircle,
  Calculator, Users, Truck, UserCheck, Receipt, Bot, Building2, Briefcase, FileText,
  Settings, BarChart3, Package, User, Lock, LogOut, Plug, Phone, BookOpen, Globe2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { HeaderControls } from './HeaderControls';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/' && location.pathname !== '' && !['/dashboard', '/login', '/register', '/employee', '/client'].includes(location.pathname) && !location.pathname.startsWith('/integrations');
  const { language, t: translate } = useTheme();
  const { user, profile, signOut } = useAuth();
  const isLoggedIn = !!user;
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // -- Unified Search Index --
  const searchItems = useMemo(() => [
    { label: translate('dashboard'), path: '/dashboard', cat: 'pages', icon: LayoutDashboard, keys: 'dashboard panel home لوحة القيادة' },
    { label: translate('features'), path: '/features', cat: 'pages', icon: Star, keys: 'features özellikler ميزات' },
    { label: translate('faq'), path: '/faq', cat: 'pages', icon: MessageCircle, keys: 'faq sss الأسئلة الشائعة' },
    { label: translate('academy'), path: '/academy', cat: 'pages', icon: GraduationCap, keys: 'academy akademi الأكاديمية' },
    { label: translate('help'), path: '/help', cat: 'pages', icon: HelpCircle, keys: 'help yardım المساعدة' },
    { label: translate('contact'), path: '/contact', cat: 'pages', icon: Mail, keys: 'contact iletişim التواصل' },
    { label: translate('pricing') || 'Pricing', path: '/pricing', cat: 'pages', icon: CreditCard, keys: 'pricing fiyatlandırma الأسعار' },
    { label: translate('integrations') || 'Integrations', path: '/integrations', cat: 'pages', icon: Plug, keys: 'integrations تكاملات entegrasyonlar' },
    { label: translate('accounting') || 'Accounting', path: '/dashboard/accounting', cat: 'modules', icon: Calculator, keys: 'accounting muhasebe المحاسبة invoices فواتير' },
    { label: translate('hr') || 'HR', path: '/dashboard/hr', cat: 'modules', icon: Users, keys: 'hr employees payroll الموظفين الرواتب' },
    { label: translate('logistics') || 'Logistics', path: '/dashboard/logistics', cat: 'modules', icon: Truck, keys: 'logistics tracking لوجستيات' },
    { label: 'CRM', path: '/dashboard/crm', cat: 'modules', icon: UserCheck, keys: 'crm clients leads عملاء' },
    { label: translate('billing') || 'Billing', path: '/dashboard/billing', cat: 'modules', icon: Receipt, keys: 'billing subscription اشتراكات فوترة' },
    { label: translate('integrations') || 'Integrations', path: '/dashboard/integrations', cat: 'modules', icon: Package, keys: 'integrations whatsapp vonage تكاملات' },
    { label: 'RARE AI', path: '/dashboard/rare', cat: 'modules', icon: Bot, keys: 'rare ai ذكاء اصطناعي' },
    { label: translate('employee_portal') || 'Employee Portal', path: '/employee', cat: 'portal', icon: Briefcase, keys: 'employee portal بوابة الموظف' },
    { label: translate('client_portal') || 'Client Portal', path: '/client', cat: 'portal', icon: Building2, keys: 'client portal بوابة العميل' },
    { label: translate('settings') || 'Settings', path: '/dashboard/settings', cat: 'admin', icon: Settings, keys: 'settings ayarlar الإعدادات' },
    { label: translate('reports') || 'Reports', path: '/dashboard/reports', cat: 'admin', icon: BarChart3, keys: 'reports raporlar التقارير' },
    { label: translate('documents') || 'Documents', path: '/dashboard/documents', cat: 'admin', icon: FileText, keys: 'documents belgeler المستندات' },
    { label: translate('login'), path: '/login', cat: 'auth', icon: LogIn, keys: 'login giriş تسجيل الدخول' },
    { label: translate('register'), path: '/register', cat: 'auth', icon: UserPlus, keys: 'register kayıt تسجيل حساب' },
  ], [translate]);

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchItems;
    return searchItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.path.toLowerCase().includes(q) ||
      item.keys.toLowerCase().includes(q)
    );
  }, [searchQuery, searchItems]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof filteredResults> = {};
    filteredResults.forEach(item => {
      if (!groups[item.cat]) groups[item.cat] = [];
      groups[item.cat].push(item);
    });
    return groups;
  }, [filteredResults]);

  const catLabels: Record<string, string> = {
    pages: translate('pages') || 'Pages',
    modules: translate('modules') || 'Modules',
    portal: translate('portals') || 'Portals',
    admin: translate('administration') || 'Administration',
    auth: translate('authentication') || 'Authentication',
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setMenuOpen(false); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // -- Smart Menu Items --
  const publicMenuItems = [
    { label: translate('features'), path: '/features', icon: Star },
    { label: translate('integrations') || 'Integrations', path: '/integrations', icon: Plug },
    { label: translate('faq'), path: '/faq', icon: MessageCircle },
    { label: translate('academy'), path: '/academy', icon: BookOpen },
    { label: translate('help'), path: '/help', icon: HelpCircle },
    { label: translate('contact'), path: '/contact', icon: Phone },
    { label: translate('industries') || 'Industries', path: '/industries', icon: Globe2 },
  ];

  const loggedInMenuItems = [
    { label: translate('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: translate('accounting') || 'Accounting', path: '/dashboard/accounting', icon: Calculator },
    { label: translate('hr') || 'HR', path: '/dashboard/hr', icon: Users },
    { label: translate('billing') || 'Billing', path: '/dashboard/billing', icon: Receipt },
    { label: translate('integrations') || 'Integrations', path: '/dashboard/integrations', icon: Package },
    { label: 'CRM', path: '/dashboard/crm', icon: UserCheck },
    { label: translate('logistics') || 'Logistics', path: '/dashboard/logistics', icon: Truck },
    { label: 'RARE AI', path: '/dashboard/rare', icon: Bot },
    { label: translate('reports') || 'Reports', path: '/dashboard/reports', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass-card !rounded-none !border-x-0 !border-t-0 px-4 md:px-8 py-1 flex items-center justify-between backdrop-blur-2xl bg-[var(--bg-primary)]/80 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        {/* Left: Logo + Back */}
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-[var(--surface-2)] rounded-full transition-all"
              title={translate('back')}
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="absolute inset-0 bg-brand blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <img src={ASSETS.LOGO_PRIMARY} alt="Logo" className="w-10 h-10 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" {...IMAGE_PROPS} />
            </div>
          </div>
        </div>

        {/* Right: Search + HeaderControls + Smart Menu */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 hover:bg-[var(--surface-2)] rounded-full transition-all text-[var(--text-secondary)]"
          >
            <Search className="w-5 h-5" />
          </button>

          <div className="hidden md:block">
            <HeaderControls />
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-[var(--surface-2)] rounded-full transition-all text-[var(--text-primary)]"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Search Dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 z-[48] bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="fixed top-[56px] left-1/2 -translate-x-1/2 z-[49] w-[95vw] max-w-2xl bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-2xl shadow-2xl shadow-black/20 overflow-hidden"
            >
              <div className="relative border-b border-[var(--border-soft)]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={translate('search_placeholder') || 'Search ZIEN Platform... (Ctrl+K)'}
                  className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] !shadow-none !rounded-none !border-none"
                  autoFocus
                />
                <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-1 rounded-md !shadow-none">ESC</kbd>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredResults.length === 0 ? (
                  <div className="py-12 text-center text-[var(--text-muted)]">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold">{translate('no_results') || 'No results found'}</p>
                    <p className="text-sm mt-1 opacity-60">{translate('try_different_search') || 'Try a different search term'}</p>
                  </div>
                ) : (
                  Object.entries(groupedResults).map(([cat, items]) => (
                    <div key={cat} className="mb-2">
                      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        {catLabels[cat] || cat}
                      </div>
                      {items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setSearchOpen(false); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all hover:bg-[var(--surface-2)] group !shadow-none !border-none ${location.pathname === item.path ? 'bg-brand/10 text-brand' : 'text-[var(--text-primary)]'}`}
                          >
                            <div className={`p-2 rounded-xl transition-colors ${location.pathname === item.path ? 'bg-brand/20' : 'bg-[var(--surface-2)] group-hover:bg-brand/10'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm truncate">{item.label}</div>
                              <div className="text-xs text-[var(--text-muted)] truncate">{item.path}</div>
                            </div>
                            <ArrowLeft className={`w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity ${language === 'ar' ? '' : 'rotate-180'}`} />
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-[var(--border-soft)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                <span>ZIEN Unified Search</span>
                <div className="flex items-center gap-3">
                  <span><kbd className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded !shadow-none">↑↓</kbd> {translate('navigate') || 'Navigate'}</span>
                  <span><kbd className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded !shadow-none">↵</kbd> {translate('open') || 'Open'}</span>
                  <span><kbd className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded !shadow-none">Esc</kbd> {translate('close') || 'Close'}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Smart Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: language === 'ar' ? -300 : 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: language === 'ar' ? -300 : 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${language === 'ar' ? 'left-0' : 'right-0'} h-screen w-80 z-[60] bg-[var(--bg-primary)] shadow-[-20px_0_50px_rgba(0,0,0,0.15)] border-l border-[var(--border-soft)] flex flex-col pt-16 px-6 overflow-y-auto`}
          >
            {/* User Profile Section */}
            {isLoggedIn && profile && (
              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-[var(--surface-2)]">
                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-lg overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    (profile.fullName || profile.email || '?')[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[var(--text-primary)] truncate">{profile.fullName || profile.email}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{profile.platformRole}</div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-1 mb-6">
              {(isLoggedIn ? loggedInMenuItems : publicMenuItems).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? 'bg-brand text-white shadow-lg shadow-brand/20'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                      }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-[var(--border-soft)] mb-4" />

            <HeaderControls />

            <div className="h-px bg-[var(--border-soft)] my-4" />

            {/* Bottom Actions */}
            <div className="space-y-2 pb-8">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => { navigate('/dashboard/settings'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all"
                  >
                    <User className="w-5 h-5" />
                    {translate('profile_settings') || 'Profile Settings'}
                  </button>
                  <button
                    onClick={() => { navigate('/dashboard/settings'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all"
                  >
                    <Lock className="w-5 h-5" />
                    {translate('change_password') || 'Change Password'}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    {translate('logout') || 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { navigate('/login'); setMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider border border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    {translate('login')}
                  </button>
                  <button
                    onClick={() => { navigate('/register'); setMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider bg-brand text-white hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
                  >
                    <UserPlus className="w-4 h-4" />
                    {translate('register')}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
}
