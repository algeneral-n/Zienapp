import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Type, Layout, Component, Save, RotateCcw, Eye } from 'lucide-react';
import { SectionHeader, TabBar } from './shared';

const TABS = ['themes', 'navigation', 'layouts', 'components'] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Record<Tab, React.ElementType> = {
    themes: Palette,
    navigation: Layout,
    layouts: Layout,
    components: Component,
};

// ─── Theme Editor ───────────────────────────────────────────────────────────

function ThemeEditor() {
    const { t } = useTranslation();
    const colors = [
        { key: 'primary', label: 'Primary', value: '#2563eb' },
        { key: 'accent', label: 'Accent', value: '#8b5cf6' },
        { key: 'success', label: 'Success', value: '#10b981' },
        { key: 'warning', label: 'Warning', value: '#f59e0b' },
        { key: 'danger', label: 'Danger', value: '#ef4444' },
        { key: 'surface', label: 'Surface', value: '#ffffff' },
        { key: 'background', label: 'Background', value: '#fafafa' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-sm font-black uppercase tracking-tighter mb-4">{t('color_palette') || 'Color Palette'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {colors.map(c => (
                        <div key={c.key} className="space-y-2">
                            <div className="w-full h-16 rounded-xl border border-zinc-200 dark:border-zinc-700" style={{ backgroundColor: c.value }} />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{c.label}</p>
                            <input
                                type="text"
                                defaultValue={c.value}
                                className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-sm font-black uppercase tracking-tighter mb-4">{t('typography') || 'Typography'}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">{t('heading_font') || 'Heading Font'}</label>
                        <select className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                            <option>Inter</option>
                            <option>Poppins</option>
                            <option>Cairo</option>
                            <option>DM Sans</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">{t('body_font') || 'Body Font'}</label>
                        <select className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                            <option>Inter</option>
                            <option>Noto Sans</option>
                            <option>Cairo</option>
                            <option>IBM Plex Sans</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">{t('border_radius') || 'Border Radius'}</label>
                        <input type="range" min="0" max="32" defaultValue="24" className="w-full" />
                        <span className="text-[10px] text-zinc-500">24px</span>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">{t('density') || 'Density'}</label>
                        <select className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                            <option>Comfortable</option>
                            <option>Compact</option>
                            <option>Spacious</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Navigation Editor ──────────────────────────────────────────────────────

function NavigationEditor() {
    const { t } = useTranslation();
    const modules = [
        { key: 'hr', label: 'HR', enabled: true },
        { key: 'crm', label: 'CRM', enabled: true },
        { key: 'accounting', label: 'Accounting', enabled: true },
        { key: 'projects', label: 'Projects', enabled: true },
        { key: 'logistics', label: 'Logistics', enabled: false },
        { key: 'meetings', label: 'Meetings', enabled: true },
        { key: 'chat', label: 'Chat', enabled: true },
        { key: 'store', label: 'Store', enabled: false },
        { key: 'academy', label: 'Academy', enabled: false },
    ];

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-sm font-black uppercase tracking-tighter mb-4">{t('sidebar_modules') || 'Sidebar Modules'}</h3>
            <p className="text-xs text-zinc-500 mb-4">{t('drag_to_reorder') || 'Toggle and reorder sidebar modules for tenant dashboards.'}</p>
            <div className="space-y-2">
                {modules.map(m => (
                    <div key={m.key} className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-1 bg-zinc-300 dark:bg-zinc-600 rounded cursor-grab" />
                            <span className="text-xs font-bold uppercase tracking-widest">{m.label}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={m.enabled} className="sr-only peer" />
                            <div className="w-9 h-5 bg-zinc-300 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Layouts Editor ─────────────────────────────────────────────────────────

function LayoutsEditor() {
    const { t } = useTranslation();
    const layouts = [
        { key: 'sidebar', label: 'Sidebar + Content', active: true },
        { key: 'topnav', label: 'Top Navigation', active: false },
        { key: 'minimal', label: 'Minimal / Focus', active: false },
    ];

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-sm font-black uppercase tracking-tighter mb-4">{t('layout_template') || 'Layout Template'}</h3>
            <div className="grid grid-cols-3 gap-4">
                {layouts.map(l => (
                    <button
                        key={l.key}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${l.active
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                            }`}
                    >
                        <div className="w-full h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-2 flex items-center justify-center">
                            <Layout size={24} className="text-zinc-400" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest">{l.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Components Editor ──────────────────────────────────────────────────────

function ComponentsEditor() {
    const { t } = useTranslation();
    const components = [
        { key: 'stat-card', label: 'Stat Card', desc: 'KPI number display' },
        { key: 'chart', label: 'Chart Widget', desc: 'Line / Bar / Pie charts' },
        { key: 'table', label: 'Data Table', desc: 'Sortable, searchable table' },
        { key: 'timeline', label: 'Activity Timeline', desc: 'Chronological feed' },
        { key: 'kanban', label: 'Kanban Board', desc: 'Drag-and-drop columns' },
        { key: 'calendar', label: 'Calendar View', desc: 'Month / Week / Day' },
    ];

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-sm font-black uppercase tracking-tighter mb-4">{t('component_library') || 'Component Library'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {components.map(c => (
                    <div
                        key={c.key}
                        className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 transition-colors cursor-pointer"
                    >
                        <Component size={20} className="text-zinc-400 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">{c.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">{c.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main UIBuilder ─────────────────────────────────────────────────────────

export default function UIBuilder() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('themes');

    const tabs = TABS.map(tab => ({
        key: tab,
        label: t(tab) || tab.charAt(0).toUpperCase() + tab.slice(1),
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionHeader
                    title={t('ui_builder') || 'UI Builder'}
                    subtitle={t('ui_builder_desc') || 'Design and configure platform appearance'}
                />
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <Eye size={14} />
                        {t('preview') || 'Preview'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <RotateCcw size={14} />
                        {t('reset') || 'Reset'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                        <Save size={14} />
                        {t('save') || 'Save'}
                    </button>
                </div>
            </div>

            <TabBar
                tabs={tabs}
                active={activeTab}
                onChange={(key) => setActiveTab(key as Tab)}
            />

            {activeTab === 'themes' && <ThemeEditor />}
            {activeTab === 'navigation' && <NavigationEditor />}
            {activeTab === 'layouts' && <LayoutsEditor />}
            {activeTab === 'components' && <ComponentsEditor />}
        </div>
    );
}
