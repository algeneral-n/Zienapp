import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS } from '../../constants/assets';
import { INDUSTRY_SECTORS, getSectorModules, type IndustrySector } from '../../data/industries';
import { Video, PlayCircle, ChevronDown, ChevronUp, ArrowRight, Boxes, CheckCircle2 } from 'lucide-react';

export default function IndustriesPage() {
    const { language } = useTheme();
    const navigate = useNavigate();
    const isAr = language === 'ar';
    const videoSrc = isAr ? ASSETS.VIDEO_AR : ASSETS.VIDEO_EN;
    const [expandedSector, setExpandedSector] = useState<string | null>(null);

    const toggleSector = (code: string) => {
        setExpandedSector(prev => prev === code ? null : code);
    };

    const renderSectorCard = (sector: IndustrySector, i: number) => {
        const Icon = sector.icon;
        const isExpanded = expandedSector === sector.code;
        const modules = getSectorModules(sector.code);

        return (
            <motion.div
                key={sector.code}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className={`border rounded-[24px] overflow-hidden transition-all duration-300 ${isExpanded ? `border-${sector.color}-500/50 shadow-xl shadow-${sector.color}-600/10 bg-white dark:bg-zinc-900` : 'border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-500/30 bg-white dark:bg-zinc-900'}`}
            >
                {/* Header */}
                <button onClick={() => toggleSector(sector.code)} className="w-full p-6 text-left flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-${sector.color}-100 dark:bg-${sector.color}-900/30 text-${sector.color}-600 flex items-center justify-center shrink-0`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{isAr ? sector.nameAr : sector.nameEn}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{isAr ? sector.descAr : sector.descEn}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{sector.subActivities.length} {isAr ? 'نشاط' : 'activities'}</span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{sector.recommendedModules.length} {isAr ? 'وحدة' : 'modules'}</span>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 mt-1 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 mt-1 shrink-0" />}
                </button>

                {/* Expandable Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 space-y-5">
                                {/* Sub-Activities */}
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{isAr ? 'الأنشطة' : 'Activities'}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sector.subActivities.map(act => (
                                            <span key={act.code} className={`px-3 py-1.5 rounded-full text-xs font-bold bg-${sector.color}-50 dark:bg-${sector.color}-900/20 text-${sector.color}-700 dark:text-${sector.color}-300 border border-${sector.color}-200/50 dark:border-${sector.color}-700/30`}>
                                                {isAr ? act.nameAr : act.nameEn}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommended Modules */}
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Boxes className="w-3.5 h-3.5" /> {isAr ? 'الوحدات المتاحة' : 'Available Modules'}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {modules.map(mod => (
                                            <div key={mod.code} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/50 text-xs">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                <span className="font-medium">{isAr ? mod.nameAr : mod.nameEn}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={() => navigate('/register')}
                                    className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    {isAr ? 'ابدأ الآن' : 'Get Started'} <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-28 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Page Title */}
                <div className="flex flex-col items-center mb-12">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20 mb-4">
                        <Boxes className="w-6 h-6" />
                        <span className="text-xl font-bold">{isAr ? 'القطاعات والصناعات' : 'Industries & Sectors'}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
                        {isAr ? 'منظومة متكاملة لجميع القطاعات' : 'One Unified Platform for Every Industry'}
                    </h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 max-w-2xl">
                        {isAr
                            ? 'ZIEN تدعم 13+ قطاع صناعي بأكثر من 90 نشاط فرعي. كل الخدمات مترابطة داخل منظومة واحدة وتحكم واحد.'
                            : 'ZIEN supports 13+ industry sectors with 90+ sub-activities. All services fully integrated within one unified system.'}
                    </p>
                </div>

                {/* Video Section */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                    className="w-full mb-16">
                    <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-violet-500/20 p-1.5 shadow-2xl shadow-blue-600/15">
                        <div className="relative rounded-[1.6rem] overflow-hidden bg-black">
                            <div className="absolute top-4 left-4 z-10">
                                <span className="px-4 py-1.5 bg-blue-600/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg">
                                    <Video size={12} /> {isAr ? 'حلول الصناعات' : 'Industry Solutions'}
                                </span>
                            </div>
                            <iframe
                                src={videoSrc}
                                className="w-full aspect-video"
                                allow="autoplay; encrypted-media; fullscreen"
                                allowFullScreen
                                title={isAr ? 'حلول صناعات ZIEN' : 'ZIEN Industry Solutions'}
                                style={{ border: 'none' }}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-blue-600" /> {isAr ? 'تعرف على حلول الصناعات' : 'Discover industry solutions'}</span>
                        <span className="w-1 h-1 bg-zinc-400 rounded-full" />
                        <span>{isAr ? 'حلول مخصصة لكل قطاع' : 'Tailored solutions for every sector'}</span>
                    </div>
                </motion.div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-4 mb-12">
                    {[
                        { value: '13+', label: isAr ? 'قطاع صناعي' : 'Industry Sectors' },
                        { value: '90+', label: isAr ? 'نشاط فرعي' : 'Sub-Activities' },
                        { value: '18+', label: isAr ? 'وحدة متكاملة' : 'Integrated Modules' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="text-center p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700">
                            <div className="text-3xl font-black text-blue-600">{stat.value}</div>
                            <div className="text-xs font-bold text-gray-500 mt-1">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Sector Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-20">
                    {INDUSTRY_SECTORS.map((sector, i) => renderSectorCard(sector, i))}
                </div>
            </div>
        </div>
    );
}
