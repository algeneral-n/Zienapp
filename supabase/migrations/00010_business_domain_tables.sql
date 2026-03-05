-- ============================================================================
-- ZIEN Platform - Business Domain Tables (Full Coverage)
-- Migration: 00010_business_domain_tables.sql
-- Date: 2026-02-25
-- Description: All missing business-domain tables required by the
--              ZIEN Master Blueprint and Platform Constitution.
--              Covers: Accounting (CoA, journals, advances), HR advanced
--              (documents, benefits, insurance, recruitment, training),
--              CRM (leads, opportunities, receipts, client portal),
--              Projects (members, tasks, comments, work logs),
--              Logistics (drivers, routes, shipments, GPS),
--              Store/POS/Inventory, Chat channels, Meetings advanced,
--              AI agent actions, Security events, Pricing add-ons,
--              Billing events.
-- ============================================================================

-- =========================================================
-- A. ACCOUNTING & FINANCE (extended)
-- =========================================================

-- A1. Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN (
        'asset', 'liability', 'equity', 'revenue', 'expense'
    )),
    is_leaf BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    currency_code TEXT DEFAULT 'AED',
    opening_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, code)
);

-- A2. Journal Entries (header)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_number TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference_type TEXT,     -- invoice, payment, payroll, manual, etc.
    reference_id UUID,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
    posted_by UUID REFERENCES auth.users(id),
    posted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, entry_number)
);

-- A3. Journal Lines (debit / credit rows)
CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    debit NUMERIC DEFAULT 0 CHECK (debit >= 0),
    credit NUMERIC DEFAULT 0 CHECK (credit >= 0),
    description TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- A4. Advances (salary advances, petty-cash)
CREATE TABLE IF NOT EXISTS advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    advance_type TEXT DEFAULT 'salary' CHECK (advance_type IN ('salary', 'petty_cash', 'travel', 'other')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'repaid', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    repayment_plan JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- A5. Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    currency_code TEXT DEFAULT 'AED',
    description TEXT,
    receipt_url TEXT,
    account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    submitted_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- B. HR ADVANCED
-- =========================================================

-- B1. Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,   -- passport, visa, contract, certificate, etc.
    file_url TEXT NOT NULL,
    file_size INTEGER,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- B2. Benefits
CREATE TABLE IF NOT EXISTS benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    benefit_type TEXT NOT NULL,    -- housing, transport, medical, education, etc.
    amount NUMERIC DEFAULT 0,
    frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'yearly', 'one_time')),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- B3. Insurance Claims (work injuries, medical)
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    claim_type TEXT NOT NULL CHECK (claim_type IN ('medical', 'work_injury', 'property', 'travel', 'other')),
    description TEXT,
    amount_claimed NUMERIC DEFAULT 0,
    amount_approved NUMERIC,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid')),
    incident_date DATE,
    documents JSONB DEFAULT '[]',
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- B4. Job Posts (recruitment)
CREATE TABLE IF NOT EXISTS job_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    job_type TEXT DEFAULT 'full_time' CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship')),
    location TEXT,
    salary_range_min NUMERIC,
    salary_range_max NUMERIC,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    closes_at DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'filled')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- B5. Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT,
    applicant_phone TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    source TEXT DEFAULT 'direct',   -- direct, referral, portal, linkedin, etc.
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'screened', 'interview', 'offered', 'hired', 'rejected')),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- B6. Training Courses
CREATE TABLE IF NOT EXISTS training_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    content_type TEXT DEFAULT 'internal' CHECK (content_type IN ('internal', 'external', 'online', 'hybrid')),
    duration_hours NUMERIC,
    is_mandatory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- B7. Training Assignments
CREATE TABLE IF NOT EXISTS training_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    due_date DATE,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed', 'expired')),
    score NUMERIC,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, employee_id)
);

-- B8. Training Attempts (quiz / exam attempts)
CREATE TABLE IF NOT EXISTS training_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES training_assignments(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    score NUMERIC,
    passed BOOLEAN DEFAULT false,
    answers JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- C. CRM & SALES (extended)
-- =========================================================

-- C1. Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source TEXT DEFAULT 'manual',   -- manual, website, referral, ad_campaign, etc.
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    industry TEXT,
    notes TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    assigned_to UUID REFERENCES company_members(id) ON DELETE SET NULL,
    converted_to_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- C2. Opportunities (sales pipeline)
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    value NUMERIC DEFAULT 0,
    currency_code TEXT DEFAULT 'AED',
    probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
    stage TEXT DEFAULT 'prospecting' CHECK (stage IN (
        'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
    )),
    expected_close_date DATE,
    assigned_to UUID REFERENCES company_members(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- C3. Receipts (payment receipts for clients)
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    receipt_number TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, receipt_number)
);

