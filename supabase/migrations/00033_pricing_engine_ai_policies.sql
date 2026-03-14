-- ============================================================================
-- Migration 00033: Pricing Engine Components + AI Policy Enforcement
-- Sprint 4: T3-1 (Pricing Engine) + T4-1 (AI Policies)
-- ============================================================================
-- Adds:
--   1. pricing_components — granular cost components (base_fee, seat_tier, etc.)
--   2. pricing_rules columns — rule_type, rule_key, conditions_json, output_json, priority
--   3. billing_breakdown JSONB on company_subscriptions
--   4. ai_action_policies — per module/agent policy rules
--   5. Seed data for pricing components + AI routing + sensitive actions
-- ============================================================================

-- ─── 1. Extend pricing_rules with engine columns ────────────────────────────

ALTER TABLE pricing_rules
  ADD COLUMN IF NOT EXISTS rule_type TEXT DEFAULT 'addon',
  ADD COLUMN IF NOT EXISTS rule_key TEXT,
  ADD COLUMN IF NOT EXISTS conditions_json JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS output_json JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

-- ─── 2. pricing_components — the formula building blocks ────────────────────
-- total = base_fee + modules_fixed + seats_tier + branches_tier
--       + usage_overage + integrations_addons + ai_usage + storage_usage

CREATE TABLE IF NOT EXISTS pricing_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_code TEXT UNIQUE NOT NULL,
  component_type TEXT NOT NULL CHECK (component_type IN (
    'base_fee', 'module_fixed', 'seat_tier', 'branch_tier',
    'usage_overage', 'integration_addon', 'ai_usage', 'storage_usage'
  )),
  label_en TEXT NOT NULL,
  label_ar TEXT,
  formula_type TEXT NOT NULL DEFAULT 'flat' CHECK (formula_type IN ('flat', 'per_unit', 'tiered', 'percentage')),
  base_amount NUMERIC(12,4) DEFAULT 0,
  per_unit_amount NUMERIC(12,4) DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  tiers JSONB DEFAULT '[]',
  applies_to_plans TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pricing_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_components_read" ON pricing_components FOR SELECT
  USING (true);

CREATE POLICY "pricing_components_admin" ON pricing_components FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 3. Add billing_breakdown to company_subscriptions ──────────────────────

ALTER TABLE company_subscriptions
  ADD COLUMN IF NOT EXISTS billing_breakdown JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS external_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS dunning_stage TEXT DEFAULT 'none'
    CHECK (dunning_stage IN ('none', 'grace', 'past_due', 'restricted', 'suspended'));

-- ─── 4. ai_action_policies — unified policy for every module + agent ────────
-- Replaces scattered checks. Per company or platform-wide (company_id IS NULL).

CREATE TABLE IF NOT EXISTS ai_action_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  module_code TEXT,
  agent_type TEXT,
  action_mode TEXT NOT NULL,
  min_role_level INT NOT NULL DEFAULT 10,
  permission_tier TEXT NOT NULL DEFAULT 'suggest'
    CHECK (permission_tier IN ('auto_execute', 'suggest', 'require_approval', 'deny')),
  require_confirmation BOOLEAN DEFAULT false,
  budget_limit_daily NUMERIC(10,2),
  budget_limit_monthly NUMERIC(10,2),
  max_tokens_per_call INT,
  preferred_model TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_action_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_action_policies_service" ON ai_action_policies FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "ai_action_policies_read" ON ai_action_policies FOR SELECT
  USING (company_id IS NULL OR EXISTS (
    SELECT 1 FROM company_members cm WHERE cm.company_id = ai_action_policies.company_id AND cm.user_id = auth.uid()
  ));

-- ─── 5. Seed base plan pricing rules ────────────────────────────────────────

