// ============================================================================
// ZIEN Mobile — Home Screen (4-tab shell)
// Dashboard, Modules, RARE AI, Settings — mirrors web Dashboard.tsx layout.
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/company_providers.dart';
import '../services/auth_providers.dart';
import '../services/api_client.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          _DashboardTab(),
          _ModulesTab(),
          _AITab(),
          _SettingsTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.apps_outlined),
            selectedIcon: Icon(Icons.apps),
            label: 'Modules',
          ),
          NavigationDestination(
            icon: Icon(Icons.smart_toy_outlined),
            selectedIcon: Icon(Icons.smart_toy),
            label: 'RARE AI',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

// ─── Dashboard Tab (StatusWall + real API data) ─────────────────────────────

class _DashboardTab extends ConsumerStatefulWidget {
  const _DashboardTab();

  @override
  ConsumerState<_DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends ConsumerState<_DashboardTab> {
  Map<String, dynamic>? _overview;
  bool _loadingOverview = false;
  String? _overviewError;

  @override
  void initState() {
    super.initState();
    _fetchOverview();
  }

  Future<void> _fetchOverview() async {
    final companyState = ref.read(companyNotifierProvider);
    final companyId = companyState.active?.id;
    if (companyId == null) return;

    setState(() {
      _loadingOverview = true;
      _overviewError = null;
    });
    try {
      final res = await ApiClient.instance.get(
        '/api/control-room/overview',
        extraHeaders: {'X-Company-Id': companyId},
      );
      if (res.isSuccess && res.data != null) {
        setState(() => _overview = res.data);
      } else {
        setState(() => _overviewError = res.errorMessage ?? 'Failed to load');
      }
    } catch (e) {
      setState(() => _overviewError = 'Connection unavailable');
    } finally {
      if (mounted) setState(() => _loadingOverview = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final companyState = ref.watch(companyNotifierProvider);
    final theme = Theme.of(context);
    final company = companyState.active;

    // Extract overview data with fallback to local provider data
    final wall = _overview?['status_wall'] as Map<String, dynamic>?;
    final financials = _overview?['financials'] as Map<String, dynamic>?;
    final aiUsage = _overview?['ai_usage_30d'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(
        title: Text(company?.name ?? 'ZIEN'),
        actions: [
          if (companyState.companies.length > 1)
            PopupMenuButton<String>(
              icon: const Icon(Icons.swap_horiz),
              tooltip: 'Switch company',
              onSelected:
                  (id) => ref
                      .read(companyNotifierProvider.notifier)
                      .switchCompany(id),
              itemBuilder:
                  (_) =>
                      companyState.companies
                          .map(
                            (c) => PopupMenuItem(
                              value: c.id,
                              child: Text(
                                c.name,
                                style: TextStyle(
                                  fontWeight:
                                      c.id == company?.id
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                ),
                              ),
                            ),
                          )
                          .toList(),
            ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Notifications not available yet'),
                ),
              );
            },
          ),
        ],
      ),
      body:
          companyState.isLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                onRefresh: _fetchOverview,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Welcome header
                    Text(
                      'Welcome back${user?.email != null ? ", ${user!.email!.split("@").first}" : ""}',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (company != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '${company.industry ?? company.name} - ${company.countryCode}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.grey,
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),

                    // ── Status Wall ──
                    Text(
                      'Status Wall',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      crossAxisCount: 2,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 1.4,
                      children: [
                        _MetricCard(
                          label: 'Team Size',
                          value:
                              '${wall?['team_size'] ?? companyState.modules.length}',
                          icon: Icons.people,
                        ),
                        _MetricCard(
                          label: 'Active Modules',
                          value:
                              '${wall?['active_modules'] ?? companyState.modules.length}',
                          icon: Icons.apps,
                        ),
                        _MetricCard(
                          label: 'Departments',
                          value:
                              '${wall?['departments'] ?? companyState.departments.length}',
                          icon: Icons.business,
                        ),
                        _MetricCard(
                          label: 'Integrations',
                          value: '${wall?['connected_integrations'] ?? 0}',
                          icon: Icons.extension,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ── Financials Panel ──
                    if (financials != null) ...[
                      Text(
                        'Financials',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              _InfoRow(
                                'Total Revenue',
                                'AED ${_fmt(financials['total_revenue'])}',
                                Icons.trending_up,
                                Colors.green,
                              ),
                              const Divider(height: 20),
                              _InfoRow(
                                'Receivable',
                                'AED ${_fmt(financials['total_receivable'])}',
                                Icons.account_balance_wallet,
                                Colors.orange,
                              ),
                              const Divider(height: 20),
                              _InfoRow(
                                'Total Invoices',
                                '${financials['total_invoices'] ?? 0}',
                                Icons.receipt_long,
                                theme.colorScheme.primary,
                              ),
                              const Divider(height: 20),
                              _InfoRow(
                                'Unpaid',
                                '${financials['unpaid_count'] ?? 0}',
                                Icons.warning_amber,
                                Colors.red,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // ── AI Usage (30d) ──
                    if (aiUsage != null) ...[
                      Text(
                        'AI Usage (30 days)',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  children: [
                                    Text(
                                      '${aiUsage['total_queries'] ?? 0}',
                                      style: theme.textTheme.headlineMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                    Text(
                                      'Queries',
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                width: 1,
                                height: 40,
                                color: Colors.grey.shade300,
                              ),
                              Expanded(
                                child: Column(
                                  children: [
                                    Text(
                                      _fmtTokens(aiUsage['total_tokens'] ?? 0),
                                      style: theme.textTheme.headlineMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                    Text(
                                      'Tokens',
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // ── Role & Status ──
                    Text(
                      'Your Access',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      crossAxisCount: 2,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 1.6,
                      children: [
                        _MetricCard(
                          label: 'Role',
                          value:
                              companyState.role?.value.replaceAll('_', ' ') ??
                              'N/A',
                          icon: Icons.badge,
                          isSmallValue: true,
                        ),
                        _MetricCard(
                          label: 'Status',
                          value:
                              company?.status.value.replaceAll('_', ' ') ??
                              'N/A',
                          icon: Icons.verified,
                          isSmallValue: true,
                        ),
                      ],
                    ),

                    // Loading / Error indicator for overview
                    if (_loadingOverview) ...[
                      const SizedBox(height: 16),
                      const Center(child: LinearProgressIndicator()),
                    ],
                    if (_overviewError != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _overviewError!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.orange,
                        ),
                      ),
                    ],
                    const SizedBox(height: 40),
                  ],
                ),
              ),
    );
  }

  String _fmt(dynamic val) {
    if (val == null) return '0';
    final n = val is num ? val : num.tryParse(val.toString()) ?? 0;
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toStringAsFixed(n.truncateToDouble() == n ? 0 : 2);
  }

  String _fmtTokens(dynamic val) {
    final n = val is int ? val : int.tryParse(val.toString()) ?? 0;
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return '$n';
  }
}

/// Info row for financials panel.
class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _InfoRow(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ),
        Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final bool isSmallValue;

  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    this.isSmallValue = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: theme.colorScheme.primary, size: 28),
            const Spacer(),
            Text(
              value,
              style:
                  isSmallValue
                      ? theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      )
                      : theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
            ),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Modules Tab ─────────────────────────────────────────────────────────────

class _ModulesTab extends ConsumerWidget {
  const _ModulesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final companyState = ref.watch(companyNotifierProvider);
    final modules = companyState.modules;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Modules')),
      body:
          companyState.isLoading
              ? const Center(child: CircularProgressIndicator())
              : modules.isEmpty
              ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.apps_outlined,
                      size: 64,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No active modules',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Modules will appear after company provisioning',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: modules.length,
                itemBuilder: (context, index) {
                  final mod = modules[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: theme.colorScheme.primaryContainer,
                        child: Icon(
                          _moduleIcon(mod.moduleCode ?? ''),
                          color: theme.colorScheme.primary,
                        ),
                      ),
                      title: Text(
                        mod.moduleCode?.replaceAll('_', ' ').toUpperCase() ??
                            'Module',
                      ),
                      subtitle: Text(mod.isActive ? 'Active' : 'Inactive'),
                      trailing: Icon(
                        Icons.chevron_right,
                        color: Colors.grey.shade400,
                      ),
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('${mod.moduleCode} module')),
                        );
                      },
                    ),
                  );
                },
              ),
    );
  }

  IconData _moduleIcon(String code) {
    return switch (code) {
      'hr' => Icons.people,
      'accounting' => Icons.account_balance,
      'crm' => Icons.handshake,
      'logistics' => Icons.local_shipping,
      'store' => Icons.storefront,
      'projects' => Icons.assignment,
      'meetings' => Icons.videocam,
      'ai_agents' => Icons.smart_toy,
      'inventory' => Icons.inventory,
      'pos' => Icons.point_of_sale,
      'ecommerce' => Icons.shopping_cart,
      _ => Icons.extension,
    };
  }
}

// ─── RARE AI Tab ─────────────────────────────────────────────────────────────

/// Chat message model for multi-turn conversation.
class _ChatMessage {
  final String role; // 'user' or 'assistant'
  final String text;
  final String? agentType;
  final String? mode;
  final DateTime timestamp;

  _ChatMessage({
    required this.role,
    required this.text,
    this.agentType,
    this.mode,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

/// Available RARE modes.
const _rareModes = ['help', 'analyze', 'act', 'report'];
const _rareModeIcons = {
  'help': Icons.help_outline,
  'analyze': Icons.analytics_outlined,
  'act': Icons.play_circle_outline,
  'report': Icons.summarize_outlined,
};

class _AITab extends ConsumerStatefulWidget {
  const _AITab();

  @override
  ConsumerState<_AITab> createState() => _AITabState();
}

class _AITabState extends ConsumerState<_AITab> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [];

  bool _isLoading = false;
  String _selectedMode = 'help';
  String _selectedAgent = 'maestro'; // Auto-routing by default
  bool _useMaestro = true;

  List<Map<String, dynamic>> _agents = [];
  bool _agentsLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAgents();
  }

  Future<void> _loadAgents() async {
    try {
      final companyState = ref.read(companyNotifierProvider);
      final companyId = companyState.active?.id;
      if (companyId == null) {
        setState(() => _agentsLoading = false);
        return;
      }
      final res = await ApiClient.instance.get(
        '/api/ai/agents',
        extraHeaders: {'X-Company-Id': companyId},
      );
      if (res.isSuccess && res.data?['agents'] != null) {
        final agentList =
            (res.data!['agents'] as List).cast<Map<String, dynamic>>();
        setState(() {
          _agents = agentList;
          _agentsLoading = false;
        });
      } else {
        setState(() => _agentsLoading = false);
      }
    } catch (_) {
      setState(() => _agentsLoading = false);
    }
  }

  Future<void> _sendMessage() async {
    final query = _controller.text.trim();
    if (query.isEmpty || _isLoading) return;

    setState(() {
      _messages.add(_ChatMessage(role: 'user', text: query));
      _isLoading = true;
    });
    _controller.clear();
    _scrollToBottom();

    try {
      final companyState = ref.read(companyNotifierProvider);
      final companyId = companyState.active?.id;
      final role = companyState.role?.value;

      Map<String, dynamic> body;
      String endpoint;

      if (_useMaestro) {
        // Maestro auto-routes to the best agent
        endpoint = '/api/ai/maestro';
        body = {
          'query': query,
          if (companyId != null) 'companyId': companyId,
          if (role != null) 'role': role,
        };
      } else {
        // Direct RARE call with selected agent + mode
        endpoint = '/api/ai/rare';
        body = {
          'query': query,
          'agentType': _selectedAgent,
          'mode': _selectedMode,
          if (companyId != null) 'companyId': companyId,
          if (role != null) 'role': role,
        };
      }

      final result = await ApiClient.instance.post(
        endpoint,
        body: body,
        extraHeaders: companyId != null ? {'X-Company-Id': companyId} : null,
      );

      if (result.isSuccess) {
        final responseText =
            result.data?['response'] as String? ?? 'No response';
        final routedAgent = result.data?['routing']?['agentType'] as String?;
        final routedMode = result.data?['routing']?['mode'] as String?;
        setState(() {
          _messages.add(
            _ChatMessage(
              role: 'assistant',
              text: responseText,
              agentType: routedAgent ?? (_useMaestro ? null : _selectedAgent),
              mode: routedMode ?? (_useMaestro ? null : _selectedMode),
            ),
          );
        });
      } else {
        setState(() {
          _messages.add(
            _ChatMessage(
              role: 'assistant',
              text: '⚠️ ${result.errorMessage ?? "Request failed"}',
            ),
          );
        });
      }
    } catch (e) {
      setState(() {
        _messages.add(
          _ChatMessage(role: 'assistant', text: '⚠️ Connection error: $e'),
        );
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  List<String> _getQuickActions() {
    switch (_selectedMode) {
      case 'analyze':
        return [
          'Show revenue trends',
          'Analyze team performance',
          'Identify cost reduction areas',
        ];
      case 'act':
        return [
          'Generate invoice draft',
          'Schedule team meeting',
          'Create project plan',
        ];
      case 'report':
        return [
          'Monthly financial summary',
          'Department KPIs report',
          'Customer satisfaction overview',
        ];
      default: // help
        return [
          'How do I add a new employee?',
          'Explain my revenue metrics',
          'What modules are available?',
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accessibleAgents =
        _agents.where((a) => a['accessible'] == true).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('RARE AI'),
        actions: [
          // Maestro toggle
          Tooltip(
            message: 'Smart Auto-Routing',
            child: IconButton(
              icon: Icon(
                _useMaestro ? Icons.auto_awesome : Icons.auto_awesome_outlined,
                color:
                    _useMaestro
                        ? theme.colorScheme.primary
                        : theme.colorScheme.onSurfaceVariant,
              ),
              onPressed: () {
                setState(() {
                  _useMaestro = !_useMaestro;
                  if (_useMaestro) _selectedAgent = 'maestro';
                });
              },
            ),
          ),
          // Clear chat
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed:
                _messages.isEmpty
                    ? null
                    : () {
                      setState(() => _messages.clear());
                    },
          ),
        ],
      ),
      body: Column(
        children: [
          // ─ Agent & Mode Selectors ─
          if (!_useMaestro) ...[
            // Agent selector
            SizedBox(
              height: 44,
              child:
                  _agentsLoading
                      ? const Center(child: LinearProgressIndicator())
                      : ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: accessibleAgents.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final agent = accessibleAgents[index];
                          final code =
                              agent['code'] as String? ??
                              agent['type'] as String;
                          final name = agent['name'] as String? ?? code;
                          final isSelected = _selectedAgent == code;
                          return FilterChip(
                            selected: isSelected,
                            label: Text(
                              name,
                              style: const TextStyle(fontSize: 12),
                            ),
                            onSelected: (_) {
                              setState(() => _selectedAgent = code);
                            },
                          );
                        },
                      ),
            ),
            const SizedBox(height: 4),
            // Mode selector
            SizedBox(
              height: 40,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children:
                    _rareModes.map((mode) {
                      final isSelected = _selectedMode == mode;
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: ChoiceChip(
                          avatar: Icon(
                            _rareModeIcons[mode],
                            size: 16,
                            color:
                                isSelected
                                    ? theme.colorScheme.onPrimary
                                    : theme.colorScheme.onSurfaceVariant,
                          ),
                          label: Text(
                            mode[0].toUpperCase() + mode.substring(1),
                            style: TextStyle(
                              fontSize: 12,
                              color:
                                  isSelected
                                      ? theme.colorScheme.onPrimary
                                      : theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          selected: isSelected,
                          onSelected: (_) {
                            setState(() => _selectedMode = mode);
                          },
                        ),
                      );
                    }).toList(),
              ),
            ),
            const Divider(height: 1),
          ] else ...[
            // Maestro info bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: theme.colorScheme.primaryContainer.withAlpha(60),
              child: Row(
                children: [
                  Icon(
                    Icons.auto_awesome,
                    size: 16,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Maestro — Smart auto-routing to the best agent',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // ─ Chat Messages ─
          Expanded(
            child:
                _messages.isEmpty
                    ? _buildEmptyState(theme)
                    : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(12),
                      itemCount: _messages.length + (_isLoading ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _messages.length) {
                          // Loading indicator
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Thinking...',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }
                        return _buildMessageBubble(_messages[index], theme);
                      },
                    ),
          ),

          // ─ Quick Actions ─
          if (_messages.isEmpty)
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _getQuickActions().length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final action = _getQuickActions()[index];
                  return ActionChip(
                    label: Text(action, style: const TextStyle(fontSize: 12)),
                    onPressed: () {
                      _controller.text = action;
                      _sendMessage();
                    },
                  );
                },
              ),
            ),

          // ─ Input Area ─
          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              border: Border(
                top: BorderSide(
                  color: theme.colorScheme.outlineVariant,
                  width: 0.5,
                ),
              ),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText:
                            _useMaestro
                                ? 'Ask anything...'
                                : 'Ask $_selectedAgent...',
                        prefixIcon: const Icon(Icons.chat_outlined, size: 20),
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 10,
                          horizontal: 12,
                        ),
                        isDense: true,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                      maxLines: 3,
                      minLines: 1,
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _isLoading ? null : _sendMessage,
                    icon: const Icon(Icons.send, size: 20),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.smart_toy,
              size: 64,
              color: theme.colorScheme.primary.withAlpha(100),
            ),
            const SizedBox(height: 16),
            Text(
              'RARE AI Assistant',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _useMaestro
                  ? 'Ask anything — Maestro will route to the best agent automatically.'
                  : 'Select an agent and mode, then ask your question.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock_outline, size: 14, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Text(
                  'Tenant Isolated  •  Role Aware',
                  style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(_ChatMessage msg, ThemeData theme) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser)
            CircleAvatar(
              radius: 14,
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Icon(
                Icons.smart_toy,
                size: 16,
                color: theme.colorScheme.primary,
              ),
            ),
          if (!isUser) const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color:
                        isUser
                            ? theme.colorScheme.primary
                            : theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                  ),
                  child: SelectableText(
                    msg.text,
                    style: TextStyle(
                      color:
                          isUser
                              ? theme.colorScheme.onPrimary
                              : theme.colorScheme.onSurface,
                    ),
                  ),
                ),
                if (!isUser && msg.agentType != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2, left: 4),
                    child: Text(
                      '${msg.agentType}${msg.mode != null ? ' • ${msg.mode}' : ''}',
                      style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                    ),
                  ),
              ],
            ),
          ),
          if (isUser) const SizedBox(width: 8),
          if (isUser)
            CircleAvatar(
              radius: 14,
              backgroundColor: theme.colorScheme.secondaryContainer,
              child: Icon(
                Icons.person,
                size: 16,
                color: theme.colorScheme.secondary,
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

class _SettingsTab extends ConsumerWidget {
  const _SettingsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileData = ref.watch(profileProvider).valueOrNull;
    final user = ref.watch(currentUserProvider);
    final companyState = ref.watch(companyNotifierProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // User info header
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  child: Text(
                    (user?.email?.substring(0, 1) ?? 'Z').toUpperCase(),
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profileData?.fullName ??
                            profileData?.displayName ??
                            user?.email?.split('@').first ??
                            'User',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        user?.email ?? '',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                      ),
                      if (companyState.role != null)
                        Text(
                          companyState.role!.value.replaceAll('_', ' '),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.primary,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(),

          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Profile'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Profile settings not available yet'),
                ),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.business),
            title: const Text('Company'),
            subtitle: Text(companyState.active?.name ?? 'No company'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Company settings not available yet'),
                ),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.palette_outlined),
            title: const Text('Theme'),
            subtitle: const Text('System default'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Theme settings not available yet'),
                ),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('Language'),
            subtitle: const Text('English'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Language settings not available yet'),
                ),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('About ZIEN'),
            subtitle: const Text('v1.0.0'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              showAboutDialog(
                context: context,
                applicationName: 'ZIEN',
                applicationVersion: '1.0.0',
                applicationLegalese: 'ZIEN Platform - Business Intelligence',
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Sign Out', style: TextStyle(color: Colors.red)),
            onTap: () => Supabase.instance.client.auth.signOut(),
          ),
        ],
      ),
    );
  }
}
