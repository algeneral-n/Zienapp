import React, { useState } from 'react';
import { LogIn, UserPlus, ArrowLeft, Menu as MenuIcon, X, Search, Globe, LayoutDashboard, Settings, LogOut, Building2, BarChart3, Users, Wallet, Truck, GraduationCap, Zap } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { HeaderControls } from './HeaderControls';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onNavigate: (to: string) => void;
  onLogout?: () => void;
  showBackButton?: boolean;
  user?: any;
}

export default function Header({ onNavigate, onLogout, showBackButton, user }: HeaderProps) {
  const { language, t: translate } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const publicLinks = [
    { label: translate('features'), path: '/features' },
    { label: translate('faq'), path: '/faq' },
    { label: translate('academy'), path: '/academy' },
    { label: translate('help'), path: '/help' },
    { label: translate('contact'), path: '/contact' },
  ];

  const userLinks = user?.role === 'founder' ? [
    { label: language === 'ar' ? 'إدارة الشركات' : 'Tenant Management', path: '/owner', icon: Building2 },
    { label: language === 'ar' ? 'إدارة الوحدات' : 'Modules Provisioning', path: '/owner/modules', icon: LayoutDashboard },
    { label: language === 'ar' ? 'طلبات العرض' : 'Demo Requests', path: '/owner/demos', icon: Search },
    { label: language === 'ar' ? 'بناء الذكاء الاصطناعي' : 'AI Builder', path: '/owner/ai', icon: Zap },
    { label: language === 'ar' ? 'التسويق' : 'Marketing', path: '/owner/marketing', icon: Globe },
    { label: language === 'ar' ? 'الإعدادات' : 'Settings', path: '/owner/settings', icon: Settings },
  ] : [
    { label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/portal', icon: LayoutDashboard },
    { label: language === 'ar' ? 'المحاسبة' : 'Accounting', path: '/portal/accounting', icon: BarChart3 },
    { label: language === 'ar' ? 'الموارد البشرية' : 'HR & People', path: '/portal/hr', icon: Users },
    { label: language === 'ar' ? 'الرواتب' : 'Payroll', path: '/portal/payroll', icon: Wallet },
    { label: language === 'ar' ? 'اللوجستيات' : 'Logistics', path: '/portal/logistics', icon: Truck },
    { label: language === 'ar' ? 'المركز الأكاديمي' : 'Academic Center', path: '/portal/academic', icon: GraduationCap },
    { label: language === 'ar' ? 'الإعدادات' : 'Settings', path: '/portal/settings', icon: Settings },
  ];

  const handleSearch = (type: 'google' | 'platform') => {
    if (type === 'google') {
      window.open('https://www.google.com/search?q=ZIEN+Platform', '_blank');
    } else {
      // Internal search logic could go here
      alert(language === 'ar' ? 'البحث الداخلي قيد التطوير' : 'Internal search is under development');
    }
    setIsSearchOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[var(--bg-primary)] border-b border-[var(--border-soft)] px-4 md:px-8 py-2 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <button 
            onClick={() => onNavigate('/')}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.1)]"
            title={language === 'ar' ? 'العودة' : 'Go Back'}
          >
            <ArrowLeft className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        )}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.1)]"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>

        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('/')}>
          <div className="relative">
            <div className="absolute inset-0 bg-brand blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <img src={ASSETS.LOGO_PRIMARY} alt="Logo" className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform duration-500" {...IMAGE_PROPS} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative">
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.1)]"
          >
            <Search className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {isSearchOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] p-2 flex flex-col gap-2"
              >
                <button 
                  onClick={() => handleSearch('google')}
                  className="flex items-center gap-3 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors text-sm font-bold shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                >
                  <Globe className="w-4 h-4 text-blue-500" />
                  {language === 'ar' ? 'بحث جوجل' : 'Google Search'}
                </button>
                <button 
                  onClick={() => handleSearch('platform')}
                  className="flex items-center gap-3 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors text-sm font-bold shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                >
                  <Search className="w-4 h-4 text-brand" />
                  {language === 'ar' ? 'بحث منصة زين' : 'ZIEN Platform Search'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <HeaderControls />
        </div>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <button 
                onClick={() => onNavigate('/login')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider hover:text-brand transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.1)] rounded-2xl"
              >
                <LogIn className="w-4 h-4" />
                {translate('login')}
              </button>
              <button 
                onClick={() => onNavigate('/register')}
                className="bg-brand text-white px-4 sm:px-6 py-2 sm:py-3 rounded-3xl font-bold text-xs uppercase tracking-wider hover:bg-brand-hover transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{translate('register')}</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => {
                // Handle logout logic here if needed, or navigate to profile
                onNavigate(user.role === 'founder' ? '/owner' : '/portal');
              }}
              className="bg-brand text-white px-4 sm:px-6 py-2 sm:py-3 rounded-3xl font-bold text-xs uppercase tracking-wider hover:bg-brand-hover transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 w-full md:w-80 md:left-4 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col p-4 gap-2 overflow-hidden"
          >
            {user ? (
              <>
                <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {language === 'ar' ? 'خدمات المستخدم' : 'User Services'}
                </div>
                {userLinks.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      onNavigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />
                <button
                  onClick={() => {
                    if (onLogout) onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 font-bold text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                >
                  <LogOut className="w-4 h-4" />
                  {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
                </div>
                {publicLinks.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      onNavigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className="text-left px-4 py-3 font-bold text-sm uppercase tracking-widest hover:bg-brand-light dark:hover:bg-brand-muted rounded-2xl transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                  >
                    {item.label}
                  </button>
                ))}
                
                <div className="sm:hidden h-px bg-[var(--border-soft)] my-2" />
                <button 
                  onClick={() => { onNavigate('/login'); setIsMenuOpen(false); }}
                  className="sm:hidden flex items-center gap-2 px-4 py-3 font-bold text-sm uppercase tracking-widest hover:bg-brand-light dark:hover:bg-brand-muted rounded-2xl transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                >
                  <LogIn className="w-5 h-5" />
                  {translate('login')}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
