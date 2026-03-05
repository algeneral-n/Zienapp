// ============================================================================
// ZIEN Mobile — Accounting Service
// Mirrors web AccountingModule.tsx — calls Worker /api/accounting/* endpoints
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

// ─── Models ─────────────────────────────────────────────────────────────

class ChartAccount {
  final String id;
  final String accountCode;
  final String nameEn;
  final String nameAr;
  final String accountType;
  final String? parentCode;
  final bool isActive;

  ChartAccount({
    required this.id,
    required this.accountCode,
    required this.nameEn,
    required this.nameAr,
    required this.accountType,
    this.parentCode,
    this.isActive = true,
  });

  factory ChartAccount.fromJson(Map<String, dynamic> json) => ChartAccount(
        id: json['id']?.toString() ?? '',
        accountCode: json['account_code'] ?? '',
        nameEn: json['name_en'] ?? '',
        nameAr: json['name_ar'] ?? '',
        accountType: json['account_type'] ?? 'asset',
        parentCode: json['parent_code'],
        isActive: json['is_active'] ?? true,
      );
}

class JournalEntry {
  final String id;
  final String? reference;
  final String entryDate;
  final double totalDebit;
  final double totalCredit;
  final int lineCount;

  JournalEntry({
    required this.id,
    required this.entryDate,
    required this.totalDebit,
    required this.totalCredit,
    this.reference,
    this.lineCount = 0,
  });

  factory JournalEntry.fromJson(Map<String, dynamic> json) => JournalEntry(
        id: json['id']?.toString() ?? '',
        reference: json['reference'],
        entryDate: json['entry_date'] ?? '',
        totalDebit: (json['total_debit'] ?? 0).toDouble(),
        totalCredit: (json['total_credit'] ?? 0).toDouble(),
        lineCount: json['line_count'] ?? 0,
      );
}

class LedgerEntry {
  final String entryDate;
  final String? description;
  final double debit;
  final double credit;
  final double runningBalance;

  LedgerEntry({
    required this.entryDate,
    this.description,
    required this.debit,
    required this.credit,
    required this.runningBalance,
  });

  factory LedgerEntry.fromJson(Map<String, dynamic> json) => LedgerEntry(
        entryDate: json['entry_date'] ?? '',
        description: json['description'],
        debit: (json['debit'] ?? 0).toDouble(),
        credit: (json['credit'] ?? 0).toDouble(),
        runningBalance: (json['running_balance'] ?? 0).toDouble(),
      );
}

class CostCenter {
  final String id;
  final String code;
  final String nameEn;
  final String nameAr;
  final String centerType;
  final String? parentCode;
  final bool isActive;

  CostCenter({
    required this.id,
    required this.code,
    required this.nameEn,
    required this.nameAr,
    required this.centerType,
    this.parentCode,
    this.isActive = true,
  });

  factory CostCenter.fromJson(Map<String, dynamic> json) => CostCenter(
        id: json['id']?.toString() ?? '',
        code: json['code'] ?? '',
        nameEn: json['name_en'] ?? '',
        nameAr: json['name_ar'] ?? '',
        centerType: json['center_type'] ?? 'operational',
        parentCode: json['parent_code'],
        isActive: json['is_active'] ?? true,
      );
}

class TrialBalanceRow {
  final String accountCode;
  final String nameEn;
  final double totalDebit;
  final double totalCredit;

  TrialBalanceRow({
    required this.accountCode,
    required this.nameEn,
    required this.totalDebit,
    required this.totalCredit,
  });

  factory TrialBalanceRow.fromJson(Map<String, dynamic> json) =>
      TrialBalanceRow(
        accountCode: json['account_code'] ?? '',
        nameEn: json['name_en'] ?? json['account_code'] ?? '',
        totalDebit: (json['total_debit'] ?? 0).toDouble(),
        totalCredit: (json['total_credit'] ?? 0).toDouble(),
      );
}

class IncomeStatementData {
  final double totalRevenue;
  final double totalExpenses;
  final double netIncome;

  IncomeStatementData({
    required this.totalRevenue,
    required this.totalExpenses,
    required this.netIncome,
  });

  factory IncomeStatementData.fromJson(Map<String, dynamic> json) =>
      IncomeStatementData(
        totalRevenue: (json['total_revenue'] ?? 0).toDouble(),
        totalExpenses: (json['total_expenses'] ?? 0).toDouble(),
        netIncome: (json['net_income'] ?? 0).toDouble(),
      );
}

class BalanceSheetData {
  final double totalAssets;
  final double totalLiabilities;
  final double totalEquity;

