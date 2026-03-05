import React from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, Users, CreditCard, Package, Bot, Phone } from 'lucide-react';

export default function HelpCenterPage() {
    const { t } = useTranslation();

    const items = [
        { titleKey: 'getting_started', descKey: 'getting_started_desc', Icon: Rocket },
        { titleKey: 'user_management_help', descKey: 'user_management_help_desc', Icon: Users },
        { titleKey: 'billing_plans_help', descKey: 'billing_plans_help_desc', Icon: CreditCard },
        { titleKey: 'modules_guide', descKey: 'modules_guide_desc', Icon: Package },
        { titleKey: 'ai_assistant_help', descKey: 'ai_assistant_help_desc', Icon: Bot },
        { titleKey: 'contact_support_help', descKey: 'contact_support_help_desc', Icon: Phone },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 pt-24 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
                    {t('help_center_title', 'Help Center')}
                </h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-12">
                    {t('help_center_subtitle', 'Find answers, guides, and support resources')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map((item) => (
                        <div
                            key={item.titleKey}
                            className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition cursor-pointer"
                        >
                            <item.Icon className="w-8 h-8 text-blue-600 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t(item.titleKey)}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t(item.descKey)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
