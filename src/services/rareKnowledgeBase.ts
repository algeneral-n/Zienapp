/**
 * RARE AI Knowledge Base
 * Structured knowledge injected into every AI call so RARE can answer
 * accurately about ZIEN platform features, roles, and workflows.
 */

// ─── Module Documentation ────────────────────────────────────────────────────

export const MODULE_KNOWLEDGE: Record<string, {
    name: string;
    description: string;
    features: string[];
    tables: string[];
}> = {
    overview: {
        name: 'Overview Dashboard',
        description: 'Central dashboard showing company KPIs, revenue charts, team activity, and quick stats.',
        features: ['Revenue tracking', 'Active projects count', 'Team size', 'Pending invoices', 'Quick navigation to all modules'],
        tables: ['companies', 'company_members', 'invoices', 'projects'],
    },
    hr: {
        name: 'Human Resources',
        description: 'Complete HR management: employees, attendance, leave requests, payroll processing.',
        features: ['Employee directory with roles', 'Clock In/Out attendance', 'Leave request workflow (request/approve/reject)', 'Payroll processing and history', 'Department management'],
        tables: ['company_members', 'employees', 'attendance', 'leave_requests', 'payroll', 'departments'],
    },
    accounting: {
        name: 'Accounting & Finance',
        description: 'Invoice management, payment tracking, tax settings, and financial reports.',
        features: ['Create/send invoices', 'Payment tracking', 'VAT/tax configuration', 'Revenue reports', 'Client billing'],
        tables: ['invoices', 'invoice_items', 'payments', 'tax_settings'],
    },
    crm: {
        name: 'CRM - Client Relations',
        description: 'Client management, deal pipeline, quotes, and relationship tracking.',
        features: ['Client directory', 'Add/edit clients', 'Track deal status', 'Revenue per client', 'Contact management'],
        tables: ['clients', 'quotes', 'contracts'],
    },
    logistics: {
        name: 'Logistics & Fleet',
        description: 'Delivery task management, vehicle fleet tracking, and driver assignment.',
        features: ['Create delivery tasks', 'Assign drivers', 'Track task progress', 'Vehicle fleet management', 'Distance and load tracking'],
        tables: ['logistics_tasks', 'vehicles'],
    },
    projects: {
        name: 'Project Management',
        description: 'Project tracking with list and board views, task management, and team collaboration.',
        features: ['Create projects', 'Task assignment', 'Progress tracking', 'Timeline/deadline management', 'List and Kanban board views'],
        tables: ['projects'],
    },
    meetings: {
        name: 'Meetings & Chat',
        description: 'Real-time team messaging and meeting scheduling.',
        features: ['Real-time chat via Supabase', 'Channel/direct messaging', 'Meeting scheduling', 'Chat history search'],
        tables: ['chats', 'meetings'],
    },
    store: {
        name: 'Store & POS',
        description: 'E-commerce module with product catalog, orders, point-of-sale, and analytics.',
        features: ['Product CRUD with categories', 'Inventory management', 'Order processing pipeline', 'Point of Sale interface', 'Sales analytics and reporting'],
        tables: ['products', 'product_categories', 'orders', 'order_items', 'store_customers', 'inventory_movements', 'store_settings'],
    },
    academy: {
        name: 'Academy',
        description: 'Internal training platform with courses organized by track.',
        features: ['Course catalog by track', 'Lesson tracking', 'Student enrollment', 'Progress monitoring'],
        tables: ['academy_courses'],
    },
    portal_builder: {
        name: 'Portal Builder',
        description: 'Customize the company portal appearance and structure.',
        features: ['Visual preview', 'Theme customization', 'AI-assisted builder', 'Component management'],
        tables: ['portal_configs'],
    },
    integrations: {
        name: 'Integrations',
        description: 'Connect third-party services: payment gateways, communication, maps, AI, storage.',
        features: ['Integration catalog', 'Connect/disconnect with API keys', 'Health monitoring', 'Per-integration pricing'],
        tables: ['integrations_catalog', 'tenant_integrations'],
    },
    rare: {
        name: 'RARE AI Management',
        description: 'Configure and manage the 24 AI agents that power the RARE assistant.',
        features: ['Agent configuration', 'Mode selection (Auto/Formal/Creative)', 'Usage analytics', 'Custom agent instructions'],
        tables: ['agent_settings', 'ai_usage_logs'],
    },
};

