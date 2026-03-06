import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import { LANGUAGES } from '../types';
import { Globe, Sun, Moon, Monitor, Leaf, Palette, Check } from 'lucide-react';

interface HeaderControlsProps {
  inline?: boolean; // When true, renders as flat sections (no dropdowns) for sidebar drawer
}

export function HeaderControls({ inline = false }: HeaderControlsProps) {
  const { i18n, t } = useTranslation();
  const { theme, setTheme, variant, setVariant, setLanguage } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── INLINE MODE: flat sections for sidebar drawer ──
  if (inline) {
    return (
      <div className="w-full space-y-4">
        {/* Language Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe size={14} className="text-[var(--text-muted)]" />
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('language', 'Language')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setLanguage(lang.code as any); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  i18n.language === lang.code
                    ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                    : 'border-[var(--border-soft)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {lang.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Style Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Palette size={14} className="text-[var(--text-muted)]" />
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('theme_style', 'Theme Style')}</span>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setVariant('default')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${variant === 'default' ? 'bg-brand/10 text-brand font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}
            >
              <div className="flex items-center gap-2"><Palette size={16} /> {t('theme_default', 'Default')}</div>
              {variant === 'default' && <Check size={16} />}
            </button>
            <button
              onClick={() => setVariant('glass')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${variant === 'glass' ? 'bg-brand/10 text-brand font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}
            >
              <div className="flex items-center gap-2"><Palette size={16} /> {t('theme_glass', 'Glass')}</div>
              {variant === 'glass' && <Check size={16} />}
            </button>
            <button
              onClick={() => setVariant('dark-green')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${variant === 'dark-green' ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}
            >
              <div className="flex items-center gap-2"><Leaf size={16} /> {t('theme_dark_green', 'Dark Green')}</div>
              {variant === 'dark-green' && <Check size={16} />}
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sun size={14} className="text-[var(--text-muted)]" />
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('appearance', 'Appearance')}</span>
          </div>
          <div className="flex bg-[var(--surface-2)] rounded-xl p-1">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all text-xs font-medium ${theme === 'light' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              <Sun size={14} /> {t('light', 'Light')}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all text-xs font-medium ${theme === 'dark' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              <Moon size={14} /> {t('dark', 'Dark')}
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all text-xs font-medium ${theme === 'system' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              <Monitor size={14} /> {t('system', 'System')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DEFAULT MODE: compact buttons with dropdowns for header bar ──
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 w-full md:w-auto">
      {/* Language Switcher */}
      <div ref={langRef} className="relative">
        <button
          onClick={() => { setIsLangOpen(!isLangOpen); setIsThemeOpen(false); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-soft)] hover:bg-[var(--surface-2)] transition-colors text-[var(--text-primary)]"
        >
          <Globe size={16} />
          <span className="text-xs font-medium uppercase">{i18n.language}</span>
        </button>
        {isLangOpen && (
          <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 w-48 bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-xl shadow-xl z-[70] overflow-hidden max-h-[50vh]">
            <div className="max-h-64 overflow-y-auto">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setLanguage(lang.code as any); setIsLangOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between text-[var(--text-primary)] ${i18n.language === lang.code ? 'text-brand font-semibold' : ''}`}
                >
                  {lang.name}
                  {i18n.language === lang.code && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theme Switcher */}
      <div ref={themeRef} className="relative">
        <button
          onClick={() => { setIsThemeOpen(!isThemeOpen); setIsLangOpen(false); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-soft)] hover:bg-[var(--surface-2)] transition-colors text-[var(--text-primary)]"
        >
          <Palette size={16} />
        </button>

        {isThemeOpen && (
          <div className="mt-2 w-full md:absolute md:left-0 md:top-full md:w-64 bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-xl shadow-xl z-[70] overflow-hidden p-2">

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
