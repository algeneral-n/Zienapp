import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, UserPlus } from 'lucide-react';

/**
 * Sticky banner shown to visitors (unauthenticated users) browsing the platform.
 * Actions redirect to /register.
 */
export default function VisitorBanner() {
    const { t } = useTranslation();

    return (
        <div className="sticky top-0 z-40 bg-amber-500 dark:bg-amber-600 text-black px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Eye size={16} />
                <span className="text-xs font-bold">
                    {t('visitor_mode_banner', 'You are browsing as a visitor. Actions require registration.')}
                </span>
            </div>
            <Link
                to="/register"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
            >
                <UserPlus size={14} />
                {t('register_now', 'Register Now')}
            </Link>
        </div>
    );
}
