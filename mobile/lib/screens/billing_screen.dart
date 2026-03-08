// ============================================================================
// ZIEN Mobile — Billing Screen
// Displays subscription overview, plans grid, usage, and checkout/portal links.
// Mirrors: web/src/pages/modules/BillingModule.tsx
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/billing_service.dart';
import '../services/i18n_service.dart';
import '../widgets/role_guard.dart';

class BillingScreen extends ConsumerStatefulWidget {
  const BillingScreen({super.key});

  @override
  ConsumerState<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends ConsumerState<BillingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _interval = 'monthly';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    // Load billing data on init
    Future.microtask(() => ref.read(billingProvider.notifier).loadAll());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final billing = ref.watch(billingProvider);
    final t = ref.watch(tProvider);

    return RouteRoleGuard(
      minLevel: 60, // accountant+, GM+ for billing access
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            t('billing'),
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          actions: [
            IconButton(
              onPressed: () => ref.read(billingProvider.notifier).loadAll(),
              icon: const Icon(Icons.refresh),
            ),
          ],
          bottom: TabBar(
            controller: _tabController,
            tabs: [
              Tab(text: t('billing_overview')),
              Tab(text: t('subscription_plan')),
            ],
          ),
        ),
        body:
            billing.isLoading
                ? const Center(child: CircularProgressIndicator())
                : billing.error != null
                ? _ErrorView(
                  error: billing.error!,
                  onRetry: () => ref.read(billingProvider.notifier).loadAll(),
                )
                : TabBarView(
                  controller: _tabController,
                  children: [
                    _OverviewTab(
                      billing: billing,
                      t: t,
                      onManagePortal: _handleManagePortal,
                    ),
                    _PlansTab(
                      billing: billing,
                      t: t,
                      interval: _interval,
                      onIntervalChanged: (v) => setState(() => _interval = v),
                      onSelectPlan: _handleSelectPlan,
                    ),
                  ],
                ),
      ),
    );
  }

  Future<void> _handleManagePortal() async {
    final url = await ref.read(billingProvider.notifier).createPortalSession();
    if (url != null) {
      await _openUrl(url);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open billing portal')),
      );
    }
  }

  Future<void> _handleSelectPlan(BillingPlan plan) async {
    final url = await ref
        .read(billingProvider.notifier)
        .createCheckoutSession(planCode: plan.code, billingInterval: _interval);
    if (url != null) {
      await _openUrl(url);
    } else if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Could not start checkout')));
    }
  }
}