  BalanceSheetData({
    required this.totalAssets,
    required this.totalLiabilities,
    required this.totalEquity,
  });

  factory BalanceSheetData.fromJson(Map<String, dynamic> json) =>
      BalanceSheetData(
        totalAssets: (json['total_assets'] ?? 0).toDouble(),
        totalLiabilities: (json['total_liabilities'] ?? 0).toDouble(),
        totalEquity: (json['total_equity'] ?? 0).toDouble(),
      );
}

class AIInsightResult {
  final String type;
  final String analysis;
  final int dataPoints;
  final String periodAnalyzed;

  AIInsightResult({
    required this.type,
    required this.analysis,
    required this.dataPoints,
    required this.periodAnalyzed,
  });

  factory AIInsightResult.fromJson(Map<String, dynamic> json) =>
      AIInsightResult(
        type: json['type'] ?? '',
        analysis: json['analysis'] ?? '',
        dataPoints: json['data_points'] ?? 0,
        periodAnalyzed: json['period_analyzed'] ?? '',
      );
}

// ─── State ──────────────────────────────────────────────────────────────

class AccountingState {
  final List<ChartAccount> accounts;
  final List<JournalEntry> journalEntries;
  final List<LedgerEntry> ledger;
  final List<CostCenter> costCenters;
  final List<TrialBalanceRow> trialBalance;
  final IncomeStatementData? incomeStatement;
  final BalanceSheetData? balanceSheet;
  final AIInsightResult? aiInsight;
  final bool loading;
  final String? error;

  AccountingState({
    this.accounts = const [],
    this.journalEntries = const [],
    this.ledger = const [],
    this.costCenters = const [],
    this.trialBalance = const [],
    this.incomeStatement,
    this.balanceSheet,
    this.aiInsight,
    this.loading = false,
    this.error,
  });

  AccountingState copyWith({
    List<ChartAccount>? accounts,
    List<JournalEntry>? journalEntries,
    List<LedgerEntry>? ledger,
    List<CostCenter>? costCenters,
    List<TrialBalanceRow>? trialBalance,
    IncomeStatementData? incomeStatement,
    BalanceSheetData? balanceSheet,
    AIInsightResult? aiInsight,
    bool? loading,
    String? error,
  }) =>
      AccountingState(
        accounts: accounts ?? this.accounts,
        journalEntries: journalEntries ?? this.journalEntries,
        ledger: ledger ?? this.ledger,
        costCenters: costCenters ?? this.costCenters,
        trialBalance: trialBalance ?? this.trialBalance,
        incomeStatement: incomeStatement ?? this.incomeStatement,
        balanceSheet: balanceSheet ?? this.balanceSheet,
        aiInsight: aiInsight ?? this.aiInsight,
        loading: loading ?? this.loading,
        error: error,
      );
}

// ─── Notifier ───────────────────────────────────────────────────────────

class AccountingNotifier extends StateNotifier<AccountingState> {
  AccountingNotifier() : super(AccountingState());
  final _api = ApiClient.instance;

  // --- Chart of Accounts ---
  Future<void> loadAccounts() async {
    state = state.copyWith(loading: true, error: null);
    final res = await _api.get('/api/accounting/chart-of-accounts');
    if (res.isSuccess && res.data != null) {
      final list = (res.data!['chart_of_accounts'] as List?)
              ?.map((e) => ChartAccount.fromJson(e))
              .toList() ??
          [];
      state = state.copyWith(accounts: list, loading: false);
    } else {
      state = state.copyWith(loading: false, error: res.errorMessage);
    }
  }

  Future<bool> createAccount({
    required String accountCode,
    required String nameEn,
    String? nameAr,
    required String accountType,
    String? parentCode,
  }) async {
    final res = await _api.post('/api/accounting/chart-of-accounts', body: {
      'account_code': accountCode,
      'name_en': nameEn,
      'name_ar': nameAr ?? nameEn,
      'account_type': accountType,
      if (parentCode != null) 'parent_code': parentCode,
    });
    if (res.isSuccess) await loadAccounts();
    return res.isSuccess;
  }

  // --- Journal Entries ---
  Future<void> loadJournalEntries() async {
    state = state.copyWith(loading: true, error: null);
    final res = await _api.get('/api/accounting/journal-entries');
    if (res.isSuccess && res.data != null) {
      final list = (res.data!['journal_entries'] as List?)
              ?.map((e) => JournalEntry.fromJson(e))
              .toList() ??
          [];
      state = state.copyWith(journalEntries: list, loading: false);
    } else {
      state = state.copyWith(loading: false, error: res.errorMessage);
    }
  }

