// ============================================================================
// ZIEN Mobile — Auth Providers (Riverpod)
// Bridges Supabase auth state into Riverpod for the entire app.
// ============================================================================

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/profile.dart';

// ─── Supabase client accessor ────────────────────────────────────────────────

final supabaseProvider = Provider<SupabaseClient>(
  (ref) => Supabase.instance.client,
);

// ─── Auth state stream ───────────────────────────────────────────────────────

final authStateProvider = StreamProvider<AuthState>((ref) {
  final client = ref.watch(supabaseProvider);
  return client.auth.onAuthStateChange;
});

// ─── Current session (nullable) ──────────────────────────────────────────────

final sessionProvider = Provider<Session?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.whenOrNull(data: (state) => state.session) ??
      Supabase.instance.client.auth.currentSession;
});

// ─── Current user (nullable) ─────────────────────────────────────────────────

final currentUserProvider = Provider<User?>((ref) {
  final session = ref.watch(sessionProvider);
  return session?.user;
});

// ─── Is authenticated ────────────────────────────────────────────────────────

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(currentUserProvider) != null;
});

// ─── User profile from DB ────────────────────────────────────────────────────

final profileProvider = FutureProvider<Profile?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;

  final client = ref.watch(supabaseProvider);
  final response =
      await client.from('profiles').select().eq('id', user.id).maybeSingle();

  if (response == null) return null;
  return Profile.fromJson(response);
});

// ─── Auth notifier for GoRouter refresh ──────────────────────────────────────

class AuthNotifier extends ChangeNotifier {
  AuthNotifier(this._ref) {
    _subscription = Supabase.instance.client.auth.onAuthStateChange.listen((_) {
      notifyListeners();
    });
  }

  // ignore: unused_field
  final Ref _ref;
  late final StreamSubscription<AuthState> _subscription;

  bool get isAuthenticated =>
      Supabase.instance.client.auth.currentSession != null;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

final authNotifierProvider = Provider<AuthNotifier>((ref) {
  final notifier = AuthNotifier(ref);
  ref.onDispose(notifier.dispose);
  return notifier;
});
