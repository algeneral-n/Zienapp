-- ZIEN Platform - Migration: RLS Hardening + Store Schema + Invitations
-- Run after supabase_schema.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: MISSING RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- platform_roles: Only founders and the user themselves can see
ALTER TABLE platform_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own platform role" ON platform_roles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Founders can manage all platform roles" ON platform_roles
  FOR ALL USING (is_founder());

-- modules_catalog: Readable by all authenticated, writable by founder only
ALTER TABLE modules_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read modules catalog" ON modules_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Founders can manage modules catalog" ON modules_catalog
  FOR ALL USING (is_founder());

-- company_types: Readable by all authenticated, writable by founder only
ALTER TABLE company_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read company types" ON company_types
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Founders can manage company types" ON company_types
  FOR ALL USING (is_founder());

-- company_type_template_modules: Readable by all authenticated, writable by founder
ALTER TABLE company_type_template_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read template modules" ON company_type_template_modules
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Founders can manage template modules" ON company_type_template_modules
  FOR ALL USING (is_founder());

-- company_members: Members can see their company's members, founders see all
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can see their company members" ON company_members
  FOR SELECT USING (
    company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid() AND cm.status = 'active')
    OR is_founder()
  );
CREATE POLICY "Company GMs can manage members" ON company_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.user_id = auth.uid()
        AND cm.role_code IN ('company_gm', 'executive_secretary')
        AND cm.status = 'active'
    )
    OR is_founder()
  );

-- departments: Members can see, GMs can manage
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can see their company departments" ON departments
  FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "GMs can manage departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = departments.company_id
        AND cm.user_id = auth.uid()
        AND cm.role_code IN ('company_gm', 'executive_secretary')
        AND cm.status = 'active'
    )
    OR is_founder()
  );

-- subscription_plans: Readable by all authenticated, writable by founder
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read plans" ON subscription_plans
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Founders can manage plans" ON subscription_plans
  FOR ALL USING (is_founder());

-- tenant_subscriptions: Members can see their own, founders see all
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can see their subscription" ON tenant_subscriptions
  FOR SELECT USING (is_company_member(company_id) OR is_founder());
CREATE POLICY "Founders can manage subscriptions" ON tenant_subscriptions
  FOR ALL USING (is_founder());

-- companies: Add INSERT/UPDATE policies (only SELECT exists)
CREATE POLICY "Owner or founder can update company" ON companies
  FOR UPDATE USING (owner_user_id = auth.uid() OR is_founder());
CREATE POLICY "Founders can insert companies" ON companies
  FOR INSERT WITH CHECK (is_founder() OR owner_user_id = auth.uid());

-- ai_usage_logs: Missing policy (RLS already enabled)
CREATE POLICY "Members can see their company AI usage" ON ai_usage_logs
  FOR SELECT USING (is_company_member(company_id) OR is_founder());
CREATE POLICY "Members can insert AI usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (is_company_member(company_id));

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: COMPANY INVITATIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS company_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    invited_name TEXT,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    invited_by UUID,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company admins can manage invitations" ON company_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_invitations.company_id
        AND cm.user_id = auth.uid()
        AND cm.role_code IN ('company_gm', 'executive_secretary')
        AND cm.status = 'active'
    )
    OR is_founder()
  );
CREATE POLICY "Anyone can validate their invitation by token" ON company_invitations
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3: CONTACT SUBMISSIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact form" ON contact_submissions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Founders can read contact submissions" ON contact_submissions
  FOR SELECT USING (is_founder());

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 4: MARKETING & PLATFORM TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    target_audience TEXT DEFAULT 'all',
    channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'in_app', 'sms', 'push')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipients_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founders can manage marketing campaigns" ON marketing_campaigns
  FOR ALL USING (is_founder());

CREATE TABLE IF NOT EXISTS platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'maintenance')),
    target TEXT DEFAULT 'all' CHECK (target IN ('all', 'founders', 'admins', 'tenants')),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read active announcements" ON platform_announcements
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "Founders can manage announcements" ON platform_announcements
  FOR ALL USING (is_founder());

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 5: INTEGRATIONS TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS integrations_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('payment', 'communication', 'storage', 'maps', 'ai', 'analytics', 'crm', 'accounting')),
    icon_url TEXT,
    price_monthly NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    config_schema JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE integrations_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read integrations catalog" ON integrations_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Founders can manage integrations catalog" ON integrations_catalog
  FOR ALL USING (is_founder());

