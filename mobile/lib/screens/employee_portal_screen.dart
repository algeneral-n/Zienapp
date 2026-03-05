// ============================================================================
// ZIEN Mobile -- Employee Portal Screen
// Mirrors web: src/pages/EmployeePortal.tsx
// Tabs: Dashboard, Attendance, Leave, Payroll, Tasks
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/company_providers.dart';
import '../services/auth_providers.dart';
import '../theme/app_theme.dart';

class EmployeePortalScreen extends ConsumerStatefulWidget {
  const EmployeePortalScreen({super.key});

  @override
  ConsumerState<EmployeePortalScreen> createState() =>
      _EmployeePortalScreenState();
}

class _EmployeePortalScreenState extends ConsumerState<EmployeePortalScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isClockedIn = false;
  bool _clockLoading = false;
  String? _todayAttendanceId;

  // Dashboard stats
  double _hoursThisMonth = 0;
  int _leaveBalance = 30;
  double _nextPayout = 0;
  int _activeTasks = 0;
  bool _statsLoading = true;

  // Leave requests
  List<Map<String, dynamic>> _leaveRequests = [];
  bool _leaveLoading = true;

  // Tasks
  List<Map<String, dynamic>> _tasks = [];
  bool _tasksLoading = true;

  // Payroll
  List<Map<String, dynamic>> _payroll = [];
  bool _payrollLoading = true;

  SupabaseClient get _db => Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _loadTabData(_tabController.index);
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboard();
      _checkClockStatus();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String? get _companyId => ref.read(companyNotifierProvider).active?.id;
  String? get _userId => ref.read(currentUserProvider)?.id;

  void _loadTabData(int index) {
    switch (index) {
      case 0:
        _loadDashboard();
        break;
      case 1:
        _checkClockStatus();
        break;
      case 2:
        _loadLeave();
        break;
      case 3:
        _loadPayroll();
        break;
      case 4:
        _loadTasks();
        break;
    }
  }

  Future<void> _loadDashboard() async {
    final companyId = _companyId;
    if (companyId == null) return;
    setState(() => _statsLoading = true);

    try {
      final now = DateTime.now();
      final monthStart = DateTime(now.year, now.month, 1).toIso8601String();

      // Attendance hours this month
      final attRes = await _db
          .from('attendance')
          .select('check_in,check_out')
          .eq('company_id', companyId)
          .gte('check_in', monthStart);
      double totalHrs = 0;
      for (final a in (attRes as List)) {
        if (a['check_in'] != null && a['check_out'] != null) {
          totalHrs +=
              DateTime.parse(
                a['check_out'],
              ).difference(DateTime.parse(a['check_in'])).inMinutes /
              60.0;
        }
      }

      // Leave balance
      final yearStart = DateTime(
        now.year,
        1,
        1,
      ).toIso8601String().substring(0, 10);
      final leaveRes = await _db
          .from('leave_requests')
          .select('id')
          .eq('company_id', companyId)
          .eq('status', 'approved')
          .gte('start_date', yearStart);
      final usedLeaves = (leaveRes as List).length;

      // Last payroll
      final payRes = await _db
          .from('payroll')
          .select('net_salary')
          .eq('company_id', companyId)
          .order('period_end', ascending: false)
          .limit(1);
      final lastPay =
          (payRes as List).isNotEmpty ? (payRes[0]['net_salary'] ?? 0) : 0;

      // Active tasks
      final taskRes = await _db
          .from('projects')
          .select('id')
          .eq('company_id', companyId)
          .neq('status', 'completed');

      setState(() {
        _hoursThisMonth = (totalHrs * 10).roundToDouble() / 10;
        _leaveBalance = 30 - usedLeaves;
        _nextPayout = (lastPay as num).toDouble();
        _activeTasks = (taskRes as List).length;
        _statsLoading = false;
      });
    } catch (e) {
      debugPrint('Dashboard load error: $e');
      setState(() => _statsLoading = false);
    }
  }

  Future<void> _checkClockStatus() async {
    final companyId = _companyId;
    final userId = _userId;
    if (companyId == null || userId == null) return;

    try {
      final today = DateTime.now().toIso8601String().substring(0, 10);
      final res = await _db
          .from('attendance')
          .select('id,check_in,check_out')
          .eq('company_id', companyId)
          .eq('user_id', userId)
          .gte('check_in', '${today}T00:00:00')
          .order('check_in', ascending: false)
          .limit(1);

      if ((res as List).isNotEmpty) {
        final record = res[0];
        setState(() {
          _todayAttendanceId = record['id'];
          _isClockedIn = record['check_out'] == null;
        });
      } else {
        setState(() {
          _todayAttendanceId = null;
          _isClockedIn = false;
        });
      }
    } catch (e) {
      debugPrint('Clock status check error: $e');
    }
  }

  Future<void> _toggleClock() async {
    final companyId = _companyId;
    final userId = _userId;
    if (companyId == null || userId == null) return;

    setState(() => _clockLoading = true);
    try {
      if (_isClockedIn && _todayAttendanceId != null) {
        // Clock Out
        await _db
            .from('attendance')
            .update({'check_out': DateTime.now().toUtc().toIso8601String()})
            .eq('id', _todayAttendanceId!);
        setState(() => _isClockedIn = false);
      } else {
        // Clock In
        final res =
            await _db
                .from('attendance')
                .insert({
                  'company_id': companyId,
                  'user_id': userId,
                  'check_in': DateTime.now().toUtc().toIso8601String(),
                })
                .select()
                .single();
        setState(() {
          _isClockedIn = true;
          _todayAttendanceId = res['id'];
        });
      }
    } catch (e) {
      debugPrint('Clock toggle error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to ${_isClockedIn ? "clock out" : "clock in"}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _clockLoading = false);
    }
  }

  Future<void> _loadLeave() async {
    final companyId = _companyId;
    if (companyId == null) return;
    setState(() => _leaveLoading = true);

    try {
      final res = await _db
          .from('leave_requests')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', ascending: false)
          .limit(20);
      setState(() {
        _leaveRequests = List<Map<String, dynamic>>.from(res as List);
        _leaveLoading = false;
      });
    } catch (e) {
      debugPrint('Leave load error: $e');
      setState(() => _leaveLoading = false);
    }
  }

  Future<void> _loadPayroll() async {
    final companyId = _companyId;
    if (companyId == null) return;
    setState(() => _payrollLoading = true);

    try {
      final res = await _db
          .from('payroll')
          .select('*')
          .eq('company_id', companyId)
          .order('period_end', ascending: false)
          .limit(12);
      setState(() {
        _payroll = List<Map<String, dynamic>>.from(res as List);
        _payrollLoading = false;
      });
    } catch (e) {
      debugPrint('Payroll load error: $e');
      setState(() => _payrollLoading = false);
    }
  }

  Future<void> _loadTasks() async {
    final companyId = _companyId;
    if (companyId == null) return;
    setState(() => _tasksLoading = true);

    try {
      final res = await _db
          .from('projects')
          .select('name,status,start_date,end_date')
          .eq('company_id', companyId)
          .order('created_at', ascending: false)
          .limit(20);
      setState(() {
        _tasks = List<Map<String, dynamic>>.from(res as List);
        _tasksLoading = false;
      });
    } catch (e) {
      debugPrint('Tasks load error: $e');
      setState(() => _tasksLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final companyState = ref.watch(companyNotifierProvider);
    final companyName = companyState.active?.name ?? 'Company';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Employee Portal',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w900,
            letterSpacing: -0.5,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
          tabs: const [
            Tab(text: 'Dashboard'),
            Tab(text: 'Attendance'),
            Tab(text: 'Leave'),
            Tab(text: 'Payroll'),
            Tab(text: 'Tasks'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDashboardTab(theme),
          _buildAttendanceTab(theme),
          _buildLeaveTab(theme),
          _buildPayrollTab(theme),
          _buildTasksTab(theme),
        ],
      ),
    );
  }

  // ---- Dashboard Tab ----
  Widget _buildDashboardTab(ThemeData theme) {
    if (_statsLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildStatCard(
            theme,
            'Hours This Month',
            _hoursThisMonth.toStringAsFixed(1),
            Icons.access_time,
            AppTheme.primaryBlue,
          ),
          const SizedBox(height: 12),
          _buildStatCard(
            theme,
            'Leave Balance',
            '$_leaveBalance days',
            Icons.calendar_today,
            AppTheme.accentGreen,
          ),
          const SizedBox(height: 12),
          _buildStatCard(
            theme,
            'Next Payout',
            _nextPayout > 0
                ? '${_nextPayout.toStringAsFixed(0)} AED'
                : 'No data',
            Icons.account_balance_wallet,
            Colors.amber.shade700,
          ),
          const SizedBox(height: 12),
          _buildStatCard(
            theme,
            'Active Tasks',
            '$_activeTasks',
            Icons.task_alt,
            Colors.deepPurple,
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    ThemeData theme,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.grey,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---- Attendance Tab (Clock In/Out) ----
  Widget _buildAttendanceTab(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Clock status indicator
            Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color:
                    _isClockedIn
                        ? AppTheme.accentGreen.withValues(alpha: 0.12)
                        : Colors.grey.withValues(alpha: 0.12),
                border: Border.all(
                  color:
                      _isClockedIn
                          ? AppTheme.accentGreen
                          : Colors.grey.shade400,
                  width: 3,
                ),
              ),
              alignment: Alignment.center,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _isClockedIn ? Icons.check_circle : Icons.access_time,
                    size: 48,
                    color:
                        _isClockedIn
                            ? AppTheme.accentGreen
                            : Colors.grey.shade400,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isClockedIn ? 'Clocked In' : 'Clocked Out',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color:
                          _isClockedIn
                              ? AppTheme.accentGreen
                              : Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // Clock toggle button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _clockLoading ? null : _toggleClock,
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      _isClockedIn ? Colors.red.shade600 : AppTheme.primaryBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child:
                    _clockLoading
                        ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                        : Text(
                          _isClockedIn ? 'Clock Out' : 'Clock In',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              TimeOfDay.now().format(context),
              style: theme.textTheme.headlineLarge?.copyWith(
                fontWeight: FontWeight.w900,
                letterSpacing: -1,
              ),
            ),
            Text(
              DateTime.now().toString().substring(0, 10),
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  // ---- Leave Tab ----
  Widget _buildLeaveTab(ThemeData theme) {
    if (_leaveLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    return RefreshIndicator(
      onRefresh: _loadLeave,
      child:
          _leaveRequests.isEmpty
              ? ListView(
                children: [
                  const SizedBox(height: 100),
                  Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.event_available,
                          size: 48,
                          color: Colors.grey.shade300,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No leave requests',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _leaveRequests.length,
                itemBuilder: (context, index) {
                  final req = _leaveRequests[index];
                  final status = req['status'] ?? 'pending';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor:
                            status == 'approved'
                                ? AppTheme.accentGreen.withValues(alpha: 0.12)
                                : status == 'rejected'
                                ? Colors.red.withValues(alpha: 0.12)
                                : Colors.amber.withValues(alpha: 0.12),
                        child: Icon(
                          status == 'approved'
                              ? Icons.check
                              : status == 'rejected'
                              ? Icons.close
                              : Icons.hourglass_empty,
                          color:
                              status == 'approved'
                                  ? AppTheme.accentGreen
                                  : status == 'rejected'
                                  ? Colors.red
                                  : Colors.amber.shade700,
                          size: 20,
                        ),
                      ),
                      title: Text(
                        req['leave_type'] ?? 'Leave',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        '${req['start_date'] ?? ''} to ${req['end_date'] ?? ''}',
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color:
                              status == 'approved'
                                  ? AppTheme.accentGreen.withValues(alpha: 0.12)
                                  : status == 'rejected'
                                  ? Colors.red.withValues(alpha: 0.12)
                                  : Colors.amber.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          status.toString().toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                            color:
                                status == 'approved'
                                    ? AppTheme.accentGreen
                                    : status == 'rejected'
                                    ? Colors.red
                                    : Colors.amber.shade700,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
    );
  }

  // ---- Payroll Tab ----
  Widget _buildPayrollTab(ThemeData theme) {
    if (_payrollLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    return RefreshIndicator(
      onRefresh: _loadPayroll,
      child:
          _payroll.isEmpty
              ? ListView(
                children: [
                  const SizedBox(height: 100),
                  Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.account_balance_wallet_outlined,
                          size: 48,
                          color: Colors.grey.shade300,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No payroll records',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _payroll.length,
                itemBuilder: (context, index) {
                  final p = _payroll[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Period: ${p['period_start'] ?? ''} - ${p['period_end'] ?? ''}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${(p['net_salary'] ?? 0).toString()} AED',
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: (p['status'] == 'paid'
                                      ? AppTheme.accentGreen
                                      : Colors.amber)
                                  .withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              (p['status'] ?? 'pending')
                                  .toString()
                                  .toUpperCase(),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color:
                                    p['status'] == 'paid'
                                        ? AppTheme.accentGreen
                                        : Colors.amber.shade700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
    );
  }

  // ---- Tasks Tab ----
  Widget _buildTasksTab(ThemeData theme) {
    if (_tasksLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    return RefreshIndicator(
      onRefresh: _loadTasks,
      child:
          _tasks.isEmpty
              ? ListView(
                children: [
                  const SizedBox(height: 100),
                  Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.task_alt,
                          size: 48,
                          color: Colors.grey.shade300,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No active tasks',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _tasks.length,
                itemBuilder: (context, index) {
                  final task = _tasks[index];
                  final status = task['status'] ?? 'active';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor:
                            status == 'completed'
                                ? AppTheme.accentGreen.withValues(alpha: 0.12)
                                : AppTheme.primaryBlue.withValues(alpha: 0.12),
                        child: Icon(
                          status == 'completed'
                              ? Icons.check_circle
                              : Icons.radio_button_unchecked,
                          color:
                              status == 'completed'
                                  ? AppTheme.accentGreen
                                  : AppTheme.primaryBlue,
                          size: 20,
                        ),
                      ),
                      title: Text(
                        task['name'] ?? 'Untitled',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        status.toString().toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                          color:
                              status == 'completed'
                                  ? AppTheme.accentGreen
                                  : Colors.grey,
                        ),
                      ),
                      trailing:
                          task['end_date'] != null
                              ? Text(
                                task['end_date'].toString().substring(0, 10),
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey,
                                ),
                              )
                              : null,
                    ),
                  );
                },
              ),
    );
  }
}
