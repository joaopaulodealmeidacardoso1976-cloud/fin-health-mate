import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navigate } from "react-router-dom";

interface Req {
  id: string;
  full_name: string;
  email: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const AccessRequests = () => {
  const { isAdmin, loading } = useIsAdmin();
  const [rows, setRows] = useState<Req[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("signup_requests")
      .select("id, full_name, email, reason, status, created_at")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Req[]);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const review = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      const { data, error } = await supabase.functions.invoke("approve-signup", {
        body: { request_id: id, action },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(action === "approve" ? "Cadastro aprovado" : "Solicitação rejeitada");
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setBusy(null);
    }
  };

  const pending = rows.filter(r => r.status === "pending");
  const reviewed = rows.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Solicitações pendentes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>}
          {pending.map(r => (
            <div key={r.id} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-medium">{r.full_name} <span className="text-muted-foreground font-normal">— {r.email}</span></p>
                {r.reason && <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={busy === r.id} onClick={() => review(r.id, "approve")}>Aprovar</Button>
                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => review(r.id, "reject")}>Rejeitar</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {reviewed.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro.</p>}
          {reviewed.map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm border-b py-2">
              <span>{r.full_name} — {r.email}</span>
              <Badge variant={r.status === "approved" ? "default" : "secondary"}>
                {r.status === "approved" ? "Aprovado" : "Rejeitado"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessRequests;
