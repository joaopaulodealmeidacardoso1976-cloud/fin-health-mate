import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Expense {
  id: string; description: string; category: string; amount: number; spent_at: string; notes: string | null;
}

const catLabel: Record<string, string> = { materials: "Materiais", cleaning: "Limpeza", salaries: "Salários", rent: "Aluguel", utilities: "Contas", other: "Outros" };

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Expenses = () => {
  const [list, setList] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("materials");

  useEffect(() => { document.title = "Despesas | Painel Clínico"; load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("expenses").select("*").order("spent_at", { ascending: false }).limit(200);
    setList((data ?? []) as any);
  };

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const description = (fd.get("description") as string)?.trim();
    const amount = Number(fd.get("amount"));
    const date = fd.get("date") as string;
    const notes = (fd.get("notes") as string) || null;
    if (!description || !amount || amount <= 0) { toast.error("Preencha descrição e valor"); return; }
    const spent_at = date ? new Date(date).toISOString() : new Date().toISOString();
    const { error } = await supabase.from("expenses").insert({ description, amount, category: category as any, spent_at, notes });
    if (error) toast.error(error.message); else { toast.success("Despesa registrada"); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removida"); load(); }
  };

  const now = new Date();
  const monthStart = startOfMonth(now), monthEnd = endOfMonth(now);
  const monthTotal = list.filter((e) => { const d = new Date(e.spent_at); return d >= monthStart && d <= monthEnd; }).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card className="shadow-soft border-l-4 border-l-destructive">
        <CardHeader className="pb-2"><CardDescription>Despesas do mês</CardDescription><CardTitle className="font-display text-3xl">{fmt(monthTotal)}</CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground">{format(monthStart, "MMMM 'de' yyyy", { locale: ptBR })}</CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl">Lançamentos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Nova despesa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Lançar despesa</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div><Label>Descrição</Label><Input name="description" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor (R$)</Label><Input type="number" name="amount" step="0.01" min="0" required /></div>
                <div><Label>Data</Label><Input type="date" name="date" defaultValue={format(new Date(), "yyyy-MM-dd")} /></div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(catLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Nenhuma despesa</TableCell></TableRow>
              ) : list.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{format(new Date(e.spent_at), "dd/MM/yy")}</TableCell>
                  <TableCell className="font-medium">{e.description}</TableCell>
                  <TableCell><Badge variant="outline">{catLabel[e.category]}</Badge></TableCell>
                  <TableCell className="text-right font-medium text-destructive">{fmt(Number(e.amount))}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
