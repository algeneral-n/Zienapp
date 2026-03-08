-- ============================================================================
-- ZIEN Platform — Fix 002 Recursive Policies + RLS for Unprotected Tables
-- Migration: 00020_fix_002_rls_and_missing_tables.sql
-- Date: 2026-03-08
-- Description:
--   1. Drop recursive company_members policies re-added by 002_rls_store_invitations.sql
--   2. Recreate clean non-recursive versions (using SECURITY DEFINER helpers from 00018)
--   3. Enable RLS + create policies for 14 unprotected tables
--   4. Add subscription_usage_counters table for usage tracking
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: Fix recursive company_members policies from migration 002
-- Migration 002 re-adds policies that query company_members FROM company_members
-- causing infinite recursion. 00018 fixed this but 002 sorts AFTER 00018.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop the recursive policies from 002
DROP POLICY IF EXISTS "Members can see their company members" ON company_members;
DROP POLICY IF EXISTS "Company GMs can manage members" ON company_members;

-- Recreate using SECURITY DEFINER helper (no recursion)
CREATE POLICY "cm_select_safe" ON company_members
  FOR SELECT USING (
    company_id IN (SELECT auth_user_company_ids())
    OR is_founder()
  );

CREATE POLICY "cm_manage_safe" ON company_members
  FOR ALL USING (
    is_company_admin(company_id)
    OR is_founder()
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: RLS for Chat tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- chat_channels
DO $$ BEGIN ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "chat_channels_select" ON chat_channels;
DROP POLICY IF EXISTS "chat_channels_insert" ON chat_channels;
DROP POLICY IF EXISTS "chat_channels_update" ON chat_channels;
DROP POLICY IF EXISTS "chat_channels_delete" ON chat_channels;

CREATE POLICY "chat_channels_select" ON chat_channels
  FOR SELECT USING (is_company_member(company_id) OR is_founder());
CREATE POLICY "chat_channels_insert" ON chat_channels
  FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "chat_channels_update" ON chat_channels
  FOR UPDATE USING (is_company_member(company_id));
CREATE POLICY "chat_channels_delete" ON chat_channels
  FOR DELETE USING (is_company_admin(company_id) OR is_founder());

-- chat_channel_members
DO $$ BEGIN ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "chat_channel_members_select" ON chat_channel_members;
DROP POLICY IF EXISTS "chat_channel_members_insert" ON chat_channel_members;
DROP POLICY IF EXISTS "chat_channel_members_delete" ON chat_channel_members;

CREATE POLICY "chat_channel_members_select" ON chat_channel_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_channels c WHERE c.id = channel_id AND is_company_member(c.company_id))
  );
CREATE POLICY "chat_channel_members_insert" ON chat_channel_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chat_channels c WHERE c.id = channel_id AND is_company_member(c.company_id))
  );
CREATE POLICY "chat_channel_members_delete" ON chat_channel_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM chat_channels c WHERE c.id = channel_id AND is_company_admin(c.company_id))
  );

-- chat_messages
DO $$ BEGIN ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON chat_messages;

CREATE POLICY "chat_messages_select" ON chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_channels c WHERE c.id = channel_id AND is_company_member(c.company_id))
  );
CREATE POLICY "chat_messages_insert" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM chat_channels c WHERE c.id = channel_id AND is_company_member(c.company_id))
  );
CREATE POLICY "chat_messages_update" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid());
CREATE POLICY "chat_messages_delete" ON chat_messages
  FOR DELETE USING (
    sender_id = auth.uid()
    OR EXISTS (SELECT 1 FROM chat_channels c WHERE c.id = channel_id AND is_company_admin(c.company_id))
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3: RLS for Meeting tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- meeting_sessions
DO $$ BEGIN ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "meeting_sessions_select" ON meeting_sessions;
DROP POLICY IF EXISTS "meeting_sessions_insert" ON meeting_sessions;
DROP POLICY IF EXISTS "meeting_sessions_update" ON meeting_sessions;

CREATE POLICY "meeting_sessions_select" ON meeting_sessions
  FOR SELECT USING (is_company_member(company_id) OR is_founder());
CREATE POLICY "meeting_sessions_insert" ON meeting_sessions
  FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "meeting_sessions_update" ON meeting_sessions
  FOR UPDATE USING (is_company_member(company_id));

-- meeting_participants
DO $$ BEGIN ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "meeting_participants_select" ON meeting_participants;
DROP POLICY IF EXISTS "meeting_participants_insert" ON meeting_participants;
DROP POLICY IF EXISTS "meeting_participants_delete" ON meeting_participants;

CREATE POLICY "meeting_participants_select" ON meeting_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM meeting_sessions m WHERE m.id = meeting_id AND is_company_member(m.company_id))
  );
CREATE POLICY "meeting_participants_insert" ON meeting_participants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM meeting_sessions m WHERE m.id = meeting_id AND is_company_member(m.company_id))
  );
CREATE POLICY "meeting_participants_delete" ON meeting_participants
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM meeting_sessions m WHERE m.id = meeting_id AND is_company_admin(m.company_id))
  );

-- meeting_transcripts
DO $$ BEGIN ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "meeting_transcripts_select" ON meeting_transcripts;
DROP POLICY IF EXISTS "meeting_transcripts_insert" ON meeting_transcripts;

