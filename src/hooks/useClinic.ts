import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ClinicInfo {
  name: string;
  logoUrl: string | null;
}

const DEFAULT_NAME = "DADOSTOP CLINIC";

export const useClinic = () => {
  const { user } = useAuth();
  const [clinic, setClinic] = useState<ClinicInfo>({ name: DEFAULT_NAME, logoUrl: null });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setClinic({ name: DEFAULT_NAME, logoUrl: null }); setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("clinic_name, clinic_logo_url")
      .eq("id", user.id)
      .maybeSingle();
    setClinic({
      name: (data as any)?.clinic_name || DEFAULT_NAME,
      logoUrl: (data as any)?.clinic_logo_url || null,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  return { clinic, loading, reload: load };
};

// Helper: load image as data URL (for embedding in jsPDF)
export async function loadImageAsDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}
