// ============================================================================
// ZIEN Mobile — Router Configuration
// Uses go_router with auth redirect matching web's route structure.
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/login_screen.dart';
import '../screens/home_screen.dart';
import '../screens/employee_portal_screen.dart';
import '../screens/billing_screen.dart';
import '../screens/accounting_screen.dart';
import '../screens/chat_screen.dart';
import '../screens/register_screen.dart';
import '../screens/tasks_screen.dart';
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
  static const billing = '/billing';
  static const accounting = '/accounting';
  static const chat = '/chat';
  static const register = '/register';
  static const tasks = '/tasks';
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

      final isRegisterRoute = state.matchedLocation == Routes.register;

      // Not logged in -> force login (allow register page)
      if (!isLoggedIn && !isLoginRoute && !isRegisterRoute) return Routes.login;
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
      GoRoute(
        path: Routes.billing,
        builder: (context, state) => const BillingScreen(),
      ),
      GoRoute(
        path: Routes.accounting,
        builder: (context, state) => const AccountingScreen(),
      ),
      GoRoute(
        path: Routes.chat,
        builder: (context, state) => const ChatScreen(),
      ),
      GoRoute(
        path: Routes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: Routes.tasks,
        builder: (context, state) => const TasksScreen(),
      ),
    ],
  );
});
