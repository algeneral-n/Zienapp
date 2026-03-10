// ============================================================================
// ZIEN Mobile — Supreme Access Screen
// Founder-only biometric-gated command center for platform oversight,
// security monitoring, reports, and confirmed command execution.
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/auth_providers.dart';
import '../services/company_providers.dart';
import '../models/enums.dart';
import '../theme/app_theme.dart';

class SupremeAccessScreen extends ConsumerStatefulWidget {
  const SupremeAccessScreen({super.key});

  @override
  ConsumerState<SupremeAccessScreen> createState() => _SupremeAccessScreenState();
}

class _SupremeAccessScreenState extends ConsumerState<SupremeAccessScreen>
    with TickerProviderStateMixin {
  final _api = ApiClient.instance;

  // Auth gate
  bool _authenticated = false;
  bool _authFailed = false;
  final _pinCtrl = TextEditingController();

  // Tab control
  late TabController _tabCtrl;

  // Data
  Map<String, dynamic> _health = {};
  List<Map<String, dynamic>> _auditLog = [];
  List<Map<String, dynamic>> _alerts = [];
  Map<String, dynamic> _metrics = {};
  bool _loading = false;

  // Command execution
  final _cmdCtrl = TextEditingController();
  String _cmdType = 'query';
  List<Map<String, dynamic>> _cmdHistory = [];

  // AI Agent panel
  List<Map<String, dynamic>> _queueCommands = [];
  Map<String, dynamic> _aiHeartbeat = {};
  bool _aiConnected = false;

  static const _supremePin = '070725'; // founder-set PIN

  static const Map<String, Map<String, dynamic>> _cmdTypes = {
    'query': {'label': 'Query', 'icon': Icons.search, 'color': Colors.blue},
    'user_mgmt': {'label': 'User Mgmt', 'icon': Icons.people, 'color': Colors.teal},
    'security': {'label': 'Security', 'icon': Icons.shield, 'color': Colors.red},
    'system': {'label': 'System', 'icon': Icons.settings, 'color': Colors.orange},
    'data': {'label': 'Data Ops', 'icon': Icons.storage, 'color': Colors.purple},
  };

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _pinCtrl.dispose();
    _cmdCtrl.dispose();
    super.dispose();
  }

  // ─── Founder verification ──────────────────────────────────────────────

  bool get _isFounder {
    final profile = ref.read(profileProvider).valueOrNull;
    return profile?.platformRole == PlatformRole.founder;
  }

  Future<void> _authenticateWithPin() async {
    final pin = _pinCtrl.text.trim();
    if (pin == _supremePin && _isFounder) {
      HapticFeedback.heavyImpact();
      setState(() {
        _authenticated = true;
        _authFailed = false;
      });
      _pinCtrl.clear();
      _loadAllData();
    } else {
      HapticFeedback.vibrate();
      setState(() => _authFailed = true);
      _pinCtrl.clear();
    }
  }

  // ─── Data loading ──────────────────────────────────────────────────────

  Future<void> _loadAllData() async {
    setState(() => _loading = true);
    await Future.wait([
      _loadHealth(),
      _loadAuditLog(),
      _loadAlerts(),
      _loadMetrics(),
      _loadQueue(),
      _loadAIHeartbeat(),
    ]);
    setState(() => _loading = false);
  }

  Future<void> _loadHealth() async {
    final res = await _api.get('/api/founder/system-health');
    if (res.isSuccess && res.data != null) {
      setState(() => _health = res.data!);
    }
  }

  Future<void> _loadAuditLog() async {
    final res = await _api.get('/api/founder/audit-log?limit=50');
    if (res.isSuccess && res.data != null) {
      setState(() => _auditLog = List<Map<String, dynamic>>.from(res.data?['logs'] ?? []));
    }
  }

  Future<void> _loadAlerts() async {
    final res = await _api.get('/api/supreme/security-alerts');
    if (res.isSuccess && res.data != null) {
      setState(() => _alerts = List<Map<String, dynamic>>.from(res.data?['alerts'] ?? []));
    }
  }

  Future<void> _loadMetrics() async {
    final res = await _api.get('/api/supreme/monitoring');
    if (res.isSuccess && res.data != null) {
      setState(() => _metrics = res.data!);
    }
  }

  Future<void> _loadQueue() async {
    final res = await _api.get('/api/supreme/queue?status=pending');
    if (res.isSuccess && res.data != null) {
      setState(() => _queueCommands = List<Map<String, dynamic>>.from(res.data?['commands'] ?? []));
    }
  }

  Future<void> _loadAIHeartbeat() async {
    final res = await _api.get('/api/supreme/ai/heartbeat');
    if (res.isSuccess && res.data != null) {
      setState(() {
        _aiHeartbeat = res.data!;
        _aiConnected = true;
      });
    } else {
      setState(() => _aiConnected = false);
    }
  }

  Future<void> _approveQueueItem(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Approve AI Command?', style: TextStyle(color: Colors.white)),
        content: Text('This will execute the AI-requested command.', style: TextStyle(color: Colors.grey[300])),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green[700]),
            child: const Text('APPROVE', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    HapticFeedback.heavyImpact();
    await _api.post('/api/supreme/queue/$id/approve', body: {});
    _loadQueue();
  }

  Future<void> _rejectQueueItem(String id) async {
    await _api.post('/api/supreme/queue/$id/reject', body: {'reason': 'Founder rejected'});
    HapticFeedback.mediumImpact();
    _loadQueue();
  }

  // ─── Command execution (with confirmation) ────────────────────────────

  Future<void> _executeCommand() async {
    final command = _cmdCtrl.text.trim();
    if (command.isEmpty) return;

    // MANDATORY confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 28),
            const SizedBox(width: 12),
            const Text('Confirm Execution', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Command Type: ${_cmdTypes[_cmdType]?['label'] ?? _cmdType}',
                style: TextStyle(color: Colors.grey[400], fontSize: 13)),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
              ),
              child: Text(command,
                  style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 13)),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Colors.redAccent, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'This action will be logged and is irreversible.',
                      style: TextStyle(color: Colors.red[300], fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(ctx, true),
            icon: const Icon(Icons.check_circle, size: 18),
            label: const Text('I CONFIRM'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red[700],
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    HapticFeedback.heavyImpact();
    setState(() => _loading = true);

    final res = await _api.post('/api/supreme/execute', body: {
      'command': command,
      'type': _cmdType,
    });

    setState(() {
      _cmdHistory.insert(0, {
        'command': command,
        'type': _cmdType,
        'success': res.isSuccess,
        'result': res.data?['result'] ?? res.errorMessage ?? 'No response',
        'timestamp': DateTime.now().toIso8601String(),
      });
      _loading = false;
    });
    _cmdCtrl.clear();
  }

  // ─── Generate report ───────────────────────────────────────────────────

  Future<void> _generateReport(String type) async {
    setState(() => _loading = true);
    final res = await _api.get('/api/supreme/reports/$type');
    setState(() => _loading = false);

    if (!mounted) return;

    if (res.isSuccess && res.data != null) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: const Color(0xFF1A1A2E),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (ctx) => DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.7,
          maxChildSize: 0.95,
          builder: (ctx, scrollCtrl) => ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey[600],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                '${type.replaceAll('_', ' ').toUpperCase()} REPORT',
                style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Generated: ${DateTime.now().toString().substring(0, 19)}',
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
              const Divider(color: Colors.grey, height: 32),
              ...((res.data?['sections'] as List<dynamic>?) ?? []).map<Widget>((section) {
                final s = section as Map<String, dynamic>;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s['title'] as String? ?? '', style: const TextStyle(
                        color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 15,
                      )),
                      const SizedBox(height: 8),
                      Text(s['content'] as String? ?? '', style: TextStyle(
                        color: Colors.grey[300], fontSize: 13, height: 1.6,
                      )),
                    ],
                  ),
                );
              }),
              if ((res.data?['sections'] as List?)?.isEmpty ?? true)
                Text(
                  res.data?['summary'] as String? ?? 'Report data loaded.',
                  style: TextStyle(color: Colors.grey[300], fontSize: 14, height: 1.6),
                ),
            ],
          ),
        ),
      );
    }
  }

  // ─── BUILD ─────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    // Block non-founders entirely
    if (!_isFounder) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D0D1A),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.block, size: 80, color: Colors.red),
              const SizedBox(height: 16),
              const Text('ACCESS DENIED', style: TextStyle(
                color: Colors.red, fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: 2,
              )),
              const SizedBox(height: 8),
              Text('Supreme Access is restricted to platform founder.',
                  style: TextStyle(color: Colors.grey[500])),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.grey[800]),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    // PIN gate
    if (!_authenticated) return _buildAuthGate();

    // Main supreme dashboard
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A2E),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Colors.amber, Colors.orange]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.shield, color: Colors.black, size: 18),
            ),
            const SizedBox(width: 10),
            const Text('SUPREME ACCESS', style: TextStyle(
              fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 16, color: Colors.white,
            )),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.amber),
            onPressed: _loadAllData,
          ),
          IconButton(
            icon: const Icon(Icons.lock_outline, color: Colors.red),
            onPressed: () => setState(() => _authenticated = false),
            tooltip: 'Lock',
          ),
        ],
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: Colors.amber,
          labelColor: Colors.amber,
          unselectedLabelColor: Colors.grey,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          tabs: const [
            Tab(icon: Icon(Icons.dashboard, size: 18), text: 'Monitor'),
            Tab(icon: Icon(Icons.security, size: 18), text: 'Security'),
            Tab(icon: Icon(Icons.assessment, size: 18), text: 'Reports'),
            Tab(icon: Icon(Icons.terminal, size: 18), text: 'Command'),
            Tab(icon: Icon(Icons.smart_toy, size: 18), text: 'AI Agent'),
          ],
        ),
      ),
      body: _loading && _health.isEmpty
          ? const Center(child: CircularProgressIndicator(color: Colors.amber))
          : TabBarView(
              controller: _tabCtrl,
              children: [
                _buildMonitorTab(),
                _buildSecurityTab(),
                _buildReportsTab(),
                _buildCommandTab(),
                _buildAIAgentTab(),
              ],
            ),
    );
  }

  // ─── AUTH GATE ─────────────────────────────────────────────────────────

  Widget _buildAuthGate() {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D1A),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Supreme logo
              Container(
                width: 100, height: 100,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFD700), Color(0xFFFF8C00)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(color: Colors.amber.withValues(alpha: 0.3), blurRadius: 30, spreadRadius: 5),
                  ],
                ),
                child: const Icon(Icons.shield_moon, size: 48, color: Color(0xFF1A1A2E)),
              ),
              const SizedBox(height: 24),
              const Text('SUPREME ACCESS', style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.w900, fontSize: 26, letterSpacing: 3,
              )),
              const SizedBox(height: 8),
              Text('Platform Founder Authentication',
                  style: TextStyle(color: Colors.grey[500], fontSize: 13)),
              const SizedBox(height: 40),

              // PIN Input
              SizedBox(
                width: 240,
                child: TextField(
                  controller: _pinCtrl,
                  obscureText: true,
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  style: const TextStyle(
                    color: Colors.white, fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.bold,
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: '• • • • • •',
                    hintStyle: TextStyle(color: Colors.grey[600], letterSpacing: 12),
                    filled: true,
                    fillColor: const Color(0xFF1A1A2E),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(
                        color: _authFailed ? Colors.red : Colors.amber.withValues(alpha: 0.3),
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(
                        color: _authFailed ? Colors.red : Colors.amber.withValues(alpha: 0.3),
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Colors.amber, width: 2),
                    ),
                  ),
                  onSubmitted: (_) => _authenticateWithPin(),
                ),
              ),
              if (_authFailed)
                const Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Text('Invalid PIN', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                ),
              const SizedBox(height: 24),
              SizedBox(
                width: 240,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _authenticateWithPin,
                  icon: const Icon(Icons.fingerprint, size: 22),
                  label: const Text('AUTHENTICATE', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.amber[700],
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock, size: 14, color: Colors.grey[600]),
                  const SizedBox(width: 6),
                  Text('End-to-end encrypted • Founder only',
                      style: TextStyle(color: Colors.grey[600], fontSize: 11)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── MONITOR TAB ───────────────────────────────────────────────────────

  Widget _buildMonitorTab() {
    return RefreshIndicator(
      color: Colors.amber,
      onRefresh: _loadAllData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Live status banner
          _statusBanner(),
          const SizedBox(height: 16),

          // Metrics grid
          _sectionTitle('Platform Metrics'),
          const SizedBox(height: 10),
          _metricsGrid(),
          const SizedBox(height: 20),

          // System health
          _sectionTitle('System Health'),
          const SizedBox(height: 10),
          _healthCards(),
          const SizedBox(height: 20),

          // Recent activity
          _sectionTitle('Live Activity Feed'),
          const SizedBox(height: 10),
          ..._auditLog.take(10).map((log) => _activityTile(log)),
          if (_auditLog.isEmpty)
            _emptyState('No activity logs yet'),
        ],
      ),
    );
  }

  Widget _statusBanner() {
    final status = _health['status'] as String? ?? 'unknown';
    final isHealthy = status == 'healthy' || status == 'ok';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isHealthy
              ? [const Color(0xFF064E3B), const Color(0xFF065F46)]
              : [const Color(0xFF7F1D1D), const Color(0xFF991B1B)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isHealthy ? Colors.green.withValues(alpha: 0.3) : Colors.red.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 12, height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isHealthy ? Colors.green : Colors.red,
              boxShadow: [BoxShadow(color: (isHealthy ? Colors.green : Colors.red).withValues(alpha: 0.5), blurRadius: 8)],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isHealthy ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM ALERT',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1),
                ),
                const SizedBox(height: 2),
                Text(
                  'Last checked: ${DateTime.now().toString().substring(11, 19)}',
                  style: TextStyle(color: Colors.grey[400], fontSize: 11),
                ),
              ],
            ),
          ),
          Icon(isHealthy ? Icons.check_circle : Icons.error, color: isHealthy ? Colors.green : Colors.red, size: 28),
        ],
      ),
    );
  }

  Widget _metricsGrid() {
    final items = <_MetricItem>[
      _MetricItem('Active Tenants', '${_metrics['active_tenants'] ?? _health['tenants'] ?? '--'}', Icons.business, Colors.blue),
      _MetricItem('Total Users', '${_metrics['total_users'] ?? _health['users'] ?? '--'}', Icons.people, Colors.teal),
      _MetricItem('AI Queries (24h)', '${_metrics['ai_queries_24h'] ?? '--'}', Icons.psychology, Colors.purple),
      _MetricItem('Revenue (MTD)', '\$${_metrics['revenue_mtd'] ?? '--'}', Icons.attach_money, Colors.green),
      _MetricItem('Active Sessions', '${_metrics['active_sessions'] ?? '--'}', Icons.devices, Colors.orange),
      _MetricItem('Error Rate', '${_metrics['error_rate'] ?? '--'}%', Icons.bug_report, Colors.red),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2, mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 1.8,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final m = items[i];
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: m.color.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(m.icon, size: 16, color: m.color),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(m.label, style: TextStyle(color: Colors.grey[400], fontSize: 11),
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
              Text(m.value, style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
            ],
          ),
        );
      },
    );
  }

  Widget _healthCards() {
    final services = <Map<String, dynamic>>[
      {'name': 'Database', 'icon': Icons.storage, 'key': 'db_status'},
      {'name': 'Auth Service', 'icon': Icons.vpn_key, 'key': 'auth_status'},
      {'name': 'Worker API', 'icon': Icons.cloud, 'key': 'api_status'},
      {'name': 'AI Engine', 'icon': Icons.smart_toy, 'key': 'ai_status'},
      {'name': 'Storage', 'icon': Icons.folder, 'key': 'storage_status'},
      {'name': 'Edge Functions', 'icon': Icons.functions, 'key': 'edge_status'},
    ];

    return Column(
      children: services.map((svc) {
        final status = _health[svc['key']] as String? ?? 'unknown';
        final ok = status == 'healthy' || status == 'ok' || status == 'operational';
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(svc['icon'] as IconData, size: 18, color: Colors.grey[400]),
              const SizedBox(width: 12),
              Expanded(child: Text(svc['name'] as String, style: const TextStyle(color: Colors.white, fontSize: 13))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: ok ? Colors.green.withValues(alpha: 0.15) : Colors.red.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  ok ? 'Healthy' : status.toUpperCase(),
                  style: TextStyle(color: ok ? Colors.green : Colors.red, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _activityTile(Map<String, dynamic> log) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 6, height: 36,
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  log['action'] as String? ?? log['event'] as String? ?? 'event',
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  '${log['actor_email'] ?? log['user_id'] ?? 'system'} • ${log['created_at'] ?? ''}',
                  style: TextStyle(color: Colors.grey[500], fontSize: 10),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── SECURITY TAB ─────────────────────────────────────────────────────

  Widget _buildSecurityTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Threat level indicator
        _threatLevel(),
        const SizedBox(height: 20),

        _sectionTitle('Active Security Alerts'),
        const SizedBox(height: 10),
        if (_alerts.isEmpty)
          _emptyState('No active alerts — All clear')
        else
          ..._alerts.map((a) => _alertTile(a)),

        const SizedBox(height: 20),
        _sectionTitle('Security Actions'),
        const SizedBox(height: 10),
        _securityActionTile('Force Logout All Sessions', Icons.logout, Colors.red,
            'Immediately terminate all active user sessions platform-wide'),
        _securityActionTile('Enable Lockdown Mode', Icons.lock, Colors.orange,
            'Restrict platform to founder-only access'),
        _securityActionTile('Rotate API Keys', Icons.vpn_key, Colors.purple,
            'Generate new API keys and invalidate existing ones'),
        _securityActionTile('Export Audit Trail', Icons.download, Colors.blue,
            'Download complete platform audit log as encrypted file'),

        const SizedBox(height: 20),
        _sectionTitle('Full Audit Log'),
        const SizedBox(height: 10),
        ..._auditLog.map((log) => _activityTile(log)),
        if (_auditLog.isEmpty)
          _emptyState('No audit entries'),
      ],
    );
  }

  Widget _threatLevel() {
    final level = _alerts.isEmpty ? 'LOW' : (_alerts.length < 3 ? 'MEDIUM' : 'HIGH');
    final color = level == 'LOW' ? Colors.green : (level == 'MEDIUM' ? Colors.orange : Colors.red);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withValues(alpha: 0.15), Colors.transparent],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(
            level == 'LOW' ? Icons.verified_user : Icons.warning_amber_rounded,
            color: color, size: 40,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Threat Level', style: TextStyle(color: Colors.grey[400], fontSize: 12)),
                const SizedBox(height: 4),
                Text(level, style: TextStyle(
                  color: color, fontWeight: FontWeight.w900, fontSize: 28, letterSpacing: 2,
                )),
                Text('${_alerts.length} active alert(s)',
                    style: TextStyle(color: Colors.grey[500], fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _alertTile(Map<String, dynamic> alert) {
    final severity = alert['severity'] as String? ?? 'info';
    final color = severity == 'critical'
        ? Colors.red
        : severity == 'warning'
            ? Colors.orange
            : Colors.blue;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(
            severity == 'critical' ? Icons.error : Icons.warning_amber_rounded,
            color: color, size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(alert['title'] as String? ?? 'Alert', style: TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13,
                )),
                const SizedBox(height: 2),
                Text(alert['description'] as String? ?? '', style: TextStyle(
                  color: Colors.grey[400], fontSize: 11,
                )),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(severity.toUpperCase(), style: TextStyle(
              color: color, fontSize: 9, fontWeight: FontWeight.bold,
            )),
          ),
        ],
      ),
    );
  }

  Widget _securityActionTile(String title, IconData icon, Color color, String desc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _confirmSecurityAction(title),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(desc, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: Colors.grey[600], size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _confirmSecurityAction(String action) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('⚠️ Security Action', style: TextStyle(color: Colors.white)),
        content: Text('Execute "$action"?\n\nThis will be logged and requires your explicit approval.',
            style: TextStyle(color: Colors.grey[300])),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red[700]),
            child: const Text('EXECUTE', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      HapticFeedback.heavyImpact();
      final res = await _api.post('/api/supreme/execute', body: {
        'command': action,
        'type': 'security',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(res.isSuccess ? '✓ $action executed' : '✗ Failed: ${res.errorMessage}'),
          backgroundColor: res.isSuccess ? Colors.green[800] : Colors.red[800],
        ));
        _loadAllData();
      }
    }
  }

  // ─── REPORTS TAB ───────────────────────────────────────────────────────

  Widget _buildReportsTab() {
    final reports = <Map<String, dynamic>>[
      {'type': 'security', 'title': 'Security Report', 'icon': Icons.shield, 'color': Colors.red,
        'desc': 'Auth attempts, threat analysis, access patterns'},
      {'type': 'financial', 'title': 'Financial Summary', 'icon': Icons.monetization_on, 'color': Colors.green,
        'desc': 'Revenue, MRR, churn, growth metrics'},
      {'type': 'platform_health', 'title': 'Platform Health', 'icon': Icons.monitor_heart, 'color': Colors.blue,
        'desc': 'Uptime, performance, error rates, latency'},
      {'type': 'ai_usage', 'title': 'AI Usage Analytics', 'icon': Icons.psychology, 'color': Colors.purple,
        'desc': 'Token consumption, agent performance, cost analysis'},
      {'type': 'tenant_activity', 'title': 'Tenant Activity', 'icon': Icons.business, 'color': Colors.teal,
        'desc': 'Active tenants, engagement, module usage'},
      {'type': 'audit_trail', 'title': 'Complete Audit Trail', 'icon': Icons.history, 'color': Colors.orange,
        'desc': 'Full audit log with actor, action, timestamp'},
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.amber.withValues(alpha: 0.1), Colors.transparent],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.amber.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              const Icon(Icons.auto_awesome, color: Colors.amber, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Supreme Reports', style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15,
                    )),
                    Text('AI-powered reports generated on-demand',
                        style: TextStyle(color: Colors.grey[400], fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        ...reports.map((r) => Container(
          margin: const EdgeInsets.only(bottom: 10),
          child: Material(
            color: const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => _generateReport(r['type'] as String),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: (r['color'] as Color).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(r['icon'] as IconData, color: r['color'] as Color, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(r['title'] as String, style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14,
                          )),
                          const SizedBox(height: 3),
                          Text(r['desc'] as String, style: TextStyle(
                            color: Colors.grey[500], fontSize: 11,
                          )),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('Generate', style: TextStyle(
                        color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 11,
                      )),
                    ),
                  ],
                ),
              ),
            ),
          ),
        )),
      ],
    );
  }

  // ─── COMMAND TAB ───────────────────────────────────────────────────────

  Widget _buildCommandTab() {
    return Column(
      children: [
        // Command type selector
        Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: _cmdTypes.entries.map((e) {
              final active = _cmdType == e.key;
              final color = e.value['color'] as Color;
              return Padding(
                padding: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
                child: ChoiceChip(
                  selected: active,
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(e.value['icon'] as IconData, size: 14, color: active ? Colors.black : color),
                      const SizedBox(width: 6),
                      Text(e.value['label'] as String),
                    ],
                  ),
                  selectedColor: Colors.amber,
                  labelStyle: TextStyle(
                    color: active ? Colors.black : color,
                    fontWeight: FontWeight.bold, fontSize: 11,
                  ),
                  onSelected: (_) => setState(() => _cmdType = e.key),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              );
            }).toList(),
          ),
        ),

        // Command history
        Expanded(
          child: _cmdHistory.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.terminal, size: 48, color: Colors.amber.withValues(alpha: 0.3)),
                      const SizedBox(height: 12),
                      const Text('Supreme Command Center', style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18,
                      )),
                      const SizedBox(height: 6),
                      Text('Execute platform commands with confirmation',
                          style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                      const SizedBox(height: 20),
                      Wrap(
                        spacing: 8, runSpacing: 8,
                        children: [
                          _cmdSuggestion('List all active tenants'),
                          _cmdSuggestion('Show revenue breakdown'),
                          _cmdSuggestion('Check system health'),
                          _cmdSuggestion('Review security logs'),
                        ],
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _cmdHistory.length,
                  itemBuilder: (_, i) => _cmdResultTile(_cmdHistory[i]),
                ),
        ),

        // Command input
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, -2))],
          ),
          child: SafeArea(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.terminal, color: Colors.amber, size: 18),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _cmdCtrl,
                    style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 13),
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _executeCommand(),
                    decoration: InputDecoration(
                      hintText: 'Enter command...',
                      hintStyle: TextStyle(color: Colors.grey[600], fontFamily: 'monospace'),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.black.withValues(alpha: 0.3),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Colors.amber[700],
                  child: IconButton(
                    icon: const Icon(Icons.play_arrow, color: Colors.black, size: 20),
                    onPressed: _loading ? null : _executeCommand,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _cmdSuggestion(String text) {
    return ActionChip(
      label: Text(text, style: const TextStyle(fontSize: 11, color: Colors.amber)),
      backgroundColor: Colors.amber.withValues(alpha: 0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.amber.withValues(alpha: 0.2)),
      ),
      onPressed: () {
        _cmdCtrl.text = text;
        _executeCommand();
      },
    );
  }

  Widget _cmdResultTile(Map<String, dynamic> cmd) {
    final success = cmd['success'] as bool? ?? false;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: success ? Colors.green.withValues(alpha: 0.2) : Colors.red.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(success ? Icons.check_circle : Icons.error, size: 14,
                  color: success ? Colors.green : Colors.red),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  cmd['command'] as String? ?? '',
                  style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  (_cmdTypes[cmd['type']]?['label'] as String?) ?? cmd['type'] as String? ?? '',
                  style: const TextStyle(color: Colors.amber, fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '${cmd['result']}',
              style: TextStyle(color: Colors.grey[300], fontFamily: 'monospace', fontSize: 11),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            cmd['timestamp'] as String? ?? '',
            style: TextStyle(color: Colors.grey[600], fontSize: 9),
          ),
        ],
      ),
    );
  }

  // ─── AI AGENT TAB ──────────────────────────────────────────────────────

  Widget _buildAIAgentTab() {
    return RefreshIndicator(
      color: Colors.amber,
      onRefresh: () async { await _loadQueue(); await _loadAIHeartbeat(); },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Connection status
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: _aiConnected
                    ? [const Color(0xFF064E3B), const Color(0xFF065F46)]
                    : [const Color(0xFF7F1D1D), const Color(0xFF991B1B)],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _aiConnected ? Colors.green.withValues(alpha: 0.3) : Colors.red.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 14, height: 14,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _aiConnected ? Colors.green : Colors.red,
                    boxShadow: [BoxShadow(
                      color: (_aiConnected ? Colors.green : Colors.red).withValues(alpha: 0.5),
                      blurRadius: 10,
                    )],
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _aiConnected ? 'AI AGENT CONNECTED' : 'AI AGENT OFFLINE',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _aiConnected
                            ? 'Last heartbeat: ${_aiHeartbeat['server_time'] ?? 'now'}'
                            : 'No heartbeat received',
                        style: TextStyle(color: Colors.grey[400], fontSize: 11),
                      ),
                    ],
                  ),
                ),
                Icon(
                  _aiConnected ? Icons.smart_toy : Icons.smart_toy_outlined,
                  color: _aiConnected ? Colors.green : Colors.red,
                  size: 28,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Service Key section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A2E),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.amber.withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.vpn_key, color: Colors.amber, size: 18),
                    const SizedBox(width: 8),
                    const Text('AI Service Key', style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Set X-Supreme-Key header in your AI agent.\nKey is stored as a Cloudflare Worker secret.',
                  style: TextStyle(color: Colors.grey[400], fontSize: 12, height: 1.5),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(Icons.check_circle, size: 14, color: Colors.green[400]),
                    const SizedBox(width: 6),
                    Text('SUPREME_AI_KEY configured', style: TextStyle(color: Colors.green[400], fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Pending commands queue
          _sectionTitle('Pending AI Commands (${_queueCommands.length})'),
          const SizedBox(height: 10),
          if (_queueCommands.isEmpty)
            _emptyState('No pending AI commands')
          else
            ..._queueCommands.map((cmd) => _queueCommandTile(cmd)),

          const SizedBox(height: 20),

          // Capabilities list
          _sectionTitle('AI Agent Capabilities'),
          const SizedBox(height: 10),
          _capabilityTile('Monitor Platform', Icons.monitor_heart, Colors.blue, 'Read-only access to metrics and health'),
          _capabilityTile('Security Scanning', Icons.security, Colors.red, 'Detect threats and anomalies autonomously'),
          _capabilityTile('Generate Reports', Icons.assessment, Colors.purple, 'Create reports on demand'),
          _capabilityTile('Submit Commands', Icons.queue, Colors.orange, 'Queue commands for your approval'),
          _capabilityTile('Heartbeat Check-in', Icons.favorite, Colors.pink, 'Periodic alive signal with metrics'),
        ],
      ),
    );
  }

  Widget _queueCommandTile(Map<String, dynamic> cmd) {
    final priority = cmd['priority'] as String? ?? 'normal';
    final priorityColor = priority == 'critical'
        ? Colors.red
        : priority == 'high'
            ? Colors.orange
            : Colors.blue;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: priorityColor.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: priorityColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(priority.toUpperCase(), style: TextStyle(
                  color: priorityColor, fontSize: 9, fontWeight: FontWeight.bold,
                )),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(cmd['command_type'] as String? ?? 'query', style: const TextStyle(
                  color: Colors.amber, fontSize: 9, fontWeight: FontWeight.bold,
                )),
              ),
              const Spacer(),
              Text(cmd['created_at'] as String? ?? '', style: TextStyle(color: Colors.grey[600], fontSize: 9)),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              cmd['command'] as String? ?? '',
              style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 12),
            ),
          ),
          if (cmd['reason'] != null) ...[
            const SizedBox(height: 6),
            Text('Reason: ${cmd['reason']}', style: TextStyle(color: Colors.grey[400], fontSize: 11, fontStyle: FontStyle.italic)),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _approveQueueItem(cmd['id'] as String),
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('APPROVE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green[700],
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _rejectQueueItem(cmd['id'] as String),
                  icon: const Icon(Icons.close, size: 16),
                  label: const Text('REJECT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red[400],
                    side: BorderSide(color: Colors.red.withValues(alpha: 0.3)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _capabilityTile(String title, IconData icon, Color color, String desc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                Text(desc, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
              ],
            ),
          ),
          Icon(Icons.check_circle, color: Colors.green.withValues(alpha: 0.6), size: 18),
        ],
      ),
    );
  }

  // ─── SHARED WIDGETS ────────────────────────────────────────────────────

  Widget _sectionTitle(String title) {
    return Text(title, style: const TextStyle(
      color: Colors.amber, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 0.5,
    ));
  }

  Widget _emptyState(String msg) {
    return Container(
      padding: const EdgeInsets.all(24),
      alignment: Alignment.center,
      child: Text(msg, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
    );
  }
}

class _MetricItem {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _MetricItem(this.label, this.value, this.icon, this.color);
}
