import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SectionCard } from "../SectionCard";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";

interface Anamnese {
  id?: string;
  chief_complaint: string; hda: string; past_history: string;
  family_history: string; allergies: string; medications: string;
  habits: string; chronic_conditions: string;
}

const empty: Anamnese = { chief_complaint:"", hda:"", past_history:"", family_history:"", allergies:"", medications:"", habits:"", chronic_conditions:"" };

export const Anamnesis = ({ recordId, patientId }: { recordId: string; patientId: string }) => {
  const [form, setForm] = useState<Anamnese>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("anamnesis").select("*").eq("record_id", recordId).maybeSingle();
      if (data) setForm(data as Anamnese);
    })();
  }, [recordId]);

  const save = async () => {
    setSaving(true);
    const payload = { ...form, record_id: recordId };
    const { error, data } = form.id
      ? await supabase.from("anamnesis").update(payload).eq("id", form.id).select().single()
      : await supabase.from("anamnesis").insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setForm(data as Anamnese);
    toast.success("Anamnese salva");
    logAudit({ record_id: recordId, patient_id: patientId, section: "anamnesis", action: form.id ? "update" : "create" });
  };

  const fields: { key: keyof Anamnese; label: string }[] = [
    { key: "chief_complaint", label: "Queixa principal" },
    { key: "hda", label: "História da doença atual (HDA)" },
    { key: "past_history", label: "Histórico médico pregresso" },
    { key: "family_history", label: "Histórico familiar" },
    { key: "allergies", label: "Alergias" },
    { key: "medications", label: "Medicamentos contínuos" },
    { key: "habits", label: "Hábitos de vida (tabagismo, álcool, atividade física)" },
    { key: "chronic_conditions", label: "Condições crônicas" },
  ];

  return (
    <SectionCard title="Anamnese" icon={<Stethoscope className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.key === "chief_complaint" || f.key === "hda" ? "md:col-span-2" : ""}>
            <Label>{f.label}</Label>
            <Textarea value={(form[f.key] as string) ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} rows={3} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
      </div>
    </SectionCard>
  );
};
