import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SectionCard } from "../SectionCard";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";

interface PlanState {
  id?: string; objectives: string; care_plan: string; interventions: string; professionals: string; frequency: string;
}
const empty: PlanState = { objectives:"", care_plan:"", interventions:"", professionals:"", frequency:"" };

export const TherapeuticPlan = ({ recordId, patientId }: { recordId: string; patientId: string }) => {
  const [form, setForm] = useState<PlanState>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("therapeutic_plans").select("*").eq("record_id", recordId).maybeSingle();
      if (data) setForm(data as PlanState);
    })();
  }, [recordId]);

  const save = async () => {
    setSaving(true);
    const payload = { ...form, record_id: recordId };
    const { error, data } = form.id
      ? await supabase.from("therapeutic_plans").update(payload).eq("id", form.id).select().single()
      : await supabase.from("therapeutic_plans").insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setForm(data as PlanState);
    toast.success("Plano salvo");
    logAudit({ record_id: recordId, patient_id: patientId, section: "therapeutic_plan", action: form.id ? "update" : "create" });
  };

  return (
    <SectionCard title="Projeto Terapêutico" icon={<Target className="h-5 w-5" />}>
      <div className="space-y-4">
        <div><Label>Objetivos do tratamento</Label><Textarea rows={3} value={form.objectives ?? ""} onChange={(e) => setForm({...form, objectives: e.target.value})} /></div>
        <div><Label>Plano de cuidado</Label><Textarea rows={3} value={form.care_plan ?? ""} onChange={(e) => setForm({...form, care_plan: e.target.value})} /></div>
        <div><Label>Intervenções propostas</Label><Textarea rows={3} value={form.interventions ?? ""} onChange={(e) => setForm({...form, interventions: e.target.value})} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Profissionais envolvidos</Label><Input value={form.professionals ?? ""} onChange={(e) => setForm({...form, professionals: e.target.value})} /></div>
          <div><Label>Frequência de acompanhamento</Label><Input value={form.frequency ?? ""} onChange={(e) => setForm({...form, frequency: e.target.value})} placeholder="Ex: semanal, quinzenal" /></div>
        </div>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={save} disabled={saving} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button></div>
    </SectionCard>
  );
};
