-- Add invoice_url column to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Create private bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects for invoices bucket
-- Files are stored under {auth.uid()}/filename
CREATE POLICY "owners read own invoices"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoices' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "owners upload own invoices"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invoices'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "owners update own invoices"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'invoices' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "owners delete own invoices"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'invoices' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);