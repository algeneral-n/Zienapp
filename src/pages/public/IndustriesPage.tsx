import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS } from '../../constants/assets';
import { Store, Briefcase, HardHat, UtensilsCrossed, Heart, GraduationCap, Monitor, Truck, Home, Factory, Video, PlayCircle } from 'lucide-react';

const industries = [
    { code: 'general_trading', nameEn: 'General Trading', nameAr: 'تجارة عامة', Icon: Store },
    { code: 'professional_services', nameEn: 'Professional Services', nameAr: 'خدمات مهنية', Icon: Briefcase },
    { code: 'construction', nameEn: 'Construction', nameAr: 'مقاولات', Icon: HardHat },
    { code: 'food_beverage', nameEn: 'Food & Beverage', nameAr: 'أغذية ومشروبات', Icon: UtensilsCrossed },
    { code: 'healthcare', nameEn: 'Healthcare', nameAr: 'رعاية صحية', Icon: Heart },
    { code: 'education', nameEn: 'Education', nameAr: 'تعليم', Icon: GraduationCap },
    { code: 'technology', nameEn: 'Technology', nameAr: 'تكنولوجيا', Icon: Monitor },
    { code: 'logistics', nameEn: 'Logistics', nameAr: 'لوجستيات', Icon: Truck },
    { code: 'real_estate', nameEn: 'Real Estate', nameAr: 'عقارات', Icon: Home },
    { code: 'manufacturing', nameEn: 'Manufacturing', nameAr: 'تصنيع', Icon: Factory },
];

export default function IndustriesPage() {
    const { language } = useTheme();
    const isAr = language === 'ar';
    const videoSrc = isAr ? ASSETS.VIDEO_AR : ASSETS.VIDEO_EN;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-28 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Page Title Card */}
                <div className="flex flex-col items-center mb-12">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20 mb-4">
                    <Factory className="w-6 h-6" />
                    <span className="text-xl font-bold">{isAr ? 'الصناعات المدعومة' : 'Supported Industries'}</span>
                  </div>
                  <p className="text-center text-gray-500 dark:text-gray-400 max-w-lg">
                    {isAr ? 'تتكيف ZIEN مع نوع عملك بوحدات وسير عمل مُعدة مسبقًا' : 'ZIEN adapts to your business type with pre-configured modules and workflows'}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {industries.map((ind, i) => (
                        <motion.div
                            key={ind.code}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg hover:border-blue-500/50 transition-all group"
                        >
                            <ind.Icon className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{isAr ? ind.nameAr : ind.nameEn}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{isAr ? ind.nameEn : ind.nameAr}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
