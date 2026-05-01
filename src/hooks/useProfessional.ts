import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, ProfessionalCategory, getCategory } from "@/lib/professionalCategories";

export interface ProfessionalProfile {
  category: ProfessionalCategory;
  registry: string | null;
  uf: string | null;
  fullName: string | null;
  meta: typeof CATEGORIES[ProfessionalCategory];
}

export const useProfessional = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, professional_category, professional_registry, professional_uf")
        .eq("id", user.id)
        .maybeSingle();
      const cat = (data?.professional_category as ProfessionalCategory) || "medical";
      setProfile({
        category: cat,
        registry: data?.professional_registry ?? null,
        uf: data?.professional_uf ?? null,
        fullName: data?.full_name ?? null,
        meta: getCategory(cat),
      });
      setLoading(false);
    })();
  }, [user]);

  return { profile, loading };
};
