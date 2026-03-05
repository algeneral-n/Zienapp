import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Globe, Moon, Sun, Monitor, LogIn, UserPlus, ArrowLeft, Menu, X, Search } from 'lucide-react';
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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[72px] left-0 right-0 z-[49] px-4 md:px-8 py-4 bg-[var(--bg-primary)] border-b border-[var(--border-soft)] shadow-xl"
          >
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translate('search_placeholder') || 'Search ZIEN Platform...'}
                className="w-full pl-12 pr-4 py-4 bg-[var(--surface-2)] border border-[var(--border-soft)] rounded-2xl outline-none focus:ring-2 focus:ring-brand/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                autoFocus
              />
            </div>
          </motion.div>
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
