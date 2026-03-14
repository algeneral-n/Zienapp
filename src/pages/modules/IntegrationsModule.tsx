import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plug, Search, Check, X, ExternalLink,
  ChevronDown, ChevronUp, UserPlus, Mail, Star,
  CreditCard, Megaphone, Chrome, MessageSquare,
  Calculator, TrendingUp, Layers, Globe, Lock, Sparkles,
  Loader2, CheckCircle, AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../components/ThemeProvider';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { connectIntegration, disconnectIntegration } from '../../services/integrationService';
import {
  INTEGRATION_GROUPS,
  ALL_INTEGRATIONS,
  PLAN_LABELS,
  type Integration,
  type IntegrationGroup,
  type IntegrationPlan,
} from '../../data/integrationCatalog';

/* ── Icon map for group icons ──────────────────────────────── */
const GROUP_ICONS: Record<string, React.ElementType> = {
  CreditCard, Megaphone, Chrome, MessageSquare,
  Calculator, TrendingUp, Layers,
};

/* ── Expanded card modal ───────────────────────────────────── */
function IntegrationDetail({
  item,
  isAr,
  isPublic,
  onClose,
  onRegister,
  onSubscribe,
}: {
  item: (typeof ALL_INTEGRATIONS)[0];
  isAr: boolean;
  isPublic: boolean;
  onClose: () => void;
  onRegister: () => void;
  onSubscribe: (integrationId: string, planId: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');
  const [subscribeState, setSubscribeState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeError, setSubscribeError] = useState('');
  const plan = item.plans.find((p) => p.id === selectedPlan) || item.plans[0];
  const planLabel = PLAN_LABELS[item.requiredPlan];

  const handleSubscribe = async () => {
    setSubscribeState('loading');
    setSubscribeError('');
    try {
      await onSubscribe(item.id, selectedPlan);
      setSubscribeState('success');
    } catch (err: any) {
      setSubscribeState('error');
      setSubscribeError(err?.message || t('intg_activate_failed'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.45 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-primary)] shadow-2xl"
      >
        {/* Close btn */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] z-10"
        >
          <X size={16} />
        </button>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center overflow-hidden shrink-0">
              {item.logo ? (
                <img src={item.logo} alt={item.name} className="w-9 h-9 object-contain" />
              ) : (
                <span className="text-2xl font-black text-brand">{item.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black text-[var(--text-primary)] leading-tight">{item.name}</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{item.groupName}</p>
              {planLabel && (
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${planLabel.color}`}>
                  {isAr ? planLabel.ar : planLabel.en}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed" dir={isAr ? 'rtl' : 'ltr'}>
            {item.description}
          </p>

          {/* Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">
              {t('intg_features')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {item.features.map((f, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-[11px] font-medium text-[var(--text-primary)]">
                  <Check size={10} className="text-brand" /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Website */}
          <a
            href={item.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-brand hover:underline"
          >
            <Globe size={12} /> {item.website}
          </a>

          {/* Pricing plans */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
              {t('intg_pricing_plans')}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {item.plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`rounded-xl border p-3 text-center transition-all ${selectedPlan === p.id
                    ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
                    : 'border-[var(--border-soft)] hover:border-brand/40'
                    }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{p.name}</div>
                  <div className="text-lg font-black text-[var(--text-primary)] mt-0.5">
                    {p.price === 0 ? t('intg_free') : p.price}
                  </div>
                  {p.price > 0 && <div className="text-[10px] text-[var(--text-secondary)]">AED/{t('intg_month')}</div>}
                  <div className="text-[10px] text-[var(--text-secondary)] mt-1 line-clamp-1">{p.limit}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected plan features */}
          {plan && (
            <div className="bg-[var(--surface-2)] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">{plan.name}</span>
                <span className="text-sm font-black text-brand">
                  {plan.price === 0 ? t('intg_free') : `${plan.price} AED/${t('intg_month')}`}
                </span>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Check size={10} className="text-emerald-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {isPublic ? (
              <>
                <button
                  onClick={onRegister}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-brand text-white hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
                >
                  <Lock size={14} /> {t('intg_register_subscribe')}
                </button>
                <a
                  href={item.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all"
                >
                  <ExternalLink size={14} />
                </a>
              </>
            ) : (
              <div className="flex-1 space-y-2">
                {subscribeState === 'success' ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white">
                    <CheckCircle size={14} /> {t('intg_activated')}
                  </div>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribeState === 'loading'}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-brand text-white hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 disabled:opacity-60"
                  >
                    {subscribeState === 'loading' ? (
                      <><Loader2 size={14} className="animate-spin" /> {t('intg_activating')}</>
                    ) : (
                      <><Sparkles size={14} /> {t('intg_subscribe')} — {plan?.price || 0} AED</>
                    )}
                  </button>
                )}
                {subscribeState === 'error' && (
                  <div className="flex items-center gap-2 text-xs text-red-500 px-1">
                    <AlertCircle size={12} /> {subscribeError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main component ────────────────────────────────────────── */
export default function IntegrationsModule() {
  const { language } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { user } = useAuth();
  const companyId = company?.id;
  const isPublicMode = !user || !companyId;
  const isAr = language === 'ar';

  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<(typeof ALL_INTEGRATIONS)[0] | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  /* ── Subscribe handler ─────────────────────────────────── */
  const handleSubscribe = useCallback(async (integrationCode: string, planId: string) => {
    if (!companyId) throw new Error(t('intg_no_company'));
    await connectIntegration(companyId, integrationCode, { plan: planId });
  }, [companyId, t]);

  /* ── Filtering ─────────────────────────────────────────── */
  const filteredGroups =
    activeGroup === 'all'
      ? INTEGRATION_GROUPS
      : INTEGRATION_GROUPS.filter((g) => g.id === activeGroup);

  const searchLower = search.toLowerCase();
  const filteredGroupsWithSearch = filteredGroups
    .map((g) => ({
      ...g,
      integrations: g.integrations.filter(
        (i) =>
          !search ||
          i.name.toLowerCase().includes(searchLower) ||
          i.description.toLowerCase().includes(searchLower) ||
          i.features.some((f) => f.toLowerCase().includes(searchLower)),
      ),
    }))
    .filter((g) => g.integrations.length > 0);

  const totalCount = ALL_INTEGRATIONS.length;
  const visibleCount = filteredGroupsWithSearch.reduce((n, g) => n + g.integrations.length, 0);

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className={`space-y-8 max-w-7xl mx-auto ${isPublicMode ? 'pt-28 px-4 pb-16' : 'px-2'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand/10 via-[var(--surface-2)] to-brand/5 border border-[var(--border-soft)] p-8 md:p-12">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Plug size={20} className="text-brand" />
            </div>
            <span className="px-3 py-1 rounded-full bg-brand/10 text-brand text-[11px] font-bold">
              {totalCount} {t('intg_available')}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] leading-tight">
            {t('intg_marketplace')}
          </h1>
          <p className="text-sm md:text-base text-[var(--text-secondary)] mt-3 leading-relaxed max-w-xl">
            {t('intg_hero_desc')}
          </p>
          {isPublicMode && (
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-brand text-white hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
              >
                <UserPlus size={16} /> {t('intg_register_activate')}
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all"
              >
                <Mail size={16} /> {t('intg_contact_us')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────── */}
      <div className="relative max-w-xl mx-auto">
        <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)]`} size={18} />
        <input
          type="text"
          placeholder={t('intg_search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full ${isAr ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-2xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:ring-2 focus:ring-brand/30 transition-all`}
        />
        {search && (
          <button onClick={() => setSearch('')} className={`absolute ${isAr ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Category tabs (horizontal scroll) ───────────────── */}
      <div ref={tabsRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        <button
          onClick={() => setActiveGroup('all')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeGroup === 'all'
            ? 'bg-brand text-white shadow-md shadow-brand/20'
            : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-brand/10 hover:text-brand border border-[var(--border-soft)]'
            }`}
        >
          <Plug size={14} />
          {t('intg_all')} ({totalCount})
        </button>
        {INTEGRATION_GROUPS.map((g) => {
          const Icon = GROUP_ICONS[g.icon] || Plug;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeGroup === g.id
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-brand/10 hover:text-brand border border-[var(--border-soft)]'
                }`}
            >
              <Icon size={14} />
              {isAr ? g.name : g.nameEn} ({g.integrations.length})
            </button>
          );
        })}
      </div>

      {/* ── Results count ───────────────────────────────────── */}
      {search && (
        <p className="text-xs text-[var(--text-secondary)]">
          {`${t('intg_showing')} ${visibleCount} ${t('intg_of')} ${totalCount} ${t('intg_integrations')}`}
        </p>
      )}

      {/* ── Group sections ──────────────────────────────────── */}
      {filteredGroupsWithSearch.map((group) => {
        const Icon = GROUP_ICONS[group.icon] || Plug;
        return (
          <section key={group.id} className="space-y-4">
            {/* Group header */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${group.color} text-white flex items-center justify-center`}>
                <Icon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)]">{isAr ? group.name : group.nameEn}</h2>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {group.integrations.length} {t('intg_integrations')}
                </p>
              </div>
            </div>

            {/* Integration cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.integrations.map((item, idx) => {
                const planLabel = PLAN_LABELS[item.requiredPlan];
                const isExpanded = expandedCard === item.id;
                const minPrice = Math.min(...item.plans.map((p) => p.price));
                const allItem = ALL_INTEGRATIONS.find((a) => a.id === item.id)!;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    className="group relative bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-2xl overflow-hidden hover:shadow-lg hover:border-brand/30 transition-all"
                  >
                    {/* Card body */}
                    <div className="p-5">
                      {/* Logo + name + plan badge */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] flex items-center justify-center overflow-hidden shrink-0">
                          {item.logo ? (
                            <img src={item.logo} alt={item.name} className="w-7 h-7 object-contain" loading="lazy" />
                          ) : (
                            <span className="text-lg font-black text-brand">{item.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{item.name}</h3>
                          {planLabel && (
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold ${planLabel.color}`}>
                              {isAr ? planLabel.ar : planLabel.en}
                            </span>
                          )}
                        </div>
                        {/* Price badge */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-brand">
                            {minPrice === 0 ? t('intg_free') : `${minPrice}`}
                          </div>
                          {minPrice > 0 && (
                            <div className="text-[9px] text-[var(--text-secondary)]">AED/{t('intg_month')}</div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-3" dir={isAr ? 'rtl' : 'ltr'}>
                        {item.description}
                      </p>

                      {/* Features pills (top 3) */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.features.slice(0, 3).map((f, fi) => (
                          <span key={fi} className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[10px] font-medium text-[var(--text-secondary)]">
                            {f}
                          </span>
                        ))}
                        {item.features.length > 3 && (
                          <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[10px] font-medium text-[var(--text-secondary)]">
                            +{item.features.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Expand / collapse pricing */}
                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : item.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                      >
                        {isExpanded
                          ? t('intg_hide_plans')
                          : t('intg_view_plans')}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {/* Expanded pricing */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-2">
                              {item.plans.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)]">
                                  <div>
                                    <div className="text-xs font-bold text-[var(--text-primary)]">{p.name}</div>
                                    <div className="text-[10px] text-[var(--text-secondary)]">{p.limit}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-black text-brand">
                                      {p.price === 0 ? t('intg_free') : `${p.price} AED`}
                                    </div>
                                    {p.price > 0 && (
                                      <div className="text-[9px] text-[var(--text-secondary)]">/{t('intg_per_month')}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Footer action */}
                    <div className="border-t border-[var(--border-soft)] p-3 flex items-center gap-2">
                      {isPublicMode ? (
                        <>
                          <button
                            onClick={() => navigate('/register')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold bg-brand text-white hover:bg-brand-hover transition-all"
                          >
                            <Lock size={12} /> {t('intg_register_to_activate')}
                          </button>
                          <button
                            onClick={() => setDetailItem(allItem)}
                            className="px-3 py-2 rounded-xl text-[11px] font-bold border border-[var(--border-soft)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all"
                          >
                            {t('intg_details')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setDetailItem(allItem)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold bg-brand text-white hover:bg-brand-hover transition-all"
                          >
                            <Sparkles size={12} /> {t('intg_subscribe_short')}
                          </button>
                          <a
                            href={item.website}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl text-[11px] font-bold border border-[var(--border-soft)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ── Empty state ─────────────────────────────────────── */}
      {filteredGroupsWithSearch.length === 0 && (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-bold text-sm">{t('intg_no_results')}</p>
          <p className="text-xs mt-1 opacity-70">{t('intg_try_different')}</p>
          <button onClick={() => { setSearch(''); setActiveGroup('all'); }} className="mt-4 text-xs font-bold text-brand hover:underline">
            {t('intg_reset')}
          </button>
        </div>
      )}

      {/* ── CTA banner ──────────────────────────────────────── */}
      {isPublicMode && (
        <div className="rounded-3xl bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 p-8 md:p-10 text-center space-y-4">
          <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)]">
            {t('intg_ready_title')}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
            {t('intg_ready_desc')}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-brand text-white hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
            >
              <UserPlus size={16} /> {t('intg_start_free')}
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold border border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all"
            >
              <Mail size={16} /> {t('intg_talk_team')}
            </button>
          </div>
        </div>
      )}

      {/* ── Detail modal ────────────────────────────────────── */}
      <AnimatePresence>
        {detailItem && (
          <IntegrationDetail
            item={detailItem}
            isAr={isAr}
            isPublic={isPublicMode}
            onClose={() => setDetailItem(null)}
            onRegister={() => { setDetailItem(null); navigate('/register'); }}
            onSubscribe={handleSubscribe}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