  Future<bool> postJournalEntry({
    required String reference,
    required String entryDate,
    required List<Map<String, dynamic>> lines,
  }) async {
    final res = await _api.post('/api/accounting/journal-entries', body: {
      'reference': reference,
      'entry_date': entryDate,
      'lines': lines,
    });
    if (res.isSuccess) await loadJournalEntries();
    return res.isSuccess;
  }

  // --- General Ledger ---
  Future<void> loadLedger(String accountCode) async {
    state = state.copyWith(loading: true, error: null);
    final res = await _api.get(
      '/api/accounting/ledger',
      queryParams: {'account_code': accountCode},
    );
    if (res.isSuccess && res.data != null) {
      final list = (res.data!['ledger'] as List?)
              ?.map((e) => LedgerEntry.fromJson(e))
              .toList() ??
          [];
      state = state.copyWith(ledger: list, loading: false);
    } else {
      state = state.copyWith(loading: false, error: res.errorMessage);
    }
  }

  // --- Cost Centers ---
  Future<void> loadCostCenters() async {
    state = state.copyWith(loading: true, error: null);
    final res = await _api.get('/api/accounting/cost-centers');
    if (res.isSuccess && res.data != null) {
      final list = (res.data!['cost_centers'] as List?)
              ?.map((e) => CostCenter.fromJson(e))
              .toList() ??
          [];
      state = state.copyWith(costCenters: list, loading: false);
    } else {
      state = state.copyWith(loading: false, error: res.errorMessage);
    }
  }

  Future<bool> createCostCenter({
    required String code,
    required String nameEn,
    String? nameAr,
    required String type,
    String? parentCode,
  }) async {
    final res = await _api.post('/api/accounting/cost-centers', body: {
      'code': code,
      'name_en': nameEn,
      'name_ar': nameAr ?? nameEn,
      'type': type,
      if (parentCode != null) 'parent_code': parentCode,
    });
    if (res.isSuccess) await loadCostCenters();
    return res.isSuccess;
  }

  // --- Financial Reports ---
  Future<void> loadTrialBalance() async {
    state = state.copyWith(loading: true, error: null);
    final res = await _api.get('/api/accounting/reports/trial-balance');
    if (res.isSuccess && res.data != null) {
      final list = (res.data!['trial_balance'] as List?)
              ?.map((e) => TrialBalanceRow.fromJson(e))
              .toList() ??
          [];
      state = state.copyWith(trialBalance: list, loading: false);
    } else {
      state = state.copyWith(loading: false, error: res.errorMessage);
    }
  }

  Future<void> loadIncomeStatement() async {
    state = state.copyWith(loading: true, error: null);
    final res = await _api.get('/api/accounting/reports/income-statement');
    if (res.isSuccess && res.data != null) {
      state = state.copyWith(
        incomeStatement: IncomeStatementData.fromJson(res.data!),
        loading: false,
      );
    } else {
      state = state.copyWith(loading: false, error: res.errorMessage);
    }
  }

  Future<void> loadBalanceSheet() async {
    state = state.copyWith(loading: true, error: null);
    final res = await _api.get('/api/accounting/reports/balance-sheet');
    if (res.isSuccess && res.data != null) {
      state = state.copyWith(
        balanceSheet: BalanceSheetData.fromJson(res.data!),
        loading: false,
      );
    } else {
      state = state.copyWith(loading: false, error: res.errorMessage);
    }
  }

  // --- AI Financial Insights ---
  Future<void> runAIAnalysis(String type, {int monthsAhead = 3}) async {
    state = state.copyWith(loading: true, error: null);
    final res = await _api.post('/api/accounting/ai/forecast', body: {
      'type': type,
      'months_ahead': monthsAhead,
    });
    if (res.isSuccess && res.data != null) {
      state = state.copyWith(
        aiInsight: AIInsightResult.fromJson(res.data!),
        loading: false,
      );
    } else {
      state = state.copyWith(loading: false, error: res.errorMessage);
    }
  }
}

// ─── Providers ──────────────────────────────────────────────────────────

final accountingProvider =
    StateNotifierProvider<AccountingNotifier, AccountingState>((ref) {
  return AccountingNotifier();
});

final chartAccountsProvider = Provider<List<ChartAccount>>((ref) {
  return ref.watch(accountingProvider).accounts;
});

final journalEntriesProvider = Provider<List<JournalEntry>>((ref) {
  return ref.watch(accountingProvider).journalEntries;
});

final costCentersProvider = Provider<List<CostCenter>>((ref) {
  return ref.watch(accountingProvider).costCenters;
});

final accountingLoadingProvider = Provider<bool>((ref) {
  return ref.watch(accountingProvider).loading;
});
