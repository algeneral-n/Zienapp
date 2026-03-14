import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Globe, DollarSign, TrendingUp, Target, BarChart3, Play, Pause,
    Plus, Eye, MousePointerClick, Zap, RefreshCw, Users, Repeat,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import {
    getMarketingAudiences, createMarketingAudience, getRetargetingCampaigns,
} from '../../services/founderService';
import { LoadingState, ErrorState, founderFetch, TabBar, SectionHeader } from './shared';

type AdPlatform = 'google' | 'meta' | 'youtube' | 'tiktok';
type CampaignStatus = 'active' | 'paused' | 'draft' | 'completed';
type MarketingTab = 'campaigns' | 'audiences' | 'retargeting';

interface AdCampaign {
    id: string;
    name: string;
    platform: AdPlatform;
    status: CampaignStatus;
    budget_daily: number;
    spend_total: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpa: number;
    created_at: string;
}

const PLATFORM_META: Record<AdPlatform, { label: string; color: string; bgColor: string }> = {
    google: { label: 'Google Ads', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
    meta: { label: 'Meta Ads', color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30' },
    youtube: { label: 'YouTube Ads', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30' },
    tiktok: { label: 'TikTok Ads', color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950/30' },
};

export default function ExternalMarketing() {
    const { t } = useTranslation();
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [audiences, setAudiences] = useState<any[]>([]);
    const [retargeting, setRetargeting] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<MarketingTab>('campaigns');
    const [platformFilter, setPlatformFilter] = useState<AdPlatform | 'all'>('all');
    const [showCreate, setShowCreate] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        name: '', platform: 'google' as AdPlatform, budget_daily: 50, target_audience: '', landing_url: '',
    });
    const [newAudience, setNewAudience] = useState({ name: '', criteria: '' });
    const [showCreateAudience, setShowCreateAudience] = useState(false);

    useEffect(() => {
        loadCampaigns();
        getMarketingAudiences().then(d => setAudiences((d as any)?.audiences || [])).catch(() => { });
        getRetargetingCampaigns().then(d => setRetargeting((d as any)?.campaigns || [])).catch(() => { });
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const { data, error: e } = await supabase
                .from('ad_campaigns')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (e) throw e;

            setCampaigns((data || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                platform: c.platform || 'google',
                status: c.status || 'draft',
                budget_daily: c.budget_daily || 0,
                spend_total: c.spend_total || 0,
                impressions: c.impressions || 0,
                clicks: c.clicks || 0,
                conversions: c.conversions || 0,
                ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
                cpa: c.conversions > 0 ? c.spend_total / c.conversions : 0,
                created_at: c.created_at,
            })));
        } catch (e: any) {
            setError(e.message || 'Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCampaign.name.trim()) return;
        try {
            await supabase.from('ad_campaigns').insert({
                ...newCampaign,
                status: 'draft',
                created_by: (await supabase.auth.getUser()).data.user?.id,
            });
            setShowCreate(false);
            setNewCampaign({ name: '', platform: 'google', budget_daily: 50, target_audience: '', landing_url: '' });
            loadCampaigns();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const toggleCampaignStatus = async (id: string, current: CampaignStatus) => {
        const next = current === 'active' ? 'paused' : 'active';
        await supabase.from('ad_campaigns').update({ status: next }).eq('id', id);
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: next } : c));
    };

    const filtered = campaigns.filter(c => platformFilter === 'all' || c.platform === platformFilter);

    const totalSpend = campaigns.filter(c => c.status === 'active').reduce((s, c) => s + c.spend_total, 0);
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionHeader title={t('external_marketing')} subtitle="Google, Meta, YouTube, TikTok Ads" />
                <div className="flex gap-2">
                    {activeTab === 'campaigns' && (
                        <button
                            onClick={() => setShowCreate(!showCreate)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                        >
                            <Plus size={14} /> {t('new_campaign')}
                        </button>
                    )}
                    {activeTab === 'audiences' && (
                        <button
                            onClick={() => setShowCreateAudience(!showCreateAudience)}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700"
                        >
                            <Plus size={14} /> {t('new_audience') || 'New Audience'}
                        </button>
                    )}
                </div>
            </div>

            <TabBar
                tabs={[
                    { key: 'campaigns', label: t('campaigns') || 'Campaigns' },
                    { key: 'audiences', label: t('audiences') || 'Audiences' },
                    { key: 'retargeting', label: t('retargeting') || 'Retargeting' },
                ]}
                active={activeTab}
                onChange={(k) => setActiveTab(k as MarketingTab)}
            />

            {/* ── Campaigns Tab ─────────────────── */}
            {activeTab === 'campaigns' && (<>
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: t('total_spend'), value: `$${Math.round(totalSpend).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600' },
                        { label: t('impressions'), value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-blue-600' },
                        { label: t('clicks'), value: totalClicks.toLocaleString(), icon: MousePointerClick, color: 'text-violet-600' },
                        { label: t('conversions'), value: totalConversions.toLocaleString(), icon: Target, color: 'text-amber-600' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5">
                            <stat.icon size={16} className={stat.color + ' mb-2'} />
                            <p className="text-xl font-black">{stat.value}</p>
                            <p className="text-[10px] font-bold uppercase text-zinc-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Platform filter */}
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'google', 'meta', 'youtube', 'tiktok'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPlatformFilter(p)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${platformFilter === p ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                }`}
                        >
                            {p === 'all' ? 'All Platforms' : PLATFORM_META[p].label}
                        </button>
                    ))}
                </div>

                {/* Create form */}
                {showCreate && (
                    <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                        <h3 className="text-sm font-black uppercase">{t('create_ad_campaign')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder="Campaign name"
                                value={newCampaign.name}
                                onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0"
                            />
                            <select
                                value={newCampaign.platform}
                                onChange={e => setNewCampaign({ ...newCampaign, platform: e.target.value as AdPlatform })}
                                className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0"
                            >
                                <option value="google">Google Ads</option>
                                <option value="meta">Meta Ads</option>
                                <option value="youtube">YouTube Ads</option>
                                <option value="tiktok">TikTok Ads</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                placeholder="Daily budget ($)"
                                value={newCampaign.budget_daily}
                                onChange={e => setNewCampaign({ ...newCampaign, budget_daily: Number(e.target.value) })}
                                className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0"
                            />
                            <input
                                placeholder="Landing URL"
                                value={newCampaign.landing_url}
                                onChange={e => setNewCampaign({ ...newCampaign, landing_url: e.target.value })}
                                className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0"
                            />
                        </div>
                        <input
                            placeholder="Target audience description"
                            value={newCampaign.target_audience}
                            onChange={e => setNewCampaign({ ...newCampaign, target_audience: e.target.value })}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{t('cancel')}</button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">{t('create')}</button>
                        </div>
                    </div>
                )}

                {/* Campaign list */}
                <div className="space-y-3">
                    {filtered.map(c => {
                        const pm = PLATFORM_META[c.platform];
                        return (
                            <div key={c.id} className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${pm.bgColor} ${pm.color}`}>
                                            {pm.label}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{c.name}</p>
                                            <p className="text-xs text-zinc-500">
                                                ${c.budget_daily}/day — {c.impressions.toLocaleString()} impressions — CTR {c.ctr.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-black">${Math.round(c.spend_total)}</p>
                                            <p className="text-[10px] text-zinc-500">{c.conversions} conv.</p>
                                        </div>
                                        <button
                                            onClick={() => toggleCampaignStatus(c.id, c.status)}
                                            className={`p-2 rounded-lg ${c.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                                        >
                                            {c.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <Globe size={28} className="mx-auto text-zinc-400 mb-3" />
                            <p className="text-sm text-zinc-500">{t('no_ad_campaigns')}</p>
                        </div>
                    )}
                </div>
            </>)}

            {/* ── Audiences Tab ──────────────────── */}
            {activeTab === 'audiences' && (
                <div className="space-y-4">
                    {showCreateAudience && (
                        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                            <h3 className="text-sm font-black uppercase">{t('new_audience') || 'New Audience'}</h3>
                            <input placeholder="Audience name" value={newAudience.name} onChange={e => setNewAudience({ ...newAudience, name: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0" />
                            <input placeholder="Criteria / description" value={newAudience.criteria} onChange={e => setNewAudience({ ...newAudience, criteria: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0" />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowCreateAudience(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{t('cancel')}</button>
                                <button
                                    onClick={async () => {
                                        if (!newAudience.name.trim()) return;
                                        try { await createMarketingAudience({ name: newAudience.name, filters: { criteria: newAudience.criteria } }); setShowCreateAudience(false); setNewAudience({ name: '', criteria: '' }); getMarketingAudiences().then(d => setAudiences((d as any)?.audiences || [])); } catch (e: any) { alert(e.message); }
                                    }}
                                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700"
                                >{t('create')}</button>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {audiences.map((a: any, i: number) => (
                            <div key={a.id || i} className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-violet-600" />
                                    <p className="text-sm font-bold">{a.name}</p>
                                </div>
                                <p className="text-xs text-zinc-500">{a.criteria || a.description || 'No criteria'}</p>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] font-bold uppercase text-zinc-400">{a.size?.toLocaleString() || '—'} contacts</span>
                                    <span className="text-[10px] text-zinc-400">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {audiences.length === 0 && (
                        <div className="text-center py-12">
                            <Users size={28} className="mx-auto text-zinc-400 mb-3" />
                            <p className="text-sm text-zinc-500">{t('no_audiences') || 'No audiences yet'}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Retargeting Tab ────────────────── */}
            {activeTab === 'retargeting' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {retargeting.map((r: any, i: number) => (
                            <div key={r.id || i} className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Repeat size={14} className="text-amber-600" />
                                        <p className="text-sm font-bold">{r.name}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${r.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                                        {r.status || 'draft'}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500">{r.description || r.trigger || 'No description'}</p>
                                <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-bold uppercase">
                                    <span>{r.platform || 'Multi-platform'}</span>
                                    <span>{r.impressions?.toLocaleString() || 0} impressions</span>
                                    <span>{r.conversions?.toLocaleString() || 0} conversions</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {retargeting.length === 0 && (
                        <div className="text-center py-12">
                            <Repeat size={28} className="mx-auto text-zinc-400 mb-3" />
                            <p className="text-sm text-zinc-500">{t('no_retargeting') || 'No retargeting campaigns yet'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
