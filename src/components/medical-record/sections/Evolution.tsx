import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import { History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";

interface Note { id: string; professional: string | null; note: string; noted_at: string; }

export const Evolution = ({ recordId, patientId }: { recordId: string; patientId: string }) => {
  const [list, setList] = useState<Note[]>([]);
  const [form, setForm] = useState({ professional: "", note: "" });

  const load = async () => {
    const { data } = await supabase.from("clinical_evolution").select("*").eq("record_id", recordId).order("noted_at", { ascending: false });
    setList((data ?? []) as Note[]);
  };
  useEffect(() => { load(); }, [recordId]);

  const add = async () => {
    if (!form.note.trim()) { toast.error("Nota obrigatória"); return; }
    const { error } = await supabase.from("clinical_evolution").insert({ record_id: recordId, professional: form.professional || null, note: form.note });
    if (error) { toast.error(error.message); return; }
    setForm({ professional: "", note: "" });
    logAudit({ record_id: recordId, patient_id: patientId, section: "evolution", action: "create" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir nota?")) return;
    await supabase.from("clinical_evolution").delete().eq("id", id);
    load();
  };

  return (
    <SectionCard title="Evolução Clínica" icon={<History className="h-5 w-5" />}>
      <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
        <div><Label>Profissional</Label><Input value={form.professional} onChange={(e) => setForm({...form, professional: e.target.value})} /></div>
        <div><Label>Nota de evolução</Label><Textarea rows={3} value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} /></div>
        <div className="flex justify-end"><Button onClick={add} className="bg-gold text-primary hover:bg-gold/90">Registrar</Button></div>
      </div>
      <div className="space-y-3">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro de evolução</p> :
          list.map((n) => (
            <div key={n.id} className="border-l-2 border-gold pl-4 py-2 flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{new Date(n.noted_at).toLocaleString("pt-BR")} {n.professional && `• ${n.professional}`}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{n.note}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
      </div>
    </SectionCard>
  );
};