CREATE TABLE IF NOT EXISTS tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations_catalog(id),
    status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
    config JSONB DEFAULT '{}',
    connected_by UUID,
    connected_at TIMESTAMPTZ DEFAULT now(),
    last_health_check TIMESTAMPTZ,
    health_status TEXT DEFAULT 'unknown',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, integration_id)
);

ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can see their company integrations" ON tenant_integrations
  FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can manage their company integrations" ON tenant_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = tenant_integrations.company_id
        AND cm.user_id = auth.uid()
        AND cm.role_code IN ('company_gm', 'executive_secretary', 'department_manager')
        AND cm.status = 'active'
    )
    OR is_founder()
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 6: E-COMMERCE / STORE TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, slug)
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage their company product categories" ON product_categories
  FOR ALL USING (is_company_member(company_id));

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    barcode TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'piece',
    images JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'out_of_stock')),
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage their company products" ON products
  FOR ALL USING (is_company_member(company_id));

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'return')),
    quantity INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage their company inventory" ON inventory_movements
  FOR ALL USING (is_company_member(company_id));

CREATE TABLE IF NOT EXISTS store_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    notes TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE store_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage their company store customers" ON store_customers
  FOR ALL USING (is_company_member(company_id));

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES store_customers(id),
    order_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    subtotal NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'refunded')),
    notes TEXT,
    shipping_address TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage their company orders" ON orders
  FOR ALL USING (is_company_member(company_id));

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage order items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND is_company_member(orders.company_id))
  );

CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    store_name TEXT,
    currency TEXT DEFAULT 'AED',
    tax_rate NUMERIC DEFAULT 5,
    low_stock_threshold INTEGER DEFAULT 10,
    auto_confirm_orders BOOLEAN DEFAULT false,
    receipt_header TEXT,
    receipt_footer TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage their store settings" ON store_settings
  FOR ALL USING (is_company_member(company_id));

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 7: HELP & SUPPORT TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read help articles" ON help_articles
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);
CREATE POLICY "Founders can manage help articles" ON help_articles
  FOR ALL USING (is_founder());

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    submitted_by UUID,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage their company support tickets" ON support_tickets
  FOR ALL USING (is_company_member(company_id) OR is_founder());

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 8: ACADEMY TABLES (for AcademyPage)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS academy_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    track TEXT NOT NULL,
    description TEXT,
    lessons INTEGER DEFAULT 0,
    students INTEGER DEFAULT 0,
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    icon TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published courses" ON academy_courses
  FOR SELECT USING (is_published = true);
CREATE POLICY "Founders can manage courses" ON academy_courses
  FOR ALL USING (is_founder());

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: Default integrations catalog
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO integrations_catalog (code, name, description, category, price_monthly) VALUES
  ('stripe', 'Stripe', 'Online payment processing', 'payment', 49),
  ('network_intl', 'Network International', 'UAE card payment processing', 'payment', 79),
  ('vonage', 'Vonage', 'SMS and voice communication', 'communication', 29),
  ('biz44', 'Biz44', 'Business communication suite', 'communication', 19),
  ('google_maps', 'Google Maps', 'Maps, geocoding, and directions', 'maps', 39),
  ('cloudflare_r2', 'Cloudflare R2', 'Object storage for files and media', 'storage', 9),
  ('gemini_ai', 'Google Gemini AI', 'Advanced AI assistant and analysis', 'ai', 59),
  ('turnstile', 'Cloudflare Turnstile', 'Bot protection and CAPTCHA', 'analytics', 0),
  ('firebase_fcm', 'Firebase Cloud Messaging', 'Push notifications', 'communication', 0),
  ('supabase_realtime', 'Supabase Realtime', 'Real-time subscriptions and presence', 'communication', 0)
ON CONFLICT (code) DO NOTHING;