INSERT INTO pricing_rules (code, label_en, label_ar, rule_type, rule_key, priority, conditions_json, output_json, is_active, currency)
VALUES
  ('base_starter', 'Starter Plan', 'باقة المبتدئين', 'base_plan', 'starter', 100,
   '{"min_employees":1,"max_employees":5}',
   '{"plan_code":"starter","plan_name":"Starter","price_monthly":99,"price_yearly":999,"included_seats":5,"included_modules":["hr","accounting","crm","chat"],"currency":"AED"}',
   true, 'AED'),
  ('base_business', 'Business Plan', 'باقة الأعمال', 'base_plan', 'business', 90,
   '{"min_employees":6,"max_employees":25}',
   '{"plan_code":"business","plan_name":"Business","price_monthly":299,"price_yearly":2990,"included_seats":25,"included_modules":["hr","accounting","crm","projects","chat","meetings","documents"],"currency":"AED"}',
   true, 'AED'),
  ('base_enterprise', 'Enterprise Plan', 'باقة المؤسسات', 'base_plan', 'enterprise', 80,
   '{"min_employees":26}',
   '{"plan_code":"enterprise","plan_name":"Enterprise","price_monthly":799,"price_yearly":7990,"included_seats":999999,"included_modules":["hr","accounting","crm","projects","chat","meetings","documents","store","logistics"],"currency":"AED"}',
   true, 'AED'),

  -- Module add-ons
  ('mod_store', 'Store Module', 'وحدة المتجر', 'module_addon', 'module_store', 50,
   '{"module_code":"store"}', '{"price_monthly":49,"price_yearly":490}', true, 'AED'),
  ('mod_logistics', 'Logistics Module', 'وحدة اللوجستيات', 'module_addon', 'module_logistics', 50,
   '{"module_code":"logistics"}', '{"price_monthly":59,"price_yearly":590}', true, 'AED'),
  ('mod_meetings', 'Meetings Module', 'وحدة الاجتماعات', 'module_addon', 'module_meetings', 50,
   '{"module_code":"meetings"}', '{"price_monthly":29,"price_yearly":290}', true, 'AED'),
  ('mod_projects', 'Projects Module', 'وحدة المشاريع', 'module_addon', 'module_projects', 50,
   '{"module_code":"projects"}', '{"price_monthly":39,"price_yearly":390}', true, 'AED'),
  ('mod_documents', 'Documents Module', 'وحدة المستندات', 'module_addon', 'module_documents', 50,
   '{"module_code":"documents"}', '{"price_monthly":19,"price_yearly":190}', true, 'AED'),

  -- Seat overage
  ('seat_overage', 'Extra Seat', 'مقعد إضافي', 'seat_overage', 'seat_overage_default', 40,
   '{}', '{"price_per_seat":15,"currency":"AED"}', true, 'AED'),

  -- Yearly billing discount
  ('yearly_discount', 'Yearly Billing Discount', 'خصم الدفع السنوي', 'discount', 'yearly_auto', 30,
   '{"billing_cycle":"yearly"}', '{"type":"percentage","value":17}', true, 'AED')
ON CONFLICT (code) DO NOTHING;

-- ─── 6. Seed pricing components (formula building blocks) ───────────────────

INSERT INTO pricing_components (component_code, component_type, label_en, label_ar, formula_type, base_amount, per_unit_amount, tiers, applies_to_plans, sort_order)
VALUES
  ('base_fee', 'base_fee', 'Platform Base Fee', 'رسوم المنصة الأساسية', 'flat', 0, 0, '[]', '{starter,business,enterprise}', 1),
  ('seat_tier', 'seat_tier', 'Per-Seat Pricing', 'تسعير حسب المقاعد', 'tiered', 0, 15,
   '[{"from":1,"to":5,"price":0},{"from":6,"to":25,"price":15},{"from":26,"to":100,"price":12},{"from":101,"to":null,"price":10}]',
   '{starter,business,enterprise}', 2),
  ('branch_tier', 'branch_tier', 'Per-Branch Pricing', 'تسعير حسب الفروع', 'tiered', 0, 50,
   '[{"from":1,"to":1,"price":0},{"from":2,"to":5,"price":50},{"from":6,"to":null,"price":40}]',
   '{business,enterprise}', 3),
  ('ai_usage', 'ai_usage', 'AI Token Usage', 'استخدام الذكاء الاصطناعي', 'per_unit', 0, 0.002, '[]', '{starter,business,enterprise}', 4),
  ('storage_usage', 'storage_usage', 'Storage Overage', 'تجاوز التخزين', 'per_unit', 0, 0.50, '[]', '{starter,business,enterprise}', 5)
