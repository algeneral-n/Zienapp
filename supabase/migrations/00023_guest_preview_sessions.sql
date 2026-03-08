-- Migration: Guest Preview Sessions tracking table
-- Tracks anonymous visitor email verifications for preview mode

CREATE TABLE IF NOT EXISTS public.guest_preview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'otp_sent' CHECK (status IN ('otp_sent', 'verified', 'expired', 'converted')),
  ip_address text,
  user_agent text,
  verified_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_guest_preview_email ON public.guest_preview_sessions(email);
CREATE INDEX IF NOT EXISTS idx_guest_preview_status ON public.guest_preview_sessions(status);

-- RLS
ALTER TABLE public.guest_preview_sessions ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_role_guest_sessions"
  ON public.guest_preview_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_guest_session_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guest_session_updated
  BEFORE UPDATE ON public.guest_preview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_guest_session_timestamp();
