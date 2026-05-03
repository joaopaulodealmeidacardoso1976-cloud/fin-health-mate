
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS clinic_name text,
  ADD COLUMN IF NOT EXISTS clinic_logo_url text;

ALTER TABLE public.signup_requests
  ADD COLUMN IF NOT EXISTS clinic_name text,
  ADD COLUMN IF NOT EXISTS clinic_logo_url text;

DROP POLICY IF EXISTS "admins update profiles" ON public.profiles;
CREATE POLICY "admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public) 
  VALUES ('clinic-logos','clinic-logos', true) 
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read clinic logos" ON storage.objects;
CREATE POLICY "public read clinic logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'clinic-logos');

DROP POLICY IF EXISTS "anyone upload clinic logos" ON storage.objects;
CREATE POLICY "anyone upload clinic logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clinic-logos');

DROP POLICY IF EXISTS "auth update clinic logos" ON storage.objects;
CREATE POLICY "auth update clinic logos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'clinic-logos');

DROP POLICY IF EXISTS "auth delete clinic logos" ON storage.objects;
CREATE POLICY "auth delete clinic logos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'clinic-logos');
