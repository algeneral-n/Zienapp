import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';

const WA_LINKS = [
  { key: 'technical_support', url: 'https://chat.whatsapp.com/H8W70Tq6ppF0pXvG2LfvJP?mode=gi_t' },
  { key: 'customer_service', url: 'https://chat.whatsapp.com/HfZlteCotW8Bi6ZsD4GJLs?mode=gi_t' },
  { key: 'complaints_suggestions', url: 'https://chat.whatsapp.com/IPu6Tmht8v1GTOwFxZO1Zz?mode=gi_t' },
];

export default function Footer() {
  const navigate = useNavigate();
  const { t: translate } = useTheme();

  const navLinks = [
    { label: translate('features'), path: '/features' },
    { label: translate('integrations'), path: '/integrations' },
    { label: translate('industries'), path: '/industries' },
    { label: translate('academy'), path: '/academy' },
    { label: translate('help'), path: '/help' },
    { label: translate('contact'), path: '/contact' },
    { label: translate('privacy'), path: '/privacy' },
    { label: translate('terms'), path: '/terms' },
    { label: 'Founder', path: '/owner', hidden: true },
  ];

  return (
    <footer className="py-12 px-6 border-t border-[var(--border-soft)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 opacity-50 cursor-pointer" onClick={() => navigate('/')}>
          <img src={ASSETS.LOGO_PRIMARY} alt="ZIEN" className="w-8 h-8 object-contain grayscale" {...IMAGE_PROPS} />
        </div>

        {/* Nav Links as Button Pills */}
        <div className="flex flex-wrap justify-center gap-3 text-xs font-bold">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`px-4 py-2 rounded-full glass-card border border-[var(--border-soft)] hover:bg-brand hover:text-white hover:border-brand transition-all duration-300 text-[var(--text-primary)] ${(link as any).hidden ? 'opacity-0 hover:opacity-100' : ''}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* WhatsApp Support Links */}
        <div className="flex flex-wrap justify-center gap-3">
          {WA_LINKS.map((wa) => (
            <a
              key={wa.url}
              href={wa.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              {translate(wa.key)}
            </a>
          ))}
        </div>

        {/* Emails */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-[var(--text-secondary)]">
          <a href="mailto:INFO@ZIEN-AI.APP" className="hover:text-brand transition-colors font-medium">INFO@ZIEN-AI.APP</a>
          <span className="text-[var(--border-soft)]">|</span>
          <a href="mailto:GM@ZIEN-AI.APP" className="hover:text-brand transition-colors font-medium">GM@ZIEN-AI.APP</a>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="bg-brand text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
          >
            {translate('register')}
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider border border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all"
          >
            {translate('contact')}
          </button>
        </div>

        {/* Copyright */}
        <div className="text-sm text-[var(--text-secondary)]">
          &copy; {new Date().getFullYear()} ZIEN AI. {translate('all_rights_reserved')}
        </div>
      </div>
    </footer>
  );
}
