/// ZIEN Mobile — Runtime Configuration
/// Loaded from --dart-define or SharedPreferences fallback.
class AppConfig {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://rjrgylhcpnijkfstvcza.supabase.co',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqcmd5bGhjcG5pamtmc3R2Y3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0ODM1NTIsImV4cCI6MjA2MzA1OTU1Mn0.jwIt_wJxrETVmuooF3mG2mz2sXboKaGCmGtsXxSI-N4',
  );

  static const apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://api.plt.zien-ai.app',
  );

  static const appleBundleId = 'com.zien.app';
  static const appleTeamId = 'BN4DXG557F';
}
