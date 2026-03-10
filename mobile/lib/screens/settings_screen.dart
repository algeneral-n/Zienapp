// ============================================================================
// ZIEN Mobile -- Settings Screen
// Profile, Language, Theme, Notifications, Security, About
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _api = ApiClient.instance;
  Map<String, dynamic> _profile = {};
  bool _loading = true;
  bool _darkMode = false;
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  String _language = 'en';

  String? get _companyId => ref.read(companyNotifierProvider).active?.id;

  static const List<Map<String, String>> _languages = [
    {'code': 'en', 'label': 'English'},
    {'code': 'ar', 'label': 'العربية'},
    {'code': 'fr', 'label': 'Français'},
    {'code': 'es', 'label': 'Español'},
    {'code': 'de', 'label': 'Deutsch'},
    {'code': 'tr', 'label': 'Türkçe'},
    {'code': 'ru', 'label': 'Русский'},
    {'code': 'zh', 'label': '中文'},
    {'code': 'ja', 'label': '日本語'},
    {'code': 'ko', 'label': '한국어'},
    {'code': 'hi', 'label': 'हिन्दी'},
    {'code': 'ur', 'label': 'اردو'},
    {'code': 'it', 'label': 'Italiano'},
    {'code': 'pt', 'label': 'Português'},
    {'code': 'nl', 'label': 'Nederlands'},
    {'code': 'bn', 'label': 'বাংলা'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadProfile());
  }

  Future<void> _loadProfile() async {
    if (_companyId == null) {
      setState(() => _loading = false);
      return;
    }
    try {
      final res = await _api.get('/api/auth/me', extraHeaders: {'X-Company-Id': _companyId!});
      if (res.ok) {
        setState(() {
          _profile = Map<String, dynamic>.from(res.data['user'] ?? res.data);
          _language = _profile['language'] ?? 'en';
          _darkMode = _profile['dark_mode'] == true;
          _pushNotifications = _profile['push_notifications'] != false;
          _emailNotifications = _profile['email_notifications'] != false;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildProfileCard(),
                const SizedBox(height: 24),
                _sectionTitle('Preferences'),
                _buildLanguageTile(),
                _buildThemeTile(),
                const SizedBox(height: 24),
                _sectionTitle('Notifications'),
                _buildNotificationTiles(),
                const SizedBox(height: 24),
                _sectionTitle('Security'),
                _buildSecurityTiles(),
                const SizedBox(height: 24),
                _sectionTitle('About'),
                _buildAboutTiles(),
                const SizedBox(height: 32),
                _buildLogoutButton(),
                const SizedBox(height: 32),
              ],
            ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primaryColor)),
    );
  }

  Widget _buildProfileCard() {
    final name = _profile['full_name'] ?? _profile['name'] ?? 'User';
    final email = _profile['email'] ?? '';
    final role = _profile['role_code'] ?? _profile['role'] ?? '';
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            CircleAvatar(
              radius: 32,
              backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : 'U',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  if (email.isNotEmpty)
                    Text(email, style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                  if (role.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(role.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                    ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              onPressed: () => _showEditProfile(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageTile() {
    final current = _languages.firstWhere((l) => l['code'] == _language, orElse: () => _languages[0]);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: ListTile(
        leading: const Icon(Icons.language),
        title: const Text('Language'),
        trailing: DropdownButton<String>(
          value: _language,
          underline: const SizedBox(),
          items: _languages.map((l) => DropdownMenuItem(value: l['code'], child: Text(l['label']!, style: const TextStyle(fontSize: 13)))).toList(),
          onChanged: (val) {
            if (val == null) return;
            setState(() => _language = val);
            _savePrefs();
          },
        ),
      ),
    );
  }

  Widget _buildThemeTile() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: SwitchListTile(
        secondary: const Icon(Icons.dark_mode),
        title: const Text('Dark Mode'),
        value: _darkMode,
        onChanged: (val) {
          setState(() => _darkMode = val);
          _savePrefs();
        },
      ),
    );
  }

  Widget _buildNotificationTiles() {
    return Column(
      children: [
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: SwitchListTile(
            secondary: const Icon(Icons.notifications_active),
            title: const Text('Push Notifications'),
            value: _pushNotifications,
            onChanged: (val) {
              setState(() => _pushNotifications = val);
              _savePrefs();
            },
          ),
        ),
        const SizedBox(height: 8),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: SwitchListTile(
            secondary: const Icon(Icons.email),
            title: const Text('Email Notifications'),
            value: _emailNotifications,
            onChanged: (val) {
              setState(() => _emailNotifications = val);
              _savePrefs();
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSecurityTiles() {
    return Column(
      children: [
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: ListTile(
            leading: const Icon(Icons.lock),
            title: const Text('Change Password'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showChangePassword(context),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: ListTile(
            leading: const Icon(Icons.security),
            title: const Text('Two-Factor Authentication'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('2FA setup coming soon')),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildAboutTiles() {
    return Column(
      children: [
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: const ListTile(
            leading: Icon(Icons.info_outline),
            title: Text('Version'),
            trailing: Text('1.0.0', style: TextStyle(color: Colors.grey)),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: ListTile(
            leading: const Icon(Icons.article_outlined),
            title: const Text('Terms & Privacy'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
        ),
      ],
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () async {
          final confirm = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Logout'),
              content: const Text('Are you sure you want to sign out?'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Logout', style: TextStyle(color: Colors.red))),
              ],
            ),
          );
          if (confirm == true && mounted) {
            await _api.post('/api/auth/logout', body: {});
          }
        },
        icon: const Icon(Icons.logout, color: Colors.red),
        label: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Colors.red),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Future<void> _savePrefs() async {
    if (_companyId == null) return;
    await _api.patch('/api/auth/preferences', body: {
      'language': _language,
      'dark_mode': _darkMode,
      'push_notifications': _pushNotifications,
      'email_notifications': _emailNotifications,
    }, extraHeaders: {'X-Company-Id': _companyId!});
  }

  void _showEditProfile(BuildContext context) {
    final nameCtrl = TextEditingController(text: _profile['full_name'] ?? _profile['name'] ?? '');
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(labelText: 'Full Name', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  Navigator.pop(ctx);
                  await _api.patch('/api/auth/profile', body: {
                    'full_name': nameCtrl.text.trim(),
                  }, extraHeaders: {'X-Company-Id': _companyId!});
                  _loadProfile();
                },
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showChangePassword(BuildContext context) {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Change Password', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 16),
            TextField(
              controller: currentCtrl,
              obscureText: true,
              decoration: InputDecoration(labelText: 'Current Password', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newCtrl,
              obscureText: true,
              decoration: InputDecoration(labelText: 'New Password', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (newCtrl.text.length < 8) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Password must be at least 8 characters')),
                    );
                    return;
                  }
                  Navigator.pop(ctx);
                  await _api.post('/api/auth/change-password', body: {
                    'current_password': currentCtrl.text,
                    'new_password': newCtrl.text,
                  }, extraHeaders: {'X-Company-Id': _companyId!});
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Password updated')),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Update Password', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