// ─── Role Knowledge ──────────────────────────────────────────────────────────

export const ROLE_KNOWLEDGE: Record<string, {
    title: string;
    level: number;
    description: string;
    canAccess: string[];
    cannotAccess: string[];
}> = {
    // Platform roles
    founder: {
        title: 'Platform Founder',
        level: 100,
        description: 'Full control over the entire ZIEN platform. Can manage all tenants, billing, integrations, and system settings.',
        canAccess: ['Everything', 'Founder Dashboard', 'All tenant data', 'Platform settings', 'Billing', 'Marketing', 'Security', 'Integration catalog'],
        cannotAccess: [],
    },
    platform_admin: {
        title: 'Platform Administrator',
        level: 90,
        description: 'Platform-level administration. Can manage tenants and support but cannot modify billing or security settings.',
        canAccess: ['Tenant management', 'Support tickets', 'User management', 'Platform monitoring'],
        cannotAccess: ['Billing settings', 'Integration pricing', 'Security configurations'],
    },
    platform_support: {
        title: 'Platform Support',
        level: 80,
        description: 'Support staff for the platform. Can view tenant issues and respond to support tickets.',
        canAccess: ['Support tickets', 'Help articles', 'User lookup'],
        cannotAccess: ['Tenant data', 'Billing', 'Settings', 'Admin functions'],
    },
    // Company roles
    company_gm: {
        title: 'General Manager',
        level: 70,
        description: 'Top authority within a company tenant. Full access to all company modules and settings.',
        canAccess: ['All company modules', 'Employee management', 'Financial data', 'Settings', 'Invitations', 'Integrations'],
        cannotAccess: ['Platform-level settings', 'Other tenants'],
    },
    assistant_gm: {
        title: 'Assistant General Manager',
        level: 65,
        description: 'Deputy to the GM. Same access as GM except company-level settings changes.',
        canAccess: ['All modules', 'Employee management', 'Financial data', 'Reports'],
        cannotAccess: ['Company settings changes', 'Integration management', 'Other tenants'],
    },
    executive_secretary: {
        title: 'Executive Secretary',
        level: 60,
        description: 'Administrative support. Can access most modules for coordination and scheduling.',
        canAccess: ['Meetings', 'Calendar', 'HR (view)', 'Document management', 'Invitations'],
        cannotAccess: ['Financial data edit', 'Payroll', 'Integration config'],
    },
    department_manager: {
        title: 'Department Manager',
        level: 50,
        description: 'Manages a specific department. Can see department members and department-level data.',
        canAccess: ['Department employees', 'Department projects', 'Leave approvals', 'Department reports'],
        cannotAccess: ['Other departments', 'Company-wide financial data', 'Settings'],
    },
    hr_manager: {
        title: 'HR Manager',
        level: 45,
        description: 'Manages all human resources functions.',
        canAccess: ['All employees', 'Attendance', 'Leave requests', 'Payroll', 'Departments'],
        cannotAccess: ['Financial modules', 'CRM', 'Logistics', 'Settings'],
    },
    accountant: {
        title: 'Accountant',
        level: 45,
        description: 'Manages financial operations.',
        canAccess: ['Invoices', 'Payments', 'Tax settings', 'Financial reports', 'Payroll data'],
        cannotAccess: ['HR management', 'CRM', 'Logistics', 'Settings'],
    },
    employee: {
        title: 'Employee',
        level: 20,
        description: 'Standard company member. Can access the Employee Portal for personal HR functions.',
        canAccess: ['Employee Portal', 'Clock In/Out', 'Leave requests', 'Payroll (own)', 'Tasks (assigned)'],
        cannotAccess: ['Module dashboards', 'Other employee data', 'Management functions', 'Settings'],
    },
    client_user: {
        title: 'Client User',
        level: 10,
        description: 'External client with limited portal access.',
        canAccess: ['Client Portal', 'Own projects', 'Own invoices', 'Document downloads', 'Support tickets'],
        cannotAccess: ['All internal modules', 'Employee data', 'Settings'],
    },
};

