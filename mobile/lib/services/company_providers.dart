// ============================================================================
// ZIEN Mobile — Company Providers (Riverpod)
// Mirrors: web/src/contexts/CompanyContext.tsx
// Loads companies, memberships, modules, departments from Supabase.
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/company.dart';
import '../models/module.dart';
import '../models/enums.dart';
import 'auth_providers.dart';

const _companyKey = 'zien:activeCompanyId';

// ─── Company state container ─────────────────────────────────────────────────

class CompanyState {
  final List<Company> companies;
  final Company? active;
  final CompanyMember? membership;
  final List<CompanyModule> modules;
  final List<Department> departments;
  final bool isLoading;

  const CompanyState({
    this.companies = const [],
    this.active,
    this.membership,
    this.modules = const [],
    this.departments = const [],
    this.isLoading = true,
  });

  CompanyRole? get role => membership?.role;

  bool hasModule(String moduleCode) =>
      modules.any((m) => m.moduleCode == moduleCode && m.isActive);

  CompanyState copyWith({
    List<Company>? companies,
    Company? active,
    CompanyMember? membership,
    List<CompanyModule>? modules,
    List<Department>? departments,
    bool? isLoading,
  }) {
    return CompanyState(
      companies: companies ?? this.companies,
      active: active ?? this.active,
      membership: membership ?? this.membership,
      modules: modules ?? this.modules,
      departments: departments ?? this.departments,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

// ─── Company Notifier ────────────────────────────────────────────────────────

class CompanyNotifier extends StateNotifier<CompanyState> {
  CompanyNotifier(this._ref) : super(const CompanyState());

  final Ref _ref;

  SupabaseClient get _db => Supabase.instance.client;

  /// Load all companies the current user belongs to.
  Future<void> load() async {
    final user = _ref.read(currentUserProvider);
    if (user == null) {
      state = const CompanyState(isLoading: false);
      return;
    }

    state = state.copyWith(isLoading: true);

    // Fetch memberships with company data
    final memberRows = await _db
        .from('company_members')
        .select('*, companies(*)')
        .eq('user_id', user.id)
        .eq('status', 'active');

    final companiesMap = <String, Company>{};
    final membershipsMap = <String, CompanyMember>{};

    for (final row in (memberRows as List<dynamic>)) {
      final map = row as Map<String, dynamic>;
      final companyData = map['companies'] as Map<String, dynamic>?;
      if (companyData == null) continue;
      final comp = Company.fromJson(companyData);
      companiesMap[comp.id] = comp;
      membershipsMap[comp.id] = CompanyMember.fromJson(map);
    }

    // If no memberships, check if user owns companies directly
    if (companiesMap.isEmpty) {
      final ownedRows = await _db
          .from('companies')
          .select()
          .eq('owner_user_id', user.id);

      for (final row in (ownedRows as List<dynamic>)) {
        final comp = Company.fromJson(row as Map<String, dynamic>);
        companiesMap[comp.id] = comp;
      }
    }

    final companyList = companiesMap.values.toList();

    if (companyList.isEmpty) {
      state = CompanyState(companies: companyList, isLoading: false);
      return;
    }

    // Restore last active company
    final prefs = await SharedPreferences.getInstance();
    final savedId = prefs.getString(_companyKey);
    final primaryMember = membershipsMap.values
        .where((m) => m.isPrimary)
        .firstOrNull;

    final activeId = (savedId != null && companiesMap.containsKey(savedId))
        ? savedId
        : primaryMember?.companyId ?? companyList.first.id;

    await _selectCompany(
      companiesMap[activeId]!,
      companyList,
      membershipsMap[activeId],
    );
  }

  /// Switch to a different company.
  Future<void> switchCompany(String companyId) async {
    final comp = state.companies.firstWhere(
      (c) => c.id == companyId,
      orElse: () => state.active!,
    );
    final user = _ref.read(currentUserProvider);
    if (user == null) return;

    state = state.copyWith(isLoading: true);

    // Load membership for this company
    final memberRow = await _db
        .from('company_members')
        .select()
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

    final member = memberRow != null ? CompanyMember.fromJson(memberRow) : null;

    await _selectCompany(comp, state.companies, member);
  }

  Future<void> _selectCompany(
    Company company,
    List<Company> companies,
    CompanyMember? member,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_companyKey, company.id);

    // Load modules + departments in parallel
    final results = await Future.wait([
      _db
          .from('company_modules')
          .select('*, modules_catalog(code)')
          .eq('company_id', company.id)
          .eq('is_active', true),
      _db
          .from('departments')
          .select()
          .eq('company_id', company.id)
          .eq('is_active', true),
    ]);

    final modules = (results[0] as List<dynamic>)
        .map((r) => CompanyModule.fromJson(r as Map<String, dynamic>))
        .toList();

    final departments = (results[1] as List<dynamic>)
        .map((r) => Department.fromJson(r as Map<String, dynamic>))
        .toList();

    state = CompanyState(
      companies: companies,
      active: company,
      membership: member,
      modules: modules,
      departments: departments,
      isLoading: false,
    );
  }

  /// Clear state on logout.
  void clear() {
    state = const CompanyState(isLoading: false);
  }
}

// ─── Riverpod providers ──────────────────────────────────────────────────────

final companyNotifierProvider =
    StateNotifierProvider<CompanyNotifier, CompanyState>((ref) {
  return CompanyNotifier(ref);
});

/// Convenience: current active company
final activeCompanyProvider = Provider<Company?>((ref) {
  return ref.watch(companyNotifierProvider).active;
});

/// Convenience: current user role in active company
final currentRoleProvider = Provider<CompanyRole?>((ref) {
  return ref.watch(companyNotifierProvider).role;
});
