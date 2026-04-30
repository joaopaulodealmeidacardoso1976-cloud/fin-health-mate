
-- Extra patient identification fields
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS emergency_contact text;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.record_type AS ENUM ('medical', 'dental');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main record
CREATE TABLE IF NOT EXISTS public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  record_type public.record_type NOT NULL DEFAULT 'medical',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.anamnesis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  chief_complaint text,
  hda text,
  past_history text,
  family_history text,
  allergies text,
  medications text,
  habits text,
  chronic_conditions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  blood_pressure text,
  heart_rate numeric,
  temperature numeric,
  spo2 numeric,
  weight numeric,
  height numeric,
  observations text,
  dental_chart jsonb,
  exam_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  primary_diagnosis text NOT NULL,
  secondary_diagnoses jsonb DEFAULT '[]'::jsonb,
  cid_code text,
  risk public.risk_level DEFAULT 'low',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.therapeutic_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  objectives text,
  care_plan text,
  interventions text,
  professionals text,
  frequency text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  procedure text NOT NULL,
  professional text,
  notes text,
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exam_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  exam_name text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  result_url text,
  result_filename text,
  interpretation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  professional text,
  notes text,
  prescribed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  medication text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_evolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  professional text,
  note text NOT NULL,
  noted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.record_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  category text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  record_id uuid,
  patient_id uuid,
  section text NOT NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_anamnesis_record ON public.anamnesis(record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_exams_record ON public.clinical_exams(record_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_record ON public.diagnoses(record_id);
CREATE INDEX IF NOT EXISTS idx_therapeutic_record ON public.therapeutic_plans(record_id);
CREATE INDEX IF NOT EXISTS idx_treatments_record ON public.treatments(record_id);
CREATE INDEX IF NOT EXISTS idx_exam_requests_record ON public.exam_requests(record_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_record ON public.prescriptions(record_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_pres ON public.prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_evolution_record ON public.clinical_evolution(record_id);
CREATE INDEX IF NOT EXISTS idx_attachments_record ON public.record_attachments(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_record ON public.audit_log(record_id);

-- Triggers updated_at
CREATE TRIGGER trg_medical_records_updated BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_anamnesis_updated BEFORE UPDATE ON public.anamnesis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clinical_exams_updated BEFORE UPDATE ON public.clinical_exams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_diagnoses_updated BEFORE UPDATE ON public.diagnoses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_therapeutic_updated BEFORE UPDATE ON public.therapeutic_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_exam_requests_updated BEFORE UPDATE ON public.exam_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapeutic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies (owner or admin pattern)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['medical_records','anamnesis','clinical_exams','diagnoses','therapeutic_plans','treatments','exam_requests','prescriptions','prescription_items','clinical_evolution','record_attachments'])
  LOOP
    EXECUTE format('CREATE POLICY "owner insert %1$s" ON public.%1$s FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "owner or admin select %1$s" ON public.%1$s FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), ''admin''::app_role))', t);
    EXECUTE format('CREATE POLICY "owner or admin update %1$s" ON public.%1$s FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), ''admin''::app_role))', t);
    EXECUTE format('CREATE POLICY "owner or admin delete %1$s" ON public.%1$s FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), ''admin''::app_role))', t);
  END LOOP;
END $$;

-- Audit log: only own + admin read; insert by authenticated
CREATE POLICY "user insert audit" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner or admin select audit" ON public.audit_log FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-records', 'medical-records', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users read own medical files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'medical-records' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "users upload own medical files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users update own medical files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'medical-records' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "users delete own medical files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'medical-records' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role)));
