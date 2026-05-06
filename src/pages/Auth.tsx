import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import authBg from "@/assets/auth-bg.png";
import { CATEGORY_OPTIONS, getCategory, ProfessionalCategory } from "@/lib/professionalCategories";

const signinSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const requestSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  reason: z.string().trim().max(500).optional(),
  clinic_name: z.string().trim().max(120).optional(),
  professional_category: z.string().trim().min(1, "Selecione a categoria profissional"),
  professional_registry: z.string().trim().min(1, "Informe o número do conselho").max(40),
  professional_uf: z.string().trim().length(2, "UF deve ter 2 letras"),
});

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [reqCategory, setReqCategory] = useState<ProfessionalCategory>("medical");

  useEffect(() => {
    document.title = "Entrar | DADOSTOP CLINIC";
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signinSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = requestSchema.safeParse({
      full_name: fd.get("full_name"),
      email: fd.get("email"),
      password: fd.get("password"),
      reason: fd.get("reason") || undefined,
      clinic_name: fd.get("clinic_name") || undefined,
      professional_category: reqCategory,
      professional_registry: fd.get("professional_registry"),
      professional_uf: (fd.get("professional_uf") as string)?.toUpperCase(),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    try {
      let logoUrl: string | null = null;
      if (logoFile) {
        setUploadingLogo(true);
        const ext = logoFile.name.split(".").pop();
        const path = `signup/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("clinic-logos").upload(path, logoFile);
        setUploadingLogo(false);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("clinic-logos").getPublicUrl(path);
        logoUrl = pub.publicUrl;
      }
      const { error } = await supabase.from("signup_requests").insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        password_hash: parsed.data.password,
        reason: parsed.data.reason ?? null,
        clinic_name: parsed.data.clinic_name ?? null,
        clinic_logo_url: logoUrl,
        professional_category: parsed.data.professional_category,
        professional_registry: parsed.data.professional_registry,
        professional_uf: parsed.data.professional_uf,
      } as any);
      if (error) throw error;
      toast.success("Solicitação enviada! Aguarde a autorização do administrador.");
      (e.target as HTMLFormElement).reset();
      setLogoFile(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${authBg})` }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" aria-hidden />
      <Card className="relative w-full max-w-md shadow-elegant border-border/60 bg-card/85 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-full bg-gold-soft flex items-center justify-center">
            <Stethoscope className="h-7 w-7 text-gold-deep" />
          </div>
          <CardTitle className="font-display text-3xl">DADOSTOP CLINIC</CardTitle>
          <CardDescription>Acesso restrito ao profissional</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="request">Solicitar acesso</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignin} className="space-y-4">
                <div><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
                <div><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" required /></div>
                <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {submitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="request">
              <form onSubmit={handleRequest} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Sua solicitação será analisada pelo administrador. Após a aprovação, você poderá entrar normalmente com o e-mail e a senha cadastrados.
                </p>
                <div><Label htmlFor="full_name">Nome completo</Label><Input id="full_name" name="full_name" required /></div>
                <div><Label htmlFor="email_r">E-mail</Label><Input id="email_r" name="email" type="email" required /></div>
                <div><Label htmlFor="password_r">Senha desejada</Label><Input id="password_r" name="password" type="password" required minLength={6} /></div>
                <div><Label htmlFor="clinic_name">Nome da clínica (opcional)</Label><Input id="clinic_name" name="clinic_name" placeholder="Ex: Clínica Bem Estar" /></div>
                <div>
                  <Label>Categoria profissional</Label>
                  <Select value={reqCategory} onValueChange={(v) => setReqCategory(v as ProfessionalCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="professional_registry">{getCategory(reqCategory).council} (nº do conselho)</Label>
                    <Input id="professional_registry" name="professional_registry" required placeholder="Ex: 123456" />
                  </div>
                  <div>
                    <Label htmlFor="professional_uf">UF</Label>
                    <Input id="professional_uf" name="professional_uf" required maxLength={2} placeholder="SP" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="logo">Logo da clínica (opcional)</Label>
                  <Input id="logo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                  <p className="text-[11px] text-muted-foreground mt-1">Você pode adicionar ou alterar depois em "Meu perfil".</p>
                </div>
                <div><Label htmlFor="reason">Motivo (opcional)</Label><Textarea id="reason" name="reason" rows={2} /></div>
                <Button type="submit" disabled={submitting || uploadingLogo} className="w-full bg-gold text-primary hover:bg-gold/90">
                  {submitting ? "Enviando..." : "Solicitar acesso"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
