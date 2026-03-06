import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import { LANGUAGES } from '../types';
import { Globe, Sun, Moon, Monitor, Leaf, Palette, Check } from 'lucide-react';

export function HeaderControls() {
  const { i18n, t } = useTranslation();
  const { theme, setTheme, variant, setVariant, setLanguage } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 w-full md:w-auto">
      {/* Language Switcher */}
      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-soft)] hover:bg-[var(--surface-2)] transition-colors text-[var(--text-primary)]">
          <Globe size={16} />
          <span className="text-xs font-medium uppercase">{i18n.language}</span>
        </button>
        <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 w-48 bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[70] overflow-hidden max-h-[50vh]">
          <div className="max-h-64 overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setLanguage(lang.code as any); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between text-[var(--text-primary)] ${i18n.language === lang.code ? 'text-brand font-semibold' : ''}`}
              >
                {lang.name}
                {i18n.language === lang.code && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Switcher — Inline (no dropdown overflow) */}
      <div ref={themeRef}>
        <button
          onClick={() => setIsThemeOpen(!isThemeOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-soft)] hover:bg-[var(--surface-2)] transition-colors text-[var(--text-primary)]"
        >
          <Palette size={16} />
          <span className="text-xs font-medium md:hidden">{t('appearance', 'Appearance')}</span>
        </button>

        {isThemeOpen && (
          <div className="mt-2 w-full md:absolute md:right-0 md:top-full md:w-64 bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-xl shadow-xl z-[70] overflow-hidden p-2">

            {/* Theme Variants */}
            <div className="mb-3">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">{t('theme_style', 'Theme Style')}</div>
              <div className="space-y-1">
                <button
                  onClick={() => setVariant('default')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-[var(--text-primary)] ${variant === 'default' ? 'bg-brand/10 text-brand font-medium' : 'hover:bg-[var(--surface-2)]'}`}
                >
                  <div className="flex items-center gap-2"><Palette size={16} /> {t('theme_default', 'Default')}</div>
                  {variant === 'default' && <Check size={16} />}
                </button>
                <button
                  onClick={() => setVariant('glass')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-[var(--text-primary)] ${variant === 'glass' ? 'bg-brand/10 text-brand font-medium' : 'hover:bg-[var(--surface-2)]'}`}
                >
                  <div className="flex items-center gap-2"><Palette size={16} /> {t('theme_glass', 'Glass')}</div>
                  {variant === 'glass' && <Check size={16} />}
                </button>
                <button
                  onClick={() => setVariant('dark-green')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-[var(--text-primary)] ${variant === 'dark-green' ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'hover:bg-[var(--surface-2)]'}`}
                >
                  <div className="flex items-center gap-2"><Leaf size={16} /> {t('theme_dark_green', 'Dark Green')}</div>
                  {variant === 'dark-green' && <Check size={16} />}
                </button>
              </div>
            </div>

            <div className="h-px bg-[var(--border-soft)] my-2"></div>

            {/* Appearance (Light/Dark) */}
            <div>
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">{t('appearance', 'Appearance')}</div>
              <div className="flex bg-[var(--surface-2)] rounded-lg p-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex justify-center p-2 rounded-md transition-all ${theme === 'light' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                  title={t('light', 'Light')}
                >
                  <Sun size={16} />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex justify-center p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                  title={t('dark', 'Dark')}
                >
                  <Moon size={16} />
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex-1 flex justify-center p-2 rounded-md transition-all ${theme === 'system' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                  title={t('system', 'System')}
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
