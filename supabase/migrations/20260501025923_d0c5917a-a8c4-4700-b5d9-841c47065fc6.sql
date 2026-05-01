-- Profiles: categoria e registro
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_category text,
  ADD COLUMN IF NOT EXISTS professional_registry text,
  ADD COLUMN IF NOT EXISTS professional_uf text;

-- Avaliações específicas por categoria
CREATE TABLE IF NOT EXISTS public.professional_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  category text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.professional_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner insert prof_assessments" ON public.professional_assessments FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin select prof_assessments" ON public.professional_assessments FOR SELECT TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin update prof_assessments" ON public.professional_assessments FOR UPDATE TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin delete prof_assessments" ON public.professional_assessments FOR DELETE TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_updated_at_prof_assessments BEFORE UPDATE ON public.professional_assessments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Planos alimentares
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'Plano alimentar',
  meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  guidelines text,
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner insert nutrition_plans" ON public.nutrition_plans FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin select nutrition_plans" ON public.nutrition_plans FOR SELECT TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin update nutrition_plans" ON public.nutrition_plans FOR UPDATE TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin delete nutrition_plans" ON public.nutrition_plans FOR DELETE TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_updated_at_nutrition_plans BEFORE UPDATE ON public.nutrition_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Planos de exercícios
CREATE TABLE IF NOT EXISTS public.exercise_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'Plano de exercícios',
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  frequency text,
  duration_weeks integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exercise_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner insert exercise_plans" ON public.exercise_plans FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin select exercise_plans" ON public.exercise_plans FOR SELECT TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin update exercise_plans" ON public.exercise_plans FOR UPDATE TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin delete exercise_plans" ON public.exercise_plans FOR DELETE TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_updated_at_exercise_plans BEFORE UPDATE ON public.exercise_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Documentos clínicos (atestados, relatórios, laudos)
CREATE TABLE IF NOT EXISTS public.clinical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  category text NOT NULL,
  doc_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner insert clinical_documents" ON public.clinical_documents FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin select clinical_documents" ON public.clinical_documents FOR SELECT TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin update clinical_documents" ON public.clinical_documents FOR UPDATE TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin delete clinical_documents" ON public.clinical_documents FOR DELETE TO authenticated USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_updated_at_clinical_documents BEFORE UPDATE ON public.clinical_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();