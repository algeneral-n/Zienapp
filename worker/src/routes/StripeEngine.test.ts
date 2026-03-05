import { describe, it, expect, vi } from 'vitest';
import { StripeEngine } from './StripeEngine';

vi.mock('stripe', () => {
    return {
        default: class {
            customers = {
                create: vi.fn().mockResolvedValue({ id: 'cus_test' }),
                update: vi.fn().mockResolvedValue({})
            };
            checkout = {
                sessions: {
                    create: vi.fn().mockResolvedValue({ id: 'sess_test', url: 'https://stripe.test/checkout' })
                }
            };
            billingPortal = {
                sessions: {
                    create: vi.fn().mockResolvedValue({ url: 'https://stripe.test/portal' })
                }
            };
            paymentMethods = {
                attach: vi.fn().mockResolvedValue({})
            };
            subscriptions = {
                retrieve: vi.fn().mockResolvedValue({ id: 'sub_test', status: 'active' }),
                del: vi.fn().mockResolvedValue({ id: 'sub_test', status: 'canceled' })
            };
            subscriptionItems = {
                createUsageRecord: vi.fn().mockResolvedValue({ id: 'usage_test' })
            };
        }
    };
});

describe('StripeEngine', () => {
    it('creates a customer', async () => {
        const id = await StripeEngine.createCustomer('tenant1', 'test@example.com');
        expect(id).toBe('cus_test');
    });

    it('creates a checkout session', async () => {
        const session = await StripeEngine.createCheckoutSession('plan1', 'cus_test', 'success', 'cancel');
        expect(session.id).toBe('sess_test');
        expect(session.url).toBe('https://stripe.test/checkout');
    });

    it('creates a billing portal session', async () => {
        const session = await StripeEngine.createBillingPortal('cus_test', 'return');
        expect(session.url).toBe('https://stripe.test/portal');
    });

    it('attaches a payment method', async () => {
        await StripeEngine.attachPaymentMethod('cus_test', 'pm_test');
        expect(true).toBe(true); // No error thrown
    });

    it('retrieves a subscription', async () => {
        const sub = await StripeEngine.getSubscription('sub_test');
        expect(sub.id).toBe('sub_test');
        expect(sub.status).toBe('active');
    });

    it('cancels a subscription', async () => {
        const sub = await StripeEngine.cancelSubscription('sub_test');
        expect(sub.id).toBe('sub_test');
        expect(sub.status).toBe('canceled');
    });

    it('reports usage', async () => {
        const usage = await StripeEngine.reportUsage('item_test', 5);
        expect(usage.id).toBe('usage_test');
    });
});
