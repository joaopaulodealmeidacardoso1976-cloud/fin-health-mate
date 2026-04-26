import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isPast, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient { id: string; name: string; email: string | null; }
interface Appt {
  id: string; patient_id: string; scheduled_at: string; duration_minutes: number;
  status: "scheduled" | "attended" | "missed" | "cancelled"; notes: string | null;
  patients: { name: string; email: string | null } | null;
}

const statusLabel: Record<string, string> = { scheduled: "Agendado", attended: "Compareceu", missed: "Faltou", cancelled: "Cancelado" };
const statusColor: Record<string, string> = {
  scheduled: "bg-gold-soft text-gold-deep border-gold/30",
  attended: "bg-success/15 text-success border-success/30",
  missed: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

const Schedule = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { document.title = "Agenda | Painel Clínico"; load(); }, []);

  const load = async () => {
    const [{ data: ps }, { data: as }] = await Promise.all([
      supabase.from("patients").select("id, name, email").order("name"),
      supabase.from("appointments").select("*, patients(name, email)").order("scheduled_at", { ascending: true }),
    ]);
    setPatients(ps ?? []);
    setAppts((as ?? []) as any);
  };

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patient_id = fd.get("patient_id") as string;
    const date = fd.get("date") as string;
    const time = fd.get("time") as string;
    const duration_minutes = Number(fd.get("duration") || 30);
    const notes = (fd.get("notes") as string) || null;
    if (!patient_id || !date || !time) { toast.error("Preencha todos os campos"); return; }
    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    const { error } = await supabase.from("appointments").insert({ patient_id, scheduled_at, duration_minutes, notes });
    if (error) toast.error(error.message);
    else { toast.success("Consulta agendada"); setOpen(false); load(); }
  };

  const updateStatus = async (a: Appt, status: Appt["status"]) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status atualizado");
    load();
    // Send email alert for missed appointments
    if (status === "missed" || status === "attended") {
      try {
        await supabase.functions.invoke("notify-appointment", {
          body: { appointment_id: a.id, status, patient_name: a.patients?.name, scheduled_at: a.scheduled_at },
        });
      } catch (err) { console.warn("notify failed", err); }
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta consulta?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removida"); load(); }
  };

  const groups: Record<string, Appt[]> = {};
  appts.forEach((a) => {
    const d = new Date(a.scheduled_at);
    const key = isToday(d) ? "Hoje" : isTomorrow(d) ? "Amanhã" : isPast(d) ? "Anteriores" : format(d, "EEEE, dd 'de' MMMM", { locale: ptBR });
    (groups[key] ??= []).push(a);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Gerencie consultas e marque presenças</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Nova consulta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Agendar consulta</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div>
                <Label>Paciente</Label>
                <Select name="patient_id">
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input type="hidden" name="patient_id" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data</Label><Input type="date" name="date" required /></div>
                <div><Label>Hora</Label><Input type="time" name="time" required /></div>
              </div>
              <div><Label>Duração (min)</Label><Input type="number" name="duration" defaultValue={30} min={5} /></div>
              <div><Label>Observações</Label><Textarea name="notes" rows={2} /></div>
              <DialogFooter><Button type="submit" className="bg-gold text-primary hover:bg-gold/90">Agendar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(groups).length === 0 ? (
        <Card className="shadow-soft"><CardContent className="py-16 text-center text-muted-foreground">Nenhuma consulta agendada</CardContent></Card>
      ) : (
        Object.entries(groups).map(([k, items]) => (
          <div key={k}>
            <h2 className="font-display text-xl mb-3 capitalize">{k}</h2>
            <div className="space-y-2">
              {items.map((a) => {
                const d = new Date(a.scheduled_at);
                return (
                  <Card key={a.id} className="shadow-soft">
                    <CardContent className="py-4 flex items-center gap-4 flex-wrap">
                      <div className="text-center min-w-[60px]">
                        <p className="font-display text-2xl">{format(d, "HH:mm")}</p>
                        <p className="text-xs text-muted-foreground">{a.duration_minutes}min</p>
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-medium">{a.patients?.name ?? "—"}</p>
                        {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                      </div>
                      <Badge variant="outline" className={statusColor[a.status]}>{statusLabel[a.status]}</Badge>
                      <div className="flex gap-1">
                        {a.status === "scheduled" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(a, "attended")} className="text-success"><Check className="h-4 w-4 mr-1" />Compareceu</Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(a, "missed")} className="text-destructive"><X className="h-4 w-4 mr-1" />Faltou</Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Schedule;
