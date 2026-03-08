/**
 * Logistics Module Worker Routes
 *
 * Endpoints:
 *   GET    /api/logistics/vehicles              — list vehicles
 *   POST   /api/logistics/vehicles              — create vehicle
 *   PATCH  /api/logistics/vehicles/:id          — update vehicle
 *
 *   GET    /api/logistics/drivers               — list drivers
 *   POST   /api/logistics/drivers               — create/assign driver
 *   PATCH  /api/logistics/drivers/:id           — update driver
 *
 *   GET    /api/logistics/routes                — list routes
 *   POST   /api/logistics/routes                — create route
 *   PATCH  /api/logistics/routes/:id            — update route
 *
 *   GET    /api/logistics/tasks                 — list logistics tasks
 *   POST   /api/logistics/tasks                 — create logistics task
 *   PATCH  /api/logistics/tasks/:id             — update task status
 *
 *   GET    /api/logistics/shipments             — list shipments
 *   POST   /api/logistics/shipments             — create shipment
 *   GET    /api/logistics/shipments/:id         — get shipment detail
 *   PATCH  /api/logistics/shipments/:id         — update shipment
 *
 *   POST   /api/logistics/gps/ping              — record GPS ping
 *   GET    /api/logistics/gps/track/:driverId   — get GPS track for driver
 *
 *   GET    /api/logistics/stats                 — logistics dashboard stats
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, discoverMembership } from '../supabase';
import { hasWriteAccess } from '../permissions';

export async function handleLogistics(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId, supabase } = await requireAuth(request, env);

    const membership = await discoverMembership(env, userId);

    if (!membership) return errorResponse('No active company membership', 403);

    const companyId = membership.company_id;
    const memberId = membership.id;
    const role = membership.role;
    const adminClient = createAdminClient(env);

    // Helper: enforce write access for mutating operations
    const requireWrite = () => {
        if (!hasWriteAccess(role)) throw new Error('__FORBIDDEN__');
    };

    // ─── Stats ─────────────────────────────────────────────────────────

    if (path === '/api/logistics/stats' && request.method === 'GET') {
        const [vehicles, drivers, tasks, shipments] = await Promise.all([
            adminClient.from('vehicles').select('id, status').eq('company_id', companyId),
            adminClient.from('drivers').select('id, is_active').eq('company_id', companyId),
            adminClient.from('logistics_tasks').select('id, status').eq('company_id', companyId),
            adminClient.from('shipments').select('id, status').eq('company_id', companyId),
        ]);

        const v = vehicles.data ?? [];
        const d = drivers.data ?? [];
        const t = tasks.data ?? [];
        const s = shipments.data ?? [];

        return jsonResponse({
            vehicles: {
                total: v.length,
                available: v.filter((x: any) => x.status === 'available').length,
                in_use: v.filter((x: any) => x.status === 'in_use').length,
                maintenance: v.filter((x: any) => x.status === 'maintenance').length,
            },
            drivers: {
                total: d.length,
                active: d.filter((x: any) => x.is_active).length,
            },
            tasks: {
                total: t.length,
                pending: t.filter((x: any) => x.status === 'pending').length,
                in_transit: t.filter((x: any) => x.status === 'in_transit').length,
                delivered: t.filter((x: any) => x.status === 'delivered').length,
            },
            shipments: {
                total: s.length,
                pending: s.filter((x: any) => x.status === 'pending').length,
                in_transit: s.filter((x: any) => x.status === 'in_transit').length,
                delivered: s.filter((x: any) => x.status === 'delivered').length,
            },
        });
    }

    // ─── Vehicles ──────────────────────────────────────────────────────

    if (path === '/api/logistics/vehicles' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const search = url.searchParams.get('search');

        let query = adminClient
            .from('vehicles')
            .select('id, plate_number, model, type, status, created_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') query = query.eq('status', status);
        if (search) query = query.or(`plate_number.ilike.%${search}%,model.ilike.%${search}%`);

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ vehicles: data ?? [] });
    }

    if (path === '/api/logistics/vehicles' && request.method === 'POST') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions — requires supervisor+', 403);
        const body = await request.json() as any;
        const { plate_number, model, type } = body;

        if (!plate_number?.trim()) return errorResponse('Plate number is required', 400);

        const { data, error } = await adminClient
            .from('vehicles')
            .insert({
                company_id: companyId,
                plate_number: plate_number.trim(),
                model: model || null,
                type: type || null,
                status: 'available',
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ vehicle: data }, 201);
    }

    const vehicleMatch = path.match(/^\/api\/logistics\/vehicles\/([0-9a-f-]+)$/);
    if (vehicleMatch && request.method === 'PATCH') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);
        const vehicleId = vehicleMatch[1];
        const body = await request.json() as any;
        const allowed = ['plate_number', 'model', 'type', 'status'];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const { data, error } = await adminClient
            .from('vehicles')
            .update(updates)
            .eq('id', vehicleId)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ vehicle: data });
    }

    // ─── Drivers ───────────────────────────────────────────────────────

    if (path === '/api/logistics/drivers' && request.method === 'GET') {
        const { data, error } = await adminClient
            .from('drivers')
            .select(`
                id, license_number, license_expiry, license_type,
                vehicle_id, vehicles(plate_number, model),
                is_active,
                member_id,
                company_members!inner(
                    user_id, role,
                    profiles!inner(full_name, phone, avatar_url)
                )
            `)
            .eq('company_id', companyId)
            .order('is_active', { ascending: false });

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ drivers: data ?? [] });
    }

    if (path === '/api/logistics/drivers' && request.method === 'POST') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);
        const body = await request.json() as any;
        const { member_id: driverMemberId, license_number, license_expiry, license_type, vehicle_id } = body;

        if (!driverMemberId) return errorResponse('member_id is required', 400);

        const { data, error } = await adminClient
            .from('drivers')
            .upsert(
                {
                    company_id: companyId,
                    member_id: driverMemberId,
                    license_number: license_number || null,
                    license_expiry: license_expiry || null,
                    license_type: license_type || null,
                    vehicle_id: vehicle_id || null,
                    is_active: true,
                },
                { onConflict: 'company_id,member_id' },
            )
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ driver: data }, 201);
    }

    const driverMatch = path.match(/^\/api\/logistics\/drivers\/([0-9a-f-]+)$/);
    if (driverMatch && request.method === 'PATCH') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);
        const driverId = driverMatch[1];
        const body = await request.json() as any;
        const allowed = ['license_number', 'license_expiry', 'license_type', 'vehicle_id', 'is_active'];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const { data, error } = await adminClient
            .from('drivers')
            .update(updates)
            .eq('id', driverId)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ driver: data });
    }

    // ─── Routes ────────────────────────────────────────────────────────

    if (path === '/api/logistics/routes' && request.method === 'GET') {
        const { data, error } = await adminClient
            .from('routes')
            .select(`
                id, name, description,
                origin_lat, origin_lng, destination_lat, destination_lng,
                waypoints, estimated_distance_km, estimated_duration_min,
                is_active
            `)
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('name');

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ routes: data ?? [] });
    }

    if (path === '/api/logistics/routes' && request.method === 'POST') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);
        const body = await request.json() as any;
        const {
            name, description, origin_lat, origin_lng,
            destination_lat, destination_lng, waypoints,
            estimated_distance_km, estimated_duration_min,
        } = body;

        if (!name?.trim()) return errorResponse('Route name is required', 400);

        const { data, error } = await adminClient
            .from('routes')
            .insert({
                company_id: companyId,
                name: name.trim(),
                description: description || null,
                origin_lat, origin_lng,
                destination_lat, destination_lng,
                waypoints: waypoints || [],
                estimated_distance_km: estimated_distance_km || null,
                estimated_duration_min: estimated_duration_min || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ route: data }, 201);
    }

    const routeMatch = path.match(/^\/api\/logistics\/routes\/([0-9a-f-]+)$/);
    if (routeMatch && request.method === 'PATCH') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);
        const routeId = routeMatch[1];
        const body = await request.json() as any;
        const allowed = [
            'name', 'description', 'origin_lat', 'origin_lng',
            'destination_lat', 'destination_lng', 'waypoints',
            'estimated_distance_km', 'estimated_duration_min', 'is_active',
        ];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const { data, error } = await adminClient
            .from('routes')
            .update(updates)
            .eq('id', routeId)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ route: data });
    }

    // ─── Logistics Tasks ───────────────────────────────────────────────

    if (path === '/api/logistics/tasks' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');

        let query = adminClient
            .from('logistics_tasks')
            .select(`
                id, title, description, pickup_location, delivery_location,
                status, tracking_data, created_at,
                assigned_to, company_members(profiles(full_name)),
                vehicle_id, vehicles(plate_number, model)
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') query = query.eq('status', status);

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ tasks: data ?? [] });
    }

    if (path === '/api/logistics/tasks' && request.method === 'POST') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);
        const body = await request.json() as any;
        const { title, description, assigned_to, vehicle_id, pickup_location, delivery_location } = body;

        if (!title?.trim()) return errorResponse('Task title is required', 400);

        const { data, error } = await adminClient
            .from('logistics_tasks')
            .insert({
                company_id: companyId,
                title: title.trim(),
                description: description || null,
                assigned_to: assigned_to || null,
                vehicle_id: vehicle_id || null,
                pickup_location: pickup_location || null,
                delivery_location: delivery_location || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ task: data }, 201);
    }

    const logTaskMatch = path.match(/^\/api\/logistics\/tasks\/([0-9a-f-]+)$/);
    if (logTaskMatch && request.method === 'PATCH') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);
        const taskId = logTaskMatch[1];
        const body = await request.json() as any;
        const allowed = [
            'title', 'description', 'assigned_to', 'vehicle_id',
            'pickup_location', 'delivery_location', 'status', 'tracking_data',
        ];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const { data, error } = await adminClient
            .from('logistics_tasks')
            .update(updates)
            .eq('id', taskId)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ task: data });
    }

    // ─── Shipments ─────────────────────────────────────────────────────

    if (path === '/api/logistics/shipments' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

        let query = adminClient
            .from('shipments')
            .select(`
                id, tracking_code, status, weight_kg, dimensions,
                recipient_name, recipient_phone, recipient_address,
                estimated_delivery, actual_delivery, proof_of_delivery_url,
                notes, created_at,
                driver_id, drivers(company_members(profiles(full_name))),
                vehicle_id, vehicles(plate_number),
                route_id, routes(name)
            `, { count: 'exact' })
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') query = query.eq('status', status);
        query = query.range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ shipments: data ?? [], total: count ?? 0, page, limit });
    }

    if (path === '/api/logistics/shipments' && request.method === 'POST') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);
        const body = await request.json() as any;
        const {
            logistics_task_id, route_id, driver_id, vehicle_id,
            weight_kg, dimensions, recipient_name, recipient_phone,
            recipient_address, estimated_delivery, notes,
        } = body;

        // Generate tracking code
        const trackingCode = `ZN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const { data, error } = await adminClient
            .from('shipments')
            .insert({
                company_id: companyId,
                logistics_task_id: logistics_task_id || null,
                route_id: route_id || null,
                driver_id: driver_id || null,
                vehicle_id: vehicle_id || null,
                tracking_code: trackingCode,
                status: 'pending',
                weight_kg: weight_kg || null,
                dimensions: dimensions || null,
                recipient_name: recipient_name || null,
                recipient_phone: recipient_phone || null,
                recipient_address: recipient_address || null,
                estimated_delivery: estimated_delivery || null,
                notes: notes || null,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ shipment: data }, 201);
    }

    const shipmentMatch = path.match(/^\/api\/logistics\/shipments\/([0-9a-f-]+)$/);

    if (shipmentMatch && request.method === 'GET') {
        const shipmentId = shipmentMatch[1];

        const { data, error } = await adminClient
            .from('shipments')
            .select(`
                id, tracking_code, status, weight_kg, dimensions,
                recipient_name, recipient_phone, recipient_address,
                estimated_delivery, actual_delivery, proof_of_delivery_url,
                notes, created_at,
                driver_id, drivers(company_members(profiles(full_name, phone))),
                vehicle_id, vehicles(plate_number, model),
                route_id, routes(name, origin_lat, origin_lng, destination_lat, destination_lng)
            `)
            .eq('id', shipmentId)
            .eq('company_id', companyId)
            .single();

        if (error || !data) return errorResponse('Shipment not found', 404);

        // Get GPS history for this shipment
        const { data: gpsTrack } = await adminClient
            .from('gps_tracks')
            .select('lat, lng, speed_kmh, heading, recorded_at')
            .eq('shipment_id', shipmentId)
            .order('recorded_at', { ascending: true })
            .limit(200);

        return jsonResponse({ shipment: data, gps_track: gpsTrack ?? [] });
    }

    if (shipmentMatch && request.method === 'PATCH') {
        if (!hasWriteAccess(role)) return errorResponse('Insufficient permissions', 403);
        const shipmentId = shipmentMatch[1];
        const body = await request.json() as any;
        const allowed = [
            'status', 'driver_id', 'vehicle_id', 'route_id',
            'recipient_name', 'recipient_phone', 'recipient_address',
            'estimated_delivery', 'actual_delivery', 'proof_of_delivery_url', 'notes',
        ];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        // Auto-set actual_delivery when marking delivered
        if (body.status === 'delivered' && !updates.actual_delivery) {
            updates.actual_delivery = new Date().toISOString();
        }

        const { data, error } = await adminClient
            .from('shipments')
            .update(updates)
            .eq('id', shipmentId)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ shipment: data });
    }

    // ─── GPS Tracking ──────────────────────────────────────────────────

    // POST /api/logistics/gps/ping
    if (path === '/api/logistics/gps/ping' && request.method === 'POST') {
        const body = await request.json() as any;
        const { lat, lng, speed_kmh, heading, accuracy_m, vehicle_id, shipment_id } = body;

        if (lat == null || lng == null) return errorResponse('lat and lng required', 400);

        // Find driver record for current member
        const { data: driver } = await adminClient
            .from('drivers')
            .select('id')
            .eq('company_id', companyId)
            .eq('member_id', memberId)
            .maybeSingle();

        if (!driver) return errorResponse('Not registered as driver', 403);

        const { data, error } = await adminClient
            .from('gps_tracks')
            .insert({
                company_id: companyId,
                driver_id: driver.id,
                vehicle_id: vehicle_id || null,
                shipment_id: shipment_id || null,
                lat, lng,
                speed_kmh: speed_kmh || null,
                heading: heading || null,
                accuracy_m: accuracy_m || null,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Also update location_pings
        await adminClient.from('location_pings').insert({
            company_id: companyId,
            member_id: memberId,
            lat, lng,
            accuracy_m: accuracy_m || null,
            ping_type: 'auto',
        });

        return jsonResponse({ track: data }, 201);
    }

    // GET /api/logistics/gps/track/:driverId
    const gpsTrackMatch = path.match(/^\/api\/logistics\/gps\/track\/([0-9a-f-]+)$/);
    if (gpsTrackMatch && request.method === 'GET') {
        const driverId = gpsTrackMatch[1];
        const url = new URL(request.url);
        const since = url.searchParams.get('since'); // ISO date
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 1000);

        let query = adminClient
            .from('gps_tracks')
            .select('lat, lng, speed_kmh, heading, accuracy_m, recorded_at, vehicle_id, shipment_id')
            .eq('company_id', companyId)
            .eq('driver_id', driverId)
            .order('recorded_at', { ascending: false })
            .limit(limit);

        if (since) query = query.gte('recorded_at', since);

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ tracks: (data ?? []).reverse() });
    }

    return errorResponse('Not found', 404);
}
