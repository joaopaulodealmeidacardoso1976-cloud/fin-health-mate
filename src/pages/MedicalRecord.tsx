import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMedicalRecord } from "@/hooks/useMedicalRecord";
import { RecordHeader } from "@/components/medical-record/RecordHeader";
import { RecordSidebar, SectionId } from "@/components/medical-record/RecordSidebar";
import { Identification } from "@/components/medical-record/sections/Identification";
import { Anamnesis } from "@/components/medical-record/sections/Anamnesis";
import { ClinicalExam } from "@/components/medical-record/sections/ClinicalExam";
import { Diagnosis } from "@/components/medical-record/sections/Diagnosis";
import { TherapeuticPlan } from "@/components/medical-record/sections/TherapeuticPlan";
import { Treatment } from "@/components/medical-record/sections/Treatment";
import { Exams } from "@/components/medical-record/sections/Exams";
import { Prescriptions } from "@/components/medical-record/sections/Prescriptions";
import { Evolution } from "@/components/medical-record/sections/Evolution";
import { Attachments } from "@/components/medical-record/sections/Attachments";
import { AppointmentsHistory } from "@/components/medical-record/sections/AppointmentsHistory";
import { AuditLog } from "@/components/medical-record/sections/AuditLog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Patient {
  id: string; name: string; phone: string | null; email: string | null;
  birth_date: string | null; cpf: string | null; gender: string | null;
  address: string | null; emergency_contact: string | null;
}

const MedicalRecord = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { record, loading, updateType } = useMedicalRecord(patientId);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [active, setActive] = useState<SectionId>("identification");
  const [allergies, setAllergies] = useState<string | null>(null);
  const [risk, setRisk] = useState<"low" | "medium" | "high" | null>(null);
  const [nextAppt, setNextAppt] = useState<string | null>(null);

  useEffect(() => { document.title = "Prontuário | DADOSTOP CLINIC"; }, []);

  const loadPatient = async () => {
    if (!patientId) return;
    const { data } = await supabase.from("patients").select("*").eq("id", patientId).maybeSingle();
    if (data) setPatient(data as Patient);
  };
  useEffect(() => { loadPatient(); }, [patientId]);

  useEffect(() => {
    if (!record || !patientId) return;
    (async () => {
      const { data: a } = await supabase.from("anamnesis").select("allergies").eq("record_id", record.id).maybeSingle();
      setAllergies(a?.allergies ?? null);
      const { data: d } = await supabase.from("diagnoses").select("risk").eq("record_id", record.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      setRisk((d?.risk as "low"|"medium"|"high") ?? null);
      const { data: ap } = await supabase.from("appointments").select("scheduled_at").eq("patient_id", patientId).gte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(1).maybeSingle();
      setNextAppt(ap?.scheduled_at ?? null);
    })();
  }, [record, patientId, active]);

  if (loading || !record || !patient) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando prontuário...</div>;
  }

  const isDental = record.record_type === "dental";

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/prontuarios")}>
          <ArrowLeft className="h-4 w-4 mr-1" />Voltar
        </Button>
      </div>

      <RecordHeader
        patientName={patient.name}
        birthDate={patient.birth_date}
        allergies={allergies}
        risk={risk}
        nextAppointment={nextAppt}
        recordType={record.record_type}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <aside className="lg:border-r lg:border-border lg:pr-4">
          <RecordSidebar active={active} onChange={setActive} />
        </aside>
        <main className="min-w-0">
          {active === "identification" && <Identification patient={patient} record={record} onTypeChange={updateType} onPatientUpdate={loadPatient} />}
          {active === "anamnesis" && <Anamnesis recordId={record.id} patientId={patient.id} />}
          {active === "exam" && <ClinicalExam recordId={record.id} patientId={patient.id} isDental={isDental} />}
          {active === "diagnosis" && <Diagnosis recordId={record.id} patientId={patient.id} />}
          {active === "plan" && <TherapeuticPlan recordId={record.id} patientId={patient.id} />}
          {active === "treatment" && <Treatment recordId={record.id} patientId={patient.id} />}
          {active === "exams" && <Exams recordId={record.id} patientId={patient.id} />}
          {active === "prescriptions" && <Prescriptions recordId={record.id} patientId={patient.id} patientName={patient.name} patientCpf={patient.cpf} recordType={record.record_type} />}
          {active === "evolution" && <Evolution recordId={record.id} patientId={patient.id} />}
          {active === "attachments" && <Attachments recordId={record.id} patientId={patient.id} />}
          {active === "appointments" && <AppointmentsHistory patientId={patient.id} />}
          {active === "audit" && <AuditLog recordId={record.id} />}
        </main>
      </div>
    </div>
  );
};

export default MedicalRecord;
