// ============================================================================
// Portal Builder — 3-tab page: Preview, Customization, AI Builder
// Allows company owners/GMs to configure their client-facing portal.
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
    Eye, Palette, Zap, Save, Loader2, Check,
    Globe, Layout, Type, Image, PanelLeft,
    Smartphone, Monitor, Info, Sparkles
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PortalConfig {
    company_id: string;
    brand_color: string;
    accent_color: string;
    logo_url: string;
    hero_title: string;
    hero_subtitle: string;
    sections: string[];
    show_invoices: boolean;
    show_quotes: boolean;
    show_contracts: boolean;
    show_support: boolean;
    custom_css: string;
    custom_domain: string;
}

type TabId = 'preview' | 'customization' | 'ai-builder';

const DEFAULT_CONFIG: Omit<PortalConfig, 'company_id'> = {
    brand_color: '#2563eb',
    accent_color: '#10b981',
    logo_url: '',
    hero_title: 'Welcome to our Client Portal',
    hero_subtitle: 'Access your projects, invoices, and documents',
    sections: ['invoices', 'quotes', 'contracts', 'support'],
    show_invoices: true,
    show_quotes: true,
    show_contracts: true,
    show_support: true,
    custom_css: '',
    custom_domain: '',
};

// ─── Preview Tab ────────────────────────────────────────────────────────────

function PreviewTab({ config }: { config: PortalConfig }) {
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-black uppercase tracking-tight text-sm">Live Preview</h3>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                    <button
                        onClick={() => setDevice('desktop')}
                        className={`p-2 rounded-lg transition-all ${device === 'desktop' ? 'bg-white dark:bg-zinc-700 shadow' : ''}`}
                    >
                        <Monitor size={16} />
                    </button>
                    <button
                        onClick={() => setDevice('mobile')}
                        className={`p-2 rounded-lg transition-all ${device === 'mobile' ? 'bg-white dark:bg-zinc-700 shadow' : ''}`}
                    >
                        <Smartphone size={16} />
                    </button>
                </div>
            </div>

            <div className={`mx-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-all ${device === 'mobile' ? 'max-w-[375px]' : 'w-full'
                }`}>
                {/* Simulated portal header */}
                <div
                    className="p-8 text-white"
                    style={{ backgroundColor: config.brand_color }}
                >
                    <div className="flex items-center gap-3 mb-8">
                        {config.logo_url ? (
                            <img src={config.logo_url} alt="Logo" className="h-10 w-10 rounded-xl object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xl">Z</div>
                        )}
                        <span className="text-lg font-black tracking-tight uppercase">Client Portal</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">{config.hero_title}</h1>
                    <p className="text-white/70 text-sm mt-2">{config.hero_subtitle}</p>
                </div>

                {/* Simulated portal content */}
                <div className="p-6 space-y-4">
                    {config.show_invoices && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.accent_color }} />
                                <span className="text-xs font-bold uppercase tracking-widest">Invoices</span>
                            </div>
                            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-3/4" />
                        </div>
                    )}
                    {config.show_quotes && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.accent_color }} />
                                <span className="text-xs font-bold uppercase tracking-widest">Quotes</span>
                            </div>
                            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-2/3" />
                        </div>
                    )}
                    {config.show_contracts && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.accent_color }} />
                                <span className="text-xs font-bold uppercase tracking-widest">Contracts</span>
                            </div>
                            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-1/2" />
                        </div>
                    )}
                    {config.show_support && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.accent_color }} />
                                <span className="text-xs font-bold uppercase tracking-widest">Support</span>
                            </div>
                            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-1/3" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Customization Tab ──────────────────────────────────────────────────────

