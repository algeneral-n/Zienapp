-- ============================================================
-- 00026: Supreme AI Tables — Command Queue & Heartbeats
-- ============================================================

-- Command queue for AI-submitted actions awaiting founder approval
CREATE TABLE IF NOT EXISTS supreme_command_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command TEXT NOT NULL,
    command_type TEXT NOT NULL DEFAULT 'query',
    reason TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    source TEXT NOT NULL DEFAULT 'ai_agent',
    result TEXT,
    expires_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI heartbeat log
CREATE TABLE IF NOT EXISTS supreme_ai_heartbeats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'alive',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queue queries
CREATE INDEX IF NOT EXISTS idx_scq_status ON supreme_command_queue (status, created_at DESC);

-- RLS: service-role only (no direct client access)
ALTER TABLE supreme_command_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE supreme_ai_heartbeats ENABLE ROW LEVEL SECURITY;

-- Super admin can read queue
CREATE POLICY "super_admin_read_queue" ON supreme_command_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM platform_admins
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );

-- Super admin can update queue (approve/reject)
CREATE POLICY "super_admin_update_queue" ON supreme_command_queue
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM platform_admins
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );

-- Super admin can read heartbeats
CREATE POLICY "super_admin_read_heartbeats" ON supreme_ai_heartbeats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM platform_admins
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );
