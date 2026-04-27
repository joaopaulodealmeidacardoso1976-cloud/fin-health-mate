import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, startOfMonth, startOfWeek, isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Appt {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "attended" | "missed" | "cancelled";
  notes: string | null;
  patients: { name: string; email: string | null } | null;
}

interface Props {
  appointments: Appt[];
  onSelectAppt?: (a: Appt) => void;
}

const statusDot: Record<string, string> = {
  scheduled: "bg-gold",
  attended: "bg-success",
  missed: "bg-destructive",
  cancelled: "bg-muted-foreground",
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h - 19h
const HOUR_HEIGHT = 56; // px per hour

export function ScheduleCalendar({ appointments, onSelectAppt }: Props) {
  const [view, setView] = useState<"week" | "month">("week");
  const [cursor, setCursor] = useState<Date>(new Date());

  const apptsByDay = useMemo(() => {
    const map = new Map<string, Appt[]>();
    for (const a of appointments) {
      const key = format(new Date(a.scheduled_at), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [appointments]);

  const navigate = (dir: -1 | 1) => {
    setCursor((c) => view === "week" ? addWeeks(c, dir) : addMonths(c, dir));
  };

  const title = view === "week"
    ? `${format(startOfWeek(cursor, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })} – ${format(endOfWeek(cursor, { weekStartsOn: 0 }), "dd MMM yyyy", { locale: ptBR })}`
    : format(cursor, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Card className="shadow-soft p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Hoje</Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          <h3 className="font-display text-lg capitalize ml-2">{title}</h3>
        </div>
        <div className="flex gap-1 rounded-md border p-1">
          <Button size="sm" variant={view === "week" ? "default" : "ghost"} onClick={() => setView("week")}>Semana</Button>
          <Button size="sm" variant={view === "month" ? "default" : "ghost"} onClick={() => setView("month")}>Mês</Button>
        </div>
      </div>

      {view === "week"
        ? <WeekView cursor={cursor} apptsByDay={apptsByDay} onSelectAppt={onSelectAppt} />
        : <MonthView cursor={cursor} apptsByDay={apptsByDay} onSelectAppt={onSelectAppt} onPickDay={(d) => { setCursor(d); setView("week"); }} />}
    </Card>
  );
}

function WeekView({ cursor, apptsByDay, onSelectAppt }: {
  cursor: Date;
  apptsByDay: Map<string, Appt[]>;
  onSelectAppt?: (a: Appt) => void;
}) {
  const start = startOfWeek(cursor, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[60px_repeat(7,minmax(110px,1fr))] border-t border-l rounded-md overflow-hidden min-w-[820px]">
        {/* header */}
        <div className="bg-muted/30 border-b border-r" />
        {days.map((d) => (
          <div key={d.toISOString()} className={cn("text-center py-2 border-b border-r bg-muted/30", isToday(d) && "bg-gold-soft/50")}>
            <p className="text-xs uppercase text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</p>
            <p className={cn("font-display text-xl", isToday(d) && "text-gold-deep")}>{format(d, "dd")}</p>
          </div>
        ))}

        {/* body */}
        <div className="relative border-r">
          {HOURS.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="text-[10px] text-muted-foreground text-right pr-1 border-b">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const dayAppts = apptsByDay.get(key) ?? [];
          return (
            <div key={key} className="relative border-r" style={{ height: HOUR_HEIGHT * HOURS.length }}>
              {HOURS.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="border-b" />
              ))}
              {dayAppts.map((a) => {
                const dt = new Date(a.scheduled_at);
                const minutes = dt.getHours() * 60 + dt.getMinutes() - HOURS[0] * 60;
                if (minutes < 0 || minutes > HOURS.length * 60) return null;
                const top = (minutes / 60) * HOUR_HEIGHT;
                const height = Math.max((a.duration_minutes / 60) * HOUR_HEIGHT - 2, 22);
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelectAppt?.(a)}
                    style={{ top, height }}
                    className={cn(
                      "absolute left-1 right-1 rounded-md px-1.5 py-1 text-left text-xs border shadow-soft overflow-hidden transition hover:shadow-md",
                      a.status === "scheduled" && "bg-gold-soft border-gold/40 text-gold-deep",
                      a.status === "attended" && "bg-success/15 border-success/40 text-success",
                      a.status === "missed" && "bg-destructive/15 border-destructive/40 text-destructive",
                      a.status === "cancelled" && "bg-muted border-border text-muted-foreground line-through",
                    )}
                  >
                    <p className="font-medium truncate">{format(dt, "HH:mm")} {a.patients?.name ?? "—"}</p>
                    {height > 36 && a.notes && <p className="opacity-70 truncate">{a.notes}</p>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ cursor, apptsByDay, onSelectAppt, onPickDay }: {
  cursor: Date;
  apptsByDay: Map<string, Appt[]>;
  onSelectAppt?: (a: Appt) => void;
  onPickDay: (d: Date) => void;
}) {
  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="border-t border-l rounded-md overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/30">
        {weekDays.map((w) => (
          <div key={w} className="text-center text-xs uppercase text-muted-foreground py-2 border-r border-b">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const dayAppts = apptsByDay.get(key) ?? [];
          const inMonth = isSameMonth(d, cursor);
          return (
            <div
              key={key}
              className={cn(
                "min-h-[100px] border-r border-b p-1.5 text-left transition hover:bg-muted/30 cursor-pointer",
                !inMonth && "bg-muted/20 text-muted-foreground",
              )}
              onClick={() => onPickDay(d)}
            >
              <div className="flex justify-end">
                <span className={cn(
                  "text-xs w-6 h-6 flex items-center justify-center rounded-full",
                  isToday(d) && "bg-gold text-primary font-semibold",
                )}>{format(d, "d")}</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {dayAppts.slice(0, 3).map((a) => {
                  const dt = new Date(a.scheduled_at);
                  return (
                    <button
                      key={a.id}
                      onClick={(e) => { e.stopPropagation(); onSelectAppt?.(a); }}
                      className="w-full text-left text-[11px] truncate flex items-center gap-1 rounded px-1 py-0.5 hover:bg-background"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot[a.status])} />
                      <span className="font-medium">{format(dt, "HH:mm")}</span>
                      <span className="truncate">{a.patients?.name ?? "—"}</span>
                    </button>
                  );
                })}
                {dayAppts.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1">+{dayAppts.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
