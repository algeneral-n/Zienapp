import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Package, ShoppingCart, Users, BarChart3, Plus, Search,
  Loader2, Trash2, Edit3, Eye, X, DollarSign, TrendingUp,
  AlertTriangle, ArrowUpDown, CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../contexts/CompanyContext';

type Tab = 'products' | 'orders' | 'customers' | 'inventory' | 'analytics';

export default function StoreModule() {
  const { language } = useTheme();
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.id;
  const [activeTab, setActiveTab] = useState<Tab>('products');

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'products', label: language === 'ar' ? 'المنتجات' : 'Products', icon: Package },
    { id: 'orders', label: language === 'ar' ? 'الطلبات' : 'Orders', icon: ShoppingCart },
    { id: 'customers', label: language === 'ar' ? 'العملاء' : 'Customers', icon: Users },
    { id: 'inventory', label: language === 'ar' ? 'المخزون' : 'Inventory', icon: AlertTriangle },
    { id: 'analytics', label: language === 'ar' ? 'التحليلات' : 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter">{language === 'ar' ? 'المتجر ونقاط البيع' : 'Store & POS'}</h1>
        <p className="text-sm text-zinc-500 mt-1">{language === 'ar' ? 'إدارة المنتجات والطلبات والعملاء' : 'Manage products, orders, and customers'}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && <ProductsTab companyId={companyId} language={language} />}
      {activeTab === 'orders' && <OrdersTab companyId={companyId} language={language} />}
      {activeTab === 'customers' && <CustomersTab companyId={companyId} language={language} />}
      {activeTab === 'inventory' && <InventoryTab companyId={companyId} language={language} />}
      {activeTab === 'analytics' && <AnalyticsTab companyId={companyId} language={language} />}
    </div>
  );
}

// ─── Products Tab ───────────────────────────────────────────────────────────

