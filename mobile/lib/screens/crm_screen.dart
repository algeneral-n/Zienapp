// ============================================================================
// ZIEN Mobile -- CRM Module Screen
// Mirrors web: src/pages/modules/CRMModule.tsx
// Tabs: Clients, Leads, Opportunities, Activities
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';
import '../theme/app_theme.dart';

class CRMScreen extends ConsumerStatefulWidget {
  const CRMScreen({super.key});

  @override
  ConsumerState<CRMScreen> createState() => _CRMScreenState();
}

class _CRMScreenState extends ConsumerState<CRMScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _api = ApiClient.instance;

  List<Map<String, dynamic>> _clients = [];
  List<Map<String, dynamic>> _leads = [];
  List<Map<String, dynamic>> _opportunities = [];
  List<Map<String, dynamic>> _activities = [];
  bool _loading = true;

  String? get _companyId => ref.read(companyNotifierProvider).active?.id;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
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
    try {
      final headers = {'X-Company-Id': _companyId!};
      switch (index) {
        case 0:
          final res = await _api.get('/api/crm/clients', extraHeaders: headers);
          if (res.isSuccess) setState(() => _clients = List<Map<String, dynamic>>.from(res.data?['clients'] ?? []));
          break;
        case 1:
          final res = await _api.get('/api/crm/leads', extraHeaders: headers);
          if (res.isSuccess) setState(() => _leads = List<Map<String, dynamic>>.from(res.data?['leads'] ?? []));
          break;
        case 2:
          final res = await _api.get('/api/crm/opportunities', extraHeaders: headers);
          if (res.isSuccess) setState(() => _opportunities = List<Map<String, dynamic>>.from(res.data?['opportunities'] ?? []));
          break;
        case 3:
          final res = await _api.get('/api/crm/activities', extraHeaders: headers);
          if (res.isSuccess) setState(() => _activities = List<Map<String, dynamic>>.from(res.data?['activities'] ?? []));
          break;
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CRM', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Clients'),
            Tab(text: 'Leads'),
            Tab(text: 'Opportunities'),
            Tab(text: 'Activities'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildClientsTab(),
          _buildLeadsTab(),
          _buildOpportunitiesTab(),
          _buildActivitiesTab(),
        ],
      ),
    );
  }

  Widget _buildClientsTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_clients.isEmpty) return const Center(child: Text('No clients yet'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(0),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _clients.length,
        itemBuilder: (context, i) {
          final c = _clients[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.1),
                child: Text(
                  (c['name'] ?? 'C')[0].toUpperCase(),
                  style: TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(c['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(c['email'] ?? c['phone'] ?? ''),
              trailing: Text(c['type'] ?? 'client', style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLeadsTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_leads.isEmpty) return const Center(child: Text('No leads yet'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(1),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _leads.length,
        itemBuilder: (context, i) {
          final lead = _leads[i];
          final stage = lead['stage'] ?? 'new';
          final stageColor = stage == 'qualified' ? Colors.green : stage == 'contacted' ? Colors.blue : Colors.orange;
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Icon(Icons.person_add, color: stageColor),
              title: Text(lead['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(lead['source'] ?? ''),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: stageColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(stage.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: stageColor)),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildOpportunitiesTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_opportunities.isEmpty) return const Center(child: Text('No opportunities'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(2),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _opportunities.length,
        itemBuilder: (context, i) {
          final opp = _opportunities[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: const Icon(Icons.monetization_on, color: Colors.amber),
              title: Text(opp['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(opp['stage'] ?? ''),
              trailing: Text(
                '\$${opp['value'] ?? 0}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActivitiesTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_activities.isEmpty) return const Center(child: Text('No activities'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(3),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _activities.length,
        itemBuilder: (context, i) {
          final act = _activities[i];
          final typeIcon = act['type'] == 'call' ? Icons.phone : act['type'] == 'email' ? Icons.email : Icons.note;
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Icon(typeIcon, color: Colors.blueGrey),
              title: Text(act['subject'] ?? act['type'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(act['created_at'] ?? ''),
            ),
          );
        },
      ),
    );
  }
}
