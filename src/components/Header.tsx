import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Globe, Moon, Sun, Monitor, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/' && location.pathname !== '';
  const { language, setLanguage, mode, setMode, t: translate } = useTheme();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'pt', name: 'Português' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ur', name: 'اردو' }
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass-card rounded-none border-x-0 border-t-0 px-4 md:px-8 py-1 flex items-center justify-between backdrop-blur-2xl bg-white/80 dark:bg-black/80 shadow-2xl shadow-blue-500/5">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-black/5 rounded-full transition-all"
            title={translate('back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <img src={ASSETS.LOGO_PRIMARY} alt="Logo" className="w-24 h-24 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" {...IMAGE_PROPS} />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest">
        {[
          { label: translate('features'), path: '/features' },
          { label: 'FAQ', path: '/faq' },
          { label: 'Academy', path: '/academy' },
          { label: 'Help', path: '/help' },
          { label: 'Contact', path: '/contact' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="px-5 py-3 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-500 border border-transparent hover:shadow-lg hover:shadow-blue-600/20"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <div className="relative group">
            <button className="p-2 hover:bg-black/5 rounded-full transition-all">
              <Globe className="w-5 h-5" />
            </button>
            <div className="absolute right-0 mt-2 w-48 glass-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-96 overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-sm font-medium ${language === lang.code ? 'text-blue-600 bg-blue-50/50' : ''}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex bg-black/5 p-1 rounded-full">
            {[
              { id: 'light', icon: Sun },
              { id: 'dark', icon: Moon },
              { id: 'system', icon: Monitor }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id as any)}
                className={`p-1.5 rounded-full transition-all ${mode === t.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <t.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider hover:text-blue-600 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {translate('login')}
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {translate('register')}
          </button>
        </div>
      </div>
    </nav>
  );
}
