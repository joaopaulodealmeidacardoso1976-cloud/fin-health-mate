import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { ProfessionalCategory } from "@/lib/professionalCategories";

interface Field { key: string; label: string; type: "text" | "textarea" | "number"; placeholder?: string; }

const FIELDS: Partial<Record<ProfessionalCategory, Field[]>> = {
  psychology: [
    { key: "queixa_emocional", label: "Queixa emocional / motivo da consulta", type: "textarea" },
    { key: "historia_psiquica", label: "História psíquica", type: "textarea" },
    { key: "estado_mental", label: "Exame do estado mental", type: "textarea" },
    { key: "hipotese_diagnostica", label: "Hipótese diagnóstica (CID-F)", type: "text" },
    { key: "conduta", label: "Conduta / encaminhamento", type: "textarea" },
  ],
  physiotherapy: [
    { key: "queixa_funcional", label: "Queixa funcional", type: "textarea" },
    { key: "dor_eva", label: "Dor (EVA 0-10)", type: "number", placeholder: "0-10" },
    { key: "avaliacao_postural", label: "Avaliação postural", type: "textarea" },
    { key: "adm", label: "ADM (amplitude de movimento)", type: "textarea" },
    { key: "forca_muscular", label: "Força muscular (escala 0-5)", type: "textarea" },
    { key: "testes_especiais", label: "Testes especiais", type: "textarea" },
    { key: "conduta", label: "Conduta", type: "textarea" },
  ],
  speech_therapy: [
    { key: "fala", label: "Avaliação de fala", type: "textarea" },
    { key: "linguagem", label: "Avaliação de linguagem", type: "textarea" },
    { key: "audicao", label: "Avaliação auditiva", type: "textarea" },
    { key: "voz", label: "Avaliação vocal", type: "textarea" },
    { key: "conduta", label: "Conduta", type: "textarea" },
  ],
  occupational_therapy: [
    { key: "avd", label: "AVDs (Atividades de Vida Diária)", type: "textarea" },
    { key: "aivd", label: "AIVDs (Atividades Instrumentais)", type: "textarea" },
    { key: "katz", label: "Índice de Katz", type: "text" },
    { key: "lawton", label: "Escala de Lawton", type: "text" },
    { key: "intervencoes", label: "Intervenções propostas", type: "textarea" },
  ],
  physical_education: [
    { key: "pa_repouso", label: "PA repouso", type: "text", placeholder: "120/80" },
    { key: "fc_repouso", label: "FC repouso (bpm)", type: "number" },
    { key: "vo2", label: "VO₂ estimado", type: "text" },
    { key: "flexibilidade", label: "Flexibilidade (sentar e alcançar)", type: "text" },
    { key: "forca", label: "Avaliação de força", type: "textarea" },
    { key: "objetivo", label: "Objetivo do treino", type: "textarea" },
  ],
};

interface Assessment { id: string; data: Record<string, any>; notes: string | null; assessed_at: string; }

export const FunctionalAssessment = ({ recordId, patientId, category }: { recordId: string; patientId: string; category: ProfessionalCategory }) => {
  const fields = FIELDS[category] ?? [];
  const [list, setList] = useState<Assessment[]>([]);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data: rows } = await supabase.from("professional_assessments").select("*").eq("record_id", recordId).eq("category", category).order("assessed_at", { ascending: false });
    setList((rows ?? []).map((r: any) => ({ id: r.id, data: r.data ?? {}, notes: r.notes, assessed_at: r.assessed_at })));
  };
  useEffect(() => { load(); }, [recordId, category]);

  const save = async () => {
    const { error } = await supabase.from("professional_assessments").insert({
      record_id: recordId, category, data: data as any, notes: notes || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    logAudit({ record_id: recordId, patient_id: patientId, section: "assessment", action: "create" });
    toast.success("Avaliação salva");
    setOpen(false); setData({}); setNotes(""); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir avaliação?")) return;
    await supabase.from("professional_assessments").delete().eq("id", id);
    load();
  };

  if (fields.length === 0) {
    return <SectionCard title="Avaliação Funcional" icon={<ClipboardCheck className="h-5 w-5" />}>
      <p className="text-sm text-muted-foreground">Nenhum formulário específico para esta categoria.</p>
    </SectionCard>;
  }

  return (
    <SectionCard title="Avaliação Funcional" icon={<ClipboardCheck className="h-5 w-5" />}
      action={!open && <Button size="sm" onClick={() => setOpen(true)} className="bg-gold text-primary hover:bg-gold/90"><Plus className="h-4 w-4 mr-1" />Nova</Button>}>
      {open && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea rows={2} value={data[f.key] ?? ""} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} />
              ) : (
                <Input type={f.type} placeholder={f.placeholder} value={data[f.key] ?? ""} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
          <div><Label>Observações</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setOpen(false); setData({}); setNotes(""); }}>Cancelar</Button>
            <Button onClick={save} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhuma avaliação registrada</p> :
          list.map((a) => (
            <div key={a.id} className="border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground">{new Date(a.assessed_at).toLocaleString("pt-BR")}</p>
                <Button variant="ghost" size="icon" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <dl className="mt-2 space-y-1 text-sm">
                {fields.map((f) => a.data[f.key] ? (
                  <div key={f.key}><dt className="text-xs text-muted-foreground">{f.label}</dt><dd>{a.data[f.key]}</dd></div>
                ) : null)}
              </dl>
              {a.notes && <p className="text-sm mt-2 text-muted-foreground"><span className="font-medium">Obs:</span> {a.notes}</p>}
            </div>
          ))}
      </div>
    </SectionCard>
  );
};
