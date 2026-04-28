-- 1) Add owner_id columns (nullable initially for backfill)
ALTER TABLE public.patients              ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.appointments          ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.payments              ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.expenses              ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.inventory_items       ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.inventory_movements   ADD COLUMN IF NOT EXISTS owner_id uuid;

-- 2) Backfill existing rows -> assign to admin account
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users
  WHERE email = 'joaopaulodealmeidacardoso1976@gmail.com'
  LIMIT 1;

  IF admin_uid IS NOT NULL THEN
    UPDATE public.patients            SET owner_id = admin_uid WHERE owner_id IS NULL;
    UPDATE public.appointments        SET owner_id = admin_uid WHERE owner_id IS NULL;
    UPDATE public.payments            SET owner_id = admin_uid WHERE owner_id IS NULL;
    UPDATE public.expenses            SET owner_id = admin_uid WHERE owner_id IS NULL;
    UPDATE public.inventory_items     SET owner_id = admin_uid WHERE owner_id IS NULL;
    UPDATE public.inventory_movements SET owner_id = admin_uid WHERE owner_id IS NULL;
  END IF;
END $$;

-- 3) Enforce NOT NULL + default to current user
ALTER TABLE public.patients            ALTER COLUMN owner_id SET NOT NULL, ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.appointments        ALTER COLUMN owner_id SET NOT NULL, ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.payments            ALTER COLUMN owner_id SET NOT NULL, ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.expenses            ALTER COLUMN owner_id SET NOT NULL, ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.inventory_items     ALTER COLUMN owner_id SET NOT NULL, ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.inventory_movements ALTER COLUMN owner_id SET NOT NULL, ALTER COLUMN owner_id SET DEFAULT auth.uid();

-- 4) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_owner            ON public.patients(owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_owner        ON public.appointments(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner            ON public.payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner            ON public.expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_owner     ON public.inventory_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_owner ON public.inventory_movements(owner_id);

-- 5) Replace permissive policies with per-owner policies (admin sees all)
DROP POLICY IF EXISTS "auth all patients"            ON public.patients;
DROP POLICY IF EXISTS "auth all appointments"        ON public.appointments;
DROP POLICY IF EXISTS "auth all payments"            ON public.payments;
DROP POLICY IF EXISTS "auth all expenses"            ON public.expenses;
DROP POLICY IF EXISTS "auth all inventory_items"     ON public.inventory_items;
DROP POLICY IF EXISTS "auth all inventory_movements" ON public.inventory_movements;

-- patients
CREATE POLICY "owner or admin select patients" ON public.patients FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner insert patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin update patients" ON public.patients FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner or admin delete patients" ON public.patients FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- appointments
CREATE POLICY "owner or admin select appointments" ON public.appointments FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner insert appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner or admin delete appointments" ON public.appointments FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- payments
CREATE POLICY "owner or admin select payments" ON public.payments FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner insert payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin update payments" ON public.payments FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner or admin delete payments" ON public.payments FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- expenses
CREATE POLICY "owner or admin select expenses" ON public.expenses FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner insert expenses" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin update expenses" ON public.expenses FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner or admin delete expenses" ON public.expenses FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- inventory_items
CREATE POLICY "owner or admin select inventory_items" ON public.inventory_items FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner insert inventory_items" ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin update inventory_items" ON public.inventory_items FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner or admin delete inventory_items" ON public.inventory_items FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- inventory_movements
CREATE POLICY "owner or admin select inventory_movements" ON public.inventory_movements FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner insert inventory_movements" ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner or admin update inventory_movements" ON public.inventory_movements FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner or admin delete inventory_movements" ON public.inventory_movements FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));