ON CONFLICT (component_code) DO NOTHING;

-- ─── 7. Seed AI model routing rules ─────────────────────────────────────────

INSERT INTO ai_model_routing_rules (agent_type, mode, model_name, priority, conditions, is_active)
VALUES
  -- Default: gpt-4o-mini for most agents
  ('*', '*', 'gpt-4o-mini', 0, '{}', true),
  -- Senate gets gpt-4o
  ('senate', '*', 'gpt-4o', 10, '{}', true),
  -- File generation gets gpt-4o
  ('*', 'generate_file', 'gpt-4o', 10, '{}', true),
  -- Vision tasks get gpt-4o
  ('*', 'read_file', 'gpt-4o', 10, '{}', true),
  -- Image generation gets dall-e-3
  ('*', 'generate_image', 'dall-e-3', 10, '{}', true),
  -- Founder agent gets gpt-4o (high importance)
  ('founder', '*', 'gpt-4o', 5, '{}', true),
  ('cfo', '*', 'gpt-4o', 5, '{}', true),
  ('cto', '*', 'gpt-4o', 5, '{}', true),
  ('director', '*', 'gpt-4o', 5, '{}', true)
ON CONFLICT DO NOTHING;

-- ─── 8. Seed AI sensitive action registry ───────────────────────────────────

INSERT INTO ai_sensitive_action_registry (action_code, description, risk_level, requires_approval, approval_roles)
VALUES
  ('delete', 'Delete records', 'high', true, ARRAY['company_gm','founder']),
  ('transfer', 'Transfer ownership or assets', 'critical', true, ARRAY['company_gm','founder']),
  ('payroll_run', 'Execute payroll', 'high', true, ARRAY['company_gm','hr_manager','founder']),
  ('terminate', 'Terminate employee', 'critical', true, ARRAY['company_gm','hr_manager','founder']),
  ('approve', 'Approve financial operation', 'high', true, ARRAY['company_gm','cfo','founder']),
  ('export_data', 'Bulk data export', 'medium', false, ARRAY['company_gm','founder']),
  ('modify_permissions', 'Change user permissions', 'high', true, ARRAY['company_gm','founder']),
  ('billing_change', 'Change subscription or billing', 'high', true, ARRAY['company_gm','founder'])
ON CONFLICT (action_code) DO NOTHING;

-- ─── 9. Seed platform-wide AI action policies ──────────────────────────────

INSERT INTO ai_action_policies (company_id, module_code, agent_type, action_mode, min_role_level, permission_tier, require_confirmation, budget_limit_daily, budget_limit_monthly, preferred_model)
VALUES
  -- Platform-wide defaults
  (NULL, NULL, '*', 'help', 10, 'auto_execute', false, NULL, NULL, 'gpt-4o-mini'),
  (NULL, NULL, '*', 'analyze', 35, 'auto_execute', false, NULL, NULL, 'gpt-4o-mini'),
  (NULL, NULL, '*', 'report', 45, 'auto_execute', false, NULL, NULL, 'gpt-4o-mini'),
  (NULL, NULL, '*', 'act', 55, 'suggest', false, NULL, NULL, 'gpt-4o-mini'),
  (NULL, NULL, '*', 'approve', 65, 'require_approval', true, NULL, NULL, 'gpt-4o'),
  (NULL, NULL, '*', 'delete', 85, 'require_approval', true, NULL, NULL, 'gpt-4o'),
  (NULL, NULL, '*', 'transfer', 85, 'require_approval', true, NULL, NULL, 'gpt-4o'),
  (NULL, NULL, '*', 'payroll_run', 85, 'require_approval', true, NULL, NULL, 'gpt-4o'),
  (NULL, NULL, '*', 'terminate', 85, 'require_approval', true, NULL, NULL, 'gpt-4o'),
  -- Senate gets gpt-4o exclusively
  (NULL, NULL, 'senate', '*', 85, 'auto_execute', false, 50.00, 500.00, 'gpt-4o')
