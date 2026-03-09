/**
 * StripePaymentForm — Embedded Stripe Payment Element.
 * Supports Google Pay, Apple Pay, cards, and Link automatically.
 * Requires VITE_STRIPE_PUBLISHABLE_KEY environment variable.
 */
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck, CreditCard } from 'lucide-react';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

interface PaymentFormProps {
    clientSecret: string;
    planName: string;
    amount: string;
    currency: string;
    onSuccess: (paymentMethodId: string) => void;
    onCancel: () => void;
    language?: string;
}

function CheckoutForm({
    planName,
    amount,
    currency,
    onSuccess,
    onCancel,
    language = 'en',
}: Omit<PaymentFormProps, 'clientSecret'>) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isAr = language === 'ar';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message ?? 'Validation error');
            setLoading(false);
            return;
        }

        const { error: confirmError, setupIntent } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/portal?billing=success`,
            },
            redirect: 'if_required',
        });

        if (confirmError) {
            setError(confirmError.message ?? 'Payment failed');
            setLoading(false);
            return;
        }

        if (setupIntent?.payment_method) {
            onSuccess(
                typeof setupIntent.payment_method === 'string'
                    ? setupIntent.payment_method
                    : setupIntent.payment_method.id,
            );
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Plan summary */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {planName}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {isAr ? 'اشتراك شهري' : 'Monthly subscription'}
                    </p>
                </div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {currency} {amount}
                </p>
            </div>

            {/* Payment Element — renders Google Pay, Apple Pay, cards */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        wallets: { googlePay: 'auto', applePay: 'auto' },
                    }}
                />
            </div>

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* Security badge */}
            <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                <ShieldCheck className="w-4 h-4" />
                <span>
                    {isAr
                        ? 'مشفّر ومحمي بواسطة Stripe'
                        : 'Encrypted and secured by Stripe'}
                </span>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                    type="submit"
                    disabled={loading || !stripe || !elements}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <CreditCard className="w-4 h-4" />
                    )}
                    {isAr ? 'تأكيد الدفع' : 'Confirm Payment'}
                </button>
            </div>
        </form>
    );
}

export default function StripePaymentForm(props: PaymentFormProps) {
    const { clientSecret, language = 'en' } = props;

    if (!stripePromise) {
        return (
            <div className="p-6 text-center text-sm text-red-500">
                Stripe publishable key not configured.
            </div>
        );
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#2563eb',
                        borderRadius: '12px',
                        fontFamily: 'Inter, system-ui, sans-serif',
                    },
                },
                locale: language === 'ar' ? 'ar' : 'en',
            }}
        >
            <CheckoutForm {...props} />
        </Elements>
    );
}
