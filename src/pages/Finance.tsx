import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient { id: string; name: string; }
interface Payment {
  id: string; patient_id: string; amount: number; method: string; paid_at: string; notes: string | null;
  patients: { name: string } | null;
}

const methodLabel: Record<string, string> = { credit_card: "Crédito", debit_card: "Débito", pix: "Pix", cash: "Dinheiro" };
const methodColor: Record<string, string> = {
  credit_card: "bg-gold-soft text-gold-deep",
  debit_card: "bg-secondary text-secondary-foreground",
  pix: "bg-success/15 text-success",
  cash: "bg-muted text-muted-foreground",
};

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Finance = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("pix");
  const [patientId, setPatientId] = useState("");

  useEffect(() => { document.title = "Financeiro | Painel Clínico"; load(); }, []);

  const load = async () => {
    const [{ data: ps }, { data: pays }] = await Promise.all([
      supabase.from("patients").select("id, name").order("name"),
      supabase.from("payments").select("*, patients(name)").order("paid_at", { ascending: false }).limit(200),
    ]);
    setPatients(ps ?? []);
    setPayments((pays ?? []) as any);
  };

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount"));
    const date = fd.get("date") as string;
    const notes = (fd.get("notes") as string) || null;
    if (!patientId || !amount || amount <= 0) { toast.error("Preencha paciente e valor"); return; }
    const paid_at = date ? new Date(date).toISOString() : new Date().toISOString();
    const { error } = await supabase.from("payments").insert({ patient_id: patientId, amount, method: method as any, paid_at, notes });
    if (error) toast.error(error.message); else { toast.success("Pagamento registrado"); setOpen(false); setPatientId(""); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este pagamento?")) return;
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removido"); load(); }
  };

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }), weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now), monthEnd = endOfMonth(now);
  const sumIn = (start: Date, end: Date) => payments.filter((p) => { const d = new Date(p.paid_at); return d >= start && d <= end; }).reduce((s, p) => s + Number(p.amount), 0);
  const weekTotal = sumIn(weekStart, weekEnd);
  const monthTotal = sumIn(monthStart, monthEnd);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-soft border-l-4 border-l-gold">
          <CardHeader className="pb-2"><CardDescription>Balancete semanal</CardDescription><CardTitle className="font-display text-3xl">{fmt(weekTotal)}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">{format(weekStart, "dd MMM", { locale: ptBR })} – {format(weekEnd, "dd MMM", { locale: ptBR })}</CardContent>
        </Card>
        <Card className="shadow-soft border-l-4 border-l-gold-deep">
          <CardHeader className="pb-2"><CardDescription>Balancete mensal</CardDescription><CardTitle className="font-display text-3xl">{fmt(monthTotal)}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">{format(monthStart, "MMMM 'de' yyyy", { locale: ptBR })}</CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl">Pagamentos recentes</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Novo pagamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Registrar pagamento</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div>
                <Label>Paciente</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor (R$)</Label><Input type="number" name="amount" step="0.01" min="0" required /></div>
                <div><Label>Data</Label><Input type="date" name="date" defaultValue={format(new Date(), "yyyy-MM-dd")} /></div>
              </div>
              <div>
                <Label>Forma de pagamento</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Cartão de crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de débito</SelectItem>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Observações</Label><Textarea name="notes" rows={2} /></div>
              <DialogFooter><Button type="submit" className="bg-gold text-primary hover:bg-gold/90">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Paciente</TableHead><TableHead>Forma</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Nenhum pagamento</TableCell></TableRow>
              ) : payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{format(new Date(p.paid_at), "dd/MM/yy")}</TableCell>
                  <TableCell>{p.patients?.name ?? "—"}</TableCell>
                  <TableCell><Badge className={methodColor[p.method] + " border-0"}>{methodLabel[p.method]}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(p.amount))}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finance;
