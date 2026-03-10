// ============================================================================
// ZIEN Mobile -- Logistics Module Screen
// Mirrors web: src/pages/modules/LogisticsModule.tsx
// Tabs: Shipments, Routes, Drivers, Analytics
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';
import '../theme/app_theme.dart';

class LogisticsScreen extends ConsumerStatefulWidget {
  const LogisticsScreen({super.key});

  @override
  ConsumerState<LogisticsScreen> createState() => _LogisticsScreenState();
}

class _LogisticsScreenState extends ConsumerState<LogisticsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _api = ApiClient.instance;

  List<Map<String, dynamic>> _shipments = [];
  List<Map<String, dynamic>> _routes = [];
  List<Map<String, dynamic>> _drivers = [];
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
          final res = await _api.get('/api/logistics-v2/shipments', extraHeaders: headers);
          if (res.isSuccess) setState(() => _shipments = List<Map<String, dynamic>>.from(res.data?['shipments'] ?? []));
          break;
        case 1:
          final res = await _api.get('/api/logistics-v2/routes', extraHeaders: headers);
          if (res.isSuccess) setState(() => _routes = List<Map<String, dynamic>>.from(res.data?['routes'] ?? []));
          break;
        case 2:
          final res = await _api.get('/api/logistics-v2/drivers', extraHeaders: headers);
          if (res.isSuccess) setState(() => _drivers = List<Map<String, dynamic>>.from(res.data?['drivers'] ?? []));
          break;
        case 3:
          break; // Analytics loaded inline
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Logistics', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Shipments'),
            Tab(text: 'Routes'),
            Tab(text: 'Drivers'),
            Tab(text: 'Analytics'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildShipmentsTab(),
          _buildRoutesTab(),
          _buildDriversTab(),
          _buildAnalyticsTab(),
        ],
      ),
    );
  }

  Widget _buildShipmentsTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_shipments.isEmpty) return const Center(child: Text('No shipments'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(0),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _shipments.length,
        itemBuilder: (context, i) {
          final s = _shipments[i];
          final status = s['status'] ?? 'pending';
          final statusColor = status == 'delivered' ? Colors.green
              : status == 'in_transit' ? Colors.blue
              : status == 'cancelled' ? Colors.red
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
                      Text('#${s['tracking_number'] ?? s['id']?.toString().substring(0, 8) ?? ''}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(status.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(child: Text('${s['origin'] ?? ''} -> ${s['destination'] ?? ''}', style: const TextStyle(fontSize: 12, color: Colors.grey))),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRoutesTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_routes.isEmpty) return const Center(child: Text('No routes'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(1),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _routes.length,
        itemBuilder: (context, i) {
          final r = _routes[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.1),
                child: const Icon(Icons.route),
              ),
              title: Text(r['name'] ?? 'Route ${i + 1}', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${r['stops'] ?? 0} stops  |  ${r['distance_km'] ?? '-'} km'),
              trailing: Text(r['status'] ?? '', style: const TextStyle(fontSize: 11)),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDriversTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_drivers.isEmpty) return const Center(child: Text('No drivers'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(2),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _drivers.length,
        itemBuilder: (context, i) {
          final d = _drivers[i];
          final online = d['status'] == 'online';
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: (online ? Colors.green : Colors.grey).withValues(alpha: 0.1),
                child: Icon(Icons.local_shipping, color: online ? Colors.green : Colors.grey),
              ),
              title: Text(d['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(d['vehicle'] ?? ''),
              trailing: Container(
                width: 10, height: 10,
                decoration: BoxDecoration(
                  color: online ? Colors.green : Colors.grey,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAnalyticsTab() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.analytics_outlined, size: 48, color: Colors.grey),
          SizedBox(height: 16),
          Text('Logistics Analytics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          SizedBox(height: 8),
          Text('Delivery metrics and route optimization', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}
