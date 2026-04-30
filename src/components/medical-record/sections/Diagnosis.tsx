import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "../SectionCard";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { searchCid10 } from "@/lib/cid10";

interface DiagState {
  id?: string;
  primary_diagnosis: string;
  secondary_diagnoses: string;
  cid_code: string;
  risk: "low" | "medium" | "high";
}

export const Diagnosis = ({ recordId, patientId }: { recordId: string; patientId: string }) => {
  const [form, setForm] = useState<DiagState>({ primary_diagnosis:"", secondary_diagnoses:"", cid_code:"", risk:"low" });
  const [cidQuery, setCidQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const suggestions = searchCid10(cidQuery);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("diagnoses").select("*").eq("record_id", recordId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setForm({
        id: data.id,
        primary_diagnosis: data.primary_diagnosis,
        secondary_diagnoses: Array.isArray(data.secondary_diagnoses) ? (data.secondary_diagnoses as string[]).join("\n") : "",
        cid_code: data.cid_code ?? "",
        risk: (data.risk as "low"|"medium"|"high") ?? "low",
      });
    })();
  }, [recordId]);

  const save = async () => {
    if (!form.primary_diagnosis.trim()) { toast.error("Diagnóstico principal é obrigatório"); return; }
    setSaving(true);
    const payload = {
      record_id: recordId,
      primary_diagnosis: form.primary_diagnosis,
      secondary_diagnoses: form.secondary_diagnoses.split("\n").map(s => s.trim()).filter(Boolean),
      cid_code: form.cid_code || null,
      risk: form.risk,
    };
    const { error, data } = form.id
      ? await supabase.from("diagnoses").update(payload).eq("id", form.id).select().single()
      : await supabase.from("diagnoses").insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setForm({ ...form, id: data.id });
    toast.success("Diagnóstico salvo");
    logAudit({ record_id: recordId, patient_id: patientId, section: "diagnosis", action: form.id ? "update" : "create" });
  };

  return (
    <SectionCard title="Diagnóstico" icon={<ClipboardList className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Diagnóstico principal</Label>
          <Input value={form.primary_diagnosis} onChange={(e) => setForm({...form, primary_diagnosis: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <Label>Diagnósticos secundários (um por linha)</Label>
          <Textarea rows={3} value={form.secondary_diagnoses} onChange={(e) => setForm({...form, secondary_diagnoses: e.target.value})} />
        </div>
        <div className="relative">
          <Label>Código CID-10</Label>
          <Input value={form.cid_code} onChange={(e) => { setForm({...form, cid_code: e.target.value}); setCidQuery(e.target.value); }} placeholder="Buscar CID..." />
          {suggestions.length > 0 && cidQuery && (
            <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((s) => (
                <button key={s.code} type="button" onClick={() => { setForm({...form, cid_code: `${s.code} - ${s.description}`}); setCidQuery(""); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent">
                  <span className="font-medium">{s.code}</span> — {s.description}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>Grau de risco</Label>
          <Select value={form.risk} onValueChange={(v) => setForm({...form, risk: v as "low"|"medium"|"high"})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixo</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="high">Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
      </div>
    </SectionCard>
  );
};
