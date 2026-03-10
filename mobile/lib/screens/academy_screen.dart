// ============================================================================
// ZIEN Mobile -- Academy Screen
// Courses, Learning Paths, Certificates
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';
import '../theme/app_theme.dart';

class AcademyScreen extends ConsumerStatefulWidget {
  const AcademyScreen({super.key});

  @override
  ConsumerState<AcademyScreen> createState() => _AcademyScreenState();
}

class _AcademyScreenState extends ConsumerState<AcademyScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _api = ApiClient.instance;

  List<Map<String, dynamic>> _courses = [];
  List<Map<String, dynamic>> _paths = [];
  List<Map<String, dynamic>> _certificates = [];
  bool _loading = true;

  String? get _companyId => ref.read(companyNotifierProvider).active?.id;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) _loadTabData(_tabController.index);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadTabData(0));
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTabData(int index) async {
    if (_companyId == null) return;
    setState(() => _loading = true);
    final headers = {'X-Company-Id': _companyId!};
    try {
      switch (index) {
        case 0:
          final res = await _api.get('/api/academy/courses', extraHeaders: headers);
          if (res.ok) setState(() => _courses = List<Map<String, dynamic>>.from(res.data['courses'] ?? []));
          break;
        case 1:
          final res = await _api.get('/api/academy/paths', extraHeaders: headers);
          if (res.ok) setState(() => _paths = List<Map<String, dynamic>>.from(res.data['paths'] ?? []));
          break;
        case 2:
          final res = await _api.get('/api/academy/certificates', extraHeaders: headers);
          if (res.ok) setState(() => _certificates = List<Map<String, dynamic>>.from(res.data['certificates'] ?? []));
          break;
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Academy', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Courses'),
            Tab(text: 'Paths'),
            Tab(text: 'Certificates'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildCoursesTab(),
          _buildPathsTab(),
          _buildCertificatesTab(),
        ],
      ),
    );
  }

  Widget _buildCoursesTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_courses.isEmpty) return const Center(child: Text('No courses available'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(0),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _courses.length,
        itemBuilder: (context, i) {
          final c = _courses[i];
          final progress = (c['progress'] ?? 0).toDouble();
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.school, color: AppTheme.primaryColor),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(c['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            Text('${c['lesson_count'] ?? 0} lessons  ·  ${c['duration'] ?? ''}',
                                style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (progress > 0) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: progress / 100,
                              minHeight: 6,
                              backgroundColor: Colors.grey[200],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text('${progress.toInt()}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPathsTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_paths.isEmpty) return const Center(child: Text('No learning paths'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(1),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _paths.length,
        itemBuilder: (context, i) {
          final p = _paths[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: Colors.deepPurple.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.route, color: Colors.deepPurple),
              ),
              title: Text(p['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${p['course_count'] ?? 0} courses'),
              trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCertificatesTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_certificates.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.workspace_premium, size: 48, color: Colors.grey),
            SizedBox(height: 16),
            Text('Complete courses to earn certificates', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _loadTabData(2),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _certificates.length,
        itemBuilder: (context, i) {
          final c = _certificates[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.workspace_premium, color: Colors.amber),
              ),
              title: Text(c['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(c['issued_at'] ?? ''),
              trailing: const Icon(Icons.download, size: 20, color: Colors.grey),
            ),
          );
        },
      ),
    );
  }
}
