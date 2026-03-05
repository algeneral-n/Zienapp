import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    CreditCard, Check, Loader2, Receipt,
    ChevronDown, ChevronUp, Tag, Users,
    Package, Plug, Sparkles, Calendar,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import {
    provisioningService,
    type QuoteRequest,
    type QuoteResult,
    type QuoteItem,
} from '../services/provisioningService';

interface PricingQuoteProps {
    companyId: string;
    country?: string;
    industry?: string;
    employeeCount?: number;
    modules?: string[];
    integrations?: string[];
    businessSize?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
    companyTypeCode?: string;
    onQuoteGenerated?: (quote: QuoteResult) => void;
    onAccepted?: (quoteId: string) => void;
    className?: string;
}

const ITEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    base_plan: CreditCard,
    module_addon: Package,
    seat_overage: Users,
    integration: Plug,
    discount: Tag,
};

export default function PricingQuote({
    companyId,
    country,
    industry,
    employeeCount = 5,
    modules = [],
    integrations = [],
    businessSize,
    companyTypeCode,
    onQuoteGenerated,
    onAccepted,
    className = '',
}: PricingQuoteProps) {
    const { language } = useTheme();
    const isAr = language === 'ar';

    const [quote, setQuote] = useState<QuoteResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(true);

    const generateQuote = async (cycle?: 'monthly' | 'yearly', coupon?: string) => {
        setLoading(true);
        setError('');
        try {
            const request: QuoteRequest = {
                companyId,
                companyTypeCode,
                country,
                industry,
                employeeCount,
                modules,
                integrations,
                businessSize,
                billingCycle: cycle ?? billingCycle,
                couponCode: coupon ?? (couponApplied ? couponCode : undefined),
            };

            const result = await provisioningService.generateQuote(request);
            setQuote(result);
            onQuoteGenerated?.(result);
        } catch (err: any) {
            setError(err.message || (isAr ? 'فشل إنشاء عرض السعر' : 'Failed to generate quote'));
        } finally {
            setLoading(false);
        }
    };

    // Generate on mount and when key props change
    useEffect(() => {
        if (companyId) {
            generateQuote();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId, employeeCount, modules.join(','), billingCycle]);

    const handleCycleChange = (cycle: 'monthly' | 'yearly') => {
        setBillingCycle(cycle);
        generateQuote(cycle);
    };

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) return;
        setCouponApplied(true);
        generateQuote(billingCycle, couponCode.trim());
    };

    const handleAccept = () => {
        if (quote?.quoteId) {
            onAccepted?.(quote.quoteId);
        }
    };

    const formatPrice = (amount: number, currency: string) => {
        const formatted = Math.abs(amount).toLocaleString(isAr ? 'ar-AE' : 'en-AE', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
        return amount < 0 ? `-${formatted} ${currency}` : `${formatted} ${currency}`;
    };

    const getItemIcon = (itemType: string) => {
        const Icon = ITEM_ICONS[itemType] || Receipt;
        return <Icon className="w-4 h-4" />;
    };

    if (loading && !quote) {
        return (
            <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                <p className="text-sm text-gray-500">
                    {isAr ? 'جاري إنشاء عرض السعر...' : 'Generating your quote...'}
                </p>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Receipt className="w-6 h-6 text-white" />
                        <h3 className="text-lg font-semibold text-white">
                            {isAr ? 'عرض السعر' : 'Pricing Quote'}
                        </h3>
                    </div>
                    {quote && (
                        <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                            {isAr ? 'صالح حتى' : 'Valid until'}{' '}
                            {new Date(quote.validUntil).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE')}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-6">
                {/* Billing cycle toggle */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <button
                        onClick={() => handleCycleChange('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        <Calendar className="w-3.5 h-3.5 inline-block ltr:mr-1.5 rtl:ml-1.5" />
                        {isAr ? 'شهري' : 'Monthly'}
                    </button>
                    <button
                        onClick={() => handleCycleChange('yearly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'yearly'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        <Sparkles className="w-3.5 h-3.5 inline-block ltr:mr-1.5 rtl:ml-1.5" />
                        {isAr ? 'سنوي (وفر أكثر)' : 'Yearly (Save more)'}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {quote && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Total */}
                        <div className="text-center py-4">
                            <div className="text-4xl font-bold text-gray-900 dark:text-white">
                                {formatPrice(quote.total, quote.currency)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {billingCycle === 'monthly'
                                    ? (isAr ? '/ شهرياً' : '/ month')
                                    : (isAr ? '/ سنوياً' : '/ year')}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {isAr ? 'الخطة:' : 'Plan:'} {quote.plan} · {quote.employeeCount}{' '}
                                {isAr ? 'موظف' : 'employees'}
                            </p>
                        </div>

                        {/* Breakdown toggle */}
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span>{isAr ? 'تفاصيل التسعير' : 'Pricing Breakdown'}</span>
                            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <AnimatePresence>
                            {showBreakdown && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-2 pb-2">
                                        {quote.items.map((item: QuoteItem, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${item.itemType === 'discount'
                                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                        : 'bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {getItemIcon(item.itemType)}
                                                    <span className="truncate max-w-[200px]">{item.description}</span>
                                                    {item.quantity > 1 && (
                                                        <span className="text-xs text-gray-400">×{item.quantity}</span>
                                                    )}
                                                </div>
                                                <span className="font-medium whitespace-nowrap">
                                                    {formatPrice(item.totalPrice, item.currency)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Subtotal & Discount summary */}
                                    {quote.discount > 0 && (
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                            <div className="flex justify-between text-sm text-gray-500 px-3">
                                                <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                                <span>{formatPrice(quote.subtotal, quote.currency)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-green-600 px-3">
                                                <span>{isAr ? 'الخصم' : 'Discount'}</span>
                                                <span>-{formatPrice(quote.discount, quote.currency)}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Coupon input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => {
                                    setCouponCode(e.target.value);
                                    setCouponApplied(false);
                                }}
                                placeholder={isAr ? 'رمز الخصم' : 'Coupon code'}
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleApplyCoupon}
                                disabled={!couponCode.trim() || loading}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
                            >
                                {couponApplied ? <Check className="w-4 h-4 text-green-500" /> : (isAr ? 'تطبيق' : 'Apply')}
                            </button>
                        </div>

                        {/* Accept button */}
                        {onAccepted && (
                            <button
                                onClick={handleAccept}
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        {isAr ? 'قبول عرض السعر والمتابعة' : 'Accept Quote & Continue'}
                                    </>
                                )}
                            </button>
                        )}

                        {/* Quote ID reference */}
                        <p className="text-center text-xs text-gray-400">
                            {isAr ? 'رقم العرض:' : 'Quote #'} {quote.quoteId.slice(0, 8)}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