-- C4. Client Portal Users
CREATE TABLE IF NOT EXISTS client_portal_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, client_id, user_id)
);

-- =========================================================
-- D. PROJECTS & TASKS (extended)
-- =========================================================

-- D1. Project Members
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('manager', 'lead', 'member', 'observer')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, member_id)
);

-- D2. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES company_members(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'cancelled')),
    due_date DATE,
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    tags JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- D3. Task Comments
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    body TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- D4. Work Logs (time tracking)
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    hours NUMERIC NOT NULL CHECK (hours > 0),
    description TEXT,
    log_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- E. LOGISTICS & GPS (extended)
-- =========================================================

-- E1. Drivers
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    license_number TEXT,
    license_expiry DATE,
    license_type TEXT,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, member_id)
);

-- E2. Routes
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    origin_lat NUMERIC,
    origin_lng NUMERIC,
    destination_lat NUMERIC,
    destination_lng NUMERIC,
    waypoints JSONB DEFAULT '[]',    -- array of {lat, lng, label}
    estimated_distance_km NUMERIC,
    estimated_duration_min NUMERIC,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- E3. Shipments
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    logistics_task_id UUID REFERENCES logistics_tasks(id) ON DELETE SET NULL,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    tracking_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'cancelled'
    )),
    weight_kg NUMERIC,
    dimensions JSONB,                -- {length, width, height}
    recipient_name TEXT,
    recipient_phone TEXT,
    recipient_address TEXT,
    estimated_delivery TIMESTAMPTZ,
    actual_delivery TIMESTAMPTZ,
    proof_of_delivery_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- E4. GPS Tracks (continuous GPS breadcrumbs)
CREATE TABLE IF NOT EXISTS gps_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    speed_kmh NUMERIC,
    heading NUMERIC,
    accuracy_m NUMERIC,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E5. Location Pings (employee check-in pings)
CREATE TABLE IF NOT EXISTS location_pings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    accuracy_m NUMERIC,
    ping_type TEXT DEFAULT 'auto' CHECK (ping_type IN ('auto', 'manual', 'checkin', 'checkout', 'sos')),
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E6. Geofences
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    radius_m NUMERIC NOT NULL DEFAULT 100,
    fence_type TEXT DEFAULT 'circular' CHECK (fence_type IN ('circular', 'polygon')),
    polygon_points JSONB,           -- for polygon type
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- F. STORE / POS / INVENTORY
-- =========================================================

-- F1. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name_en)
);

-- F2. Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    sku TEXT,
    barcode TEXT,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    unit TEXT DEFAULT 'piece',       -- piece, kg, liter, box, etc.
    base_price NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_service BOOLEAN DEFAULT false,
    track_inventory BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, sku)
);

-- F3. Product Variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT,
    barcode TEXT,
    variant_name TEXT NOT NULL,      -- e.g. "Red / Large"
    attributes JSONB DEFAULT '{}',   -- {color: "red", size: "L"}
    price_override NUMERIC,
    cost_override NUMERIC,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- F4. Warehouses / Branches
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    lat NUMERIC,
    lng NUMERIC,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);

-- F5. Inventory Items (stock per product + warehouse)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity NUMERIC DEFAULT 0,
    reserved_quantity NUMERIC DEFAULT 0,
    reorder_level NUMERIC DEFAULT 0,
    max_stock NUMERIC,
    bin_location TEXT,               -- shelf / bin code
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, variant_id, warehouse_id)
);

-- F6. Inventory Movements (stock in/out log)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN (
        'purchase', 'sale', 'return', 'adjustment', 'transfer_in', 'transfer_out', 'damage', 'expired'
    )),
    quantity NUMERIC NOT NULL,
    reference_type TEXT,             -- po, invoice, transfer, manual
    reference_id UUID,
    unit_cost NUMERIC,
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- F7. POS Sessions
CREATE TABLE IF NOT EXISTS pos_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    cashier_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC DEFAULT 0,
    closing_cash NUMERIC,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'suspended')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- F8. POS Orders
