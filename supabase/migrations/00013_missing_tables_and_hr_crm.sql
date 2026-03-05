-- ─────────────────────────────────────────────────────────────────────
-- Migration 00013: Fix missing tables + add HR/CRM operational tables
-- Fills gaps found in module audit:
--   1. general_ledger (referenced by accounting worker, never created)
--   2. cost_centers (referenced by accounting worker, never created)
--   3. employee_shifts (scheduling)
--   4. employee_goals (performance)
--   5. crm_activities (contact activity log)
--   6. deal_stages (CRM pipeline)
-- ─────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════
-- 1. GENERAL LEDGER (missing — accounting worker queries this)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS general_ledger (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  entry_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  description  TEXT,
  debit        NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit       NUMERIC(18,2) NOT NULL DEFAULT 0,
  balance      NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'AED',
  cost_center_id UUID,
  reference_type TEXT,
  reference_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_general_ledger_company
  ON general_ledger(company_id);
CREATE INDEX IF NOT EXISTS idx_general_ledger_account
  ON general_ledger(company_id, account_code);
CREATE INDEX IF NOT EXISTS idx_general_ledger_date
  ON general_ledger(company_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_general_ledger_journal
  ON general_ledger(journal_entry_id);

ALTER TABLE general_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY general_ledger_tenant_isolation ON general_ledger
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 2. COST CENTERS (missing — accounting worker queries this)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cost_centers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES cost_centers(id),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  budget      NUMERIC(18,2),
  currency    TEXT DEFAULT 'AED',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_company
  ON cost_centers(company_id);

ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cost_centers_tenant_isolation ON cost_centers
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

-- Add FK from general_ledger to cost_centers
ALTER TABLE general_ledger
  ADD CONSTRAINT fk_general_ledger_cost_center
  FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
  ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. EMPLOYEE SHIFTS (HR scheduling)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS employee_shifts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_date   DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  break_minutes INT DEFAULT 0,
  shift_type   TEXT DEFAULT 'regular', -- regular, overtime, holiday
  status       TEXT DEFAULT 'scheduled', -- scheduled, completed, missed, cancelled
  notes        TEXT,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_shifts_company
  ON employee_shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee_date
  ON employee_shifts(employee_id, shift_date);

ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY employee_shifts_tenant_isolation ON employee_shifts
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 4. EMPLOYEE GOALS (HR performance)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS employee_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  target_value NUMERIC(18,2),
  current_value NUMERIC(18,2) DEFAULT 0,
  unit         TEXT, -- percentage, count, currency
  due_date     DATE,
  status       TEXT DEFAULT 'in_progress', -- in_progress, completed, overdue, cancelled
  category     TEXT, -- performance, development, project
  reviewer_id  UUID REFERENCES profiles(id),
  review_notes TEXT,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_goals_company
  ON employee_goals(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_goals_employee
  ON employee_goals(employee_id);

ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY employee_goals_tenant_isolation ON employee_goals
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 5. CRM ACTIVITIES (contact activity log)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS crm_activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  lead_id      UUID REFERENCES leads(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL, -- call, email, meeting, note, task, follow_up
  subject      TEXT NOT NULL,
  description  TEXT,
  due_date     TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status       TEXT DEFAULT 'pending', -- pending, completed, cancelled
  assigned_to  UUID REFERENCES profiles(id),
  created_by   UUID NOT NULL REFERENCES profiles(id),
  metadata_json JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_company
  ON crm_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_client
  ON crm_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead
  ON crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_assigned
  ON crm_activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_activities_due
  ON crm_activities(company_id, due_date) WHERE status = 'pending';

ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_activities_tenant_isolation ON crm_activities
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 6. DEAL STAGES (CRM pipeline configuration)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS deal_stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  name_ar     TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  color       TEXT DEFAULT '#3B82F6',
  probability NUMERIC(5,2) DEFAULT 0, -- win probability %
  is_won      BOOLEAN DEFAULT false,
  is_lost     BOOLEAN DEFAULT false,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_deal_stages_company
  ON deal_stages(company_id);

ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY deal_stages_tenant_isolation ON deal_stages
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

-- Add stage_id FK to opportunities table
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES deal_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_stage
  ON opportunities(stage_id);
