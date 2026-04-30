import { supabase } from "@/integrations/supabase/client";

export const logAudit = async (params: {
  record_id?: string;
  patient_id?: string;
  section: string;
  action: string;
  details?: Record<string, unknown>;
}) => {
  await supabase.from("audit_log").insert({
    ...(params.record_id ? { record_id: params.record_id } : {}),
    ...(params.patient_id ? { patient_id: params.patient_id } : {}),
    section: params.section,
    action: params.action,
    details: (params.details ?? {}) as never,
  });
};