ON CONFLICT DO NOTHING;

-- ─── 10. Usage metering function ────────────────────────────────────────────
-- Called by worker cron or after each billable action.
-- Upserts the current period's counter atomically.

CREATE OR REPLACE FUNCTION meter_usage(
  _company_id UUID,
  _counter_type TEXT,
  _amount NUMERIC DEFAULT 1
) RETURNS VOID AS $$
DECLARE
  _period_start DATE;
  _period_end DATE;
BEGIN
  _period_start := date_trunc('month', CURRENT_DATE)::DATE;
  _period_end := (_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  INSERT INTO subscription_usage_counters (company_id, counter_type, current_value, period_start, period_end)
  VALUES (_company_id, _counter_type, _amount, _period_start, _period_end)
  ON CONFLICT (company_id, counter_type, period_start)
  DO UPDATE SET
    current_value = subscription_usage_counters.current_value + _amount,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── 11. AI budget check function ──────────────────────────────────────────
-- Returns whether a company is within its AI budget for the day/month.

CREATE OR REPLACE FUNCTION check_ai_budget(
  _company_id UUID
) RETURNS JSONB AS $$
DECLARE
  _budget RECORD;
  _daily_usage INT;
  _monthly_usage INT;
  _result JSONB;
BEGIN
  SELECT * INTO _budget FROM ai_budget_policies WHERE company_id = _company_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'no_budget_policy');
  END IF;

  -- Count today's AI calls
  SELECT COALESCE(COUNT(*), 0) INTO _daily_usage
  FROM ai_usage_logs
  WHERE company_id = _company_id
    AND created_at >= CURRENT_DATE;

  -- Count this month's AI calls
  SELECT COALESCE(COUNT(*), 0) INTO _monthly_usage
  FROM ai_usage_logs
  WHERE company_id = _company_id
    AND created_at >= date_trunc('month', CURRENT_DATE);

  IF _budget.daily_limit IS NOT NULL AND _daily_usage >= _budget.daily_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_limit_exceeded',
      'daily_used', _daily_usage, 'daily_limit', _budget.daily_limit);
  END IF;

  IF _budget.monthly_limit IS NOT NULL AND _monthly_usage >= _budget.monthly_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'monthly_limit_exceeded',
      'monthly_used', _monthly_usage, 'monthly_limit', _budget.monthly_limit);
  END IF;

  RETURN jsonb_build_object('allowed', true,
    'daily_used', _daily_usage, 'daily_limit', COALESCE(_budget.daily_limit, -1),
    'monthly_used', _monthly_usage, 'monthly_limit', COALESCE(_budget.monthly_limit, -1),
    'alert', (_budget.alert_threshold IS NOT NULL AND
              _monthly_usage::NUMERIC / GREATEST(_budget.monthly_limit, 1)::NUMERIC >= _budget.alert_threshold));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── 12. Model routing lookup function ──────────────────────────────────────

CREATE OR REPLACE FUNCTION resolve_ai_model(
  _agent_type TEXT,
  _mode TEXT DEFAULT '*'
) RETURNS TEXT AS $$
DECLARE
  _model TEXT;
BEGIN
  -- Try exact match first, then wildcard agent, then wildcard mode, then default
  SELECT model_name INTO _model
  FROM ai_model_routing_rules
  WHERE is_active = true
    AND (agent_type = _agent_type OR agent_type = '*')
    AND (mode = _mode OR mode = '*')
  ORDER BY
    CASE WHEN agent_type = _agent_type AND mode = _mode THEN 0
         WHEN agent_type = _agent_type AND mode = '*' THEN 1
         WHEN agent_type = '*' AND mode = _mode THEN 2
         ELSE 3 END,
    priority DESC
  LIMIT 1;

  RETURN COALESCE(_model, 'gpt-4o-mini');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
