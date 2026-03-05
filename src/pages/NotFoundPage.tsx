import { Link } from 'react-router-dom';

/**
 * 404 Not Found Page — shown when no route matches.
 */
export default function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-10 text-center shadow-xl space-y-6">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-4xl font-black text-blue-600 dark:text-blue-400">404</span>
                </div>

                <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                    Page Not Found
                </h1>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    The page you are looking for does not exist or has been moved.
                </p>

                <div className="flex gap-3 pt-2">
                    <Link
                        to="/"
                        className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors text-center"
                    >
                        Go Home
                    </Link>
                    <Link
                        to="/dashboard"
                        className="flex-1 px-5 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors text-center"
                    >
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
