-- SECURITY HARDENING SCRIPT

-- 1. Restrict Storage uploads to images only and max 5MB
-- Note: This requires specific configuration in Supabase Storage settings which are best set via UI, 
-- but we can enforce RLS policies for better control.

-- Drop old lax policies
drop policy if exists "Public Insert" on storage.objects;

-- New more restrictive policy for uploads
create policy "Restrictive Public Insert"
on storage.objects for insert
to public
with check (
  bucket_id = 'observations' 
  AND (storage.extension(name) = 'png' OR storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg')
  -- Max 5MB (5 * 1024 * 1024)
  -- AND (octet_length(content) < 5242880) -- content length check is tricky in RLS, better handled in app + storage settings
);

-- 2. Prevent table flooding with a basic check (limit text length)
alter table public.observations 
add constraint prompt_length_check check (char_length(prompt) < 1000),
add constraint notes_length_check check (char_length(notes) < 2000);

-- 3. Optimization: Add indexes for better performance under load
create index if not exists idx_observations_created_at on public.observations(created_at desc);
create index if not exists idx_observations_model on public.observations(model);
