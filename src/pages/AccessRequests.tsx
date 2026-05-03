import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navigate } from "react-router-dom";
import { Image as ImageIcon, Pencil, Ban, Upload } from "lucide-react";

interface Req {
  id: string;
  full_name: string;
  email: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  clinic_name: string | null;
  clinic_logo_url: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  clinic_name: string | null;
  clinic_logo_url: string | null;
}

const AccessRequests = () => {
  const { isAdmin, loading } = useIsAdmin();
  const [rows, setRows] = useState<Req[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("signup_requests")
      .select("id, full_name, email, reason, status, created_at, clinic_name, clinic_logo_url")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Req[]);

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email, clinic_name, clinic_logo_url");
    setProfiles((profs ?? []) as ProfileRow[]);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const review = async (id: string, action: "approve" | "reject" | "revoke") => {
    setBusy(id);
    try {
      const { data, error } = await supabase.functions.invoke("approve-signup", {
        body: { request_id: id, action },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        action === "approve" ? "Cadastro aprovado" :
        action === "revoke" ? "Acesso cancelado" :
        "Solicitação rejeitada"
      );
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setBusy(null);
    }
  };

  const openEdit = (p: ProfileRow) => {
    setEditing(p);
    setEditName(p.clinic_name ?? "");
    setEditLogo(p.clinic_logo_url);
  };

  const uploadEditLogo = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `admin/${editing?.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-logos").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("clinic-logos").getPublicUrl(path);
    setEditLogo(data.publicUrl);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("profiles").update({
      clinic_name: editName || null,
      clinic_logo_url: editLogo,
    } as any).eq("id", editing.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Identidade da clínica atualizada");
    setEditing(null);
    load();
  };

  const pending = rows.filter(r => r.status === "pending");
  const reviewed = rows.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6 max-w-5xl">
      <Card>
        <CardHeader><CardTitle>Solicitações pendentes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>}
          {pending.map(r => (
            <div key={r.id} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
                  {r.clinic_logo_url ? <img src={r.clinic_logo_url} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-medium">{r.full_name} <span className="text-muted-foreground font-normal">— {r.email}</span></p>
                  {r.clinic_name && <p className="text-sm">Clínica: <span className="font-medium">{r.clinic_name}</span></p>}
                  {r.reason && <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
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
        <CardHeader><CardTitle>Perfis ativos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {profiles.length === 0 && <p className="text-sm text-muted-foreground">Nenhum perfil.</p>}
          {profiles.map(p => {
            const req = rows.find(r => r.email === p.email && r.status === "approved");
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 border-b py-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
                    {p.clinic_logo_url ? <img src={p.clinic_logo_url} className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{p.clinic_name || "(sem nome de clínica)"}</p>
                    <p className="text-xs text-muted-foreground">{p.full_name} — {p.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4 mr-1" />Editar clínica
                  </Button>
                  {req && (
                    <Button size="sm" variant="destructive" disabled={busy === req.id}
                      onClick={() => { if (confirm(`Cancelar acesso de ${p.email}?`)) review(req.id, "revoke"); }}>
                      <Ban className="h-4 w-4 mr-1" />Cancelar acesso
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico de solicitações</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {reviewed.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro.</p>}
          {reviewed.map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm border-b py-2">
              <span>{r.full_name} — {r.email}{r.clinic_name && ` • ${r.clinic_name}`}</span>
              <Badge variant={r.status === "approved" ? "default" : "secondary"}>
                {r.status === "approved" ? "Aprovado" : "Rejeitado"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar identidade da clínica</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome da clínica</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-16 w-16 border border-border rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                  {editLogo ? <img src={editLogo} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                </div>
                <Label className="cursor-pointer inline-flex items-center text-sm border border-input bg-background hover:bg-accent rounded-md px-3 py-2">
                  <Upload className="h-4 w-4 mr-1" />Trocar
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && uploadEditLogo(e.target.files[0])} />
                </Label>
                {editLogo && <Button variant="ghost" size="sm" onClick={() => setEditLogo(null)}>Remover</Button>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessRequests;
