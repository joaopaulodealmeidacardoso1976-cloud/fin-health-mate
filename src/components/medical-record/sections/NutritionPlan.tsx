import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import { Apple, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { generateNutritionPlanPdf } from "@/lib/pdf";
import { useProfessional } from "@/hooks/useProfessional";

interface Meal { name: string; time: string; items: string; }
interface Plan { id: string; title: string; meals: Meal[]; guidelines: string | null; valid_until: string | null; created_at: string; }

export const NutritionPlan = ({ recordId, patientId, patientName }: { recordId: string; patientId: string; patientName: string }) => {
  const { profile } = useProfessional();
  const [list, setList] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Plano alimentar");
  const [guidelines, setGuidelines] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [meals, setMeals] = useState<Meal[]>([
    { name: "Café da manhã", time: "07:00", items: "" },
    { name: "Lanche da manhã", time: "10:00", items: "" },
    { name: "Almoço", time: "12:30", items: "" },
    { name: "Lanche da tarde", time: "16:00", items: "" },
    { name: "Jantar", time: "19:30", items: "" },
  ]);

  const load = async () => {
    const { data } = await supabase.from("nutrition_plans").select("*").eq("record_id", recordId).order("created_at", { ascending: false });
    setList((data ?? []).map((p: any) => ({
      id: p.id, title: p.title, meals: (p.meals as Meal[]) ?? [], guidelines: p.guidelines, valid_until: p.valid_until, created_at: p.created_at,
    })));
  };
  useEffect(() => { load(); }, [recordId]);

  const reset = () => { setOpen(false); setTitle("Plano alimentar"); setGuidelines(""); setValidUntil(""); };

  const save = async () => {
    const { error } = await supabase.from("nutrition_plans").insert({
      record_id: recordId, title, meals: meals as any, guidelines: guidelines || null, valid_until: validUntil || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    logAudit({ record_id: recordId, patient_id: patientId, section: "nutrition_plan", action: "create" });
    toast.success("Plano alimentar salvo");
    reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir plano?")) return;
    await supabase.from("nutrition_plans").delete().eq("id", id);
    load();
  };

  const downloadPdf = (p: Plan) => {
    generateNutritionPlanPdf({
      clinicName: "DADOSTOP CLINIC",
      patientName, title: p.title, meals: p.meals, guidelines: p.guidelines, validUntil: p.valid_until,
      issuedAt: new Date(p.created_at),
      professional: profile?.fullName ?? null,
      professionalRegistry: profile?.registry ? `${profile.meta.council}${profile.uf ? `/${profile.uf}` : ""} ${profile.registry}` : null,
    });
  };

  return (
    <SectionCard title="Plano Alimentar" icon={<Apple className="h-5 w-5" />}
      action={!open && <Button size="sm" onClick={() => setOpen(true)} className="bg-gold text-primary hover:bg-gold/90"><Plus className="h-4 w-4 mr-1" />Novo</Button>}>
      {open && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Válido até</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            {meals.map((m, idx) => (
              <div key={idx} className="border border-border rounded-md p-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2"><Label>Refeição</Label><Input value={m.name} onChange={(e) => { const c = [...meals]; c[idx].name = e.target.value; setMeals(c); }} /></div>
                  <div><Label>Horário</Label><Input value={m.time} onChange={(e) => { const c = [...meals]; c[idx].time = e.target.value; setMeals(c); }} /></div>
                </div>
                <div><Label>Alimentos / preparações</Label><Textarea rows={2} value={m.items} onChange={(e) => { const c = [...meals]; c[idx].items = e.target.value; setMeals(c); }} /></div>
                {meals.length > 1 && <Button variant="ghost" size="sm" onClick={() => setMeals(meals.filter((_, i) => i !== idx))} className="text-destructive">Remover refeição</Button>}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setMeals([...meals, { name: "Nova refeição", time: "", items: "" }])}><Plus className="h-4 w-4 mr-1" />Adicionar refeição</Button>
          </div>
          <div><Label>Orientações gerais</Label><Textarea rows={3} value={guidelines} onChange={(e) => setGuidelines(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>Cancelar</Button>
            <Button onClick={save} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum plano alimentar registrado</p> :
          list.map((p) => (
            <div key={p.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")} • {p.meals.length} refeições{p.valid_until && ` • válido até ${new Date(p.valid_until).toLocaleDateString("pt-BR")}`}</p>
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
