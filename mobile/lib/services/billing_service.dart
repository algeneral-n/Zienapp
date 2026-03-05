// ============================================================================
// ZIEN Mobile — Billing Service (Riverpod)
// Calls Worker billing API endpoints.
// Mirrors: web/src/pages/modules/BillingModule.tsx API calls
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';
import 'company_providers.dart';

// ─── Models ──────────────────────────────────────────────────────────────

class BillingPlan {
  final String id;
  final String code;
  final String nameAr;
  final String nameEn;
  final double priceMonthly;
  final double priceYearly;
  final String currency;
  final int maxUsers;
  final int maxUsagePerService;
  final List<String> features;
  final bool isActive;

  const BillingPlan({
    required this.id,
    required this.code,
    required this.nameAr,
    required this.nameEn,
    required this.priceMonthly,
    required this.priceYearly,
    required this.currency,
    required this.maxUsers,
    required this.maxUsagePerService,
    required this.features,
    required this.isActive,
  });

  factory BillingPlan.fromJson(Map<String, dynamic> json) => BillingPlan(
    id: json['id']?.toString() ?? '',
    code: json['code']?.toString() ?? '',
    nameAr: json['name_ar']?.toString() ?? json['code']?.toString() ?? '',
    nameEn: json['name_en']?.toString() ?? json['code']?.toString() ?? '',
    priceMonthly: (json['price_monthly'] as num?)?.toDouble() ?? 0,
    priceYearly: (json['price_yearly'] as num?)?.toDouble() ?? 0,
    currency: json['currency']?.toString() ?? 'SAR',
    maxUsers: (json['max_users'] as num?)?.toInt() ?? 0,
    maxUsagePerService: (json['max_usage_per_service'] as num?)?.toInt() ?? 0,
    features:
        (json['features'] is List)
            ? (json['features'] as List).map((e) => e.toString()).toList()
            : [],
    isActive: json['is_active'] == true,
  );
}

class BillingSubscription {
  final String id;
  final String companyId;
  final String planCode;
  final String status;
  final String billingInterval;
  final String? stripeCustomerId;
  final String? stripeSubscriptionId;
  final String? currentPeriodStart;
  final String? currentPeriodEnd;
  final String? cancelAt;
  final String? gateway;

  const BillingSubscription({
    required this.id,
    required this.companyId,
    required this.planCode,
    required this.status,
    required this.billingInterval,
    this.stripeCustomerId,
    this.stripeSubscriptionId,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.cancelAt,
    this.gateway,
  });

  factory BillingSubscription.fromJson(Map<String, dynamic> json) =>
      BillingSubscription(
        id: json['id']?.toString() ?? '',
        companyId: json['company_id']?.toString() ?? '',
        planCode: json['plan_code']?.toString() ?? '',
        status: json['status']?.toString() ?? 'incomplete',
        billingInterval: json['billing_interval']?.toString() ?? 'monthly',
        stripeCustomerId: json['stripe_customer_id']?.toString(),
        stripeSubscriptionId: json['stripe_subscription_id']?.toString(),
        currentPeriodStart: json['current_period_start']?.toString(),
        currentPeriodEnd: json['current_period_end']?.toString(),
        cancelAt: json['cancel_at']?.toString(),
        gateway: json['gateway']?.toString(),
      );

  bool get isActive => status == 'active' || status == 'trialing';
}

class BillingUsage {
  final int aiQueriesUsed;
  final int aiQuota;
  final int aiUsagePercent;
  final int activeUsers;
  final int maxUsers;
  final int userUsagePercent;

  const BillingUsage({
    required this.aiQueriesUsed,
    required this.aiQuota,
    required this.aiUsagePercent,
    required this.activeUsers,
    required this.maxUsers,
    required this.userUsagePercent,
  });

  factory BillingUsage.fromJson(Map<String, dynamic> json) {
    final ai = json['ai'] as Map<String, dynamic>? ?? {};
    final users = json['users'] as Map<String, dynamic>? ?? {};
    return BillingUsage(
      aiQueriesUsed: (ai['queries_used'] as num?)?.toInt() ?? 0,
      aiQuota: (ai['quota'] as num?)?.toInt() ?? 0,
      aiUsagePercent: (ai['usage_percent'] as num?)?.toInt() ?? 0,
      activeUsers: (users['active'] as num?)?.toInt() ?? 0,
      maxUsers: (users['max'] as num?)?.toInt() ?? 0,
      userUsagePercent: (users['usage_percent'] as num?)?.toInt() ?? 0,
    );
  }
}