CREATE POLICY "meeting_transcripts_select" ON meeting_transcripts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM meeting_sessions m WHERE m.id = meeting_id AND is_company_member(m.company_id))
  );
CREATE POLICY "meeting_transcripts_insert" ON meeting_transcripts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM meeting_sessions m WHERE m.id = meeting_id AND is_company_member(m.company_id))
  );

-- meeting_summaries
DO $$ BEGIN ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "meeting_summaries_select" ON meeting_summaries;
DROP POLICY IF EXISTS "meeting_summaries_insert" ON meeting_summaries;

CREATE POLICY "meeting_summaries_select" ON meeting_summaries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM meeting_sessions m WHERE m.id = meeting_id AND is_company_member(m.company_id))
  );
CREATE POLICY "meeting_summaries_insert" ON meeting_summaries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM meeting_sessions m WHERE m.id = meeting_id AND is_company_member(m.company_id))
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 4: RLS for Location/GPS tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- location_pings
DO $$ BEGIN ALTER TABLE location_pings ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "location_pings_select" ON location_pings;
DROP POLICY IF EXISTS "location_pings_insert" ON location_pings;

CREATE POLICY "location_pings_select" ON location_pings
  FOR SELECT USING (is_company_member(company_id) OR user_id = auth.uid());
CREATE POLICY "location_pings_insert" ON location_pings
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_company_member(company_id));

-- gps_tracks
DO $$ BEGIN ALTER TABLE gps_tracks ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "gps_tracks_select" ON gps_tracks;
DROP POLICY IF EXISTS "gps_tracks_insert" ON gps_tracks;

CREATE POLICY "gps_tracks_select" ON gps_tracks
  FOR SELECT USING (is_company_member(company_id) OR user_id = auth.uid());
CREATE POLICY "gps_tracks_insert" ON gps_tracks
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_company_member(company_id));

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 5: RLS for Integration tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- integration_configs
DO $$ BEGIN ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "integration_configs_select" ON integration_configs;
DROP POLICY IF EXISTS "integration_configs_manage" ON integration_configs;

CREATE POLICY "integration_configs_select" ON integration_configs
  FOR SELECT USING (is_company_member(company_id) OR is_founder());
CREATE POLICY "integration_configs_manage" ON integration_configs
  FOR ALL USING (is_company_admin(company_id) OR is_founder());

-- integration_subscriptions
DO $$ BEGIN ALTER TABLE integration_subscriptions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "integration_subscriptions_select" ON integration_subscriptions;
DROP POLICY IF EXISTS "integration_subscriptions_manage" ON integration_subscriptions;

CREATE POLICY "integration_subscriptions_select" ON integration_subscriptions
  FOR SELECT USING (is_company_member(company_id) OR is_founder());
CREATE POLICY "integration_subscriptions_manage" ON integration_subscriptions
  FOR ALL USING (is_company_admin(company_id) OR is_founder());

-- integration_usage_logs
DO $$ BEGIN ALTER TABLE integration_usage_logs ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "integration_usage_logs_select" ON integration_usage_logs;
DROP POLICY IF EXISTS "integration_usage_logs_insert" ON integration_usage_logs;

CREATE POLICY "integration_usage_logs_select" ON integration_usage_logs
  FOR SELECT USING (is_company_member(company_id) OR is_founder());
CREATE POLICY "integration_usage_logs_insert" ON integration_usage_logs
  FOR INSERT WITH CHECK (is_company_member(company_id));

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 6: RLS for Knowledge & Presence tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- knowledge_articles (can be global or company-scoped)
DO $$ BEGIN ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "knowledge_articles_select" ON knowledge_articles;
DROP POLICY IF EXISTS "knowledge_articles_manage" ON knowledge_articles;

CREATE POLICY "knowledge_articles_select" ON knowledge_articles
  FOR SELECT USING (
    is_published = true
    AND (company_id IS NULL OR is_company_member(company_id))
  );
CREATE POLICY "knowledge_articles_manage" ON knowledge_articles
  FOR ALL USING (
    company_id IS NULL AND is_founder()
    OR company_id IS NOT NULL AND is_company_admin(company_id)
  );

-- presence_status
DO $$ BEGIN ALTER TABLE presence_status ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DROP POLICY IF EXISTS "presence_status_select" ON presence_status;
DROP POLICY IF EXISTS "presence_status_upsert" ON presence_status;

CREATE POLICY "presence_status_select" ON presence_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_members cm1
      WHERE cm1.user_id = presence_status.user_id
      AND cm1.company_id IN (SELECT auth_user_company_ids())
    )
    OR user_id = auth.uid()
  );
CREATE POLICY "presence_status_upsert" ON presence_status
  FOR ALL USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 7: Usage Counter table for Sprint 3 usage tracking
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscription_usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    usage_type TEXT NOT NULL, -- 'ai_query', 'storage_mb', 'api_call', 'seat'
    period_key TEXT NOT NULL, -- '2026-03' (YYYY-MM)
    count NUMERIC NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, usage_type, period_key)
);

ALTER TABLE subscription_usage_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suc_select" ON subscription_usage_counters
  FOR SELECT USING (is_company_member(company_id) OR is_founder());
CREATE POLICY "suc_manage" ON subscription_usage_counters
  FOR ALL USING (is_company_admin(company_id) OR is_founder());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_suc_company_period ON subscription_usage_counters(company_id, period_key);

COMMIT;
