-- ============================================================================
-- Migration 00022: Marketing Email System
-- Tables for email campaigns, subscribers, send logs, and auto-flows
-- ============================================================================

-- 1. Email subscriber status tracking
CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','unsubscribed','bounced','incomplete_signup')),
  source text DEFAULT 'signup'
    CHECK (source IN ('signup','invite','manual','import','incomplete')),
  language text DEFAULT 'ar' CHECK (language IN ('ar','en')),
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_subscribers_email
  ON public.email_subscribers(email);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_status
  ON public.email_subscribers(status);

-- 2. Email campaigns / templates
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  subject_ar text NOT NULL,
  subject_en text NOT NULL,
  html_body text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'one_time'
    CHECK (campaign_type IN ('one_time','recurring','drip','auto_flow')),
  -- For recurring: cron expression or interval
  schedule_cron text,
  -- For drip: delay after trigger event
  drip_delay_hours int,
  drip_trigger text CHECK (drip_trigger IN ('signup','invite_accepted','incomplete_signup','purchase','trial_end')),
  -- Target audience filter
  target_audience jsonb DEFAULT '{"status": "active"}',
  -- Status
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','completed','archived')),
  -- Stats
  total_sent int DEFAULT 0,
  total_opened int DEFAULT 0,
  total_clicked int DEFAULT 0,
  last_sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Email send log
CREATE TABLE IF NOT EXISTS public.email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sent','delivered','opened','clicked','bounced','failed')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_sends_campaign
  ON public.email_sends(campaign_id);

CREATE INDEX IF NOT EXISTS idx_email_sends_subscriber
  ON public.email_sends(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_email_sends_status
  ON public.email_sends(status);

-- 4. Auto-flow definitions (automated email sequences)
CREATE TABLE IF NOT EXISTS public.email_auto_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_event text NOT NULL
    CHECK (trigger_event IN ('user_signup','incomplete_signup','invite_sent','first_login','trial_ending','subscription_created','subscription_cancelled')),
  is_active boolean DEFAULT true,
  steps jsonb NOT NULL DEFAULT '[]',
  -- steps = [{delay_hours: 0, campaign_id: "..."}, {delay_hours: 24, campaign_id: "..."}, ...]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_auto_flows ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (worker uses service role key)
CREATE POLICY "service_role_full_access" ON public.email_subscribers
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON public.email_campaigns
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON public.email_sends
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON public.email_auto_flows
  FOR ALL USING (auth.role() = 'service_role');

-- Founders can read campaigns
CREATE POLICY "founder_read_campaigns" ON public.email_campaigns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'founder')
  );

-- 6. Auto-sync: when a user signs up, add them to email_subscribers
CREATE OR REPLACE FUNCTION public.handle_new_user_email_subscribe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_subscribers (email, user_id, full_name, status, source)
  VALUES (
    NEW.email,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'active',
    'signup'
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    status = 'active',
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_subscribe ON auth.users;
CREATE TRIGGER on_auth_user_created_subscribe
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_email_subscribe();

-- 7. Insert default marketing campaign templates
INSERT INTO public.email_campaigns (name, slug, subject_ar, subject_en, html_body, campaign_type, status, drip_trigger, drip_delay_hours) VALUES

-- Welcome email (immediate after signup)
('Welcome Email', 'welcome', 
 'مرحبا بك في ZIEN Platform - ابدا رحلتك الان!',
 'Welcome to ZIEN Platform - Start Your Journey!',
 '__WELCOME_TEMPLATE__',
 'drip', 'active', 'signup', 0),

-- Feature discovery (24h after signup)
('Feature Discovery', 'feature-discovery',
 'اكتشف قوة ZIEN Platform - 10 ادوات لادارة اعمالك',
 'Discover ZIEN Power - 10 Tools for Your Business',
 '__FEATURES_TEMPLATE__',
 'drip', 'active', 'signup', 24),

-- Re-engagement for incomplete signups (48h after attempt)
('Complete Your Signup', 'incomplete-reengagement',
 'حسابك بانتظارك! اكمل التسجيل في ZIEN Platform',
 'Your Account is Waiting! Complete Your ZIEN Signup',
 '__INCOMPLETE_TEMPLATE__',
 'drip', 'active', 'incomplete_signup', 48),

-- Monthly newsletter
('Monthly Newsletter', 'monthly-newsletter',
 'جديد ZIEN Platform هذا الشهر | Monthly Update',
 'What is New at ZIEN Platform | Monthly Update',
 '__NEWSLETTER_TEMPLATE__',
 'recurring', 'active', NULL, NULL),

-- Trial ending reminder
('Trial Ending Soon', 'trial-ending',
 'تنتهي فترتك التجريبية قريبا - لا تفوت الفرصة!',
 'Your Trial is Ending Soon - Do Not Miss Out!',
 '__TRIAL_TEMPLATE__',
 'drip', 'active', 'trial_end', 0)

ON CONFLICT (slug) DO UPDATE SET
  subject_ar = EXCLUDED.subject_ar,
  subject_en = EXCLUDED.subject_en,
  html_body = EXCLUDED.html_body,
  updated_at = now();

-- 8. Insert default auto-flows
INSERT INTO public.email_auto_flows (name, trigger_event, is_active, steps) VALUES
('Welcome Sequence', 'user_signup', true, 
 '[{"delay_hours":0,"campaign_slug":"welcome"},{"delay_hours":24,"campaign_slug":"feature-discovery"}]'),
('Incomplete Signup Recovery', 'incomplete_signup', true,
 '[{"delay_hours":48,"campaign_slug":"incomplete-reengagement"}]'),
('Trial End Reminder', 'trial_ending', true,
 '[{"delay_hours":0,"campaign_slug":"trial-ending"}]')
ON CONFLICT DO NOTHING;