// ─── Billing State ───────────────────────────────────────────────────────

class BillingState {
  final List<BillingPlan> plans;
  final BillingSubscription? subscription;
  final BillingPlan? currentPlan;
  final BillingUsage? usage;
  final bool isLoading;
  final String? error;

  const BillingState({
    this.plans = const [],
    this.subscription,
    this.currentPlan,
    this.usage,
    this.isLoading = false,
    this.error,
  });

  BillingState copyWith({
    List<BillingPlan>? plans,
    BillingSubscription? subscription,
    BillingPlan? currentPlan,
    BillingUsage? usage,
    bool? isLoading,
    String? error,
  }) {
    return BillingState(
      plans: plans ?? this.plans,
      subscription: subscription ?? this.subscription,
      currentPlan: currentPlan ?? this.currentPlan,
      usage: usage ?? this.usage,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// ─── Billing Notifier ────────────────────────────────────────────────────

class BillingNotifier extends StateNotifier<BillingState> {
  final Ref ref;
  BillingNotifier(this.ref) : super(const BillingState());

  final _api = ApiClient.instance;

  /// Fetch all billing data: plans, subscription, usage.
  Future<void> loadAll() async {
    final companyState = ref.read(companyProvider);
    final companyId = companyState.activeCompany?.id;
    if (companyId == null) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      // Load plans + subscription + usage in parallel
      final results = await Future.wait([
        _api.get('/api/billing/plans'),
        _api.get('/api/billing/subscription/$companyId'),
        _api.get('/api/billing/usage/$companyId'),
      ]);

      final plansRes = results[0];
      final subRes = results[1];
      final usageRes = results[2];

      List<BillingPlan> plans = [];
      BillingSubscription? subscription;
      BillingPlan? currentPlan;
      BillingUsage? usage;

      if (plansRes.isSuccess && plansRes.data?['plans'] is List) {
        plans =
            (plansRes.data!['plans'] as List)
                .map((e) => BillingPlan.fromJson(e as Map<String, dynamic>))
                .toList();
      }

      if (subRes.isSuccess && subRes.data?['subscription'] != null) {
        subscription = BillingSubscription.fromJson(
          subRes.data!['subscription'] as Map<String, dynamic>,
        );
        if (subRes.data?['plan'] != null) {
          currentPlan = BillingPlan.fromJson(
            subRes.data!['plan'] as Map<String, dynamic>,
          );
        }
      }

      if (usageRes.isSuccess && usageRes.data != null) {
        usage = BillingUsage.fromJson(usageRes.data!);
      }

      state = BillingState(
        plans: plans,
        subscription: subscription,
        currentPlan: currentPlan,
        usage: usage,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Create a Stripe checkout session and return the URL.
  Future<String?> createCheckoutSession({
    required String planCode,
    String billingInterval = 'monthly',
  }) async {
    final companyId = ref.read(companyProvider).activeCompany?.id;
    if (companyId == null) return null;

    final res = await _api.post(
      '/api/billing/create-checkout-session',
      body: {
        'companyId': companyId,
        'planCode': planCode,
        'billingInterval': billingInterval,
      },
    );

    if (res.isSuccess && res.data?['url'] != null) {
      return res.data!['url'] as String;
    }
    return null;
  }

  /// Create a Stripe customer portal session and return the URL.
  Future<String?> createPortalSession() async {
    final companyId = ref.read(companyProvider).activeCompany?.id;
    if (companyId == null) return null;

    final res = await _api.post(
      '/api/billing/create-portal-session',
      body: {'companyId': companyId},
    );

    if (res.isSuccess && res.data?['url'] != null) {
      return res.data!['url'] as String;
    }
    return null;
  }
}

// ─── Riverpod Providers ──────────────────────────────────────────────────

final billingProvider = StateNotifierProvider<BillingNotifier, BillingState>((
  ref,
) {
  return BillingNotifier(ref);
});
