// ============================================================================
// ZIEN Mobile — i18n Service (Riverpod)
// Loads JSON translation files from assets/i18n/ and provides them
// to the entire app via Riverpod. Supports all 15 languages with RTL.
// ============================================================================

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/enums.dart';

const _langKey = 'zien:language';

// ─── i18n State ──────────────────────────────────────────────────────────────

class I18nState {
  final AppLanguage language;
  final Map<String, String> translations;
  final bool isLoaded;

  const I18nState({
    this.language = AppLanguage.en,
    this.translations = const {},
    this.isLoaded = false,
  });

  /// Get a translated string by key. Returns key itself if not found.
  String t(String key) => translations[key] ?? key;

  /// Whether the current language is RTL.
  bool get isRtl => language.isRtl;

  /// The text direction for the current language.
  TextDirection get textDirection =>
      isRtl ? TextDirection.rtl : TextDirection.ltr;

  /// The locale for the current language.
  Locale get locale => Locale(language.code);

  I18nState copyWith({
    AppLanguage? language,
    Map<String, String>? translations,
    bool? isLoaded,
  }) {
    return I18nState(
      language: language ?? this.language,
      translations: translations ?? this.translations,
      isLoaded: isLoaded ?? this.isLoaded,
    );
  }
}

// ─── i18n Notifier ───────────────────────────────────────────────────────────

class I18nNotifier extends StateNotifier<I18nState> {
  I18nNotifier() : super(const I18nState());

  /// Supported languages for which we have JSON files.
  static const supportedLanguages = [
    'en',
    'ar',
    'fr',
    'es',
    'de',
    'tr',
    'ru',
    'zh',
    'ja',
    'ko',
    'hi',
    'ur',
    'it',
    'pt',
    'nl',
  ];

  /// Initialize: load saved language preference, then load translation file.
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final savedCode = prefs.getString(_langKey) ?? 'en';
    final lang = AppLanguage.fromCode(savedCode);
    await _loadTranslations(lang);
  }

  /// Change language, persist preference, and reload translations.
  Future<void> setLanguage(AppLanguage lang) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_langKey, lang.code);
    await _loadTranslations(lang);
  }

  /// Load the JSON translation file for the given language.
  /// Falls back to English if the requested language file doesn't exist.
  Future<void> _loadTranslations(AppLanguage lang) async {
    try {
      final code = supportedLanguages.contains(lang.code) ? lang.code : 'en';
      final jsonStr = await rootBundle.loadString('assets/i18n/$code.json');
      final Map<String, dynamic> jsonMap = json.decode(jsonStr);
      final translations = jsonMap.map((k, v) => MapEntry(k, v.toString()));
      state = I18nState(
        language: lang,
        translations: translations,
        isLoaded: true,
      );
    } catch (e) {
      // If loading fails, try English as final fallback
      if (lang.code != 'en') {
        await _loadTranslations(AppLanguage.en);
      } else {
        state = I18nState(
          language: AppLanguage.en,
          translations: const {},
          isLoaded: true,
        );
      }
    }
  }
}

// ─── Riverpod Providers ──────────────────────────────────────────────────────

final i18nProvider = StateNotifierProvider<I18nNotifier, I18nState>((ref) {
  final notifier = I18nNotifier();
  notifier.init(); // fire-and-forget init
  return notifier;
});

/// Convenience: get the current translation function.
final tProvider = Provider<String Function(String)>((ref) {
  final i18n = ref.watch(i18nProvider);
  return i18n.t;
});

/// Convenience: is current language RTL?
final isRtlProvider = Provider<bool>((ref) {
  return ref.watch(i18nProvider).isRtl;
});

/// Convenience: current locale.
final localeProvider = Provider<Locale>((ref) {
  return ref.watch(i18nProvider).locale;
});
