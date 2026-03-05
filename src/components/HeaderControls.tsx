import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import { LANGUAGES } from '../types';
import { Globe, Sun, Moon, Monitor } from 'lucide-react';

export function HeaderControls() {
  const { i18n, t } = useTranslation();
  const { theme, setTheme } = useTheme();

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
                className={`w-full text-left px-4 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${i18n.language === lang.code ? 'text-blue-600 font-semibold' : ''}`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Switcher */}
      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
        <button
          onClick={() => setTheme('light')}
          className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          <Sun size={14} />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}
        >
          <Moon size={14} />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`p-1.5 rounded-full transition-all ${theme === 'system' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400'}`}
        >
          <Monitor size={14} />
        </button>
      </div>
    </div>
  );
}
