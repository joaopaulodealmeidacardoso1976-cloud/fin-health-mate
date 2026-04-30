import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import { Pill, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";

interface Treatment {
  id: string; procedure: string; professional: string | null; notes: string | null; performed_at: string;
}

export const Treatment = ({ recordId, patientId }: { recordId: string; patientId: string }) => {
  const [list, setList] = useState<Treatment[]>([]);
  const [form, setForm] = useState({ procedure:"", professional:"", notes:"", performed_at: new Date().toISOString().slice(0,16) });

  const load = async () => {
    const { data } = await supabase.from("treatments").select("*").eq("record_id", recordId).order("performed_at", { ascending: false });
    setList((data ?? []) as Treatment[]);
  };
  useEffect(() => { load(); }, [recordId]);

  const add = async () => {
    if (!form.procedure.trim()) { toast.error("Procedimento obrigatório"); return; }
    const { error } = await supabase.from("treatments").insert({
      record_id: recordId, procedure: form.procedure, professional: form.professional || null,
      notes: form.notes || null, performed_at: new Date(form.performed_at).toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    setForm({ procedure:"", professional:"", notes:"", performed_at: new Date().toISOString().slice(0,16) });
    logAudit({ record_id: recordId, patient_id: patientId, section: "treatment", action: "create" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    await supabase.from("treatments").delete().eq("id", id);
    logAudit({ record_id: recordId, patient_id: patientId, section: "treatment", action: "delete" });
    load();
  };

  return (
    <SectionCard title="Tratamento" icon={<Pill className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
        <div><Label>Procedimento</Label><Input value={form.procedure} onChange={(e) => setForm({...form, procedure: e.target.value})} /></div>
        <div><Label>Profissional</Label><Input value={form.professional} onChange={(e) => setForm({...form, professional: e.target.value})} /></div>
        <div><Label>Data/hora</Label><Input type="datetime-local" value={form.performed_at} onChange={(e) => setForm({...form, performed_at: e.target.value})} /></div>
        <div className="md:col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
        <div className="md:col-span-2 flex justify-end"><Button onClick={add} className="bg-gold text-primary hover:bg-gold/90">Adicionar</Button></div>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum procedimento registrado</p> :
          list.map((t) => (
            <div key={t.id} className="border-l-2 border-gold pl-4 py-2 flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.procedure}</span>
                  <span className="text-xs text-muted-foreground">{new Date(t.performed_at).toLocaleString("pt-BR")}</span>
                </div>
                {t.professional && <p className="text-sm text-muted-foreground">{t.professional}</p>}
                {t.notes && <p className="text-sm mt-1">{t.notes}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
      </div>
    </SectionCard>
  );
};
