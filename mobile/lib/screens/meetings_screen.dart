// ============================================================================
// ZIEN Mobile -- Meetings Screen
// Mirrors web: src/pages/modules/MeetingsModule.tsx
// Tabs: Upcoming, Past, Recordings
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';
import '../theme/app_theme.dart';

class MeetingsScreen extends ConsumerStatefulWidget {
  const MeetingsScreen({super.key});

  @override
  ConsumerState<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends ConsumerState<MeetingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _api = ApiClient.instance;

  List<Map<String, dynamic>> _upcoming = [];
  List<Map<String, dynamic>> _past = [];
  List<Map<String, dynamic>> _recordings = [];
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
          final res = await _api.get('/api/meetings?status=upcoming', extraHeaders: headers);
          if (res.isSuccess) setState(() => _upcoming = List<Map<String, dynamic>>.from(res.data?['meetings'] ?? []));
          break;
        case 1:
          final res = await _api.get('/api/meetings?status=past', extraHeaders: headers);
          if (res.isSuccess) setState(() => _past = List<Map<String, dynamic>>.from(res.data?['meetings'] ?? []));
          break;
        case 2:
          final res = await _api.get('/api/meetings/recordings', extraHeaders: headers);
          if (res.isSuccess) setState(() => _recordings = List<Map<String, dynamic>>.from(res.data?['recordings'] ?? []));
          break;
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meetings', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
            Tab(text: 'Recordings'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildMeetingList(_upcoming, 0, isUpcoming: true),
          _buildMeetingList(_past, 1),
          _buildRecordingsList(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showScheduleMeeting(context),
        child: const Icon(Icons.video_call),
      ),
    );
  }

  Widget _buildMeetingList(List<Map<String, dynamic>> meetings, int tabIdx, {bool isUpcoming = false}) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (meetings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(isUpcoming ? Icons.event_available : Icons.event_busy, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(isUpcoming ? 'No upcoming meetings' : 'No past meetings', style: const TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _loadTabData(tabIdx),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: meetings.length,
        itemBuilder: (context, i) {
          final m = meetings[i];
          final startTime = m['start_time'] ?? '';
          final participants = (m['participants'] as List?)?.length ?? m['participant_count'] ?? 0;
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: isUpcoming ? () => _joinMeeting(m) : null,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(
                        color: isUpcoming
                            ? AppTheme.primaryBlue.withValues(alpha: 0.1)
                            : Colors.grey.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.videocam,
                        color: isUpcoming ? AppTheme.primaryBlue : Colors.grey,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(m['title'] ?? 'Meeting', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.access_time, size: 13, color: Colors.grey[500]),
                              const SizedBox(width: 4),
                              Text(startTime.length > 16 ? startTime.substring(0, 16) : startTime,
                                  style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                              const SizedBox(width: 12),
                              Icon(Icons.people, size: 13, color: Colors.grey[500]),
                              const SizedBox(width: 4),
                              Text('$participants', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (isUpcoming)
                      ElevatedButton(
                        onPressed: () => _joinMeeting(m),
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        child: const Text('Join', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRecordingsList() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_recordings.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.fiber_manual_record, size: 48, color: Colors.grey),
            SizedBox(height: 16),
            Text('No recordings', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _loadTabData(2),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _recordings.length,
        itemBuilder: (context, i) {
          final r = _recordings[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Container(
                width: 40, height: 40,
                decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.play_circle_fill, color: Colors.red),
              ),
              title: Text(r['title'] ?? 'Recording', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(r['duration'] ?? r['created_at'] ?? ''),
              trailing: const Icon(Icons.download, size: 20, color: Colors.grey),
            ),
          );
        },
      ),
    );
  }

  void _joinMeeting(Map<String, dynamic> meeting) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Joining: ${meeting['title'] ?? 'Meeting'}...')),
    );
  }

  void _showScheduleMeeting(BuildContext context) {
    final titleCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Schedule Meeting', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 16),
            TextField(
              controller: titleCtrl,
              decoration: InputDecoration(labelText: 'Meeting Title', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (titleCtrl.text.trim().isEmpty) return;
                  Navigator.pop(ctx);
                  final headers = {'X-Company-Id': _companyId!};
                  await _api.post('/api/meetings', body: {
                    'title': titleCtrl.text.trim(),
                    'start_time': DateTime.now().add(const Duration(hours: 1)).toIso8601String(),
                  }, extraHeaders: headers);
                  _loadTabData(0);
                },
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Schedule', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
