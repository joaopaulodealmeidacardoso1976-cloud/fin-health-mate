import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import { Dumbbell, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { generateExercisePlanPdf } from "@/lib/pdf";
import { useProfessional } from "@/hooks/useProfessional";
import { useClinic, loadImageAsDataUrl } from "@/hooks/useClinic";

interface Exercise { name: string; sets: string; reps: string; load: string; rest: string; notes: string; }
interface Plan { id: string; title: string; exercises: Exercise[]; frequency: string | null; duration_weeks: number | null; notes: string | null; created_at: string; }

export const ExercisePlan = ({ recordId, patientId, patientName }: { recordId: string; patientId: string; patientName: string }) => {
  const { profile } = useProfessional();
  const { clinic } = useClinic();
  const [list, setList] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Plano de exercícios");
  const [frequency, setFrequency] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: "", reps: "", load: "", rest: "", notes: "" }]);

  const load = async () => {
    const { data } = await supabase.from("exercise_plans").select("*").eq("record_id", recordId).order("created_at", { ascending: false });
    setList((data ?? []).map((p: any) => ({
      id: p.id, title: p.title, exercises: (p.exercises as Exercise[]) ?? [], frequency: p.frequency, duration_weeks: p.duration_weeks, notes: p.notes, created_at: p.created_at,
    })));
  };
  useEffect(() => { load(); }, [recordId]);

  const reset = () => { setOpen(false); setTitle("Plano de exercícios"); setFrequency(""); setDurationWeeks(""); setNotes(""); setExercises([{ name: "", sets: "", reps: "", load: "", rest: "", notes: "" }]); };

  const save = async () => {
    const valid = exercises.filter((e) => e.name.trim());
    if (!valid.length) { toast.error("Adicione ao menos um exercício"); return; }
    const { error } = await supabase.from("exercise_plans").insert({
      record_id: recordId, title, exercises: valid as any, frequency: frequency || null, duration_weeks: durationWeeks ? Number(durationWeeks) : null, notes: notes || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    logAudit({ record_id: recordId, patient_id: patientId, section: "exercise_plan", action: "create" });
    toast.success("Plano salvo");
    reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir plano?")) return;
    await supabase.from("exercise_plans").delete().eq("id", id);
    load();
  };

  const downloadPdf = async (p: Plan) => {
    const logo = await loadImageAsDataUrl(clinic.logoUrl);
    generateExercisePlanPdf({
      clinicName: clinic.name,
      clinicLogoDataUrl: logo,
      patientName, title: p.title, exercises: p.exercises, frequency: p.frequency, durationWeeks: p.duration_weeks, notes: p.notes,
      issuedAt: new Date(p.created_at),
      professional: profile?.fullName ?? null,
      professionalRegistry: profile?.registry ? `${profile.meta.council}${profile.uf ? `/${profile.uf}` : ""} ${profile.registry}` : null,
    });
  };

  return (
    <SectionCard title="Plano de Exercícios" icon={<Dumbbell className="h-5 w-5" />}
      action={!open && <Button size="sm" onClick={() => setOpen(true)} className="bg-gold text-primary hover:bg-gold/90"><Plus className="h-4 w-4 mr-1" />Novo</Button>}>
      {open && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Frequência semanal</Label><Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="3x/semana" /></div>
            <div><Label>Duração (semanas)</Label><Input type="number" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} /></div>
          </div>
          {exercises.map((ex, idx) => (
            <div key={idx} className="border border-border rounded-md p-3 space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="col-span-2"><Label>Exercício</Label><Input value={ex.name} onChange={(e) => { const c = [...exercises]; c[idx].name = e.target.value; setExercises(c); }} /></div>
                <div><Label>Séries</Label><Input value={ex.sets} onChange={(e) => { const c = [...exercises]; c[idx].sets = e.target.value; setExercises(c); }} /></div>
                <div><Label>Repetições</Label><Input value={ex.reps} onChange={(e) => { const c = [...exercises]; c[idx].reps = e.target.value; setExercises(c); }} /></div>
                <div><Label>Carga</Label><Input value={ex.load} onChange={(e) => { const c = [...exercises]; c[idx].load = e.target.value; setExercises(c); }} /></div>
                <div><Label>Descanso</Label><Input value={ex.rest} onChange={(e) => { const c = [...exercises]; c[idx].rest = e.target.value; setExercises(c); }} /></div>
                <div className="col-span-2 md:col-span-4"><Label>Observações</Label><Input value={ex.notes} onChange={(e) => { const c = [...exercises]; c[idx].notes = e.target.value; setExercises(c); }} /></div>
              </div>
              {exercises.length > 1 && <Button variant="ghost" size="sm" onClick={() => setExercises(exercises.filter((_, i) => i !== idx))} className="text-destructive">Remover</Button>}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setExercises([...exercises, { name: "", sets: "", reps: "", load: "", rest: "", notes: "" }])}><Plus className="h-4 w-4 mr-1" />Adicionar exercício</Button>
          <div><Label>Observações gerais</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>Cancelar</Button>
            <Button onClick={save} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum plano registrado</p> :
          list.map((p) => (
            <div key={p.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")} • {p.exercises.length} exercícios{p.frequency && ` • ${p.frequency}`}{p.duration_weeks && ` • ${p.duration_weeks} sem.`}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => downloadPdf(p)}><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
      </div>
    </SectionCard>
  );
};
