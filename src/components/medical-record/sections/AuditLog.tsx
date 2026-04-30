import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionCard } from "../SectionCard";
import { ShieldCheck } from "lucide-react";

interface Log { id: string; section: string; action: string; created_at: string; user_id: string; details: unknown; }
interface Profile { id: string; full_name: string | null; email: string | null; }

export const AuditLog = ({ recordId }: { recordId: string }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [users, setUsers] = useState<Record<string, Profile>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("audit_log").select("*").eq("record_id", recordId).order("created_at", { ascending: false }).limit(100);
      const list = (data ?? []) as Log[];
      setLogs(list);
      const ids = Array.from(new Set(list.map(l => l.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        const map: Record<string, Profile> = {};
        (profs ?? []).forEach(p => { map[p.id] = p as Profile; });
        setUsers(map);
      }
    })();
  }, [recordId]);

  return (
    <SectionCard title="Segurança e Auditoria" icon={<ShieldCheck className="h-5 w-5" />}>
      {logs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro</p> :
        <div className="space-y-1 max-h-96 overflow-auto">
          {logs.map((l) => {
            const u = users[l.user_id];
            return (
              <div key={l.id} className="text-sm border-b border-border py-2 flex items-center justify-between gap-2">
                <div>
                  <span className="font-medium">{l.section}</span> <span className="text-muted-foreground">— {l.action}</span>
                  <p className="text-xs text-muted-foreground">{u?.full_name || u?.email || "Usuário"}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
              </div>
            );
          })}
        </div>}
    </SectionCard>
  );
};
