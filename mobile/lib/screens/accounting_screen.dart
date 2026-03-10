// ============================================================================
// ZIEN Mobile — Accounting Screen
// Full-featured accounting UI with 6 tabs matching web AccountingModule.tsx
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/accounting_service.dart';
import '../services/i18n_service.dart';

class AccountingScreen extends ConsumerStatefulWidget {
  const AccountingScreen({super.key});

  @override
  ConsumerState<AccountingScreen> createState() => _AccountingScreenState();
}

class _AccountingScreenState extends ConsumerState<AccountingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    // Load initial data
    Future.microtask(() {
      ref.read(accountingProvider.notifier).loadAccounts();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(translatorProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          t('accounting', fallback: 'Accounting'),
          style: const TextStyle(
            fontWeight: FontWeight.w900,
            letterSpacing: -0.5,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.2,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
          tabs: [
            Tab(text: t('chart_of_accounts', fallback: 'Accounts')),
            Tab(text: t('journal_entries', fallback: 'Journal')),
            Tab(text: t('general_ledger', fallback: 'Ledger')),
            Tab(text: t('financial_reports', fallback: 'Reports')),
            Tab(text: t('cost_centers', fallback: 'Cost Centers')),
            Tab(text: t('ai_insights', fallback: 'AI Insights')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _ChartOfAccountsTab(),
          _JournalEntriesTab(),
          _GeneralLedgerTab(),
          _FinancialReportsTab(),
          _CostCentersTab(),
          _AIInsightsTab(),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CHART OF ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════
class _ChartOfAccountsTab extends ConsumerStatefulWidget {
  const _ChartOfAccountsTab();

  @override
  ConsumerState<_ChartOfAccountsTab> createState() =>
      _ChartOfAccountsTabState();
}

class _ChartOfAccountsTabState extends ConsumerState<_ChartOfAccountsTab> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(accountingProvider.notifier).loadAccounts();
    });
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'asset':
        return Colors.blue;
      case 'liability':
        return Colors.red;
      case 'equity':
        return Colors.purple;
      case 'revenue':
        return Colors.green;
      case 'expense':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(accountingProvider);
    final t = ref.watch(translatorProvider);

    if (state.loading && state.accounts.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(accountingProvider.notifier).loadAccounts(),
      child:
          state.accounts.isEmpty
              ? Center(
                child: Text(
                  t('no_accounts', fallback: 'No accounts configured'),
                  style: TextStyle(color: Colors.grey[500]),
                ),
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.accounts.length,
                itemBuilder: (context, index) {
                  final acc = state.accounts[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _typeColor(
                          acc.accountType,
                        ).withValues(alpha: 0.1),
                        child: Text(
                          acc.accountCode.length > 2
                              ? acc.accountCode.substring(0, 2)
                              : acc.accountCode,
                          style: TextStyle(
                            color: _typeColor(acc.accountType),
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      title: Text(
                        acc.nameEn,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        '${acc.accountCode} · ${acc.accountType.toUpperCase()}',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[500],
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                      trailing: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: acc.isActive ? Colors.green : Colors.grey[300],
                        ),
                      ),
                    ),
                  );
                },
              ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. JOURNAL ENTRIES
// ═══════════════════════════════════════════════════════════════════════════
class _JournalEntriesTab extends ConsumerStatefulWidget {
  const _JournalEntriesTab();

  @override
  ConsumerState<_JournalEntriesTab> createState() => _JournalEntriesTabState();
}

class _JournalEntriesTabState extends ConsumerState<_JournalEntriesTab> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(accountingProvider.notifier).loadJournalEntries();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(accountingProvider);
    final t = ref.watch(translatorProvider);

    if (state.loading && state.journalEntries.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh:
          () => ref.read(accountingProvider.notifier).loadJournalEntries(),
      child:
          state.journalEntries.isEmpty
              ? Center(
                child: Text(
                  t('no_journal_entries', fallback: 'No journal entries yet'),
                  style: TextStyle(color: Colors.grey[500]),
                ),
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.journalEntries.length,
                itemBuilder: (context, index) {
                  final entry = state.journalEntries[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                entry.reference ?? '—',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                entry.entryDate,
                                style: TextStyle(
                                  color: Colors.grey[500],
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              _MetricChip(
                                label: t('debit', fallback: 'Debit'),
                                value: entry.totalDebit.toStringAsFixed(2),
                                color: Colors.blue,
                              ),
                              const SizedBox(width: 12),
                              _MetricChip(
                                label: t('credit', fallback: 'Credit'),
                                value: entry.totalCredit.toStringAsFixed(2),
                                color: Colors.green,
                              ),
                              const Spacer(),
                              Text(
                                '${entry.lineCount} lines',
                                style: TextStyle(
                                  color: Colors.grey[400],
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. GENERAL LEDGER
// ═══════════════════════════════════════════════════════════════════════════
class _GeneralLedgerTab extends ConsumerStatefulWidget {
  const _GeneralLedgerTab();

  @override
  ConsumerState<_GeneralLedgerTab> createState() => _GeneralLedgerTabState();
}

class _GeneralLedgerTabState extends ConsumerState<_GeneralLedgerTab> {
  String? _selectedAccount;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(accountingProvider);
    final t = ref.watch(translatorProvider);
    final accounts = state.accounts;

    return Column(
      children: [
        // Account selector
        Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child:
              accounts.isEmpty
                  ? Center(
                    child: Text(
                      t('no_accounts', fallback: 'Load accounts first'),
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                  )
                  : ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: accounts.length,
                    itemBuilder: (context, i) {
                      final acc = accounts[i];
                      final isSelected = _selectedAccount == acc.accountCode;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(
                            '${acc.accountCode} - ${acc.nameEn}',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color:
                                  isSelected ? Colors.white : Colors.grey[600],
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: Colors.blue,
                          onSelected: (_) {
                            setState(() => _selectedAccount = acc.accountCode);
                            ref
                                .read(accountingProvider.notifier)
                                .loadLedger(acc.accountCode);
                          },
                        ),
                      );
                    },
                  ),
        ),
        const Divider(height: 1),
        // Ledger entries
        Expanded(
          child:
              state.loading
                  ? const Center(child: CircularProgressIndicator())
                  : _selectedAccount == null
                  ? Center(
                    child: Text(
                      t('select_account', fallback: 'Select an account above'),
                      style: TextStyle(color: Colors.grey[500]),
                    ),
                  )
                  : state.ledger.isEmpty
                  ? Center(
                    child: Text(
                      t('no_entries', fallback: 'No entries for this account'),
                      style: TextStyle(color: Colors.grey[500]),
                    ),
                  )
                  : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.ledger.length,
                    itemBuilder: (context, i) {
                      final e = state.ledger[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 6),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      e.description ?? '—',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                      ),
                                    ),
                                    Text(
                                      e.entryDate,
                                      style: TextStyle(
                                        color: Colors.grey[500],
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (e.debit > 0)
                                _MetricChip(
                                  label: 'Dr',
                                  value: e.debit.toStringAsFixed(2),
                                  color: Colors.blue,
                                ),
                              if (e.credit > 0)
                                Padding(
                                  padding: const EdgeInsets.only(left: 8),
                                  child: _MetricChip(
                                    label: 'Cr',
                                    value: e.credit.toStringAsFixed(2),
                                    color: Colors.green,
                                  ),
                                ),
                              const SizedBox(width: 12),
                              Text(
                                e.runningBalance.toStringAsFixed(2),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. FINANCIAL REPORTS
// ═══════════════════════════════════════════════════════════════════════════
class _FinancialReportsTab extends ConsumerStatefulWidget {
  const _FinancialReportsTab();

  @override
  ConsumerState<_FinancialReportsTab> createState() =>
      _FinancialReportsTabState();
}

class _FinancialReportsTabState extends ConsumerState<_FinancialReportsTab> {
  int _selected = 0; // 0=trial, 1=income, 2=balance

  void _loadReport() {
    final notifier = ref.read(accountingProvider.notifier);
    switch (_selected) {
      case 0:
        notifier.loadTrialBalance();
        break;
      case 1:
        notifier.loadIncomeStatement();
        break;
      case 2:
        notifier.loadBalanceSheet();
        break;
    }
  }

  @override
  void initState() {
    super.initState();
    Future.microtask(() => _loadReport());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(accountingProvider);
    final t = ref.watch(translatorProvider);

    return Column(
      children: [
        // Report selector
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              _reportBtn(0, t('trial_balance', fallback: 'Trial Balance')),
              const SizedBox(width: 8),
              _reportBtn(
                1,
                t('income_statement', fallback: 'Income Statement'),
              ),
              const SizedBox(width: 8),
              _reportBtn(2, t('balance_sheet', fallback: 'Balance Sheet')),
            ],
          ),
        ),
        Expanded(
          child:
              state.loading
                  ? const Center(child: CircularProgressIndicator())
                  : _selected == 0
                  ? _buildTrialBalance(state, t)
                  : _selected == 1
                  ? _buildIncomeStatement(state, t)
                  : _buildBalanceSheet(state, t),
        ),
      ],
    );
  }

  Widget _reportBtn(int idx, String label) {
    final isActive = _selected == idx;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _selected = idx);
          _loadReport();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? Colors.blue : Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
                color: isActive ? Colors.white : Colors.grey[600],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTrialBalance(
    AccountingState state,
    String Function(String, {String? fallback}) t,
  ) {
    if (state.trialBalance.isEmpty) {
      return Center(
        child: Text(
          t('no_entries', fallback: 'No data'),
          style: TextStyle(color: Colors.grey[500]),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: state.trialBalance.length,
      itemBuilder: (context, i) {
        final r = state.trialBalance[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        r.nameEn,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        r.accountCode,
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 10,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
                if (r.totalDebit > 0)
                  _MetricChip(
                    label: 'Dr',
                    value: r.totalDebit.toStringAsFixed(2),
                    color: Colors.blue,
                  ),
                if (r.totalCredit > 0)
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: _MetricChip(
                      label: 'Cr',
                      value: r.totalCredit.toStringAsFixed(2),
                      color: Colors.green,
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildIncomeStatement(
    AccountingState state,
    String Function(String, {String? fallback}) t,
  ) {
    final data = state.incomeStatement;
    if (data == null) {
      return Center(
        child: Text(
          t('no_entries', fallback: 'No data'),
          style: TextStyle(color: Colors.grey[500]),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _SummaryCard(
            title: t('total_revenue', fallback: 'Total Revenue'),
            value: data.totalRevenue,
            color: Colors.green,
            icon: Icons.trending_up,
          ),
          const SizedBox(height: 12),
          _SummaryCard(
            title: t('total_expenses', fallback: 'Total Expenses'),
            value: data.totalExpenses,
            color: Colors.red,
            icon: Icons.trending_down,
          ),
          const SizedBox(height: 12),
          _SummaryCard(
            title: t('net_income', fallback: 'Net Income'),
            value: data.netIncome,
            color: data.netIncome >= 0 ? Colors.blue : Colors.orange,
            icon: Icons.attach_money,
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceSheet(
    AccountingState state,
    String Function(String, {String? fallback}) t,
  ) {
    final data = state.balanceSheet;
    if (data == null) {
      return Center(
        child: Text(
          t('no_entries', fallback: 'No data'),
          style: TextStyle(color: Colors.grey[500]),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _SummaryCard(
            title: t('total_assets', fallback: 'Total Assets'),
            value: data.totalAssets,
            color: Colors.blue,
            icon: Icons.account_balance,
          ),
          const SizedBox(height: 12),
          _SummaryCard(
            title: t('total_liabilities', fallback: 'Total Liabilities'),
            value: data.totalLiabilities,
            color: Colors.red,
            icon: Icons.warning_amber,
          ),
          const SizedBox(height: 12),
          _SummaryCard(
            title: t('total_equity', fallback: 'Total Equity'),
            value: data.totalEquity,
            color: Colors.purple,
            icon: Icons.pie_chart,
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. COST CENTERS
// ═══════════════════════════════════════════════════════════════════════════
class _CostCentersTab extends ConsumerStatefulWidget {
  const _CostCentersTab();

  @override
  ConsumerState<_CostCentersTab> createState() => _CostCentersTabState();
}

class _CostCentersTabState extends ConsumerState<_CostCentersTab> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(accountingProvider.notifier).loadCostCenters();
    });
  }

  Color _centerColor(String type) {
    switch (type) {
      case 'administrative':
        return Colors.blue;
      case 'operational':
        return Colors.green;
      case 'financial':
        return Colors.purple;
      case 'profit':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(accountingProvider);
    final t = ref.watch(translatorProvider);

    if (state.loading && state.costCenters.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(accountingProvider.notifier).loadCostCenters(),
      child:
          state.costCenters.isEmpty
              ? Center(
                child: Text(
                  t('no_cost_centers', fallback: 'No cost centers configured'),
                  style: TextStyle(color: Colors.grey[500]),
                ),
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.costCenters.length,
                itemBuilder: (context, index) {
                  final center = state.costCenters[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _centerColor(
                          center.centerType,
                        ).withValues(alpha: 0.1),
                        child: Icon(
                          Icons.business,
                          color: _centerColor(center.centerType),
                          size: 20,
                        ),
                      ),
                      title: Text(
                        center.nameEn,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        '${center.code} · ${center.centerType.toUpperCase()}',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[500],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      trailing: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color:
                              center.isActive ? Colors.green : Colors.grey[300],
                        ),
                      ),
                    ),
                  );
                },
              ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. AI INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════
class _AIInsightsTab extends ConsumerStatefulWidget {
  const _AIInsightsTab();

  @override
  ConsumerState<_AIInsightsTab> createState() => _AIInsightsTabState();
}

class _AIInsightsTabState extends ConsumerState<_AIInsightsTab> {
  String _type = 'cashflow';

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(accountingProvider);
    final t = ref.watch(translatorProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Type selector
          Row(
            children: [
              _insightBtn(
                'cashflow',
                t('cashflow_forecast', fallback: 'Cash Flow'),
                Icons.trending_up,
              ),
              const SizedBox(width: 8),
              _insightBtn(
                'anomaly',
                t('anomaly_detection', fallback: 'Anomaly'),
                Icons.warning_amber,
              ),
              const SizedBox(width: 8),
              _insightBtn(
                'risk',
                t('risk_assessment', fallback: 'Risk'),
                Icons.visibility,
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Run button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed:
                  state.loading
                      ? null
                      : () => ref
                          .read(accountingProvider.notifier)
                          .runAIAnalysis(_type),
              icon:
                  state.loading
                      ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                      : const Icon(Icons.psychology, size: 18),
              label: Text(
                state.loading
                    ? t('analyzing', fallback: 'Analyzing...')
                    : t('run_analysis', fallback: 'Run Analysis'),
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                  fontSize: 12,
                ),
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          // Results
          if (state.aiInsight != null) ...[
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          state.aiInsight!.type.toUpperCase(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                            letterSpacing: 1.5,
                          ),
                        ),
                        Text(
                          '${state.aiInsight!.dataPoints} data points',
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      state.aiInsight!.periodAnalyzed,
                      style: TextStyle(color: Colors.grey[400], fontSize: 11),
                    ),
                    const Divider(height: 24),
                    Text(
                      state.aiInsight!.analysis,
                      style: const TextStyle(fontSize: 13, height: 1.6),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _insightBtn(String key, String label, IconData icon) {
    final isActive = _type == key;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _type = key),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isActive ? Colors.blue : Colors.grey[100],
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 20,
                color: isActive ? Colors.white : Colors.grey[500],
              ),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: isActive ? Colors.white : Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════════════════

class _MetricChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MetricChip({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final double value;
  final Color color;
  final IconData icon;

  const _SummaryCard({
    required this.title,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.toUpperCase(),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  value.toStringAsFixed(2),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          Icon(icon, color: Colors.white.withValues(alpha: 0.3), size: 48),
        ],
      ),
    );
  }
}
