// ============================================================================
// ZIEN Mobile — Theme Provider (Riverpod)
// Mirrors: web/src/components/ThemeProvider.tsx
// Persists theme preference (light/dark/system) via SharedPreferences.
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _themeKey = 'zien:theme';

/// Possible theme modes — matches web ThemeMode enum.
enum ZienThemeMode { light, dark, system }

// ─── Theme Notifier ──────────────────────────────────────────────────────────

class ThemeNotifier extends StateNotifier<ZienThemeMode> {
  ThemeNotifier() : super(ZienThemeMode.system);

  /// Initialize: load saved theme preference.
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_themeKey) ?? 'system';
    state = _fromString(saved);
  }

  /// Change theme mode and persist.
  Future<void> setTheme(ZienThemeMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, mode.name);
  }

  /// Toggle: light → dark → system → light
  Future<void> toggle() async {
    switch (state) {
      case ZienThemeMode.light:
        await setTheme(ZienThemeMode.dark);
      case ZienThemeMode.dark:
        await setTheme(ZienThemeMode.system);
      case ZienThemeMode.system:
        await setTheme(ZienThemeMode.light);
    }
  }

  static ZienThemeMode _fromString(String s) {
    switch (s) {
      case 'light':
        return ZienThemeMode.light;
      case 'dark':
        return ZienThemeMode.dark;
      default:
        return ZienThemeMode.system;
    }
  }
}

// ─── Riverpod Providers ──────────────────────────────────────────────────────

final themeNotifierProvider =
    StateNotifierProvider<ThemeNotifier, ZienThemeMode>((ref) {
      final notifier = ThemeNotifier();
      notifier.init();
      return notifier;
    });

/// Converts ZienThemeMode to Flutter's ThemeMode for MaterialApp.
final flutterThemeModeProvider = Provider<ThemeMode>((ref) {
  final mode = ref.watch(themeNotifierProvider);
  switch (mode) {
    case ZienThemeMode.light:
      return ThemeMode.light;
    case ZienThemeMode.dark:
      return ThemeMode.dark;
    case ZienThemeMode.system:
      return ThemeMode.system;
  }
});
