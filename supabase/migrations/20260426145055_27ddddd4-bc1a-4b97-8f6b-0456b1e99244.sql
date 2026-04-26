
CREATE TYPE public.movement_type AS ENUM ('in', 'out');

CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all inventory_items" ON public.inventory_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type public.movement_type NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  reason TEXT,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all inventory_movements" ON public.inventory_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.movement_type = 'in' THEN
    UPDATE public.inventory_items SET quantity = quantity + NEW.quantity WHERE id = NEW.item_id;
  ELSE
    UPDATE public.inventory_items SET quantity = quantity - NEW.quantity WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER apply_inventory_movement_trg
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();
