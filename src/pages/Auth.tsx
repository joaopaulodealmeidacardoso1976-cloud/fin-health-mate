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
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";

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
});

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Entrar | Clínica";
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
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    try {
      const { error } = await supabase.from("signup_requests").insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        password_hash: parsed.data.password,
        reason: parsed.data.reason ?? null,
      });
      if (error) throw error;
      toast.success("Solicitação enviada! Aguarde a autorização do administrador.");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-elegant flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant border-border/60">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-full bg-gold-soft flex items-center justify-center">
            <Stethoscope className="h-7 w-7 text-gold-deep" />
          </div>
          <CardTitle className="font-display text-3xl">Painel Clínico</CardTitle>
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
                <div><Label htmlFor="reason">Motivo (opcional)</Label><Textarea id="reason" name="reason" rows={3} /></div>
                <Button type="submit" disabled={submitting} className="w-full bg-gold text-primary hover:bg-gold/90">
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
