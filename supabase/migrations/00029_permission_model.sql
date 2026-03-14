-- ============================================================================
-- 00029_permission_model.sql
-- Granular Permission System (T0-1 from TASKS_TODO.md)
-- Adds code-based permissions alongside existing numeric role levels.
-- ============================================================================

BEGIN;

-- ─── 1. permissions table (seed data — immutable catalog) ───────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code        text UNIQUE NOT NULL,          -- e.g. 'hr.read', 'accounting.write'
  module      text NOT NULL,                 -- e.g. 'hr', 'accounting', 'platform'
  description text,
  created_at  timestamptz DEFAULT now()
);

-- ─── 2. role_permissions (which roles get which permissions by default) ──────
CREATE TABLE IF NOT EXISTS role_permissions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code     text NOT NULL,               -- matches company_members.role_code
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE (role_code, permission_id)
);

-- ─── 3. user_permission_overrides (per-user grants/revokes per company) ─────
CREATE TABLE IF NOT EXISTS user_permission_overrides (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted       boolean NOT NULL DEFAULT true,  -- true = grant, false = revoke
  granted_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, company_id, permission_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role     ON role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_user_perm_override_lookup ON user_permission_overrides(user_id, company_id);

-- ─── 4. Seed permission codes ───────────────────────────────────────────────
INSERT INTO permissions (code, module, description) VALUES
  -- Dashboard
  ('dashboard.read',        'dashboard',     'View company dashboard'),
  ('dashboard.write',       'dashboard',     'Edit dashboard widgets & settings'),
  -- HR
  ('hr.read',               'hr',            'View HR records'),
  ('hr.write',              'hr',            'Create/edit HR records'),
  ('hr.approve',            'hr',            'Approve HR requests'),
  ('hr.terminate',          'hr',            'Terminate employees'),
  -- Accounting
  ('accounting.read',       'accounting',    'View accounting data'),
  ('accounting.write',      'accounting',    'Create/edit transactions'),
  ('accounting.approve',    'accounting',    'Approve financial operations'),
  ('accounting.payroll',    'accounting',    'Run payroll'),
  -- CRM
  ('crm.read',             'crm',           'View CRM contacts & deals'),
  ('crm.write',            'crm',           'Create/edit CRM records'),
  -- Projects
  ('projects.read',        'projects',      'View projects & tasks'),
  ('projects.write',       'projects',      'Create/edit projects & tasks'),
  -- Logistics
  ('logistics.read',       'logistics',     'View fleet & logistics'),
  ('logistics.write',      'logistics',     'Manage fleet & logistics'),
  -- Store
  ('store.read',           'store',         'View store products & orders'),
  ('store.write',          'store',         'Manage store products & orders'),
  -- Chat
  ('chat.read',            'chat',          'Read chat messages'),
  ('chat.write',           'chat',          'Send chat messages'),
  -- Meetings
  ('meetings.read',        'meetings',      'View meetings'),
  ('meetings.write',       'meetings',      'Create/manage meetings'),
  -- RARE AI
  ('rare.read',            'rare',          'Use AI read-only agents'),
  ('rare.write',           'rare',          'Use AI action agents'),
  ('rare.senate',          'rare',          'Access RARE Senate'),
  -- Integrations
  ('integrations.read',    'integrations',  'View integrations'),
  ('integrations.write',   'integrations',  'Manage integrations'),
  -- Billing
  ('billing.read',         'billing',       'View billing & invoices'),
  ('billing.write',        'billing',       'Manage subscriptions & payments'),
  -- Marketing
  ('marketing.read',       'marketing',     'View campaigns'),
  ('marketing.write',      'marketing',     'Manage campaigns'),
  -- Academy
  ('academy.read',         'academy',       'View academy content'),
  ('academy.write',        'academy',       'Manage academy content'),
  -- Portal Builder
  ('portal.read',          'portal_builder','View portal configuration'),
  ('portal.write',         'portal_builder','Edit portal builder'),
  -- Voice
  ('voice.read',           'voice',         'View voice recordings'),
  ('voice.write',          'voice',         'Manage voice system'),
  -- Platform Admin
  ('platform.admin',       'platform',      'Platform administration'),
  ('platform.provision',   'platform',      'Provision new companies'),
  ('platform.support',     'platform',      'Platform support operations'),
  -- Members
  ('members.read',         'members',       'View company members'),
  ('members.write',        'members',       'Invite / manage members'),
  ('members.roles',        'members',       'Change member roles')
ON CONFLICT (code) DO NOTHING;

-- ─── 5. Seed role → permission mappings ─────────────────────────────────────
-- Helper: assigns a list of permission codes to a role
DO $$
DECLARE
  _perm_id uuid;
BEGIN
  -- ── founder: everything ─────────────────────────────────────────────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'founder', id FROM permissions
  ON CONFLICT DO NOTHING;

  -- ── platform_admin: everything ──────────────────────────────────────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'platform_admin', id FROM permissions
  ON CONFLICT DO NOTHING;

  -- ── platform_support: read-all + platform.support ───────────────────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'platform_support', id FROM permissions
  WHERE code LIKE '%.read' OR code = 'platform.support'
  ON CONFLICT DO NOTHING;

  -- ── company_gm: all company permissions (no platform.*) ────────────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'company_gm', id FROM permissions
  WHERE module != 'platform'
  ON CONFLICT DO NOTHING;

  -- ── assistant_gm: all company perms except terminate/payroll/billing.write/portal.write
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'assistant_gm', id FROM permissions
  WHERE module != 'platform'
    AND code NOT IN ('hr.terminate','accounting.payroll','billing.write','portal.write')
  ON CONFLICT DO NOTHING;

  -- ── executive_secretary: read-all + most writes except sensitive ────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'executive_secretary', id FROM permissions
  WHERE module != 'platform'
    AND code NOT IN ('hr.terminate','accounting.payroll','accounting.approve',
                     'billing.write','portal.write','members.roles',
                     'rare.senate','voice.write')
  ON CONFLICT DO NOTHING;

  -- ── department_manager: read-all + write own modules + approve ─────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'department_manager', id FROM permissions
  WHERE code IN (
    'dashboard.read','hr.read','hr.write','hr.approve',
    'accounting.read','crm.read','crm.write',
    'projects.read','projects.write','logistics.read',
    'store.read','chat.read','chat.write','meetings.read','meetings.write',
    'rare.read','integrations.read','billing.read',
    'marketing.read','academy.read','academy.write',
    'members.read','voice.read'
  )
  ON CONFLICT DO NOTHING;

  -- ── hr_officer: HR full + read others ──────────────────────────────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'hr_officer', id FROM permissions
  WHERE code IN (
    'dashboard.read','hr.read','hr.write','hr.approve',
    'accounting.read','crm.read','projects.read','logistics.read',
    'store.read','chat.read','chat.write','meetings.read','meetings.write',
    'rare.read','academy.read','members.read','voice.read'
  )
  ON CONFLICT DO NOTHING;

  -- ── accountant: accounting full + read others ──────────────────────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'accountant', id FROM permissions
  WHERE code IN (
    'dashboard.read','hr.read','accounting.read','accounting.write','accounting.approve',
    'crm.read','projects.read','logistics.read','store.read',
    'chat.read','chat.write','meetings.read','meetings.write',
    'rare.read','billing.read','academy.read','members.read','voice.read'
  )
  ON CONFLICT DO NOTHING;

  -- ── supervisor: team reads + limited writes ────────────────────────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'supervisor', id FROM permissions
  WHERE code IN (
    'dashboard.read','hr.read','crm.read','crm.write',
    'projects.read','projects.write','logistics.read','logistics.write',
    'store.read','chat.read','chat.write','meetings.read','meetings.write',
    'rare.read','academy.read','members.read','voice.read'
  )
  ON CONFLICT DO NOTHING;

  -- ── senior_employee / sales_rep: module reads + own contributions ──────
  FOR _perm_id IN SELECT id FROM permissions WHERE code IN (
    'dashboard.read','projects.read','projects.write','crm.read','crm.write',
    'store.read','chat.read','chat.write','meetings.read','meetings.write',
    'rare.read','academy.read'
  ) LOOP
    INSERT INTO role_permissions (role_code, permission_id)
    VALUES ('senior_employee', _perm_id), ('sales_rep', _perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ── employee: basic reads + chat ───────────────────────────────────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'employee', id FROM permissions
  WHERE code IN (
    'dashboard.read','projects.read','chat.read','chat.write',
    'meetings.read','academy.read'
  )
  ON CONFLICT DO NOTHING;

  -- ── field_employee / driver: minimal ───────────────────────────────────
  FOR _perm_id IN SELECT id FROM permissions WHERE code IN (
    'dashboard.read','logistics.read','chat.read','chat.write','academy.read'
  ) LOOP
    INSERT INTO role_permissions (role_code, permission_id)
    VALUES ('field_employee', _perm_id), ('driver', _perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ── new_hire / trainee: dashboard + chat + academy ─────────────────────
  FOR _perm_id IN SELECT id FROM permissions WHERE code IN (
    'dashboard.read','chat.read','chat.write','academy.read'
  ) LOOP
    INSERT INTO role_permissions (role_code, permission_id)
    VALUES ('new_hire', _perm_id), ('trainee', _perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ── client_user: dashboard.read only ───────────────────────────────────
  INSERT INTO role_permissions (role_code, permission_id)
  SELECT 'client_user', id FROM permissions WHERE code = 'dashboard.read'
  ON CONFLICT DO NOTHING;

END $$;

-- ─── 6. DB function: has_permission ─────────────────────────────────────────
-- Checks role defaults + user overrides. Used by RLS and worker.
CREATE OR REPLACE FUNCTION has_permission(
  _user_id   uuid,
  _company_id uuid,
  _perm_code text
) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if permission is granted via role defaults
    SELECT 1
    FROM company_members cm
    JOIN role_permissions rp ON rp.role_code = cm.role_code
    JOIN permissions p       ON p.id = rp.permission_id
    WHERE cm.user_id    = _user_id
      AND cm.company_id = _company_id
      AND cm.status     = 'active'
      AND p.code        = _perm_code
    -- ... and not explicitly revoked
    AND NOT EXISTS (
      SELECT 1 FROM user_permission_overrides upo
      WHERE upo.user_id       = _user_id
        AND upo.company_id    = _company_id
        AND upo.permission_id = p.id
        AND upo.granted       = false
    )
  )
  OR EXISTS (
    -- Check for explicit user-level grant
    SELECT 1
    FROM user_permission_overrides upo
    JOIN permissions p ON p.id = upo.permission_id
    WHERE upo.user_id    = _user_id
      AND upo.company_id = _company_id
      AND upo.granted    = true
      AND p.code         = _perm_code
  );
$$;

-- ─── 7. DB function: user_effective_permissions ─────────────────────────────
-- Returns all permission codes a user has in a company.
CREATE OR REPLACE FUNCTION user_effective_permissions(
  _user_id    uuid,
  _company_id uuid
) RETURNS TABLE(code text)
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  -- Role-based permissions minus explicit revokes
  SELECT p.code
  FROM company_members cm
  JOIN role_permissions rp ON rp.role_code = cm.role_code
  JOIN permissions p       ON p.id = rp.permission_id
  WHERE cm.user_id    = _user_id
    AND cm.company_id = _company_id
    AND cm.status     = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM user_permission_overrides upo
      WHERE upo.user_id       = _user_id
        AND upo.company_id    = _company_id
        AND upo.permission_id = p.id
        AND upo.granted       = false
    )
  UNION
  -- Explicit grants
  SELECT p.code
  FROM user_permission_overrides upo
  JOIN permissions p ON p.id = upo.permission_id
  WHERE upo.user_id    = _user_id
    AND upo.company_id = _company_id
    AND upo.granted    = true;
$$;

-- ─── 8. RLS on new tables ──────────────────────────────────────────────────
ALTER TABLE permissions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_overrides  ENABLE ROW LEVEL SECURITY;

-- permissions: public read (seed data)
CREATE POLICY "Anyone can read permissions catalog"
  ON permissions FOR SELECT
  USING (true);

-- role_permissions: public read
CREATE POLICY "Anyone can read role permissions"
  ON role_permissions FOR SELECT
  USING (true);

-- user_permission_overrides: users see own, admins see company
CREATE POLICY "Users see own overrides"
  ON user_permission_overrides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Company admins manage overrides"
  ON user_permission_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.user_id    = auth.uid()
        AND cm.company_id = user_permission_overrides.company_id
        AND cm.status     = 'active'
        AND cm.role_code  IN ('founder','platform_admin','company_gm','assistant_gm')
    )
  );

COMMIT;