CREATE TABLE IF NOT EXISTS pos_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pos_session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    subtotal NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile', 'mixed', 'credit')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, order_number)
);

-- F9. POS Order Items
CREATE TABLE IF NOT EXISTS pos_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- F10. Customer Orders (online / delivery)
CREATE TABLE IF NOT EXISTS customer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    channel TEXT DEFAULT 'online' CHECK (channel IN ('online', 'phone', 'walk_in', 'marketplace')),
    subtotal NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    shipping_amount NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    )),
    shipping_address JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, order_number)
);

-- F11. Customer Order Items
CREATE TABLE IF NOT EXISTS customer_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- G. CHAT CHANNELS & MESSAGING (proper channel model)
-- =========================================================

-- G1. Chat Channels
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    channel_type TEXT DEFAULT 'group' CHECK (channel_type IN ('direct', 'group', 'department', 'announcement')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- G2. Chat Channel Members
CREATE TABLE IF NOT EXISTS chat_channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    muted BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(channel_id, member_id)
);

-- G3. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'audio', 'system')),
    file_url TEXT,
    reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- G4. Presence Status
CREATE TABLE IF NOT EXISTS presence_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'on_leave', 'offline')),
    custom_message TEXT,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, member_id)
);

-- =========================================================
-- H. MEETINGS (extended -- rooms, sessions, transcripts)
-- =========================================================

-- H1. Meeting Rooms
CREATE TABLE IF NOT EXISTS meeting_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    room_type TEXT DEFAULT 'virtual' CHECK (room_type IN ('virtual', 'physical', 'hybrid')),
    capacity INTEGER,
    location TEXT,
    equipment JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- H2. Meeting Sessions (extends meetings with recording/room)
CREATE TABLE IF NOT EXISTS meeting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES meeting_rooms(id) ON DELETE SET NULL,
    provider TEXT DEFAULT 'vonage',  -- vonage, zoom, teams, etc.
    session_token TEXT,
    recording_url TEXT,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- H3. Meeting Participants
CREATE TABLE IF NOT EXISTS meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    rsvp TEXT DEFAULT 'pending' CHECK (rsvp IN ('pending', 'accepted', 'declined', 'tentative')),
    attended BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    UNIQUE(meeting_id, member_id)
);

-- H4. Meeting Transcripts (AI-generated)
CREATE TABLE IF NOT EXISTS meeting_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    session_id UUID REFERENCES meeting_sessions(id) ON DELETE SET NULL,
    language TEXT DEFAULT 'ar',
    raw_text TEXT,
    formatted_text TEXT,
    generated_by TEXT DEFAULT 'rare_ai',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- H5. Meeting Summaries (AI-generated)
CREATE TABLE IF NOT EXISTS meeting_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    transcript_id UUID REFERENCES meeting_transcripts(id) ON DELETE SET NULL,
    summary TEXT NOT NULL,
    action_items JSONB DEFAULT '[]',
    decisions JSONB DEFAULT '[]',
    attendees_summary JSONB DEFAULT '[]',
    generated_by TEXT DEFAULT 'rare_ai',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- I. AI AGENT ACTIONS & SECURITY
-- =========================================================