function ProductsTab({ companyId, language }: { companyId?: string; language: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', stock_quantity: '', category: '' });

  const fetchProducts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAddProduct = async () => {
    if (!companyId || !newProduct.name) return;
    await supabase.from('products').insert({
      company_id: companyId,
      name: newProduct.name,
      sku: newProduct.sku || null,
      price: parseFloat(newProduct.price) || 0,
      stock_quantity: parseInt(newProduct.stock_quantity) || 0,
      category: newProduct.category || null,
      status: 'active',
    });
    setShowAdd(false);
    setNewProduct({ name: '', sku: '', price: '', stock_quantity: '', category: '' });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input id="product-search" name="search" placeholder={language === 'ar' ? 'بحث...' : 'Search products...'} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all">
          <Plus size={14} /> {language === 'ar' ? 'منتج جديد' : 'Add Product'}
        </button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm">{language === 'ar' ? 'منتج جديد' : 'New Product'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input id="product-name" name="productName" placeholder={language === 'ar' ? 'اسم المنتج' : 'Product Name'} value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm outline-none" />
            <input id="product-sku" name="sku" placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm outline-none" />
            <input id="product-price" name="price" placeholder={language === 'ar' ? 'السعر' : 'Price'} type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm outline-none" />
            <input id="product-stock" name="stockQuantity" placeholder={language === 'ar' ? 'الكمية' : 'Stock Qty'} type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct({ ...newProduct, stock_quantity: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm outline-none" />
            <input id="product-category" name="category" placeholder={language === 'ar' ? 'الفئة' : 'Category'} value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button onClick={handleAddProduct} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">{language === 'ar' ? 'حفظ' : 'Save'}</button>
          </div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'المنتج' : 'Product'}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">SKU</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'السعر' : 'Price'}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'المخزون' : 'Stock'}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-400">{language === 'ar' ? 'لا توجد منتجات بعد' : 'No products yet'}</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{p.name}</td>
                <td className="px-6 py-4 text-xs text-zinc-500 font-mono">{p.sku || '—'}</td>
                <td className="px-6 py-4 text-sm font-bold">{p.price?.toFixed(2)} AED</td>
                <td className="px-6 py-4 text-sm"><span className={p.stock_quantity < 10 ? 'text-red-500 font-bold' : ''}>{p.stock_quantity}</span></td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>{p.status}</span></td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(p.id)} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Orders Tab ─────────────────────────────────────────────────────────────

function OrdersTab({ companyId, language }: { companyId?: string; language: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(count), store_customers(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders(data || []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const statusFlow = ['pending', 'processing', 'shipped', 'completed'];

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'العميل' : 'Customer'}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الحالة' : 'Status'}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {orders.length === 0 ? (
            <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-400">{language === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}</td></tr>
          ) : orders.map(o => {
            const nextStatus = statusFlow[statusFlow.indexOf(o.status) + 1];
            return (
              <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold font-mono">#{o.order_number || o.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-sm">{o.store_customers?.name || '—'}</td>
                <td className="px-6 py-4 text-sm font-bold">{o.total_amount?.toFixed(2)} {o.currency || 'AED'}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' :
                  o.status === 'shipped' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' :
                    o.status === 'processing' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' :
                      o.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' :
                        'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                  }`}>{o.status}</span></td>
                <td className="px-6 py-4 text-xs text-zinc-400">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  {nextStatus && (
                    <button onClick={() => updateStatus(o.id, nextStatus)} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-blue-700">
                      {nextStatus === 'processing' ? '→ Process' : nextStatus === 'shipped' ? '→ Ship' : '→ Complete'}
                    </button>
                  )}
                  {o.status === 'completed' && <CheckCircle2 size={16} className="text-emerald-500" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Customers Tab ──────────────────────────────────────────────────────────

function CustomersTab({ companyId, language }: { companyId?: string; language: string }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data } = await supabase
        .from('store_customers')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      setCustomers(data || []);
      setLoading(false);
    })();
  }, [companyId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الاسم' : 'Name'}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'البريد' : 'Email'}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الإجمالي' : 'Total Spent'}</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'التسجيل' : 'Joined'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {customers.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-400">{language === 'ar' ? 'لا يوجد عملاء بعد' : 'No customers yet'}</td></tr>
          ) : customers.map(c => (
            <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="px-6 py-4 text-sm font-bold">{c.name}</td>
              <td className="px-6 py-4 text-xs text-zinc-500">{c.email || '—'}</td>
              <td className="px-6 py-4 text-xs">{c.phone || '—'}</td>
              <td className="px-6 py-4 text-sm font-bold">{(c.total_spent || 0).toFixed(2)} AED</td>
              <td className="px-6 py-4 text-xs text-zinc-400">{new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Inventory Tab ──────────────────────────────────────────────────────────

function InventoryTab({ companyId, language }: { companyId?: string; language: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');

  const fetchProducts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('company_id', companyId).order('stock_quantity', { ascending: true });
    setProducts(data || []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAdjust = async (id: string, currentQty: number) => {
    const delta = parseInt(adjustQty);
    if (isNaN(delta)) return;
    const newQty = Math.max(0, currentQty + delta);
    await supabase.from('products').update({ stock_quantity: newQty }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_quantity: newQty } : p));
    setAdjusting(null);
    setAdjustQty('');
  };

  const lowStock = products.filter(p => p.stock_quantity < 10);
  const outOfStock = products.filter(p => p.stock_quantity === 0);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-blue-600 mb-3"><Package size={18} /></div>
          <div className="text-2xl font-black">{products.length}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-600/10 flex items-center justify-center text-amber-600 mb-3"><AlertTriangle size={18} /></div>
          <div className="text-2xl font-black text-amber-600">{lowStock.length}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{language === 'ar' ? 'مخزون منخفض' : 'Low Stock (<10)'}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-600/10 flex items-center justify-center text-red-600 mb-3"><X size={18} /></div>
          <div className="text-2xl font-black text-red-600">{outOfStock.length}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{language === 'ar' ? 'نفد المخزون' : 'Out of Stock'}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'المنتج' : 'Product'}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">SKU</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'تعديل' : 'Adjust'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {products.map(p => (
              <tr key={p.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${p.stock_quantity === 0 ? 'bg-red-50/50 dark:bg-red-900/10' : p.stock_quantity < 10 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                <td className="px-6 py-4 text-sm font-bold">{p.name}</td>
                <td className="px-6 py-4 text-xs text-zinc-500 font-mono">{p.sku || '—'}</td>
                <td className="px-6 py-4 text-sm font-black">{p.stock_quantity}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.stock_quantity === 0 ? 'bg-red-500/10 text-red-600' : p.stock_quantity < 10 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    {p.stock_quantity === 0 ? (language === 'ar' ? 'نفد' : 'Out') : p.stock_quantity < 10 ? (language === 'ar' ? 'منخفض' : 'Low') : (language === 'ar' ? 'متوفر' : 'In Stock')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {adjusting === p.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="+/- qty" className="w-20 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs" />
                      <button onClick={() => handleAdjust(p.id, p.stock_quantity)} className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold">OK</button>
                      <button onClick={() => { setAdjusting(null); setAdjustQty(''); }} className="text-zinc-400"><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setAdjusting(p.id)} className="text-zinc-400 hover:text-blue-600"><ArrowUpDown size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Analytics Tab ──────────────────────────────────────────────────────────

function AnalyticsTab({ companyId, language }: { companyId?: string; language: string }) {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const [products, orders, customers] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('orders').select('total_amount').eq('company_id', companyId),
        supabase.from('store_customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);
      const revenue = (orders.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
      setStats({
        totalProducts: products.count || 0,
        totalOrders: (orders.data || []).length,
        totalRevenue: revenue,
        totalCustomers: customers.count || 0,
      });
      setLoading(false);
    })();
  }, [companyId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  const cards = [
    { label: language === 'ar' ? 'المنتجات' : 'Products', value: stats.totalProducts, icon: Package, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
    { label: language === 'ar' ? 'الطلبات' : 'Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
    { label: language === 'ar' ? 'الإيرادات' : 'Revenue', value: `${stats.totalRevenue.toFixed(0)} AED`, icon: DollarSign, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
    { label: language === 'ar' ? 'العملاء' : 'Customers', value: stats.totalCustomers, icon: Users, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}><card.icon size={18} /></div>
          <div className="text-2xl font-black">{card.value}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
