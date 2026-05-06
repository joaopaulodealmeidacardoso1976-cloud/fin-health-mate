import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Lock } from "lucide-react";

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  clinic_name: string | null;
  clinic_logo_url: string | null;
}

const Profile = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [clinicName, setClinicName] = useState("");
  const [clinicLogoUrl, setClinicLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = "Meu Perfil | DADOSTOP CLINIC"; }, []);

  // Load own profile (always) and, if admin, load all profiles for selection
  useEffect(() => {
    if (!user || roleLoading) return;
    (async () => {
      setLoading(true);
      if (isAdmin) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, email, clinic_name, clinic_logo_url")
          .order("full_name", { ascending: true });
        const list = (data ?? []) as ProfileRow[];
        setProfiles(list);
        setSelectedId(user.id);
      } else {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, email, clinic_name, clinic_logo_url")
          .eq("id", user.id)
          .maybeSingle();
        if (data) {
          const row = data as ProfileRow;
          setProfiles([row]);
          setSelectedId(row.id);
          setClinicName(row.clinic_name ?? "");
          setClinicLogoUrl(row.clinic_logo_url ?? null);
        }
      }
      setLoading(false);
    })();
  }, [user, isAdmin, roleLoading]);

  // When admin changes selection, populate fields
  useEffect(() => {
    if (!selectedId) return;
    const p = profiles.find((x) => x.id === selectedId);
    if (p) {
      setClinicName(p.clinic_name ?? "");
      setClinicLogoUrl(p.clinic_logo_url ?? null);
    }
  }, [selectedId, profiles]);

  const uploadLogo = async (file: File) => {
    if (!user || !isAdmin) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${selectedId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-logos").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("clinic-logos").getPublicUrl(path);
    setClinicLogoUrl(data.publicUrl);
    toast.success("Logo carregada — clique em Salvar para confirmar");
  };

  const save = async () => {
    if (!user || !isAdmin || !selectedId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      clinic_name: clinicName || null,
      clinic_logo_url: clinicLogoUrl,
    } as any).eq("id", selectedId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setProfiles((prev) => prev.map((p) => p.id === selectedId ? { ...p, clinic_name: clinicName || null, clinic_logo_url: clinicLogoUrl } : p));
    if (selectedId === user.id) window.dispatchEvent(new Event("profile:updated"));
    toast.success("Perfil atualizado");
  };

  if (loading || roleLoading) return <div className="text-muted-foreground">Carregando...</div>;

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Identidade da Clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Apenas o administrador pode alterar a identidade da clínica. Solicite a alteração ao administrador.</span>
            </div>
            <div>
              <Label>Nome da clínica</Label>
              <Input value={clinicName} disabled placeholder="—" />
            </div>
            <div>
              <Label>Logo da clínica</Label>
              <div className="mt-1 h-20 w-20 rounded-md border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                {clinicLogoUrl ? <img src={clinicLogoUrl} alt="logo" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Identidade da Clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Cliente / Profissional</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder="Selecione um perfil" /></SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {(p.full_name || p.email || p.id) + (p.id === user?.id ? " (você)" : "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Como administrador, você pode editar o perfil de qualquer cliente.</p>
          </div>
          <div>
            <Label>Nome da clínica</Label>
            <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Ex: Clínica Bem Estar" />
            <p className="text-xs text-muted-foreground mt-1">Aparece no painel e em todos os documentos impressos.</p>
          </div>
          <div>
            <Label>Logo da clínica</Label>
            <div className="flex items-center gap-4 mt-1">
              <div className="h-20 w-20 rounded-md border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                {clinicLogoUrl ? <img src={clinicLogoUrl} alt="logo" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
              </div>
              <Label className="cursor-pointer inline-flex items-center text-sm border border-input bg-background hover:bg-accent rounded-md px-3 py-2">
                <Upload className="h-4 w-4 mr-1" />{uploading ? "Enviando..." : "Enviar logo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && uploadLogo(e.target.files[0])} />
              </Label>
              {clinicLogoUrl && (
                <Button variant="ghost" size="sm" onClick={() => setClinicLogoUrl(null)}>Remover</Button>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
