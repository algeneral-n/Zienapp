// ============================================================================
// ZIEN Mobile -- Store/POS Module Screen
// Mirrors web: src/pages/modules/StoreModule.tsx
// Tabs: Products, Orders, Customers, Analytics
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';
import '../theme/app_theme.dart';

class StoreScreen extends ConsumerStatefulWidget {
  const StoreScreen({super.key});

  @override
  ConsumerState<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends ConsumerState<StoreScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _api = ApiClient.instance;

  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _orders = [];
  List<Map<String, dynamic>> _customers = [];
  List<Map<String, dynamic>> _inventory = [];
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
          final res = await _api.get('/api/store/products', extraHeaders: headers);
          if (res.isSuccess) setState(() => _products = List<Map<String, dynamic>>.from(res.data?['products'] ?? []));
          break;
        case 1:
          final res = await _api.get('/api/store/orders', extraHeaders: headers);
          if (res.isSuccess) setState(() => _orders = List<Map<String, dynamic>>.from(res.data?['orders'] ?? []));
          break;
        case 2:
          final res = await _api.get('/api/store/customers', extraHeaders: headers);
          if (res.isSuccess) setState(() => _customers = List<Map<String, dynamic>>.from(res.data?['customers'] ?? []));
          break;
        case 3:
          final res = await _api.get('/api/store/inventory', extraHeaders: headers);
          if (res.isSuccess) setState(() => _inventory = List<Map<String, dynamic>>.from(res.data?['items'] ?? []));
          break;
        case 4:
          break;
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Store', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Products'),
            Tab(text: 'Orders'),
            Tab(text: 'Customers'),
            Tab(text: 'Inventory'),
            Tab(text: 'Analytics'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildProductsTab(),
          _buildOrdersTab(),
          _buildCustomersTab(),
          _buildInventoryTab(),
          _buildAnalyticsTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddProduct(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildProductsTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_products.isEmpty) return const Center(child: Text('No products yet'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(0),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _products.length,
        itemBuilder: (context, i) {
          final p = _products[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: p['image_url'] != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(p['image_url'], fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.shopping_bag)))
                    : const Icon(Icons.shopping_bag),
              ),
              title: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('SKU: ${p['sku'] ?? '-'}  |  Stock: ${p['stock'] ?? 0}'),
              trailing: Text(
                '\$${(p['price'] ?? 0).toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildOrdersTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_orders.isEmpty) return const Center(child: Text('No orders'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(1),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _orders.length,
        itemBuilder: (context, i) {
          final o = _orders[i];
          final status = o['status'] ?? 'pending';
          final statusColor = status == 'completed' ? Colors.green
              : status == 'shipped' ? Colors.blue
              : status == 'cancelled' ? Colors.red
              : Colors.orange;
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Icon(Icons.receipt_long, color: statusColor),
              title: Text('#${o['order_number'] ?? o['id']?.toString().substring(0, 8) ?? ''}',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(o['customer_name'] ?? ''),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('\$${(o['total'] ?? 0).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(status.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: statusColor)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCustomersTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_customers.isEmpty) return const Center(child: Text('No customers'));
    return RefreshIndicator(
      onRefresh: () => _loadTabData(2),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _customers.length,
        itemBuilder: (context, i) {
          final c = _customers[i];
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
              trailing: Text('${c['order_count'] ?? 0} orders', style: const TextStyle(fontSize: 11, color: Colors.grey)),
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
          Text('Store Analytics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          SizedBox(height: 8),
          Text('Revenue, sales trends, and top products', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildInventoryTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_inventory.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey),
            SizedBox(height: 16),
            Text('Inventory', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            SizedBox(height: 8),
            Text('Track stock levels and low-stock alerts', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _loadTabData(3),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _inventory.length,
        itemBuilder: (context, i) {
          final item = _inventory[i];
          final stock = item['stock_quantity'] ?? 0;
          final lowStock = stock < 10;
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: Icon(
                lowStock ? Icons.warning_amber : Icons.inventory,
                color: lowStock ? Colors.red : Colors.green,
              ),
              title: Text(item['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('SKU: ${item['sku'] ?? '-'}'),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: lowStock ? Colors.red.withValues(alpha: 0.1) : Colors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$stock units',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: lowStock ? Colors.red : Colors.green),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showAddProduct(BuildContext context) {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Add Product', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(labelText: 'Product Name', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: priceCtrl,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: 'Price', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty) return;
                  Navigator.pop(ctx);
                  final headers = {'X-Company-Id': _companyId!};
                  await _api.post('/api/store/products', body: {
                    'name': nameCtrl.text.trim(),
                    'price': double.tryParse(priceCtrl.text) ?? 0,
                  }, extraHeaders: headers);
                  _loadTabData(0);
                },
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Add Product', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
