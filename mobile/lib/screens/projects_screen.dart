// ============================================================================
// ZIEN Mobile -- Projects Module Screen
// Mirrors web: src/pages/modules/ProjectsModule.tsx
// Tabs: Projects, Board, Timeline
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';
import '../theme/app_theme.dart';

class ProjectsScreen extends ConsumerStatefulWidget {
  const ProjectsScreen({super.key});

  @override
  ConsumerState<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends ConsumerState<ProjectsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _api = ApiClient.instance;

  List<Map<String, dynamic>> _projects = [];
  List<Map<String, dynamic>> _tasks = [];
  Map<String, dynamic> _stats = {};
  bool _loading = true;

  String? get _companyId => ref.read(companyNotifierProvider).active?.id;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadProjects());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadProjects() async {
    if (_companyId == null) return;
    setState(() => _loading = true);
    try {
      final headers = {'X-Company-Id': _companyId!};
      final res = await _api.get('/api/projects/list', extraHeaders: headers);
      if (res.isSuccess) {
        setState(() {
          _projects = List<Map<String, dynamic>>.from(res.data?['projects'] ?? []);
          _stats = res.data?['stats'] is Map ? Map<String, dynamic>.from(res.data?['stats']) : {};
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'All Projects'),
            Tab(text: 'Tasks'),
            Tab(text: 'Board'),
            Tab(text: 'Timeline'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildProjectsList(),
          _buildTasksTab(),
          _buildBoard(),
          _buildTimeline(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateProject(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildProjectsList() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_projects.isEmpty) return const Center(child: Text('No projects yet'));
    return RefreshIndicator(
      onRefresh: _loadProjects,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Stats row
          if (_stats.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                children: [
                  _statCard('Total', '${_stats['total'] ?? _projects.length}', Colors.blue),
                  const SizedBox(width: 8),
                  _statCard('Active', '${_stats['active'] ?? 0}', Colors.green),
                  const SizedBox(width: 8),
                  _statCard('Completed', '${_stats['completed'] ?? 0}', Colors.grey),
                ],
              ),
            ),
          ..._projects.map((p) {
            final progress = (p['progress'] ?? 0).toDouble();
            final statusColor = p['status'] == 'active' ? Colors.green
                : p['status'] == 'completed' ? Colors.blue
                : Colors.orange;
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            (p['status'] ?? 'active').toString().toUpperCase(),
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                          ),
                        ),
                      ],
                    ),
                    if (p['description'] != null) ...[
                      const SizedBox(height: 8),
                      Text(p['description'], style: const TextStyle(color: Colors.grey, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: progress / 100,
                      backgroundColor: Colors.grey.withValues(alpha: 0.2),
                      color: statusColor,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 4),
                    Text('${progress.toInt()}% complete', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _buildTasksTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    // Flatten tasks from all projects
    final allTasks = <Map<String, dynamic>>[];
    for (final p in _projects) {
      final tasks = p['tasks'] as List? ?? [];
      for (final t in tasks) {
        allTasks.add({...Map<String, dynamic>.from(t as Map), 'project_name': p['name']});
      }
    }
    // Also add standalone tasks
    allTasks.addAll(_tasks);

    if (allTasks.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.task_alt, size: 48, color: Colors.grey),
            SizedBox(height: 16),
            Text('Tasks', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            SizedBox(height: 8),
            Text('No tasks found. Create tasks within projects.', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadProjects,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: allTasks.length,
        itemBuilder: (context, i) {
          final task = allTasks[i];
          final isDone = task['is_done'] == true || task['status'] == 'done';
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            child: ListTile(
              leading: Icon(
                isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                color: isDone ? Colors.green : Colors.grey,
              ),
              title: Text(
                task['title'] ?? '',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  decoration: isDone ? TextDecoration.lineThrough : null,
                ),
              ),
              subtitle: Text(task['project_name'] ?? '', style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBoard() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final statuses = ['todo', 'in_progress', 'review', 'done'];
    final labels = {'todo': 'To Do', 'in_progress': 'In Progress', 'review': 'Review', 'done': 'Done'};
    final colors = {'todo': Colors.grey, 'in_progress': Colors.blue, 'review': Colors.orange, 'done': Colors.green};

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: statuses.map((status) {
          final items = _projects.where((p) => p['status'] == status).toList();
          return Container(
            width: 260,
            margin: const EdgeInsets.only(right: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: colors[status]!.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(labels[status]!, style: TextStyle(fontWeight: FontWeight.bold, color: colors[status])),
                      Text('${items.length}', style: TextStyle(fontWeight: FontWeight.bold, color: colors[status])),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                ...items.map((p) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                )),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTimeline() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_projects.isEmpty) return const Center(child: Text('No projects'));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _projects.length,
      itemBuilder: (context, i) {
        final p = _projects[i];
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Container(
                  width: 12, height: 12,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue,
                    shape: BoxShape.circle,
                  ),
                ),
                if (i < _projects.length - 1)
                  Container(width: 2, height: 60, color: Colors.grey.withValues(alpha: 0.3)),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('${p['start_date'] ?? 'TBD'} - ${p['end_date'] ?? 'TBD'}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showCreateProject(BuildContext context) {
    final nameCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('New Project', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(
                labelText: 'Project Name',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty) return;
                  Navigator.pop(ctx);
                  final headers = {'X-Company-Id': _companyId!};
                  await _api.post('/api/projects/create', body: {'name': nameCtrl.text.trim()}, extraHeaders: headers);
                  _loadProjects();
                },
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Create', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
