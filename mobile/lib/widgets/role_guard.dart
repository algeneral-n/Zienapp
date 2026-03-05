// ============================================================================
// ZIEN Mobile — Role Guard Widgets
// Mirrors: web/src/components/ProtectedRoute.tsx
// Conditionally renders children based on role level / module access.
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'permission_utils.dart';

/// Hides its child if the current user doesn't meet [minLevel],
/// or can't read [moduleCode].
class RoleGuard extends ConsumerWidget {
  const RoleGuard({
    super.key,
    this.minLevel,
    this.moduleCode,
    this.writeAccess = false,
    this.fallback,
    required this.child,
  });

  /// Minimum numeric permission level (from ROLE_LEVEL).
  final int? minLevel;

  /// Module code to check (uses MODULE_ACCESS matrix).
  final String? moduleCode;

  /// If true, checks *write* access instead of read.
  final bool writeAccess;

  /// Widget to show when access is denied. Defaults to SizedBox.shrink().
  final Widget? fallback;

  /// Widget to show when access is granted.
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final level = ref.watch(currentLevelProvider);

    // Check minimum level
    if (minLevel != null && level < minLevel!) {
      return fallback ?? const SizedBox.shrink();
    }

    // Check module access
    if (moduleCode != null) {
      final role = ref.watch(currentRoleProvider);
      final hasAccess =
          writeAccess
              ? canWriteModule(role, moduleCode!)
              : canReadModule(role, moduleCode!);
      if (!hasAccess) {
        return fallback ?? const SizedBox.shrink();
      }
    }

    return child;
  }
}

/// Route-level guard that redirects to [redirectPath] when access is denied.
/// Use this in GoRouter's `builder` / `pageBuilder`.
class RouteRoleGuard extends ConsumerWidget {
  const RouteRoleGuard({
    super.key,
    this.minLevel,
    this.moduleCode,
    this.writeAccess = false,
    this.redirectPath = '/no-access',
    required this.child,
  });

  final int? minLevel;
  final String? moduleCode;
  final bool writeAccess;
  final String redirectPath;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final level = ref.watch(currentLevelProvider);

    bool denied = false;

    if (minLevel != null && level < minLevel!) {
      denied = true;
    }

    if (!denied && moduleCode != null) {
      final role = ref.watch(currentRoleProvider);
      final hasAccess =
          writeAccess
              ? canWriteModule(role, moduleCode!)
              : canReadModule(role, moduleCode!);
      denied = !hasAccess;
    }

    if (denied) {
      return const _NoAccessPage();
    }

    return child;
  }
}

/// Minimal "No Access" fallback page.
class _NoAccessPage extends StatelessWidget {
  const _NoAccessPage();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('ZIEN')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.lock_outline,
                size: 64,
                color: theme.colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text('Access Denied', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                'You do not have the required permissions to view this page.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => Navigator.of(context).maybePop(),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Go Back'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
