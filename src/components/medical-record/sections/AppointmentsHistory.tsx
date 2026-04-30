import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionCard } from "../SectionCard";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Appt { id: string; scheduled_at: string; duration_minutes: number; status: string; notes: string | null; }

export const AppointmentsHistory = ({ patientId }: { patientId: string }) => {
  const [list, setList] = useState<Appt[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("appointments").select("*").eq("patient_id", patientId).order("scheduled_at", { ascending: false });
      setList((data ?? []) as Appt[]);
    })();
  }, [patientId]);

  const now = new Date();
  const upcoming = list.filter(a => new Date(a.scheduled_at) >= now);
  const past = list.filter(a => new Date(a.scheduled_at) < now);

  const renderItem = (a: Appt) => (
    <div key={a.id} className="flex items-center justify-between border-l-2 border-gold pl-4 py-2">
      <div>
        <p className="font-medium">{new Date(a.scheduled_at).toLocaleString("pt-BR")}</p>
        <p className="text-xs text-muted-foreground">{a.duration_minutes} min {a.notes && `• ${a.notes}`}</p>
      </div>
      <Badge variant={a.status === "completed" ? "default" : a.status === "cancelled" ? "destructive" : "secondary"}>{a.status}</Badge>
    </div>
  );

  return (
    <SectionCard title="Agenda e Retornos" icon={<CalendarDays className="h-5 w-5" />}>
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Próximas consultas</h4>
          {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma consulta agendada</p> :
            <div className="space-y-2">{upcoming.map(renderItem)}</div>}
        </div>
        <div>
          <h4 className="font-medium mb-2">Histórico</h4>
          {past.length === 0 ? <p className="text-sm text-muted-foreground">Sem histórico</p> :
            <div className="space-y-2">{past.slice(0, 10).map(renderItem)}</div>}
        </div>
      </div>
    </SectionCard>
  );
};
