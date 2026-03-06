import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Phone, MessageCircle, MapPin, ExternalLink,
  Star, HelpCircle, BookOpen, Plug, Building2, FileText,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';

const WHATSAPP_SUPPORT = 'https://wa.me/966500000000';
const SUPPORT_EMAIL = 'support@zien-ai.app';

export default function Footer() {
  const navigate = useNavigate();
  const { language, t: translate } = useTheme();

  const navLinks = [
    { label: translate('features'), path: '/features', icon: Star },
    { label: translate('integrations') || 'Integrations', path: '/integrations', icon: Plug },
    { label: translate('industries') || 'Industries', path: '/industries', icon: Building2 },
    { label: translate('faq'), path: '/faq', icon: MessageCircle },
    { label: translate('academy'), path: '/academy', icon: BookOpen },
    { label: translate('help'), path: '/help', icon: HelpCircle },
    { label: translate('contact'), path: '/contact', icon: Mail },
  ];

  const legalLinks = [
    { label: translate('privacy_policy') || 'Privacy Policy', path: '/privacy' },
    { label: translate('terms_of_service') || 'Terms of Service', path: '/terms' },
  ];

  return (
    <footer className="relative mt-auto border-t border-[var(--border-soft)] bg-[var(--bg-primary)]">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 cursor-pointer mb-4" onClick={() => navigate('/')}>
              <img
                src={ASSETS.LOGO_PRIMARY}
                alt="ZIEN"
                className="w-16 h-16 object-contain"
                {...IMAGE_PROPS}
              />
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              {translate('footer_desc') || 'AI-Powered Enterprise Platform for Intelligent Business Operations'}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={WHATSAPP_SUPPORT}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-[var(--surface-2)] hover:bg-green-500 hover:text-white transition-all text-[var(--text-secondary)]"
                title="WhatsApp"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="p-2 rounded-full bg-[var(--surface-2)] hover:bg-brand hover:text-white transition-all text-[var(--text-secondary)]"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-primary)] mb-4">
              {translate('navigation') || 'Navigation'}
            </h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-brand transition-colors"
                  >
                    <link.icon className="w-4 h-4 opacity-60" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-primary)] mb-4">
              {translate('services') || 'Services'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/features/accounting" className="text-sm text-[var(--text-secondary)] hover:text-brand transition-colors">
                  {translate('accounting') || 'Accounting'}
                </Link>
              </li>
              <li>
                <Link to="/features/hr" className="text-sm text-[var(--text-secondary)] hover:text-brand transition-colors">
                  {translate('hr') || 'HR Management'}
                </Link>
              </li>
              <li>
                <Link to="/features/billing" className="text-sm text-[var(--text-secondary)] hover:text-brand transition-colors">
                  {translate('billing') || 'Billing'}
                </Link>
              </li>
              <li>
                <Link to="/features/crm" className="text-sm text-[var(--text-secondary)] hover:text-brand transition-colors">
                  CRM
                </Link>
              </li>
              <li>
                <Link to="/features/logistics" className="text-sm text-[var(--text-secondary)] hover:text-brand transition-colors">
                  {translate('logistics') || 'Logistics'}
                </Link>
              </li>
              <li>
                <Link to="/features/rare" className="text-sm text-[var(--text-secondary)] hover:text-brand transition-colors">
                  RARE AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-primary)] mb-4">
              {translate('contact') || 'Contact'}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Mail className="w-4 h-4 text-brand flex-shrink-0" />
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-brand transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                <a href={WHATSAPP_SUPPORT} target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">
                  {translate('whatsapp_support') || 'WhatsApp Support'}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <MapPin className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                <span>{translate('footer_address') || 'Saudi Arabia'}</span>
              </li>
            </ul>

            {/* CTA Buttons */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-brand text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
              >
                {translate('register')}
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="w-full border border-[var(--border-soft)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[var(--surface-2)] transition-all"
              >
                {translate('contact')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--border-soft)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} ZIEN AI Platform. {translate('all_rights_reserved') || 'All Rights Reserved.'}
          </p>
          <div className="flex items-center gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-xs text-[var(--text-muted)] hover:text-brand transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
