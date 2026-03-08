/**
 * Store API routes - products, orders, customers, analytics
 *
 * SECURED: All endpoints require JWT auth + company membership.
 * Write operations require hasWriteAccess (role level >= 55).
 */
import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, discoverMembership } from '../supabase';
import { hasWriteAccess } from '../permissions';

export async function handleStore(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    // Auth + Company gate
    const { userId, supabase } = await requireAuth(request, env);
    const membership = await discoverMembership(env, userId);
    if (!membership) return errorResponse('No active company membership', 403);

    const companyId = membership.company_id;
    const role = membership.role;
    const adminClient = createAdminClient(env);
    const url = new URL(request.url);
    const method = request.method;

    // --- Products ---
    if (path === '/api/store/products' && method === 'GET') {
        const search = url.searchParams.get('search');
        const category = url.searchParams.get('category');
        const status = url.searchParams.get('status');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('products')
            .select('*', { count: 'exact' })
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
        if (category) query = query.eq('category', category);
        if (status && status !== 'all') query = query.eq('status', status);
        query = query.range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ products: data ?? [], total: count ?? 0, page, limit });
    }

    if (path === '/api/store/products' && method === 'POST') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions - store write requires supervisor+', 403);

        const body = await request.json() as any;
        if (!body.name) return errorResponse('Product name is required');

        const { data, error } = await adminClient.from('products').insert({
            company_id: companyId,
            name: body.name,
            sku: body.sku || null,
            price: body.price || 0,
            cost_price: body.cost_price || 0,
            stock_quantity: body.stock_quantity || 0,
            category: body.category || null,
            description: body.description || null,
            status: 'active',
        }).select().single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ product: data }, 201);
    }

    if (path.startsWith('/api/store/products/') && method === 'DELETE') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);

        const productId = path.replace('/api/store/products/', '');
        const { error } = await adminClient
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('company_id', companyId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ ok: true });
    }

    // --- Orders ---
    if (path === '/api/store/orders' && method === 'GET') {
        const status = url.searchParams.get('status');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('orders')
            .select('*, order_items(*), store_customers(name, email)', { count: 'exact' })
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') query = query.eq('status', status);
        query = query.range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ orders: data ?? [], total: count ?? 0, page, limit });
    }

    if (path === '/api/store/orders' && method === 'POST') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);

        const body = await request.json() as any;

        const { data: order, error: orderErr } = await adminClient.from('orders').insert({
            company_id: companyId,
            customer_id: body.customer_id || null,
            order_number: body.order_number || `ORD-${Date.now()}`,
            status: 'pending',
            total_amount: body.total_amount || 0,
            currency: body.currency || 'AED',
            notes: body.notes || null,
        }).select().single();

        if (orderErr) return errorResponse(orderErr.message, 500);

        if (body.items?.length && order) {
            const items = body.items.map((item: any) => ({
                order_id: order.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0,
                total_price: (item.quantity || 1) * (item.unit_price || 0),
            }));
            await adminClient.from('order_items').insert(items);

            for (const item of body.items) {
                if (item.product_id) {
                    try {
                        await adminClient.rpc('decrement_stock', {
                            p_product_id: item.product_id,
                            p_quantity: item.quantity || 1,
                        });
                    } catch { /* RPC may not exist yet */ }
                }
            }
        }

        return jsonResponse({ order }, 201);
    }

    // --- Customers ---
    if (path === '/api/store/customers' && method === 'GET') {
        const search = url.searchParams.get('search');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('store_customers')
            .select('*', { count: 'exact' })
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        query = query.range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ customers: data ?? [], total: count ?? 0, page, limit });
    }

    if (path === '/api/store/customers' && method === 'POST') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);

        const body = await request.json() as any;
        if (!body.name) return errorResponse('Customer name is required');

        const { data, error } = await adminClient.from('store_customers').insert({
            company_id: companyId,
            name: body.name,
            email: body.email || null,
            phone: body.phone || null,
        }).select().single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ customer: data }, 201);
    }

    // --- Analytics ---
    if (path === '/api/store/analytics' && method === 'GET') {
        const [products, orders, customers] = await Promise.all([
            adminClient.from('products').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
            adminClient.from('orders').select('total_amount, status').eq('company_id', companyId),
            adminClient.from('store_customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        ]);

        const allOrders = orders.data || [];
        const totalRevenue = allOrders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
        const completedOrders = allOrders.filter((o: any) => o.status === 'completed').length;

        return jsonResponse({
            total_products: products.count || 0,
            total_orders: allOrders.length,
            completed_orders: completedOrders,
            total_revenue: totalRevenue,
            total_customers: customers.count || 0,
        });
    }

    return errorResponse('Not found', 404);
}
