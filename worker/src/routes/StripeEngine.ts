import Stripe from 'stripe';

/**
 * StripeEngine — Cloudflare Worker compatible.
 * Accepts STRIPE_SECRET_KEY via parameter (CF Workers have no process.env).
 */
export class StripeEngine {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
  }

  async createCustomer(tenantId: string, email: string) {
    const customer = await this.stripe.customers.create({
      email,
      metadata: { tenantId },
    });
    return customer.id;
  }

  async createCheckoutSession(
    planId: string,
    customerId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>,
  ) {
    return await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: planId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ['card'],
      ...(metadata ? { metadata } : {}),
    });
  }

  async createSetupIntent(customerId: string, metadata?: Record<string, string>) {
    return await this.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      ...(metadata ? { metadata } : {}),
    });
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    paymentMethodId: string,
    metadata?: Record<string, string>,
  ) {
    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      ...(metadata ? { metadata } : {}),
    });
  }

  async createBillingPortal(customerId: string, returnUrl: string) {
    return await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string) {
    await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  async getSubscription(subscriptionId: string) {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string) {
    return await this.stripe.subscriptions.del(subscriptionId);
  }

  async reportUsage(subscriptionItemId: string, quantity: number) {
    return await this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      action: 'increment',
    });
  }
}
