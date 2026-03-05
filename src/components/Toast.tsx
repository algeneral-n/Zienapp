import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextValue {
    toast: (type: ToastType, title: string, message?: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const BG: Record<ToastType, string> = {
    success: 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700',
    error: 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700',
    warning: 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700',
    info: 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700',
};

const TEXT: Record<ToastType, string> = {
    success: 'text-emerald-700 dark:text-emerald-300',
    error: 'text-red-700 dark:text-red-300',
    warning: 'text-amber-700 dark:text-amber-300',
    info: 'text-blue-700 dark:text-blue-300',
};

// ─── Provider ────────────────────────────────────────────────────────────────

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = ++nextId;
        setToasts((prev) => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4500);
    }, []);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value: ToastContextValue = {
        toast: addToast,
        success: (t, m) => addToast('success', t, m),
        error: (t, m) => addToast('error', t, m),
        warning: (t, m) => addToast('warning', t, m),
        info: (t, m) => addToast('info', t, m),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast stack */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => {
                        const Icon = ICON[t.type];
                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                                transition={{ duration: 0.25 }}
                                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${BG[t.type]}`}
                            >
                                <Icon size={18} className={`mt-0.5 shrink-0 ${TEXT[t.type]}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold ${TEXT[t.type]}`}>{t.title}</p>
                                    {t.message && (
                                        <p className={`text-xs mt-0.5 opacity-80 ${TEXT[t.type]}`}>{t.message}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => remove(t.id)}
                                    className={`shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${TEXT[t.type]}`}
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
