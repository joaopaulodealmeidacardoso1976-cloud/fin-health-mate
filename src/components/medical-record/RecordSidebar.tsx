import { cn } from "@/lib/utils";
import { User, Stethoscope, Activity, ClipboardList, Target, Pill, FlaskConical, FileText, History, Paperclip, CalendarDays, ShieldCheck } from "lucide-react";

export const SECTIONS = [
  { id: "identification", label: "Identificação", icon: User },
  { id: "anamnesis", label: "Anamnese", icon: Stethoscope },
  { id: "exam", label: "Exame Clínico", icon: Activity },
  { id: "diagnosis", label: "Diagnóstico", icon: ClipboardList },
  { id: "plan", label: "Projeto Terapêutico", icon: Target },
  { id: "treatment", label: "Tratamento", icon: Pill },
  { id: "exams", label: "Exames", icon: FlaskConical },
  { id: "prescriptions", label: "Prescrições", icon: FileText },
  { id: "evolution", label: "Evolução", icon: History },
  { id: "attachments", label: "Anexos", icon: Paperclip },
  { id: "appointments", label: "Agenda/Retornos", icon: CalendarDays },
  { id: "audit", label: "Auditoria", icon: ShieldCheck },
] as const;

export type SectionId = typeof SECTIONS[number]["id"];

export const RecordSidebar = ({ active, onChange }: { active: SectionId; onChange: (id: SectionId) => void }) => (
  <nav className="space-y-1 sticky top-0">
    {SECTIONS.map((s) => {
      const Icon = s.icon;
      return (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
            active === s.id
              ? "bg-gold-soft text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{s.label}</span>
        </button>
      );
    })}
  </nav>
);
