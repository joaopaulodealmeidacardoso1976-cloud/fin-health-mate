import { supabase } from "@/integrations/supabase/client";

export const logAudit = async (params: {
  record_id?: string | null;
  patient_id?: string | null;
  section: string;
  action: string;
  details?: Record<string, unknown>;
}) => {
  await supabase.from("audit_log").insert({
    record_id: params.record_id ?? null,
    patient_id: params.patient_id ?? null,
    section: params.section,
    action: params.action,
    details: params.details ?? {},
  });
};
