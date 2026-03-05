// ============================================================================
// ZIEN Mobile — App Entrypoint
// Riverpod + GoRouter + Supabase. Mirrors web's App.tsx structure.
// ============================================================================

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/app_config.dart';
import 'config/router.dart';
import 'theme/app_theme.dart';
import 'services/company_providers.dart';
import 'services/theme_provider.dart';
import 'services/i18n_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnonKey,
  );

  runApp(const ProviderScope(child: ZienApp()));
}

class ZienApp extends ConsumerStatefulWidget {
  const ZienApp({super.key});

  @override
  ConsumerState<ZienApp> createState() => _ZienAppState();
}

class _ZienAppState extends ConsumerState<ZienApp> {
  @override
  void initState() {
    super.initState();
    // Listen to auth changes and load company data when authenticated
    Supabase.instance.client.auth.onAuthStateChange.listen((event) {
      if (event.session != null) {
        ref.read(companyNotifierProvider.notifier).load();
      } else {
        ref.read(companyNotifierProvider.notifier).clear();
      }
    });
    // Initial load if already authenticated
    if (Supabase.instance.client.auth.currentSession != null) {
      ref.read(companyNotifierProvider.notifier).load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(flutterThemeModeProvider);
    final i18n = ref.watch(i18nProvider);
    final locale = i18n.locale;

    return Directionality(
      textDirection: i18n.isRtl ? TextDirection.rtl : TextDirection.ltr,
      child: MaterialApp.router(
        title: 'ZIEN',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: themeMode,
        locale: locale,
        supportedLocales: const [
          Locale('en'),
          Locale('ar'),
          Locale('fr'),
          Locale('es'),
          Locale('de'),
          Locale('tr'),
          Locale('ru'),
          Locale('zh'),
          Locale('ja'),
          Locale('ko'),
          Locale('hi'),
          Locale('ur'),
          Locale('it'),
          Locale('pt'),
          Locale('nl'),
        ],
        routerConfig: router,
      ),
    );
  }
}