function CustomizationTab({
    config,
    onChange,
    onSave,
    saving,
}: {
    config: PortalConfig;
    onChange: (patch: Partial<PortalConfig>) => void;
    onSave: () => void;
    saving: boolean;
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-black uppercase tracking-tight text-sm">Customize Portal</h3>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                </button>
            </div>

            {/* Branding */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                    <Palette size={14} /> Branding
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="block">
                        <span className="text-xs font-bold text-zinc-500">Brand Color</span>
                        <div className="flex items-center gap-3 mt-2">
                            <input
                                type="color"
                                value={config.brand_color}
                                onChange={(e) => onChange({ brand_color: e.target.value })}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={config.brand_color}
                                onChange={(e) => onChange({ brand_color: e.target.value })}
                                className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono"
                            />
                        </div>
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold text-zinc-500">Accent Color</span>
                        <div className="flex items-center gap-3 mt-2">
                            <input
                                type="color"
                                value={config.accent_color}
                                onChange={(e) => onChange({ accent_color: e.target.value })}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={config.accent_color}
                                onChange={(e) => onChange({ accent_color: e.target.value })}
                                className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono"
                            />
                        </div>
                    </label>
                    <label className="block md:col-span-2">
                        <span className="text-xs font-bold text-zinc-500">Logo URL</span>
                        <input
                            type="url"
                            value={config.logo_url}
                            onChange={(e) => onChange({ logo_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm mt-2"
                        />
                    </label>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                    <Type size={14} /> Content
                </h4>
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-xs font-bold text-zinc-500">Hero Title</span>
                        <input
                            type="text"
                            value={config.hero_title}
                            onChange={(e) => onChange({ hero_title: e.target.value })}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm mt-2"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold text-zinc-500">Hero Subtitle</span>
                        <input
                            type="text"
                            value={config.hero_subtitle}
                            onChange={(e) => onChange({ hero_subtitle: e.target.value })}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm mt-2"
                        />
                    </label>
                </div>
            </div>

            {/* Sections */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                    <Layout size={14} /> Sections
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { key: 'show_invoices', label: 'Invoices' },
                        { key: 'show_quotes', label: 'Quotes' },
                        { key: 'show_contracts', label: 'Contracts' },
                        { key: 'show_support', label: 'Support' },
                    ].map((section) => (
                        <label
                            key={section.key}
                            className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl cursor-pointer hover:border-blue-600 border border-transparent transition-all"
                        >
                            <input
                                type="checkbox"
                                checked={(config as any)[section.key]}
                                onChange={(e) => onChange({ [section.key]: e.target.checked })}
                                className="rounded border-zinc-300"
                            />
                            <span className="text-sm font-bold">{section.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Advanced */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                    <Globe size={14} /> Advanced
                </h4>
                <label className="block">
                    <span className="text-xs font-bold text-zinc-500">Custom Domain (optional)</span>
                    <input
                        type="text"
                        value={config.custom_domain}
                        onChange={(e) => onChange({ custom_domain: e.target.value })}
                        placeholder="portal.yourdomain.com"
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm mt-2"
                    />
                </label>
            </div>
        </div>
    );
}

// ─── AI Builder Tab ─────────────────────────────────────────────────────────

function AIBuilderTab({
    config,
    onChange,
}: {
    config: PortalConfig;
    onChange: (patch: Partial<PortalConfig>) => void;
}) {
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    async function handleGenerate() {
        if (!prompt.trim()) return;
        setGenerating(true);
        setResult(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const companyId = localStorage.getItem('zien:activeCompanyId') || '';
            const res = await fetch(`${API_URL}/api/ai/rare`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`,
                    ...(companyId ? { 'X-Company-Id': companyId } : {}),
                },
                body: JSON.stringify({
                    query: `You are a portal design assistant. The user wants to customize their client portal. Based on their description, suggest: brand_color (hex), accent_color (hex), hero_title, hero_subtitle. Return ONLY valid JSON, no markdown.\n\nUser request: ${prompt}`,
                    agentType: 'general',
                    mode: 'act',
                    companyId,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const responseText = data.response || '';
                setResult(responseText);

                // Try to parse AI-generated JSON and apply it
                try {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        const patch: Partial<PortalConfig> = {};
                        if (parsed.brand_color) patch.brand_color = parsed.brand_color;
                        if (parsed.accent_color) patch.accent_color = parsed.accent_color;
                        if (parsed.hero_title) patch.hero_title = parsed.hero_title;
                        if (parsed.hero_subtitle) patch.hero_subtitle = parsed.hero_subtitle;
                        if (Object.keys(patch).length > 0) onChange(patch);
                    }
                } catch { /* AI response wasn't parseable — show raw text */ }
            } else {
                setResult('AI builder request failed. Please try again.');
            }
        } catch (e: any) {
            setResult(`Error: ${e.message}`);
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div className="space-y-6">
            <h3 className="font-black uppercase tracking-tight text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" /> AI Portal Builder
            </h3>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 rounded-[32px]">
                <h4 className="text-lg font-black tracking-tight mb-2">Describe your ideal portal</h4>
                <p className="text-white/70 text-sm mb-6">Tell the AI what your portal should look and feel like, and it will generate the configuration for you.</p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. A modern, professional portal for a law firm with dark blue branding and a welcoming headline..."
                    className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/40 resize-none"
                    rows={3}
                />
                <button
                    onClick={handleGenerate}
                    disabled={generating || !prompt.trim()}
                    className="mt-4 flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-all"
                >
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    {generating ? 'Generating…' : 'Generate Configuration'}
                </button>
            </div>

            {result && (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">AI Response</h4>
                    <pre className="text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl overflow-auto max-h-60">
                        {result}
                    </pre>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-3 flex items-center gap-1">
                        <Check size={12} /> Configuration applied — check Preview tab
                    </p>
                </div>
            )}

            {/* Quick templates */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Quick Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            name: 'Professional',
                            desc: 'Clean, corporate look',
                            config: { brand_color: '#1e3a5f', accent_color: '#2563eb', hero_title: 'Client Hub', hero_subtitle: 'Your projects and documents, all in one place' },
                        },
                        {
                            name: 'Modern',
                            desc: 'Bold colors, minimal',
                            config: { brand_color: '#000000', accent_color: '#8b5cf6', hero_title: 'Welcome', hero_subtitle: 'Everything you need, nothing you don\'t' },
                        },
                        {
                            name: 'Warm',
                            desc: 'Friendly, approachable',
                            config: { brand_color: '#92400e', accent_color: '#f59e0b', hero_title: 'Hello there!', hero_subtitle: 'We\'re glad you\'re here. Let\'s get started.' },
                        },
                    ].map((template) => (
                        <button
                            key={template.name}
                            onClick={() => onChange(template.config)}
                            className="text-left p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl hover:border-blue-600 border border-transparent transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: template.config.brand_color }} />
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: template.config.accent_color }} />
                            </div>
                            <p className="text-sm font-bold">{template.name}</p>
                            <p className="text-[10px] text-zinc-500">{template.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PortalBuilder() {
    const { company } = useCompany();
    const [activeTab, setActiveTab] = useState<TabId>('customization');
    const [config, setConfig] = useState<PortalConfig>({
        ...DEFAULT_CONFIG,
        company_id: company?.id || '',
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load existing config from company settings
    useEffect(() => {
        if (!company) return;
        setConfig((prev) => ({ ...prev, company_id: company.id }));

        (async () => {
            try {
                const { data } = await supabase
                    .from('companies')
                    .select('settings')
                    .eq('id', company.id)
                    .single();

                if (data?.settings?.portal_config) {
                    setConfig((prev) => ({
                        ...prev,
                        ...data.settings.portal_config,
                        company_id: company.id,
                    }));
                }
            } catch { /* first time — use defaults */ }
            finally { setLoading(false); }
        })();
    }, [company]);

    function handleChange(patch: Partial<PortalConfig>) {
        setConfig((prev) => ({ ...prev, ...patch }));
    }

    async function handleSave() {
        if (!company) return;
        setSaving(true);
        try {
            // Read current settings first, then merge portal_config
            const { data: current } = await supabase
                .from('companies')
                .select('settings')
                .eq('id', company.id)
                .single();

            const existingSettings = current?.settings || {};
            const { error } = await supabase
                .from('companies')
                .update({
                    settings: {
                        ...existingSettings,
                        portal_config: config,
                    },
                })
                .eq('id', company.id);

            if (error) throw error;
        } catch (e: any) {
            console.error('Save failed:', e.message);
        } finally {
            setSaving(false);
        }
    }

    const tabs: { id: TabId; label: string; icon: React.ComponentType<any> }[] = [
        { id: 'preview', label: 'Preview', icon: Eye },
        { id: 'customization', label: 'Customization', icon: Palette },
        { id: 'ai-builder', label: 'AI Builder', icon: Zap },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-zinc-400">
                <Loader2 className="animate-spin mr-2" size={18} /> Loading portal configuration…
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Portal Builder</h2>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-zinc-700 shadow text-blue-600'
                                    : 'text-zinc-500 hover:text-zinc-700'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'preview' && <PreviewTab config={config} />}
            {activeTab === 'customization' && (
                <CustomizationTab config={config} onChange={handleChange} onSave={handleSave} saving={saving} />
            )}
            {activeTab === 'ai-builder' && (
                <AIBuilderTab config={config} onChange={handleChange} />
            )}
        </div>
    );
}
