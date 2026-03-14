// ─── Domain Event Emitter ────────────────────────────────────────────────────
// Inserts rows into public.domain_events via admin client (service_role).
// Usage: await emitDomainEvent(env, { ... });

import type { Env } from '../index';
import { createAdminClient } from '../supabase';

export interface DomainEventInput {
    eventName: string;        // e.g. "company.created"
    entityType: string;       // e.g. "company"
    entityId?: string;
    companyId?: string;
    actorUserId?: string;
    payload?: Record<string, unknown>;
    correlationId?: string;
    causationId?: string;
}

/**
 * Fire-and-forget insert into domain_events.
 * Uses admin client (service_role) to bypass RLS.
 * Errors are logged but never thrown — callers should not fail on event emission.
 */
export async function emitDomainEvent(
    env: Env,
    input: DomainEventInput,
): Promise<void> {
    try {
        const admin = createAdminClient(env);
        await admin.from('domain_events').insert({
            event_name: input.eventName,
            entity_type: input.entityType,
            entity_id: input.entityId ?? null,
            company_id: input.companyId ?? null,
            actor_user_id: input.actorUserId ?? null,
            event_payload: input.payload ?? {},
            correlation_id: input.correlationId ?? crypto.randomUUID(),
            causation_id: input.causationId ?? null,
        });
    } catch (err) {
        console.error('[domain-event] Failed to emit:', input.eventName, err);
    }
}

/**
 * Emit multiple domain events in a single insert.
 */
export async function emitDomainEvents(
    env: Env,
    inputs: DomainEventInput[],
): Promise<void> {
    if (inputs.length === 0) return;
    try {
        const admin = createAdminClient(env);
        const correlationId = crypto.randomUUID();
        await admin.from('domain_events').insert(
            inputs.map((input) => ({
                event_name: input.eventName,
                entity_type: input.entityType,
                entity_id: input.entityId ?? null,
                company_id: input.companyId ?? null,
                actor_user_id: input.actorUserId ?? null,
                event_payload: input.payload ?? {},
                correlation_id: input.correlationId ?? correlationId,
                causation_id: input.causationId ?? null,
            })),
        );
    } catch (err) {
        console.error('[domain-event] Failed to emit batch:', err);
    }
}