// ─── Platform FAQ ────────────────────────────────────────────────────────────

export const PLATFORM_FAQ = [
    { q: 'How do I invite a new employee?', a: 'Go to HR module > Employees > Add Employee. Enter their email and role. They will receive an invitation link.' },
    { q: 'How do I create an invoice?', a: 'Go to Accounting module > Invoices > New Invoice. Fill in client name, amounts, and click Create.' },
    { q: 'How do I clock in?', a: 'Go to Employee Portal > Attendance tab. Click the "Clock In" button. Your time will be recorded.' },
    { q: 'How do I request leave?', a: 'Go to Employee Portal > Leave tab. Select leave type, dates, and provide a reason. Submit for approval.' },
    { q: 'How do I add a new client?', a: 'Go to CRM module > Add Client. Enter company name, contact details, and save.' },
    { q: 'How do I connect an integration?', a: 'Go to Integrations module. Find the service you want to connect. Click Connect and enter your API credentials.' },
    { q: 'How do I create a project?', a: 'Go to Projects module > New Project. Enter project name, optional client, and deadline.' },
    { q: 'How do I manage departments?', a: 'Go to HR module > Departments tab. You can create new departments and assign managers.' },
    { q: 'How do I run payroll?', a: 'Go to HR module > Payroll tab. Click "Run Payroll" to process the current cycle.' },
    { q: 'How do I view reports?', a: 'Each module has its own reporting section. The Overview dashboard shows cross-module KPIs.' },
];

// ─── Build System Prompt ─────────────────────────────────────────────────────

export function buildSystemPrompt(params: {
    role: string;
    companyName: string;
    currentPage: string;
    currentModule?: string;
    permissions: string[];
    language: string;
}): string {
    const roleInfo = ROLE_KNOWLEDGE[params.role] || ROLE_KNOWLEDGE.employee;
    const moduleInfo = params.currentModule ? MODULE_KNOWLEDGE[params.currentModule] : null;

    return `You are RARE, the AI assistant for ZIEN multi-tenant business platform.

## Your Identity
- Name: RARE (Real-time AI Resource Engine)
- Platform: ZIEN Business Intelligence Platform
- Response Language: ${params.language === 'ar' ? 'Arabic' : 'English'}

## Current User Context
- Role: ${roleInfo.title} (Level ${roleInfo.level})
- Company: ${params.companyName}
- Current Page: ${params.currentPage}
${params.currentModule ? `- Active Module: ${moduleInfo?.name || params.currentModule}` : ''}

## User Permissions
- Can Access: ${roleInfo.canAccess.join(', ')}
- Cannot Access: ${roleInfo.cannotAccess.length > 0 ? roleInfo.cannotAccess.join(', ') : 'No restrictions'}

${moduleInfo ? `## Current Module: ${moduleInfo.name}
${moduleInfo.description}
Features: ${moduleInfo.features.join(', ')}
Data Tables: ${moduleInfo.tables.join(', ')}` : ''}

## Rules
1. Only provide information the user's role has access to.
2. If asked about restricted data, explain they need higher permissions.
3. Be concise, professional, and actionable.
4. Guide users to the correct module/feature for their needs.
5. Never reveal internal table names or technical architecture.
6. For sensitive operations (delete, payroll, settings), always recommend confirmation.
7. No emoji in responses.`;
}
