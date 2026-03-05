// ============================================================================
// ZIEN Mobile — Router Configuration
// Uses go_router with auth redirect matching web's route structure.
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/login_screen.dart';
import '../screens/home_screen.dart';
import '../screens/employee_portal_screen.dart';
import '../services/auth_providers.dart';

// ─── Route names ─────────────────────────────────────────────────────────────

class Routes {
  static const login = '/login';
  static const home = '/';
  static const dashboard = '/dashboard';
  static const modules = '/modules';
  static const rareAi = '/rare';
  static const settings = '/settings';
  static const profile = '/settings/profile';
  static const company = '/settings/company';
  static const employeePortal = '/employee';
}

// ─── Router provider ─────────────────────────────────────────────────────────

final routerProvider = Provider<GoRouter>((ref) {
  final authNotifier = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: Routes.home,
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final isLoggedIn = authNotifier.isAuthenticated;
      final isLoginRoute = state.matchedLocation == Routes.login;

      // Not logged in -> force login
      if (!isLoggedIn && !isLoginRoute) return Routes.login;
      // Logged in but on login page -> go home
      if (isLoggedIn && isLoginRoute) return Routes.home;

      return null; // No redirect
    },
    routes: [
      GoRoute(
        path: Routes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: Routes.home,
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: Routes.employeePortal,
        builder: (context, state) => const EmployeePortalScreen(),
      ),
    ],
  );
});
