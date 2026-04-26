import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alert {
  id: string;
  type: "missed" | "upcoming";
  message: string;
  at: string;
}

const AlertsBell = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const load = async () => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 3600 * 1000);
    const { data } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, patients(name)")
      .lte("scheduled_at", in24h.toISOString())
      .order("scheduled_at", { ascending: false })
      .limit(50);
    const a: Alert[] = [];
    (data ?? []).forEach((row: any) => {
      const date = new Date(row.scheduled_at);
      const name = row.patients?.name ?? "Paciente";
      if (row.status === "missed") {
        a.push({ id: row.id, type: "missed", message: `${name} faltou em ${format(date, "dd/MM HH:mm", { locale: ptBR })}`, at: row.scheduled_at });
      } else if (row.status === "scheduled" && isPast(date) && !isToday(date)) {
        a.push({ id: row.id, type: "missed", message: `${name} não compareceu em ${format(date, "dd/MM HH:mm", { locale: ptBR })}`, at: row.scheduled_at });
      } else if (row.status === "scheduled" && date > now && date < in24h) {
        a.push({ id: row.id, type: "upcoming", message: `Próxima consulta: ${name} ${format(date, "dd/MM HH:mm", { locale: ptBR })}`, at: row.scheduled_at });
      }
    });
    setAlerts(a.slice(0, 10));
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("alerts").on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, load).subscribe();
    const t = setInterval(load, 60000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {alerts.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gold text-primary border-0">
              {alerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <p className="font-display text-lg mb-2">Alertas</p>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Sem alertas</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-auto">
            {alerts.map((a) => (
              <li key={a.id + a.type} className="text-sm p-2 rounded-md bg-muted/50 border-l-2 border-gold">
                {a.message}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AlertsBell;
