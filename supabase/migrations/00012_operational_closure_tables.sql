-- =============================================================================
-- Migration 00012: Platform Operational Closure Tables
-- Dynamic Pricing + Integrations Health + AI Governance + Approvals + Platform Ops
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Dynamic Pricing Engine
-- ─────────────────────────────────────────────────────────────────────────────

-- Pricing rules define how add-ons, modules, seats, AI quota etc. are priced
CREATE TABLE IF NOT EXISTS pricing_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,               -- e.g. 'seat_fee', 'module_hr', 'ai_quota_1k'
  category      TEXT NOT NULL DEFAULT 'addon',       -- 'base', 'seat', 'module', 'ai', 'storage', 'integration', 'support'
  label_en      TEXT NOT NULL,
  label_ar      TEXT,
  description   TEXT,
  unit_price    NUMERIC(12,4) NOT NULL DEFAULT 0,    -- price per unit
  currency      TEXT NOT NULL DEFAULT 'USD',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',     -- 'monthly', 'yearly', 'one_time', 'usage'
  min_quantity  INT DEFAULT 0,
  max_quantity  INT,                                 -- NULL = unlimited
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  metadata      JSONB DEFAULT '{}',                  -- extra config (tier thresholds, etc.)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated pricing quotes before subscription activation
CREATE TABLE IF NOT EXISTS pricing_quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  quote_number    TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',     -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
  total_monthly   NUMERIC(12,4) DEFAULT 0,
  total_yearly    NUMERIC(12,4) DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  valid_until     TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  notes           TEXT,
  generated_by    TEXT DEFAULT 'system',             -- 'system', 'founder', 'sales'
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual line items in a pricing quote
CREATE TABLE IF NOT EXISTS pricing_quote_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id        UUID NOT NULL REFERENCES pricing_quotes(id) ON DELETE CASCADE,
  pricing_rule_id UUID REFERENCES pricing_rules(id),
  code            TEXT NOT NULL,                     -- mirrors pricing_rules.code
  label           TEXT NOT NULL,
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,4) NOT NULL DEFAULT 0,
  subtotal        NUMERIC(12,4) NOT NULL DEFAULT 0,
  is_optional     BOOLEAN DEFAULT FALSE,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Integration Health & Setup Tracking
-- ─────────────────────────────────────────────────────────────────────────────

-- Tracks onboarding/configuration wizard sessions for each integration
CREATE TABLE IF NOT EXISTS integration_setup_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_code  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'started',  -- 'started', 'config_pending', 'credentials_set', 'testing', 'active', 'failed'
  step_current      INT DEFAULT 1,
  step_total        INT DEFAULT 1,
  config_schema     JSONB DEFAULT '{}',               -- expected config fields
  config_values     JSONB DEFAULT '{}',               -- user-provided values (encrypted refs)
  error_json        JSONB,
  started_by        UUID REFERENCES profiles(id),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Periodic health checks for active integrations
CREATE TABLE IF NOT EXISTS integration_health_checks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_code  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'healthy',  -- 'healthy', 'degraded', 'down', 'unknown'
  latency_ms        INT,
  response_code     INT,
  error_message     TEXT,
  checked_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sync run log for integrations that pull/push data
