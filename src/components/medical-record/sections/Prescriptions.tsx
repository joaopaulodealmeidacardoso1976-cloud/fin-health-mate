import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import { FileText, Trash2, Plus, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { searchMedications } from "@/lib/medications";
import { generatePrescriptionPdf } from "@/lib/pdf";

interface Item { medication: string; dosage: string; frequency: string; duration: string; instructions: string; }
interface Prescription { id: string; professional: string | null; professional_registry: string | null; notes: string | null; prescribed_at: string; items: Item[]; }

export const Prescriptions = ({ recordId, patientId, patientName, patientCpf }: { recordId: string; patientId: string; patientName: string; patientCpf: string | null; }) => {
  const [list, setList] = useState<Prescription[]>([]);
  const [open, setOpen] = useState(false);
  const [professional, setProfessional] = useState("");
  const [professionalRegistry, setProfessionalRegistry] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([{ medication:"", dosage:"", frequency:"", duration:"", instructions:"" }]);
  const [activeQuery, setActiveQuery] = useState<{ idx: number; q: string } | null>(null);

  const load = async () => {
    const { data: pres } = await supabase.from("prescriptions").select("*").eq("record_id", recordId).order("prescribed_at", { ascending: false });
    if (!pres) { setList([]); return; }
    const ids = pres.map(p => p.id);
    const { data: itms } = ids.length ? await supabase.from("prescription_items").select("*").in("prescription_id", ids) : { data: [] };
    setList(pres.map(p => ({
      id: p.id, professional: p.professional, notes: p.notes, prescribed_at: p.prescribed_at,
      items: (itms ?? []).filter(i => i.prescription_id === p.id).map(i => ({
        medication: i.medication, dosage: i.dosage ?? "", frequency: i.frequency ?? "", duration: i.duration ?? "", instructions: i.instructions ?? "",
      })),
    })));
  };
  useEffect(() => { load(); }, [recordId]);

  const reset = () => {
    setProfessional(""); setNotes(""); setItems([{ medication:"", dosage:"", frequency:"", duration:"", instructions:"" }]); setOpen(false);
  };

  const save = async () => {
    const valid = items.filter(i => i.medication.trim());
    if (!valid.length) { toast.error("Adicione ao menos um medicamento"); return; }
    const { data: pres, error } = await supabase.from("prescriptions").insert({
      record_id: recordId, professional: professional || null, notes: notes || null,
    }).select().single();
    if (error || !pres) { toast.error(error?.message ?? "Erro"); return; }
    const itemRows = valid.map(i => ({ prescription_id: pres.id, ...i, dosage: i.dosage || null, frequency: i.frequency || null, duration: i.duration || null, instructions: i.instructions || null }));
    await supabase.from("prescription_items").insert(itemRows);
    logAudit({ record_id: recordId, patient_id: patientId, section: "prescriptions", action: "create" });
    toast.success("Prescrição salva");
    reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir prescrição?")) return;
    await supabase.from("prescriptions").delete().eq("id", id);
    load();
  };

  const downloadPdf = (p: Prescription) => {
    generatePrescriptionPdf({
      clinicName: "DADOSTOP CLINIC",
      patientName, patientCpf,
      professional: p.professional, prescribedAt: new Date(p.prescribed_at),
      items: p.items, notes: p.notes,
    });
  };

  const duplicate = (p: Prescription) => {
    setProfessional(p.professional ?? ""); setNotes(p.notes ?? "");
    setItems(p.items.length ? p.items : [{ medication:"", dosage:"", frequency:"", duration:"", instructions:"" }]);
    setOpen(true);
  };

  return (
    <SectionCard title="Prescrições / Receitas" icon={<FileText className="h-5 w-5" />}
      action={!open && <Button size="sm" onClick={() => setOpen(true)} className="bg-gold text-primary hover:bg-gold/90"><Plus className="h-4 w-4 mr-1" />Nova</Button>}>
      {open && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Profissional</Label><Input value={professional} onChange={(e) => setProfessional(e.target.value)} /></div>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="border border-border rounded-md p-3 space-y-2 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 relative">
                <div className="relative">
                  <Label>Medicamento</Label>
                  <Input value={it.medication}
                    onChange={(e) => { const c = [...items]; c[idx].medication = e.target.value; setItems(c); setActiveQuery({ idx, q: e.target.value }); }} />
                  {activeQuery?.idx === idx && activeQuery.q && searchMedications(activeQuery.q).length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                      {searchMedications(activeQuery.q).map((m) => (
                        <button key={m} type="button" onClick={() => { const c = [...items]; c[idx].medication = m; setItems(c); setActiveQuery(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent">{m}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div><Label>Dosagem</Label><Input value={it.dosage} onChange={(e) => { const c=[...items]; c[idx].dosage = e.target.value; setItems(c); }} /></div>
                <div><Label>Frequência</Label><Input value={it.frequency} placeholder="Ex: 8/8h" onChange={(e) => { const c=[...items]; c[idx].frequency = e.target.value; setItems(c); }} /></div>
                <div><Label>Duração</Label><Input value={it.duration} placeholder="Ex: 7 dias" onChange={(e) => { const c=[...items]; c[idx].duration = e.target.value; setItems(c); }} /></div>
                <div className="md:col-span-2"><Label>Instruções</Label><Input value={it.instructions} onChange={(e) => { const c=[...items]; c[idx].instructions = e.target.value; setItems(c); }} /></div>
              </div>
              {items.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-destructive">Remover</Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setItems([...items, { medication:"", dosage:"", frequency:"", duration:"", instructions:"" }])}>
            <Plus className="h-4 w-4 mr-1" />Adicionar medicamento
          </Button>
          <div><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>Cancelar</Button>
            <Button onClick={save} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhuma prescrição registrada</p> :
          list.map((p) => (
            <div key={p.id} className="border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{new Date(p.prescribed_at).toLocaleString("pt-BR")} {p.professional && `• ${p.professional}`}</p>
                  <ul className="mt-1 space-y-1">
                    {p.items.map((i, k) => (
                      <li key={k} className="text-sm"><span className="font-medium">{i.medication}</span> {i.dosage && `— ${i.dosage}`} {i.frequency && `• ${i.frequency}`} {i.duration && `• ${i.duration}`}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => downloadPdf(p)} title="Baixar PDF"><Download className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => duplicate(p)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </SectionCard>
  );
};
