import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { TRANSLATIONS } from '../constants/translations';
import type { Language, ThemeMode } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type ThemeVariant = 'default' | 'glass';
type Theme = 'light' | 'dark' | 'system';

const RTL_LANGUAGES: Language[] = ['ar', 'ur'];

interface ThemeContextType {
  // Original API (HeaderControls, etc.)
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Extended API (LandingPage, Header, EmployeePortal, etc.)
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  variant: ThemeVariant;
  setVariant: (v: ThemeVariant) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  isRTL: boolean;

  /** Translation helper — returns key's value for current language, falls back to `en` */
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeRaw] = useState<Theme>(() => {
    return (localStorage.getItem('zien-theme') as Theme) || 'system';
  });

  const [language, setLanguageRaw] = useState<Language>(() => {
    return (localStorage.getItem('zien-language') as Language) || 'en';
  });

  const [variant, setVariantRaw] = useState<ThemeVariant>(() => {
    return (localStorage.getItem('zien-variant') as ThemeVariant) || 'default';
  });

  // ── Setters ────────────────────────────────────────────────────────────────
  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem('zien-theme', t);
    setThemeRaw(t);
  }, []);

  const setLanguage = useCallback((l: Language) => {
    localStorage.setItem('zien-language', l);
    setLanguageRaw(l);
  }, []);

  const setVariant = useCallback((v: ThemeVariant) => {
    localStorage.setItem('zien-variant', v);
    setVariantRaw(v);
  }, []);

  // Aliases for legacy consumers that use mode/setMode
  const mode = theme as ThemeMode;
  const setMode = useCallback((m: ThemeMode) => setTheme(m as Theme), [setTheme]);

  const isRTL = RTL_LANGUAGES.includes(language);

  // ── Apply theme class + dir to <html> ──────────────────────────────────────
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    root.dir = isRTL ? 'rtl' : 'ltr';
    root.lang = language;
  }, [theme, language, isRTL]);

  // ── Translation function ───────────────────────────────────────────────────
  const t = useCallback(
    (key: string): string => {
      const dict = TRANSLATIONS[language] ?? TRANSLATIONS['en'] ?? {};
      const fallback = TRANSLATIONS['en'] ?? {};
      return dict[key] ?? fallback[key] ?? key;
    },
    [language],
  );

  // ── Memoised value ─────────────────────────────────────────────────────────
  const value = useMemo<ThemeContextType>(
    () => ({
      theme, setTheme,
      mode, setMode,
      variant, setVariant,
      language, setLanguage,
      isRTL,
      t,
    }),
    [theme, setTheme, mode, setMode, variant, setVariant, language, setLanguage, isRTL, t],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