// ─── Overview Tab ────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final BillingState billing;
  final String Function(String) t;
  final VoidCallback onManagePortal;

  const _OverviewTab({
    required this.billing,
    required this.t,
    required this.onManagePortal,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final sub = billing.subscription;
    final plan = billing.currentPlan;
    final usage = billing.usage;

    if (sub == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.workspace_premium,
                size: 64,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(height: 16),
              Text(
                t('subscription_plan'),
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'No active subscription. Choose a plan to get started.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        // The parent will handle refresh via button
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Current Plan Card
          _CurrentPlanCard(sub: sub, plan: plan, t: t),
          const SizedBox(height: 16),

          // Quick Actions
          Row(
            children: [
              Expanded(
                child: _ActionCard(
                  icon: Icons.settings,
                  iconColor: Colors.blue,
                  title: t('payment_methods'),
                  subtitle: 'Manage cards',
                  onTap: onManagePortal,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ActionCard(
                  icon: Icons.receipt_long,
                  iconColor: Colors.amber.shade700,
                  title: t('payment_history'),
                  subtitle: 'View invoices',
                  onTap: onManagePortal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Usage Section
          if (usage != null) ...[
            Text(
              t('usage_limits'),
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 12),
            _UsageCard(
              label: 'AI Queries',
              icon: Icons.bolt,
              color: Colors.blue,
              used: usage.aiQueriesUsed,
              total: usage.aiQuota,
            ),
            const SizedBox(height: 8),
            _UsageCard(
              label: t('users'),
              icon: Icons.people,
              color: Colors.teal,
              used: usage.activeUsers,
              total: usage.maxUsers,
            ),
          ],

          // Cancel Warning
          if (sub.cancelAt != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.amber.shade200),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.warning_amber,
                    color: Colors.amber.shade700,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t('cancel_subscription'),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.amber.shade900,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          'Ends on ${sub.cancelAt}',
                          style: TextStyle(
                            color: Colors.amber.shade700,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Current Plan Card ───────────────────────────────────────────────────

class _CurrentPlanCard extends StatelessWidget {
  final BillingSubscription sub;
  final BillingPlan? plan;
  final String Function(String) t;

  const _CurrentPlanCard({
    required this.sub,
    required this.plan,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (sub.status) {
      'active' => Colors.green,
      'trialing' => Colors.blue,
      'past_due' => Colors.amber,
      'canceled' => Colors.red,
      _ => Colors.grey,
    };

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('current_plan').toUpperCase(),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            plan?.nameEn ?? sub.planCode,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w900,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  sub.status.toUpperCase(),
                  style: TextStyle(
                    color: statusColor.shade100,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                sub.billingInterval,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _PlanStat(
                label: t('amount_due'),
                value:
                    plan != null
                        ? '${plan!.currency} ${sub.billingInterval == 'yearly' ? plan!.priceYearly : plan!.priceMonthly}'
                        : '—',
              ),
              const SizedBox(width: 24),
              _PlanStat(
                label: t('next_billing_date'),
                value:
                    sub.currentPeriodEnd != null
                        ? sub.currentPeriodEnd!.substring(0, 10)
                        : '—',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PlanStat extends StatelessWidget {
  final String label;
  final String value;
  const _PlanStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 9,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }
}

// ─── Action Card ─────────────────────────────────────────────────────────

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: theme.dividerColor.withValues(alpha: 0.3),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: iconColor, size: 22),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 10,
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Usage Card ──────────────────────────────────────────────────────────

class _UsageCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final int used;
  final int total;

  const _UsageCard({
    required this.label,
    required this.icon,
    required this.color,
    required this.used,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pct = total > 0 ? (used / total).clamp(0.0, 1.0) : 0.0;
    final barColor =
        pct > 0.9 ? Colors.red : (pct > 0.7 ? Colors.amber : color);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
              const Spacer(),
              Text(
                '$used / $total',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct,
              backgroundColor: theme.colorScheme.onSurface.withValues(
                alpha: 0.08,
              ),
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Plans Tab ───────────────────────────────────────────────────────────

class _PlansTab extends StatelessWidget {
  final BillingState billing;
  final String Function(String) t;
  final String interval;
  final ValueChanged<String> onIntervalChanged;
  final Future<void> Function(BillingPlan) onSelectPlan;

  const _PlansTab({
    required this.billing,
    required this.t,
    required this.interval,
    required this.onIntervalChanged,
    required this.onSelectPlan,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Interval Toggle
        Center(
          child: SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'monthly', label: Text('Monthly')),
              ButtonSegment(value: 'yearly', label: Text('Yearly — Save 17%')),
            ],
            selected: {interval},
            onSelectionChanged: (v) => onIntervalChanged(v.first),
          ),
        ),
        const SizedBox(height: 20),

        // Plans Grid
        ...billing.plans.map((plan) {
          final isCurrent = plan.code == billing.subscription?.planCode;
          final price =
              interval == 'yearly' ? plan.priceYearly : plan.priceMonthly;

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color:
                    isCurrent
                        ? theme.colorScheme.primary
                        : theme.dividerColor.withValues(alpha: 0.3),
                width: isCurrent ? 2 : 1,
              ),
              color:
                  isCurrent
                      ? theme.colorScheme.primary.withValues(alpha: 0.05)
                      : theme.colorScheme.surface,
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isCurrent)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      t('current_plan').toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                if (isCurrent) const SizedBox(height: 8),
                Text(
                  plan.nameEn,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    style: theme.textTheme.bodyMedium,
                    children: [
                      TextSpan(
                        text: '${plan.currency} $price',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      TextSpan(
                        text: interval == 'yearly' ? ' /yr' : ' /mo',
                        style: TextStyle(
                          fontSize: 14,
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _PlanFeature(Icons.people, 'Up to ${plan.maxUsers} users'),
                _PlanFeature(
                  Icons.bolt,
                  '${plan.maxUsagePerService} AI queries/mo',
                ),
                ...plan.features
                    .take(4)
                    .map((f) => _PlanFeature(Icons.check_circle, f)),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: isCurrent ? null : () => onSelectPlan(plan),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      isCurrent
                          ? t('current_plan').toUpperCase()
                          : t('upgrade_plan').toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

class _PlanFeature extends StatelessWidget {
  final IconData icon;
  final String text;
  const _PlanFeature(this.icon, this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Colors.teal),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Error View ──────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(error, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
