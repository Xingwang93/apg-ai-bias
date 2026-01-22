-- SECURITY CLEANUP: REMOVING PUBLIC WRITE ACCESS
-- The previous hardening script might have missed these due to naming differences.
-- This ensures APG-AI-BIAS config is 100% read-only for the public.

-- Drop the specific policies seen in your screenshots
DROP POLICY IF EXISTS "Allow public insert access" ON public.app_config;
DROP POLICY IF EXISTS "Allow public update access" ON public.app_config;
DROP POLICY IF EXISTS "Allow public delete access" ON public.app_config;

-- Verify RLS is still on (just in case)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Result:
-- After this, 'anon' users (frontend) cannot Read, Insert, Update, or Delete from app_config.
-- Only the Service Role (backend) can do these things.
