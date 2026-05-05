import { useState } from "react";
import { Button } from "@/components/ui/button";

export type ToothStatus = "healthy" | "caries" | "restored" | "missing" | "treatment" | "implant";

const STATUS_COLORS: Record<ToothStatus, string> = {
  healthy: "hsl(var(--card))",
  caries: "hsl(0 84% 60%)",
  restored: "hsl(217 91% 60%)",
  missing: "hsl(0 0% 0%)",
  treatment: "hsl(45 93% 58%)",
  implant: "hsl(142 71% 45%)",
};

const STATUS_LABELS: Record<ToothStatus, string> = {
  healthy: "Hígido", caries: "Cárie", restored: "Restaurado", missing: "Ausente", treatment: "Em tratamento", implant: "Implante",
};

const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

export const Odontogram = ({ value, onChange }: { value: Record<string, ToothStatus>; onChange: (v: Record<string, ToothStatus>) => void }) => {
  const [active, setActive] = useState<ToothStatus>("caries");

  const toggle = (tooth: number) => {
    const k = String(tooth);
    const next = { ...value };
    if (next[k] === active) delete next[k];
    else next[k] = active;
    onChange(next);
  };

  const renderTooth = (n: number) => {
    const status = value[String(n)] ?? "healthy";
    return (
      <button
        key={n}
        onClick={() => toggle(n)}
        className="flex flex-col items-center gap-1 group"
        title={`Dente ${n} — ${STATUS_LABELS[status]}`}
        type="button"
      >
        <div
          className="w-7 h-9 rounded-md border border-border transition-transform group-hover:scale-110"
          style={{ background: STATUS_COLORS[status] }}
        />
        <span className="text-[10px] text-muted-foreground">{n}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(STATUS_LABELS) as ToothStatus[]).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={active === s ? "default" : "outline"}
            onClick={() => setActive(s)}
            className="gap-2"
          >
            <span className="inline-block w-3 h-3 rounded" style={{ background: STATUS_COLORS[s], border: "1px solid hsl(var(--border))" }} />
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>
      <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
        <div className="flex justify-center gap-1 mb-2">{UPPER.map(renderTooth)}</div>
        <div className="border-t border-border my-2" />
        <div className="flex justify-center gap-1">{LOWER.map(renderTooth)}</div>
      </div>
      <p className="text-xs text-muted-foreground">Selecione um status acima e clique nos dentes. Clique novamente para remover.</p>
    </div>
  );
};
