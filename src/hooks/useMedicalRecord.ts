import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RecordType = "medical" | "dental";

export interface MedicalRecord {
  id: string;
  patient_id: string;
  owner_id: string;
  record_type: RecordType;
}

export const useMedicalRecord = (patientId: string | undefined) => {
  const { user } = useAuth();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!patientId || !user) return;
    setLoading(true);
    const { data } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patientId)
      .maybeSingle();
    if (data) {
      setRecord(data as MedicalRecord);
    } else {
      const { data: created } = await supabase
        .from("medical_records")
        .insert({ patient_id: patientId, record_type: "medical" })
        .select()
        .single();
      if (created) setRecord(created as MedicalRecord);
    }
    setLoading(false);
  }, [patientId, user]);

  useEffect(() => { load(); }, [load]);

  const updateType = async (type: RecordType) => {
    if (!record) return;
    const { error } = await supabase.from("medical_records").update({ record_type: type }).eq("id", record.id);
    if (!error) setRecord({ ...record, record_type: type });
  };

  return { record, loading, reload: load, updateType };
};
