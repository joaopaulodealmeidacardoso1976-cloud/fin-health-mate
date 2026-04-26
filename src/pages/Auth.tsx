import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
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

  const handle = async (mode: "signin" | "signup", e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail se a confirmação estiver ativa.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar");
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
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={(e) => handle("signin", e)} className="space-y-4">
                <div><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
                <div><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" required /></div>
                <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {submitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={(e) => handle("signup", e)} className="space-y-4">
                <div><Label htmlFor="email2">E-mail</Label><Input id="email2" name="email" type="email" required /></div>
                <div><Label htmlFor="password2">Senha</Label><Input id="password2" name="password" type="password" required /></div>
                <Button type="submit" disabled={submitting} className="w-full bg-gold text-primary hover:bg-gold/90">
                  {submitting ? "Criando..." : "Criar conta"}
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
