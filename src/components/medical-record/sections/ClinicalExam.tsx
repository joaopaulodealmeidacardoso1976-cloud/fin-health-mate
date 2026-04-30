import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { Odontogram, ToothStatus } from "./Odontogram";

interface ExamState {
  id?: string;
  blood_pressure: string; heart_rate: string; temperature: string; spo2: string;
  weight: string; height: string; observations: string;
  dental_chart: Record<string, ToothStatus>;
}

const empty: ExamState = { blood_pressure:"", heart_rate:"", temperature:"", spo2:"", weight:"", height:"", observations:"", dental_chart: {} };

export const ClinicalExam = ({ recordId, patientId, isDental }: { recordId: string; patientId: string; isDental: boolean }) => {
  const [form, setForm] = useState<ExamState>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("clinical_exams").select("*").eq("record_id", recordId).order("exam_date", { ascending: false }).limit(1).maybeSingle();
      if (data) setForm({
        id: data.id,
        blood_pressure: data.blood_pressure ?? "",
        heart_rate: data.heart_rate?.toString() ?? "",
        temperature: data.temperature?.toString() ?? "",
        spo2: data.spo2?.toString() ?? "",
        weight: data.weight?.toString() ?? "",
        height: data.height?.toString() ?? "",
        observations: data.observations ?? "",
        dental_chart: (data.dental_chart as Record<string, ToothStatus>) ?? {},
      });
    })();
  }, [recordId]);

  const imc = (() => {
    const w = parseFloat(form.weight); const h = parseFloat(form.height) / 100;
    if (!w || !h) return null;
    return (w / (h * h)).toFixed(1);
  })();

  const save = async () => {
    setSaving(true);
    const payload = {
      record_id: recordId,
      blood_pressure: form.blood_pressure || null,
      heart_rate: form.heart_rate ? Number(form.heart_rate) : null,
      temperature: form.temperature ? Number(form.temperature) : null,
      spo2: form.spo2 ? Number(form.spo2) : null,
      weight: form.weight ? Number(form.weight) : null,
      height: form.height ? Number(form.height) : null,
      observations: form.observations || null,
      dental_chart: form.dental_chart,
    };
    const { error, data } = form.id
      ? await supabase.from("clinical_exams").update(payload).eq("id", form.id).select().single()
      : await supabase.from("clinical_exams").insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setForm({ ...form, id: data.id });
    toast.success("Exame clínico salvo");
    logAudit({ record_id: recordId, patient_id: patientId, section: "clinical_exam", action: form.id ? "update" : "create" });
  };

  return (
    <SectionCard title="Exame Clínico" icon={<Activity className="h-5 w-5" />}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><Label>PA (mmHg)</Label><Input placeholder="120/80" value={form.blood_pressure} onChange={(e) => setForm({...form, blood_pressure: e.target.value})} /></div>
        <div><Label>FC (bpm)</Label><Input type="number" value={form.heart_rate} onChange={(e) => setForm({...form, heart_rate: e.target.value})} /></div>
        <div><Label>Temp (°C)</Label><Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({...form, temperature: e.target.value})} /></div>
        <div><Label>SpO₂ (%)</Label><Input type="number" value={form.spo2} onChange={(e) => setForm({...form, spo2: e.target.value})} /></div>
        <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} /></div>
        <div><Label>Altura (cm)</Label><Input type="number" value={form.height} onChange={(e) => setForm({...form, height: e.target.value})} /></div>
        <div><Label>IMC</Label><Input value={imc ?? "—"} disabled /></div>
      </div>
      <div className="mt-4">
        <Label>Observações clínicas</Label>
        <Textarea rows={4} value={form.observations} onChange={(e) => setForm({...form, observations: e.target.value})} />
      </div>
      {isDental && (
        <div className="mt-6">
          <Label className="mb-2 block">Odontograma</Label>
          <Odontogram value={form.dental_chart} onChange={(v) => setForm({...form, dental_chart: v})} />
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
      </div>
    </SectionCard>
  );
};