CREATE TABLE IF NOT EXISTS integration_sync_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_code  TEXT NOT NULL,
  direction         TEXT NOT NULL DEFAULT 'pull',     -- 'pull', 'push', 'bidirectional'
  status            TEXT NOT NULL DEFAULT 'running',  -- 'running', 'completed', 'failed', 'partial'
  records_processed INT DEFAULT 0,
  records_failed    INT DEFAULT 0,
  duration_ms       INT,
  error_json        JSONB,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AI Governance
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy rules that control AI behavior per tenant/module/role
CREATE TABLE IF NOT EXISTS ai_policy_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,  -- NULL = platform-wide
  module_code     TEXT,                              -- NULL = all modules
  role_code       TEXT,                              -- NULL = all roles
  action_type     TEXT NOT NULL,                     -- 'suggest', 'execute', 'approve', 'deny'
  permission_tier TEXT NOT NULL DEFAULT 'suggest',   -- 'suggest', 'auto_execute', 'require_approval'
  max_daily_calls INT,
  max_monthly_cost NUMERIC(12,4),
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Review trail for AI actions that require approval
CREATE TABLE IF NOT EXISTS ai_action_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  policy_rule_id  UUID REFERENCES ai_policy_rules(id),
  action_type     TEXT NOT NULL,
  action_payload  JSONB NOT NULL DEFAULT '{}',
  ai_model        TEXT,
  ai_confidence   NUMERIC(5,4),
  status          TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'approved', 'rejected', 'auto_approved'
  reviewed_by     UUID REFERENCES profiles(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation threads for AI chat interactions
CREATE TABLE IF NOT EXISTS ai_conversation_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT,
  agent_type      TEXT NOT NULL DEFAULT 'general',   -- 'general', 'hr', 'accounting', 'sales', 'gm', 'secretary', etc.
  module_code     TEXT,
  status          TEXT NOT NULL DEFAULT 'active',    -- 'active', 'archived', 'deleted'
  message_count   INT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual messages within AI conversation threads
CREATE TABLE IF NOT EXISTS ai_conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID NOT NULL REFERENCES ai_conversation_threads(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,                     -- 'user', 'assistant', 'system'
  content         TEXT NOT NULL,
  token_count     INT,
  model_used      TEXT,
  cost_usd        NUMERIC(10,6),
  attachments     JSONB DEFAULT '[]',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Platform Operations & Health
-- ─────────────────────────────────────────────────────────────────────────────

-- Platform-level incidents (tracked by founder/platform admins)
CREATE TABLE IF NOT EXISTS platform_incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'low',       -- 'critical', 'high', 'medium', 'low'
  status          TEXT NOT NULL DEFAULT 'open',      -- 'open', 'investigating', 'identified', 'monitoring', 'resolved'
  affected_service TEXT,                             -- 'auth', 'billing', 'ai', 'worker', 'database', 'integrations'
  affected_tenants UUID[],                           -- specific company IDs, or empty for platform-wide
  description     TEXT,
  resolution      TEXT,
  reported_by     UUID REFERENCES profiles(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Periodic health snapshots per tenant
CREATE TABLE IF NOT EXISTS tenant_health_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  health_score    INT NOT NULL DEFAULT 100,          -- 0-100
  active_users    INT DEFAULT 0,
  api_calls_24h   INT DEFAULT 0,
  error_rate_24h  NUMERIC(5,4) DEFAULT 0,
  storage_bytes   BIGINT DEFAULT 0,
  ai_calls_24h    INT DEFAULT 0,
  active_modules  INT DEFAULT 0,
  alerts          JSONB DEFAULT '[]',                -- array of alert objects
  snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Runtime metrics per module (for performance monitoring)
CREATE TABLE IF NOT EXISTS module_runtime_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_code     TEXT NOT NULL,
  metric_type     TEXT NOT NULL,                     -- 'api_latency', 'error_count', 'usage_count', 'data_volume'
  metric_value    NUMERIC(16,4) NOT NULL,
  unit            TEXT DEFAULT 'ms',
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Approval Workflows
-- ─────────────────────────────────────────────────────────────────────────────

-- Workflow definitions (configurable per company/module)
CREATE TABLE IF NOT EXISTS approval_workflows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_code     TEXT NOT NULL,                     -- 'hr', 'accounting', 'crm', 'store', etc.
  trigger_event   TEXT NOT NULL,                     -- 'leave_request', 'expense_over_1000', 'invoice_create', etc.
  name            TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  auto_approve_if JSONB,                             -- conditions for auto-approval
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, module_code, trigger_event)
);

-- Steps within an approval workflow (ordered)
CREATE TABLE IF NOT EXISTS approval_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order      INT NOT NULL DEFAULT 1,
  approver_role   TEXT,                              -- role code that can approve
  approver_id     UUID REFERENCES profiles(id),      -- specific user, or NULL for role-based
  timeout_hours   INT DEFAULT 48,
  escalation_to   UUID REFERENCES profiles(id),      -- escalate if timeout
  is_required     BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Actual approval requests (instances of workflows)
CREATE TABLE IF NOT EXISTS approval_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES approval_workflows(id),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES profiles(id),
  subject_type    TEXT NOT NULL,                     -- 'leave_request', 'expense', 'invoice', etc.
  subject_id      UUID NOT NULL,                     -- reference to the entity being approved
  current_step    INT DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'approved', 'rejected', 'cancelled', 'expired'
  priority        TEXT DEFAULT 'normal',             -- 'low', 'normal', 'high', 'urgent'
  context_data    JSONB DEFAULT '{}',                -- snapshot of the submission
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual approval/rejection actions per step
CREATE TABLE IF NOT EXISTS approval_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id         UUID REFERENCES approval_steps(id),
  action          TEXT NOT NULL,                     -- 'approve', 'reject', 'comment', 'escalate', 'delegate'
  actor_id        UUID NOT NULL REFERENCES profiles(id),
  comment         TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Indexes for Performance
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pricing_rules_category ON pricing_rules(category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_pricing_quotes_company ON pricing_quotes(company_id, status);
CREATE INDEX IF NOT EXISTS idx_pricing_quote_items_quote ON pricing_quote_items(quote_id);

CREATE INDEX IF NOT EXISTS idx_integration_setup_company ON integration_setup_sessions(company_id, integration_code);
CREATE INDEX IF NOT EXISTS idx_integration_health_company ON integration_health_checks(company_id, integration_code, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_sync_company ON integration_sync_runs(company_id, integration_code, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_policy_company ON ai_policy_rules(company_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ai_reviews_company ON ai_action_reviews(company_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_threads_user ON ai_conversation_threads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_messages_thread ON ai_conversation_messages(thread_id, created_at);

CREATE INDEX IF NOT EXISTS idx_platform_incidents_status ON platform_incidents(status, severity);
CREATE INDEX IF NOT EXISTS idx_tenant_health_company ON tenant_health_snapshots(company_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_metrics_company ON module_runtime_metrics(company_id, module_code, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_company ON approval_workflows(company_id, module_code) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_approval_requests_company ON approval_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_user ON approval_requests(requested_by, status);
CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON approval_actions(request_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_setup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_runtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;

-- Pricing rules: readable by all authenticated, writable by service_role only
CREATE POLICY "pricing_rules_read" ON pricing_rules FOR SELECT TO authenticated USING (TRUE);

-- Pricing quotes: company members can read their own
CREATE POLICY "pricing_quotes_read" ON pricing_quotes FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "pricing_quotes_insert" ON pricing_quotes FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Quote items follow quote access
CREATE POLICY "pricing_quote_items_read" ON pricing_quote_items FOR SELECT TO authenticated
  USING (quote_id IN (SELECT id FROM pricing_quotes WHERE company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())));

-- Integration tables: company-scoped
CREATE POLICY "integration_setup_read" ON integration_setup_sessions FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "integration_health_read" ON integration_health_checks FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "integration_sync_read" ON integration_sync_runs FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- AI governance: company-scoped + platform-wide rules
CREATE POLICY "ai_policy_read" ON ai_policy_rules FOR SELECT TO authenticated
  USING (company_id IS NULL OR company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "ai_reviews_read" ON ai_action_reviews FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- AI conversations: user owns their threads
CREATE POLICY "ai_threads_read" ON ai_conversation_threads FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "ai_threads_insert" ON ai_conversation_threads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_messages_read" ON ai_conversation_messages FOR SELECT TO authenticated
  USING (thread_id IN (SELECT id FROM ai_conversation_threads WHERE user_id = auth.uid()));
CREATE POLICY "ai_messages_insert" ON ai_conversation_messages FOR INSERT TO authenticated
  WITH CHECK (thread_id IN (SELECT id FROM ai_conversation_threads WHERE user_id = auth.uid()));

-- Platform incidents: readable by platform admins
CREATE POLICY "platform_incidents_read" ON platform_incidents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role IN ('founder', 'platform_admin', 'platform_support')));

-- Tenant health: readable by platform admins + company GMs
CREATE POLICY "tenant_health_read" ON tenant_health_snapshots FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role IN ('founder', 'platform_admin'))
    OR company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role IN ('company_gm', 'assistant_gm'))
  );

-- Module metrics: company-scoped
CREATE POLICY "module_metrics_read" ON module_runtime_metrics FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Approval workflows: company-scoped
CREATE POLICY "approval_workflows_read" ON approval_workflows FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "approval_steps_read" ON approval_steps FOR SELECT TO authenticated
  USING (workflow_id IN (SELECT id FROM approval_workflows WHERE company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())));
CREATE POLICY "approval_requests_read" ON approval_requests FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
CREATE POLICY "approval_requests_insert" ON approval_requests FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()) AND requested_by = auth.uid());
CREATE POLICY "approval_actions_read" ON approval_actions FOR SELECT TO authenticated
  USING (request_id IN (SELECT id FROM approval_requests WHERE company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())));
CREATE POLICY "approval_actions_insert" ON approval_actions FOR INSERT TO authenticated
  WITH CHECK (request_id IN (SELECT id FROM approval_requests WHERE company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())) AND actor_id = auth.uid());

COMMIT;
