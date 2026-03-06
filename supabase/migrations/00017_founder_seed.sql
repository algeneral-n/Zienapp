-- ═══════════════════════════════════════════════════════════
-- Migration 00017: Founder Account Setup
-- ═══════════════════════════════════════════════════════════
-- 
-- USAGE:
-- 1. Register a new account through the app (email: founder@zien-ai.app)
-- 2. After registration, run this SQL to promote to founder:
--    SELECT promote_to_founder('founder@zien-ai.app');
--
-- Or manually:
--    UPDATE profiles SET platform_role = 'founder' WHERE email = 'founder@zien-ai.app';
-- ═══════════════════════════════════════════════════════════

-- Function to promote a user to founder role
CREATE OR REPLACE FUNCTION promote_to_founder(target_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM profiles WHERE email = target_email;
  
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in profiles', target_email;
  END IF;

  -- Ensure only one founder exists
  UPDATE profiles SET platform_role = 'tenant_user' WHERE platform_role = 'founder';
  
  -- Promote the target user
  UPDATE profiles SET platform_role = 'founder', is_active = true, updated_at = now() WHERE id = target_id;
  
  RAISE NOTICE 'User % promoted to founder successfully', target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote a user to platform admin
CREATE OR REPLACE FUNCTION promote_to_platform_admin(target_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM profiles WHERE email = target_email;
  
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in profiles', target_email;
  END IF;

  UPDATE profiles SET platform_role = 'platform_admin', is_active = true, updated_at = now() WHERE id = target_id;
  
  RAISE NOTICE 'User % promoted to platform_admin successfully', target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
