// ============================================================================
// ZIEN Mobile -- HR Module Screen
// Mirrors web: src/pages/modules/HRModule.tsx
// Tabs: Employees, Attendance, Leave, Payroll, Departments
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';
import '../theme/app_theme.dart';

class HRScreen extends ConsumerStatefulWidget {
  const HRScreen({super.key});

  @override
  ConsumerState<HRScreen> createState() => _HRScreenState();
}

class _HRScreenState extends ConsumerState<HRScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _api = ApiClient.instance;

  List<Map<String, dynamic>> _employees = [];
  List<Map<String, dynamic>> _attendance = [];
  List<Map<String, dynamic>> _leaveRequests = [];
  List<Map<String, dynamic>> _departments = [];
  bool _loading = true;

  String? get _companyId => ref.read(companyNotifierProvider).active?.id;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
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
          final res = await _api.get('/api/hr/employees', extraHeaders: headers);
          if (res.isSuccess) setState(() => _employees = List<Map<String, dynamic>>.from(res.data?['employees'] ?? []));
          break;
        case 1:
          final res = await _api.get('/api/hr/attendance', extraHeaders: headers);
          if (res.isSuccess) setState(() => _attendance = List<Map<String, dynamic>>.from(res.data?['attendance'] ?? []));
          break;
        case 2:
          final res = await _api.get('/api/hr/leave-requests', extraHeaders: headers);
          if (res.isSuccess) setState(() => _leaveRequests = List<Map<String, dynamic>>.from(res.data?['requests'] ?? []));
          break;
        case 3:
          // Payroll - loads from same HR API
          break;
        case 4:
          final res = await _api.get('/api/hr/departments', extraHeaders: headers);
          if (res.isSuccess) setState(() => _departments = List<Map<String, dynamic>>.from(res.data?['departments'] ?? []));
          break;
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('HR Management', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Employees'),
            Tab(text: 'Attendance'),
            Tab(text: 'Leave'),
            Tab(text: 'Payroll'),
            Tab(text: 'Departments'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildEmployeesTab(),
          _buildAttendanceTab(),
          _buildLeaveTab(),
          _buildPayrollTab(),
          _buildDepartmentsTab(),
        ],
      ),
    );
  }

  Widget _buildEmployeesTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_employees.isEmpty) return const Center(child: Text('No employees found'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(0),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _employees.length,
        itemBuilder: (context, i) {
          final emp = _employees[i];
          final profile = emp['profiles'] ?? {};
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.1),
                child: Text(
                  (profile['full_name'] ?? 'U')[0].toUpperCase(),
                  style: TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(profile['full_name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(emp['role_code'] ?? emp['department'] ?? ''),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: emp['status'] == 'active' ? Colors.green.withValues(alpha: 0.1) : Colors.grey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  emp['status'] ?? 'active',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: emp['status'] == 'active' ? Colors.green : Colors.grey,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAttendanceTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_attendance.isEmpty) return const Center(child: Text('No attendance records'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(1),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _attendance.length,
        itemBuilder: (context, i) {
          final rec = _attendance[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Icon(
                rec['clock_out'] != null ? Icons.check_circle : Icons.access_time,
                color: rec['clock_out'] != null ? Colors.green : Colors.orange,
              ),
              title: Text(rec['date'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('In: ${rec['clock_in'] ?? '-'}  Out: ${rec['clock_out'] ?? '-'}'),
              trailing: Text(rec['total_hours'] != null ? '${rec['total_hours']}h' : '-'),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLeaveTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_leaveRequests.isEmpty) return const Center(child: Text('No leave requests'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(2),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _leaveRequests.length,
        itemBuilder: (context, i) {
          final req = _leaveRequests[i];
          final status = req['status'] ?? 'pending';
          final statusColor = status == 'approved' ? Colors.green : status == 'rejected' ? Colors.red : Colors.orange;
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Icon(Icons.event_note, color: statusColor),
              title: Text(req['leave_type'] ?? 'Leave', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${req['start_date'] ?? ''} - ${req['end_date'] ?? ''}'),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(status.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor)),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPayrollTab() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.payments_outlined, size: 48, color: Colors.grey),
          SizedBox(height: 16),
          Text('Payroll', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          SizedBox(height: 8),
          Text('View payslips and salary details in Employee Portal', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildDepartmentsTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_departments.isEmpty) return const Center(child: Text('No departments'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(4),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _departments.length,
        itemBuilder: (context, i) {
          final dept = _departments[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.1),
                child: const Icon(Icons.business),
              ),
              title: Text(dept['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${dept['member_count'] ?? 0} members'),
            ),
          );
        },
      ),
    );
  }
}
