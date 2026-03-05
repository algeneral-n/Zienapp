import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import { Language, ThemeMode } from '../types';
import { Globe, Sun, Moon, Monitor, Leaf, Palette, Check } from 'lucide-react';

const LANGUAGES = [
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

export function HeaderControls() {
  const { i18n, t } = useTranslation();
  const { theme, setTheme, variant, setVariant } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-4">
      {/* Language Switcher */}
      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <Globe size={16} />
          <span className="text-xs font-medium uppercase">{i18n.language}</span>
        </button>
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between ${i18n.language === lang.code ? 'text-emerald-500 font-semibold' : ''}`}
              >
                {lang.name}
                {i18n.language === lang.code && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Switcher Dropdown */}
      <div className="relative" ref={themeRef}>
        <button 
          onClick={() => setIsThemeOpen(!isThemeOpen)}
          className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
        >
          <Palette size={18} />
        </button>
        
        {isThemeOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden p-2">
            
            {/* Theme Variants */}
            <div className="mb-4">
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2">Theme Style</div>
              <div className="space-y-1">
                <button 
                  onClick={() => setVariant('prism' as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${variant === 'prism' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                >
                  <div className="flex items-center gap-2"><Palette size={16} /> Default (Prism)</div>
                  {variant === 'prism' && <Check size={16} />}
                </button>
                <button 
                  onClick={() => setVariant('dark-green' as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${variant === 'dark-green' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                >
                  <div className="flex items-center gap-2"><Leaf size={16} /> Dark Green</div>
                  {variant === 'dark-green' && <Check size={16} />}
                </button>
              </div>
            </div>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2"></div>

            {/* Appearance (Light/Dark) */}
            <div>
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2">Appearance</div>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setTheme(ThemeMode.LIGHT)}
                  className={`flex-1 flex justify-center p-2 rounded-md transition-all ${theme === ThemeMode.LIGHT ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                  title="Light"
                >
                  <Sun size={16} />
                </button>
                <button
                  onClick={() => setTheme(ThemeMode.DARK)}
                  className={`flex-1 flex justify-center p-2 rounded-md transition-all ${theme === ThemeMode.DARK ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}
                  title="Dark"
                >
                  <Moon size={16} />
                </button>
                <button
                  onClick={() => setTheme(ThemeMode.SYSTEM)}
                  className={`flex-1 flex justify-center p-2 rounded-md transition-all ${theme === ThemeMode.SYSTEM ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400'}`}
                  title="System"
                >
                  <Monitor size={16} />
                </button>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