-- I1. AI Agent Actions (detailed audit per RARE interaction)
CREATE TABLE IF NOT EXISTS ai_agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    agent_type TEXT NOT NULL,        -- hr_agent, accounting_agent, gm_agent, etc.
    action_level TEXT NOT NULL CHECK (action_level IN ('read_only', 'suggest_only', 'execute', 'sensitive')),
    action_code TEXT NOT NULL,       -- e.g. 'generate_payroll_report', 'create_invoice'
    target_entity_type TEXT,
    target_entity_id UUID,
    input_summary TEXT,
    output_summary TEXT,
    was_approved BOOLEAN,
    approved_by UUID REFERENCES auth.users(id),
    execution_status TEXT DEFAULT 'pending' CHECK (execution_status IN ('pending', 'executed', 'denied', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- I2. Security Events
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,        -- login, logout, failed_login, password_change, role_change, etc.
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    ip_address TEXT,
    user_agent TEXT,
    geo_location TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- I3. Integration Events (webhook deliveries, sync status)
CREATE TABLE IF NOT EXISTS integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES integrations_catalog(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,        -- webhook_received, sync_completed, error, etc.
    direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
    payload JSONB DEFAULT '{}',
    status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'retrying')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- J. PRICING & BILLING (dynamic pricing support)
-- =========================================================

-- J1. Pricing Add-ons
CREATE TABLE IF NOT EXISTS pricing_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    addon_type TEXT NOT NULL CHECK (addon_type IN ('module', 'integration', 'seats', 'storage', 'ai_usage', 'support')),
    price_monthly NUMERIC DEFAULT 0,
    price_yearly NUMERIC DEFAULT 0,
    price_per_unit NUMERIC DEFAULT 0,
    unit_label TEXT,                 -- per user, per GB, per 1000 calls, etc.
    currency TEXT DEFAULT 'AED',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- J2. Subscription Usage Counters
CREATE TABLE IF NOT EXISTS subscription_usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    counter_type TEXT NOT NULL,      -- ai_tokens, storage_gb, video_minutes, active_users, etc.
    current_value NUMERIC DEFAULT 0,
    limit_value NUMERIC,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, counter_type, period_start)
);

-- J3. Billing Events (charge / credit / refund log)
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('charge', 'credit', 'refund', 'adjustment', 'proration', 'dispute')),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'AED',
    description TEXT,
    reference_type TEXT,             -- subscription, addon, integration, manual
    reference_id UUID,
    stripe_event_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- K. INDEXES
-- =========================================================

-- Accounting
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_company ON chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_advances_company ON advances(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_company ON expenses(company_id);

-- HR advanced
CREATE INDEX IF NOT EXISTS idx_employee_documents_company ON employee_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_benefits_company ON benefits(company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_company ON insurance_claims(company_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_company ON job_posts(company_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company ON job_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_post ON job_applications(job_post_id);
CREATE INDEX IF NOT EXISTS idx_training_courses_company ON training_courses(company_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_employee ON training_assignments(employee_id);

-- CRM
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_receipts_company ON receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_users_company ON client_portal_users(company_id);

-- Projects & Tasks
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_company ON work_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_task ON work_logs(task_id);

-- Logistics
CREATE INDEX IF NOT EXISTS idx_drivers_company ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_company ON routes(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_company ON shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_driver ON gps_tracks(driver_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_recorded ON gps_tracks(recorded_at);
CREATE INDEX IF NOT EXISTS idx_location_pings_member ON location_pings(member_id);
CREATE INDEX IF NOT EXISTS idx_location_pings_recorded ON location_pings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_geofences_company ON geofences(company_id);

-- Store / POS / Inventory
CREATE INDEX IF NOT EXISTS idx_product_categories_company ON product_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_product ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_warehouse ON inventory_items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_company ON inventory_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_company ON pos_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_session ON pos_orders(pos_session_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_company ON pos_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_company ON customer_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);

-- Chat
CREATE INDEX IF NOT EXISTS idx_chat_channels_company ON chat_channels(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_channel ON chat_channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_presence_status_company ON presence_status(company_id);

-- Meetings
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_meeting ON meeting_sessions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting ON meeting_transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_meeting ON meeting_summaries(meeting_id);

-- AI & Security
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_company ON ai_agent_actions(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_user ON ai_agent_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_level ON ai_agent_actions(action_level);
CREATE INDEX IF NOT EXISTS idx_security_events_company ON security_events(company_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_integration_events_company ON integration_events(company_id);

-- Pricing & Billing
CREATE INDEX IF NOT EXISTS idx_pricing_addons_type ON pricing_addons(addon_type);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_company ON subscription_usage_counters(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_company ON billing_events(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);

-- =========================================================
-- L. TRIGGERS (auto-update updated_at for new tables)
-- =========================================================

CREATE TRIGGER update_chart_of_accounts_updated_at
    BEFORE UPDATE ON chart_of_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advances_updated_at
    BEFORE UPDATE ON advances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at
    BEFORE UPDATE ON insurance_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_posts_updated_at
    BEFORE UPDATE ON job_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
    BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_orders_updated_at
    BEFORE UPDATE ON customer_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_channels_updated_at
    BEFORE UPDATE ON chat_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- End of business domain tables
-- ============================================================================
