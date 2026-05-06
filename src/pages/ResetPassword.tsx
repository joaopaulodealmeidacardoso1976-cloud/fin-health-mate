import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import authBg from "@/assets/auth-bg.png";
import logoDadosTop from "@/assets/logo-dadostop.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = "Redefinir senha | DADOSTOP CLINIC";
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    if (password.length < 6) return toast.error("Senha deve ter no mínimo 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não conferem");
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha redefinida com sucesso!");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err: any) {
      toast.error(err.message || "Erro ao redefinir senha");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center" style={{ backgroundImage: `url(${authBg})` }}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" aria-hidden />
      <Card className="relative w-full max-w-md shadow-elegant border-border/60 bg-card/85 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-20 w-20 rounded-full overflow-hidden flex items-center justify-center">
            <img src={logoDadosTop} alt="DADOSTOP CLINIC logo" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="font-display text-2xl">Redefinir senha</CardTitle>
          <CardDescription>
            {ready ? "Digite sua nova senha" : "Validando link de recuperação..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ready ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label htmlFor="password">Nova senha</Label><Input id="password" name="password" type="password" required minLength={6} /></div>
              <div><Label htmlFor="confirm">Confirmar nova senha</Label><Input id="confirm" name="confirm" type="password" required minLength={6} /></div>
              <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {submitting ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Abra o link enviado para seu e-mail para continuar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
