import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_OPTIONS, getCategory, ProfessionalCategory } from "@/lib/professionalCategories";
import { toast } from "sonner";
import { UserCog } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [category, setCategory] = useState<ProfessionalCategory>("medical");
  const [registry, setRegistry] = useState("");
  const [uf, setUf] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = "Meu Perfil | DADOSTOP CLINIC"; }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, professional_category, professional_registry, professional_uf")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setCategory(((data as any).professional_category as ProfessionalCategory) || "medical");
        setRegistry((data as any).professional_registry ?? "");
        setUf((data as any).professional_uf ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      professional_category: category,
      professional_registry: registry || null,
      professional_uf: uf || null,
    } as any).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil atualizado");
  };

  if (loading) return <div className="text-muted-foreground">Carregando...</div>;

  const meta = getCategory(category);

  return (
    <div className="max-w-2xl mx-auto w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" />Meu Perfil Profissional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Categoria profissional</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ProfessionalCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">O prontuário e os documentos serão adaptados para esta categoria.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>{meta.council} (número do conselho)</Label>
              <Input value={registry} onChange={(e) => setRegistry(e.target.value)} placeholder={`Ex: 123456`} />
            </div>
            <div>
              <Label>UF</Label>
              <Input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} maxLength={2} placeholder="SP" />
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
