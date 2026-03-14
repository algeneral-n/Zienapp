-- 00030_domain_events.sql
-- Domain Events Architecture (T0-4a)
-- Blueprint §15: domain_events, event_subscriptions, analytics_events

-- ─── domain_events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.domain_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name    text NOT NULL,          -- e.g. company.created, member.invited
  entity_type   text NOT NULL,          -- e.g. company, member, module
  entity_id     uuid,
  company_id    uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_payload jsonb NOT NULL DEFAULT '{}',
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  causation_id  uuid,                   -- the event that caused this event
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_domain_events_company   ON public.domain_events(company_id, created_at DESC);
CREATE INDEX idx_domain_events_name      ON public.domain_events(event_name);
CREATE INDEX idx_domain_events_entity    ON public.domain_events(entity_type, entity_id);
CREATE INDEX idx_domain_events_corr      ON public.domain_events(correlation_id);

COMMENT ON TABLE public.domain_events IS 'Canonical domain event log — every significant platform action produces a row.';

-- ─── event_subscriptions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name    text NOT NULL,          -- pattern: exact name or wildcard e.g. "company.*"
  consumer_code text NOT NULL,          -- e.g. "billing_webhook", "analytics_sink"
  webhook_url   text,                   -- optional external webhook
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_name, consumer_code)
);

COMMENT ON TABLE public.event_subscriptions IS 'Registry of consumers interested in specific domain events.';

-- ─── analytics_events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  text NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page        text,
  payload     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_company ON public.analytics_events(company_id, created_at DESC);
CREATE INDEX idx_analytics_events_name    ON public.analytics_events(event_name, category);

COMMENT ON TABLE public.analytics_events IS 'Lightweight analytics events for dashboards and usage tracking.';

-- ─── RLS ────────────────────────────────────────────────────────────────
ALTER TABLE public.domain_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events    ENABLE ROW LEVEL SECURITY;

-- domain_events: company members can read their company's events
CREATE POLICY "domain_events_select_member" ON public.domain_events
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
  );

-- domain_events: only service_role inserts (via Worker admin client)
CREATE POLICY "domain_events_insert_service" ON public.domain_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- event_subscriptions: founders only
CREATE POLICY "event_subscriptions_all_founder" ON public.event_subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_founder = true)
  );

-- analytics_events: same as domain_events
CREATE POLICY "analytics_events_select_member" ON public.analytics_events
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
  );

CREATE POLICY "analytics_events_insert_service" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
