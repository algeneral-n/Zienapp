import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, ThemeMode, ThemeVariant } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  variant: ThemeVariant;
  setVariant: (variant: ThemeVariant) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('zien-theme') as ThemeMode) || ThemeMode.SYSTEM;
  });
  
  const [variant, setVariant] = useState<ThemeVariant>(() => {
    return (localStorage.getItem('zien-variant') as ThemeVariant) || ThemeVariant.PRISM;
  });

  const language = (i18n.language as Language) || 'en';

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === ThemeMode.SYSTEM) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('zien-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all variant classes
    Object.values(ThemeVariant).forEach(v => root.classList.remove(`theme-${v}`));
    root.classList.add(`theme-${variant}`);
    localStorage.setItem('zien-variant', variant);
  }, [variant]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' || language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    theme,
    setTheme,
    mode: theme,
    setMode: setTheme,
    variant,
    setVariant,
    language,
    setLanguage,
    t
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
