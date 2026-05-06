import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, UserCog } from "lucide-react";
import { CATEGORY_OPTIONS, ProfessionalCategory } from "@/lib/professionalCategories";

const ADMIN_EMAIL = "joaopaulodealmeidacardoso1976@gmail.com";

const Profile = () => {
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState("");
  const [clinicLogoUrl, setClinicLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<ProfessionalCategory>("medical");
  const [registry, setRegistry] = useState("");
  const [uf, setUf] = useState("");
  const [savingProf, setSavingProf] = useState(false);

  const isAdminUser = user?.email === ADMIN_EMAIL;

  useEffect(() => { document.title = "Meu Perfil | DADOSTOP CLINIC"; }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("clinic_name, clinic_logo_url, professional_category, professional_registry, professional_uf")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setClinicName((data as any).clinic_name ?? "");
        setClinicLogoUrl((data as any).clinic_logo_url ?? null);
        setCategory(((data as any).professional_category as ProfessionalCategory) ?? "medical");
        setRegistry((data as any).professional_registry ?? "");
        setUf((data as any).professional_uf ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const uploadLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-logos").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("clinic-logos").getPublicUrl(path);
    setClinicLogoUrl(data.publicUrl);
    toast.success("Logo carregada — clique em Salvar para confirmar");
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      clinic_name: clinicName || null,
      clinic_logo_url: clinicLogoUrl,
    } as any).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    window.dispatchEvent(new Event("profile:updated"));
    toast.success("Perfil atualizado");
  };

  const saveProfessional = async () => {
    if (!user) return;
    setSavingProf(true);
    const { error } = await supabase.from("profiles").update({
      professional_category: category,
      professional_registry: registry || null,
      professional_uf: uf ? uf.toUpperCase() : null,
    } as any).eq("id", user.id);
    setSavingProf(false);
    if (error) { toast.error(error.message); return; }
    window.dispatchEvent(new Event("profile:updated"));
    toast.success("Perfil profissional atualizado");
  };

  if (loading) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Identidade da Clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

      {isAdminUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" />Perfil profissional (admin)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Disponível apenas para o administrador. Permite trocar a categoria profissional do seu acesso.</p>
            <div>
              <Label>Categoria profissional</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProfessionalCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nº do conselho</Label>
                <Input value={registry} onChange={(e) => setRegistry(e.target.value)} placeholder="Ex: 12345" />
              </div>
              <div>
                <Label>UF</Label>
                <Input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} maxLength={2} placeholder="SP" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={saveProfessional} disabled={savingProf} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;
