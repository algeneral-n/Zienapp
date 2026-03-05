import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Plug, Search, Check, X, Loader2, ExternalLink,
  Wifi, WifiOff, RefreshCw, AlertTriangle, Shield, Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../components/ThemeProvider';
import { useCompany } from '../../contexts/CompanyContext';
import { integrationsService } from '../../services/integrationsService';

interface CatalogItem {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  icon_url: string | null;
  price_monthly: number;
  is_active: boolean;
  features: string[];
}

interface TenantIntegration {
  id: string;
  company_id: string;
  catalog_id: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  last_health_check: string | null;
  created_at: string;
}

export default function IntegrationsModule() {
  const { language } = useTheme();
  const { t } = useTranslation();
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.id;

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [connected, setConnected] = useState<TenantIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [catalogResult, connResult] = await Promise.all([
        integrationsService.getCatalog(),
        integrationsService.getCompanyIntegrations(companyId),
      ]);
      setCatalog((catalogResult as any)?.catalog || catalogResult || []);
      setConnected((connResult as any)?.integrations || connResult || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [companyId]);

  const handleConnect = async (catalogItem: CatalogItem) => {
    if (!companyId) return;
    setConnectingId(catalogItem.id);
    try {
      await integrationsService.connect(companyId, catalogItem.provider, { catalog_id: catalogItem.id });
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (integration: TenantIntegration) => {
    if (!companyId) return;
    setConnectingId(integration.id);
    try {
      await integrationsService.disconnect(companyId, integration.provider);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConnectingId(null);
    }
  };

  const connectedProviders = new Set(connected.filter(c => c.status === 'active').map(c => c.provider));
  const connectedMap = new Map(connected.map(c => [c.provider, c]));

  const categories = ['all', ...Array.from(new Set(catalog.map(c => c.category)))];
  const filtered = catalog.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.provider.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || item.category === filterCat;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">{t('integrations')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('integrations_desc')}</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
          <RefreshCw size={14} /> {t('refresh')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('int_available'), value: catalog.length, icon: Plug, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: t('int_connected'), value: connectedProviders.size, icon: Wifi, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: t('int_free'), value: catalog.filter(c => !c.price_monthly).length, icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
          { label: t('int_categories'), value: categories.length - 1, icon: Shield, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.color}`}><s.icon size={16} /></div>
            <div className="text-xl font-black">{s.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder={t('search_integrations')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize ${filterCat === cat ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}
            >
              {cat === 'all' ? t('all') : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, i) => {
          const isConnected = connectedProviders.has(item.provider);
          const integration = connectedMap.get(item.provider);
          const isProcessing = connectingId === item.id || connectingId === integration?.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-white dark:bg-zinc-900 border rounded-2xl p-6 transition-all hover:shadow-lg ${isConnected ? 'border-emerald-300 dark:border-emerald-700' : 'border-zinc-200 dark:border-zinc-800'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-black text-blue-600">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{item.name}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{item.category}</p>
                  </div>
                </div>
                {isConnected ? (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                    <Wifi size={10} /> {t('int_connected')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                    <WifiOff size={10} /> {t('offline')}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{item.description || t('integrate_with', { provider: item.provider })}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">
                  {item.price_monthly ? `${item.price_monthly} AED/${t('month_short')}` : t('int_free')}
                </span>
                {isConnected ? (
                  <button
                    disabled={isProcessing}
                    onClick={() => integration && handleDisconnect(integration)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    {t('disconnect')}
                  </button>
                ) : (
                  <button
                    disabled={isProcessing}
                    onClick={() => handleConnect(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                    {t('connect')}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <Plug className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold">{t('no_matching_integrations')}</p>
          <p className="text-xs mt-1">{t('try_adjusting_search')}</p>
        </div>
      )}
    </div>
  );
}
