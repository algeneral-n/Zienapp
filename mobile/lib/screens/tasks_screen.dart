// ============================================================================
// ZIEN Mobile — Tasks Screen
// Full CRUD for project tasks via Worker API (/api/projects/tasks/*).
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  List<Map<String, dynamic>> _tasks = [];
  bool _loading = true;
  String? _error;
  String _filter = 'all'; // all | pending | in_progress | completed

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    final companyState = ref.read(companyNotifierProvider);
    final companyId = companyState.active?.id;
    if (companyId == null) {
      setState(() {
        _loading = false;
        _error = 'No active company';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final params = <String, String>{'companyId': companyId};
      if (_filter != 'all') params['status'] = _filter;

      final res = await ApiClient.instance.get(
        '/api/projects/tasks',
        queryParams: params,
      );

      if (res.isSuccess && res.data != null) {
        final list = res.data!['tasks'] ?? res.data!['data'] ?? [];
        setState(() {
          _tasks = List<Map<String, dynamic>>.from(list is List ? list : []);
          _loading = false;
        });
      } else {
        setState(() {
          _error = res.errorMessage ?? 'Failed to load tasks';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Connection error';
        _loading = false;
      });
    }
  }

  Future<void> _createTask(
    String title,
    String? description,
    String priority,
  ) async {
    final companyState = ref.read(companyNotifierProvider);
    final companyId = companyState.active?.id;
    if (companyId == null) return;

    final res = await ApiClient.instance.post(
      '/api/projects/tasks',
      body: {
        'companyId': companyId,
        'title': title,
        if (description != null && description.isNotEmpty)
          'description': description,
        'priority': priority,
        'status': 'pending',
      },
      extraHeaders: {'X-Company-Id': companyId},
    );

    if (res.isSuccess) {
      _loadTasks();
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.errorMessage ?? 'Failed to create task')),
        );
      }
    }
  }

  Future<void> _updateTaskStatus(String taskId, String newStatus) async {
    final companyState = ref.read(companyNotifierProvider);
    final companyId = companyState.active?.id;
    if (companyId == null) return;

    final res = await ApiClient.instance.put(
      '/api/projects/tasks/$taskId',
      body: {'status': newStatus},
      extraHeaders: {'X-Company-Id': companyId},
    );

    if (res.isSuccess) {
      _loadTasks();
    }
  }

  Future<void> _deleteTask(String taskId) async {
    final companyState = ref.read(companyNotifierProvider);
    final companyId = companyState.active?.id;
    if (companyId == null) return;

    final res = await ApiClient.instance.delete(
      '/api/projects/tasks/$taskId',
      extraHeaders: {'X-Company-Id': companyId},
    );

    if (res.isSuccess) {
      _loadTasks();
    }
  }

  void _showCreateDialog() {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String priority = 'medium';

    showDialog(
      context: context,
      builder:
          (ctx) => StatefulBuilder(
            builder:
                (ctx, setDialogState) => AlertDialog(
                  title: const Text('New Task'),
                  content: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TextField(
                          controller: titleCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Title *',
                            prefixIcon: Icon(Icons.title),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: descCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Description',
                            prefixIcon: Icon(Icons.notes),
                          ),
                          maxLines: 3,
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: priority,
                          decoration: const InputDecoration(
                            labelText: 'Priority',
                            prefixIcon: Icon(Icons.flag),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'low', child: Text('Low')),
                            DropdownMenuItem(
                              value: 'medium',
                              child: Text('Medium'),
                            ),
                            DropdownMenuItem(
                              value: 'high',
                              child: Text('High'),
                            ),
                            DropdownMenuItem(
                              value: 'urgent',
                              child: Text('Urgent'),
                            ),
                          ],
                          onChanged: (v) {
                            if (v != null) setDialogState(() => priority = v);
                          },
                        ),
                      ],
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        if (titleCtrl.text.trim().isEmpty) return;
                        Navigator.pop(ctx);
                        _createTask(
                          titleCtrl.text.trim(),
                          descCtrl.text.trim(),
                          priority,
                        );
                      },
                      child: const Text('Create'),
                    ),
                  ],
                ),
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tasks'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) {
              setState(() => _filter = v);
              _loadTasks();
            },
            itemBuilder:
                (_) => const [
                  PopupMenuItem(value: 'all', child: Text('All')),
                  PopupMenuItem(value: 'pending', child: Text('Pending')),
                  PopupMenuItem(
                    value: 'in_progress',
                    child: Text('In Progress'),
                  ),
                  PopupMenuItem(value: 'completed', child: Text('Completed')),
                ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        child: const Icon(Icons.add),
      ),
      body:
          _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
              ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 48,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _loadTasks,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              )
              : _tasks.isEmpty
              ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.task_alt, size: 64, color: Colors.grey.shade400),
                    const SizedBox(height: 16),
                    Text(
                      'No tasks yet',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Tap + to create your first task',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              )
              : RefreshIndicator(
                onRefresh: _loadTasks,
                child: ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _tasks.length,
                  itemBuilder: (context, index) {
                    final task = _tasks[index];
                    return _TaskCard(
                      task: task,
                      onStatusChange:
                          (status) =>
                              _updateTaskStatus(task['id'].toString(), status),
                      onDelete: () => _deleteTask(task['id'].toString()),
                    );
                  },
                ),
              ),
    );
  }
}

// ─── Task Card ───────────────────────────────────────────────────────────────

class _TaskCard extends StatelessWidget {
  final Map<String, dynamic> task;
  final void Function(String status) onStatusChange;
  final VoidCallback onDelete;

  const _TaskCard({
    required this.task,
    required this.onStatusChange,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final status = task['status']?.toString() ?? 'pending';
    final priority = task['priority']?.toString() ?? 'medium';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _priorityDot(priority),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    task['title']?.toString() ?? 'Untitled',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      decoration:
                          status == 'completed'
                              ? TextDecoration.lineThrough
                              : null,
                    ),
                  ),
                ),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, size: 20),
                  onSelected: (v) {
                    if (v == 'delete') {
                      onDelete();
                    } else {
                      onStatusChange(v);
                    }
                  },
                  itemBuilder:
                      (_) => [
                        if (status != 'pending')
                          const PopupMenuItem(
                            value: 'pending',
                            child: Text('Mark Pending'),
                          ),
                        if (status != 'in_progress')
                          const PopupMenuItem(
                            value: 'in_progress',
                            child: Text('Mark In Progress'),
                          ),
                        if (status != 'completed')
                          const PopupMenuItem(
                            value: 'completed',
                            child: Text('Mark Completed'),
                          ),
                        const PopupMenuDivider(),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Text(
                            'Delete',
                            style: TextStyle(color: Colors.red),
                          ),
                        ),
                      ],
                ),
              ],
            ),
            if (task['description'] != null &&
                task['description'].toString().isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                task['description'].toString(),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                _statusChip(status, theme),
                const Spacer(),
                if (task['assignee_name'] != null)
                  Text(
                    task['assignee_name'].toString(),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _priorityDot(String priority) {
    final color = switch (priority) {
      'urgent' => Colors.red,
      'high' => Colors.orange,
      'medium' => Colors.blue,
      'low' => Colors.grey,
      _ => Colors.grey,
    };
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }

  Widget _statusChip(String status, ThemeData theme) {
    final (label, color) = switch (status) {
      'pending' => ('Pending', Colors.orange),
      'in_progress' => ('In Progress', Colors.blue),
      'completed' => ('Completed', Colors.green),
      'blocked' => ('Blocked', Colors.red),
      _ => (status, Colors.grey),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
