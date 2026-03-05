import React from 'react';
import { Store, Briefcase, HardHat, UtensilsCrossed, Heart, GraduationCap, Monitor, Truck, Home, Factory } from 'lucide-react';

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
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 pt-24 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
                    الصناعات المدعومة
                </h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-12">
                    ZIEN adapts to your business type with pre-configured modules and workflows
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {industries.map((ind) => (
                        <div
                            key={ind.code}
                            className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition"
                        >
                            <ind.Icon className="w-10 h-10 text-blue-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ind.nameEn}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{ind.nameAr}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
