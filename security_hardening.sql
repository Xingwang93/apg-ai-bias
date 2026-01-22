-- SECURITY HARDENING: STRICT ROW LEVEL SECURITY FOR APP_CONFIG
-- This script revokes all public/anon access to the configuration table.
-- After applying this, only the Service Role (backend) can access this table.

-- 1. DROP existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.app_config;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.app_config;
DROP POLICY IF EXISTS "Enable update for all users" ON public.app_config;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.app_config;
DROP POLICY IF EXISTS "Allow public read access" ON public.app_config;

-- 2. ENSURE RLS is enabled
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- 3. (Optional but recommended) Create a policy specifically for Service Role (though it bypasses RLS by default)
-- No explicit policy needed for Service Role as it ignores RLS.
-- Because no policies exist for 'anon' or 'authenticated', they will be denied access by default.

-- This ensures that:
-- - Frontend cannot read API keys directly.
-- - Frontend cannot modify configuration.
-- - All access must flow through api/generate, api/verify-passcode, or api/config.
