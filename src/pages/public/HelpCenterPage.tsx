import React from 'react';
import { Rocket, Users, CreditCard, Package, Bot, Phone } from 'lucide-react';

export default function HelpCenterPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 pt-24 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
                    مركز المساعدة
                </h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-12">
                    Find answers, guides, and support resources
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { title: 'Getting Started', description: 'Learn how to set up your company on ZIEN', Icon: Rocket },
                        { title: 'User Management', description: 'Invite team members and manage roles', Icon: Users },
                        { title: 'Billing & Plans', description: 'Understand pricing, upgrades, and invoices', Icon: CreditCard },
                        { title: 'Modules Guide', description: 'How to use HR, CRM, Accounting, and more', Icon: Package },
                        { title: 'AI Assistant', description: 'Get the most from RARE AI', Icon: Bot },
                        { title: 'Contact Support', description: 'Reach our team for personalized help', Icon: Phone },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition cursor-pointer"
                        >
                            <item.Icon className="w-8 h-8 text-blue-600 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
