ALTER TABLE public.signup_requests
  ADD COLUMN IF NOT EXISTS professional_category text,
  ADD COLUMN IF NOT EXISTS professional_registry text,
  ADD COLUMN IF NOT EXISTS professional_uf text;