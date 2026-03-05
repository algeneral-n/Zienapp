// Store API routes — products, orders, customers, analytics
import { createClient } from '@supabase/supabase-js';

interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function err(message: string, status = 400) {
    return json({ error: message }, status);
}

function getSupabase(env: Env) {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function handleStore(request: Request, env: Env, path: string): Promise<Response> {
    const supabase = getSupabase(env);
    const url = new URL(request.url);
    const method = request.method;

    // ─── Products ───────────────────────────────────────────────────────────
    // GET /api/store/products?company_id=xxx
    if (path === '/api/store/products' && method === 'GET') {
        const companyId = url.searchParams.get('company_id');
        if (!companyId) return err('company_id required');
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });
        if (error) return err(error.message, 500);
        return json({ products: data });
    }

    // POST /api/store/products
    if (path === '/api/store/products' && method === 'POST') {
        const body = await request.json() as any;
        if (!body.company_id || !body.name) return err('company_id and name required');
        const { data, error } = await supabase.from('products').insert({
            company_id: body.company_id,
            name: body.name,
            sku: body.sku || null,
            price: body.price || 0,
            cost_price: body.cost_price || 0,
            stock_quantity: body.stock_quantity || 0,
            category: body.category || null,
            description: body.description || null,
            status: 'active',
        }).select().single();
        if (error) return err(error.message, 500);
        return json({ product: data }, 201);
    }

    // DELETE /api/store/products/:id
    if (path.startsWith('/api/store/products/') && method === 'DELETE') {
        const productId = path.replace('/api/store/products/', '');
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) return err(error.message, 500);
        return json({ ok: true });
    }

    // ─── Orders ─────────────────────────────────────────────────────────────
    // GET /api/store/orders?company_id=xxx
    if (path === '/api/store/orders' && method === 'GET') {
        const companyId = url.searchParams.get('company_id');
        if (!companyId) return err('company_id required');
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*), store_customers(name, email)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) return err(error.message, 500);
        return json({ orders: data });
    }

    // POST /api/store/orders
    if (path === '/api/store/orders' && method === 'POST') {
        const body = await request.json() as any;
        if (!body.company_id) return err('company_id required');

        // Create order
        const { data: order, error: orderErr } = await supabase.from('orders').insert({
            company_id: body.company_id,
            customer_id: body.customer_id || null,
            order_number: body.order_number || `ORD-${Date.now()}`,
            status: 'pending',
            total_amount: body.total_amount || 0,
            currency: body.currency || 'AED',
            notes: body.notes || null,
        }).select().single();
        if (orderErr) return err(orderErr.message, 500);

        // Insert order items
        if (body.items?.length && order) {
            const items = body.items.map((item: any) => ({
                order_id: order.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0,
                total_price: (item.quantity || 1) * (item.unit_price || 0),
            }));
            await supabase.from('order_items').insert(items);

            // Decrement stock
            for (const item of body.items) {
                if (item.product_id) {
                    await supabase.rpc('decrement_stock', {
                        p_product_id: item.product_id,
                        p_quantity: item.quantity || 1,
                    }).catch(() => { /* RPC may not exist yet */ });
                }
            }
        }

        return json({ order }, 201);
    }

    // ─── Customers ──────────────────────────────────────────────────────────
    // GET /api/store/customers?company_id=xxx
    if (path === '/api/store/customers' && method === 'GET') {
        const companyId = url.searchParams.get('company_id');
        if (!companyId) return err('company_id required');
        const { data, error } = await supabase
            .from('store_customers')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });
        if (error) return err(error.message, 500);
        return json({ customers: data });
    }

    // POST /api/store/customers
    if (path === '/api/store/customers' && method === 'POST') {
        const body = await request.json() as any;
        if (!body.company_id || !body.name) return err('company_id and name required');
        const { data, error } = await supabase.from('store_customers').insert({
            company_id: body.company_id,
            name: body.name,
            email: body.email || null,
            phone: body.phone || null,
        }).select().single();
        if (error) return err(error.message, 500);
        return json({ customer: data }, 201);
    }

    // ─── Analytics ──────────────────────────────────────────────────────────
    // GET /api/store/analytics?company_id=xxx
    if (path === '/api/store/analytics' && method === 'GET') {
        const companyId = url.searchParams.get('company_id');
        if (!companyId) return err('company_id required');

        const [products, orders, customers] = await Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
            supabase.from('orders').select('total_amount, status').eq('company_id', companyId),
            supabase.from('store_customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        ]);

        const allOrders = orders.data || [];
        const totalRevenue = allOrders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
        const completedOrders = allOrders.filter((o: any) => o.status === 'completed').length;

        return json({
            total_products: products.count || 0,
            total_orders: allOrders.length,
            completed_orders: completedOrders,
            total_revenue: totalRevenue,
            total_customers: customers.count || 0,
        });
    }

    return err('Not found', 404);
}
