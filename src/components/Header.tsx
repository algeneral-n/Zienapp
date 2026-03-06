import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Globe, Moon, Sun, Monitor, LogIn, UserPlus, ArrowLeft, Menu, X, Search, LayoutDashboard, Star, CreditCard, GraduationCap, HelpCircle, Mail, MessageCircle, Calculator, Users, Truck, UserCheck, Receipt, Shield, Bot, Building2, Briefcase, FileText, Settings, BarChart3, Package } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { HeaderControls } from './HeaderControls';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/' && location.pathname !== '';
  const { language, setLanguage, mode, setMode, t: translate } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Unified Search Index ──────────────────────────────────────
  const searchItems = useMemo(() => [
    // Public Pages
    { label: translate('dashboard'), path: '/dashboard', cat: 'pages', icon: LayoutDashboard, keys: 'dashboard panel home لوحة القيادة' },
    { label: translate('features'), path: '/features', cat: 'pages', icon: Star, keys: 'features özellikler ميزات' },
    { label: translate('faq'), path: '/faq', cat: 'pages', icon: MessageCircle, keys: 'faq sss الأسئلة الشائعة' },
    { label: translate('academy'), path: '/academy', cat: 'pages', icon: GraduationCap, keys: 'academy akademi الأكاديمية' },
    { label: translate('help'), path: '/help', cat: 'pages', icon: HelpCircle, keys: 'help yardım المساعدة' },
    { label: translate('contact'), path: '/contact', cat: 'pages', icon: Mail, keys: 'contact iletişim التواصل' },
    { label: translate('pricing') || 'Pricing', path: '/pricing', cat: 'pages', icon: CreditCard, keys: 'pricing fiyatlandırma الأسعار' },
    // Modules
    { label: translate('accounting') || 'Accounting', path: '/dashboard/accounting', cat: 'modules', icon: Calculator, keys: 'accounting muhasebe المحاسبة invoices فواتير' },
    { label: translate('hr') || 'HR', path: '/dashboard/hr', cat: 'modules', icon: Users, keys: 'hr employees payroll الموظفين الرواتب' },
    { label: translate('logistics') || 'Logistics', path: '/dashboard/logistics', cat: 'modules', icon: Truck, keys: 'logistics tracking لوجستيات' },
    { label: 'CRM', path: '/dashboard/crm', cat: 'modules', icon: UserCheck, keys: 'crm clients leads عملاء' },
    { label: translate('billing') || 'Billing', path: '/dashboard/billing', cat: 'modules', icon: Receipt, keys: 'billing subscription اشتراكات فوترة' },
    { label: translate('integrations') || 'Integrations', path: '/dashboard/integrations', cat: 'modules', icon: Package, keys: 'integrations whatsapp vonage تكاملات' },
    { label: 'RARE AI', path: '/dashboard/rare', cat: 'modules', icon: Bot, keys: 'rare ai ذكاء اصطناعي' },
    // Portal
    { label: translate('employee_portal') || 'Employee Portal', path: '/employee', cat: 'portal', icon: Briefcase, keys: 'employee portal بوابة الموظف' },
    { label: translate('client_portal') || 'Client Portal', path: '/client', cat: 'portal', icon: Building2, keys: 'client portal بوابة العميل' },
    // Administration
    { label: translate('settings') || 'Settings', path: '/dashboard/settings', cat: 'admin', icon: Settings, keys: 'settings ayarlar الإعدادات' },
    { label: translate('reports') || 'Reports', path: '/dashboard/reports', cat: 'admin', icon: BarChart3, keys: 'reports raporlar التقارير' },
    { label: translate('documents') || 'Documents', path: '/dashboard/documents', cat: 'admin', icon: FileText, keys: 'documents belgeler المستندات' },
    // Auth
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

  // Close search on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
      // Ctrl+K / Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const navItems = [
    { label: translate('features'), path: '/features' },
    { label: translate('faq'), path: '/faq' },
    { label: translate('academy'), path: '/academy' },
    { label: translate('help'), path: '/help' },
    { label: translate('contact'), path: '/contact' },
  ];

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
              <img src={ASSETS.LOGO_PRIMARY} alt="Logo" className="w-24 h-24 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" {...IMAGE_PROPS} />
            </div>
          </div>
        </div>

        {/* Center: Nav Links (desktop) */}
        <div className="hidden lg:flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-5 py-3 rounded-full transition-all duration-500 border border-transparent hover:bg-brand hover:text-white hover:shadow-lg hover:shadow-brand/20 ${location.pathname === item.path ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-[var(--text-secondary)]'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 hover:bg-[var(--surface-2)] rounded-full transition-all text-[var(--text-secondary)]"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* HeaderControls (theme + language) - desktop only */}
          <div className="hidden md:block">
            <HeaderControls />
          </div>

          {/* Auth Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider hover:text-brand transition-colors text-[var(--text-secondary)]"
            >
              <LogIn className="w-4 h-4" />
              {translate('login')}
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-brand text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {translate('register')}
            </button>
          </div>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-[var(--surface-2)] rounded-full transition-all text-[var(--text-primary)]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Search Dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Backdrop */}
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
              className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[49] w-[95vw] max-w-2xl bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-2xl shadow-2xl shadow-black/20 overflow-hidden"
            >
              {/* Search Input */}
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

              {/* Results */}
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
                            onClick={() => {
                              navigate(item.path);
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all hover:bg-[var(--surface-2)] group !shadow-none !border-none ${
                              location.pathname === item.path ? 'bg-brand/10 text-brand' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            <div className={`p-2 rounded-xl transition-colors ${
                              location.pathname === item.path ? 'bg-brand/20' : 'bg-[var(--surface-2)] group-hover:bg-brand/10'
                            }`}>
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

              {/* Footer */}
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

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: language === 'ar' ? -300 : 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: language === 'ar' ? -300 : 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${language === 'ar' ? 'left-0' : 'right-0'} h-screen w-80 z-[60] bg-[var(--bg-primary)] shadow-[-20px_0_50px_rgba(0,0,0,0.15)] border-l border-[var(--border-soft)] flex flex-col pt-24 px-6`}
          >
            {/* Nav Links */}
            <div className="space-y-2 mb-8">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${location.pathname === item.path
                      ? 'bg-brand text-white shadow-lg shadow-brand/20'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="h-px bg-[var(--border-soft)] mb-6" />

            {/* Theme Controls in mobile */}
            <HeaderControls />

            <div className="h-px bg-[var(--border-soft)] my-6" />

            {/* Auth Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider border border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all"
              >
                <LogIn className="w-4 h-4" />
                {translate('login')}
              </button>
              <button
                onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider bg-brand text-white hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
              >
                <UserPlus className="w-4 h-4" />
                {translate('register')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
}
