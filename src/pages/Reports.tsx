import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, FileDown } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const methodLabel: Record<string, string> = { credit_card: "Crédito", debit_card: "Débito", pix: "Pix", cash: "Dinheiro" };
const catLabel: Record<string, string> = { materials: "Materiais", cleaning: "Limpeza", salaries: "Salários", rent: "Aluguel", utilities: "Contas", other: "Outros" };

interface Payment { id: string; amount: number; method: string; paid_at: string; notes: string | null; patients: { name: string } | null; }
interface Expense { id: string; description: string; category: string; amount: number; spent_at: string; notes: string | null; }
interface Appt { id: string; status: string; scheduled_at: string; patients: { name: string } | null; }

const Reports = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "year" | "custom">("month");
  const [from, setFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  useEffect(() => { document.title = "Relatórios | Painel Clínico"; load(); }, []);

  useEffect(() => {
    const now = new Date();
    if (period === "week") { setFrom(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")); setTo(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")); }
    else if (period === "month") { setFrom(format(startOfMonth(now), "yyyy-MM-dd")); setTo(format(endOfMonth(now), "yyyy-MM-dd")); }
    else if (period === "year") { setFrom(format(startOfYear(now), "yyyy-MM-dd")); setTo(format(endOfYear(now), "yyyy-MM-dd")); }
  }, [period]);

  const load = async () => {
    const [{ data: pays }, { data: exps }, { data: aps }] = await Promise.all([
      supabase.from("payments").select("*, patients(name)").order("paid_at", { ascending: true }),
      supabase.from("expenses").select("*").order("spent_at", { ascending: true }),
      supabase.from("appointments").select("*, patients(name)").order("scheduled_at", { ascending: true }),
    ]);
    setPayments((pays ?? []) as any);
    setExpenses((exps ?? []) as any);
    setAppts((aps ?? []) as any);
  };

  const inRange = (iso: string) => {
    const d = new Date(iso);
    const start = new Date(from + "T00:00:00");
    const end = new Date(to + "T23:59:59");
    return d >= start && d <= end;
  };

  const filteredPays = useMemo(() => payments.filter((p) => inRange(p.paid_at)), [payments, from, to]);
  const filteredExps = useMemo(() => expenses.filter((e) => inRange(e.spent_at)), [expenses, from, to]);
  const filteredAppts = useMemo(() => appts.filter((a) => inRange(a.scheduled_at)), [appts, from, to]);

  const totalReceitas = filteredPays.reduce((s, p) => s + Number(p.amount), 0);
  const totalDespesas = filteredExps.reduce((s, e) => s + Number(e.amount), 0);
  const lucro = totalReceitas - totalDespesas;

  // Livro caixa: ordenar por data
  type CashRow = { date: string; type: "Entrada" | "Saída"; description: string; in: number; out: number; };
  const cashRows: CashRow[] = useMemo(() => {
    const rows: CashRow[] = [
      ...filteredPays.map((p) => ({ date: p.paid_at, type: "Entrada" as const, description: `Pagamento – ${p.patients?.name ?? "—"} (${methodLabel[p.method]})`, in: Number(p.amount), out: 0 })),
      ...filteredExps.map((e) => ({ date: e.spent_at, type: "Saída" as const, description: `${catLabel[e.category] ?? e.category} – ${e.description}`, in: 0, out: Number(e.amount) })),
    ];
    return rows.sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [filteredPays, filteredExps]);

  // Saldo acumulado
  let running = 0;
  const cashWithBalance = cashRows.map((r) => { running += r.in - r.out; return { ...r, balance: running }; });

  // Receitas por método
  const byMethod: Record<string, number> = {};
  filteredPays.forEach((p) => { byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount); });
  // Despesas por categoria
  const byCategory: Record<string, number> = {};
  filteredExps.forEach((e) => { byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount); });

  const apptStats = {
    total: filteredAppts.length,
    attended: filteredAppts.filter((a) => a.status === "attended").length,
    missed: filteredAppts.filter((a) => a.status === "missed").length,
    cancelled: filteredAppts.filter((a) => a.status === "cancelled").length,
    scheduled: filteredAppts.filter((a) => a.status === "scheduled").length,
  };

  const handlePrint = () => window.print();

  const exportCsv = () => {
    const header = "Data;Tipo;Descrição;Entrada;Saída;Saldo\n";
    const body = cashWithBalance.map((r) =>
      [format(new Date(r.date), "dd/MM/yyyy"), r.type, r.description.replace(/;/g, ","), r.in.toFixed(2), r.out.toFixed(2), r.balance.toFixed(2)].join(";")
    ).join("\n");
    const blob = new Blob(["\ufeff" + header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `livro-caixa_${from}_a_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const periodLabel = `${format(new Date(from + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} até ${format(new Date(to + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card className="shadow-soft print:hidden">
        <CardHeader><CardTitle className="font-display text-xl">Filtros do relatório</CardTitle><CardDescription>Selecione o período e exporte ou imprima</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5 items-end">
            <div className="md:col-span-1">
              <Label>Período</Label>
              <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana atual</SelectItem>
                  <SelectItem value="month">Mês atual</SelectItem>
                  <SelectItem value="year">Ano atual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>De</Label><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPeriod("custom"); }} /></div>
            <div><Label>Até</Label><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPeriod("custom"); }} /></div>
            <Button onClick={handlePrint} className="bg-primary text-primary-foreground"><Printer className="h-4 w-4 mr-2" />Imprimir</Button>
            <Button variant="outline" onClick={exportCsv}><FileDown className="h-4 w-4 mr-2" />Exportar CSV</Button>
          </div>
        </CardContent>
      </Card>

      <div id="print-area" className="space-y-6">
        <div className="hidden print:block text-center pb-4 border-b">
          <h1 className="font-display text-3xl">Relatório Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">{periodLabel}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-soft border-l-4 border-l-success">
            <CardHeader className="pb-2"><CardDescription>Total de receitas</CardDescription><CardTitle className="font-display text-2xl text-success">{fmt(totalReceitas)}</CardTitle></CardHeader>
          </Card>
          <Card className="shadow-soft border-l-4 border-l-destructive">
            <CardHeader className="pb-2"><CardDescription>Total de despesas</CardDescription><CardTitle className="font-display text-2xl text-destructive">{fmt(totalDespesas)}</CardTitle></CardHeader>
          </Card>
          <Card className="shadow-soft border-l-4 border-l-gold">
            <CardHeader className="pb-2"><CardDescription>Lucro líquido</CardDescription><CardTitle className="font-display text-2xl">{fmt(lucro)}</CardTitle></CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="cashbook" className="w-full">
          <TabsList className="print:hidden">
            <TabsTrigger value="cashbook">Livro caixa</TabsTrigger>
            <TabsTrigger value="revenue">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="appointments">Atendimentos</TabsTrigger>
          </TabsList>

          <TabsContent value="cashbook" className="print:!block">
            <Card className="shadow-soft">
              <CardHeader><CardTitle className="font-display">Livro Caixa</CardTitle><CardDescription>Movimentações em ordem cronológica</CardDescription></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Entrada</TableHead><TableHead className="text-right">Saída</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {cashWithBalance.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Sem movimentações no período</TableCell></TableRow>
                    ) : cashWithBalance.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{format(new Date(r.date), "dd/MM/yy")}</TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell>{r.description}</TableCell>
                        <TableCell className="text-right text-success">{r.in ? fmt(r.in) : "—"}</TableCell>
                        <TableCell className="text-right text-destructive">{r.out ? fmt(r.out) : "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(r.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="print:!block">
            <Card className="shadow-soft">
              <CardHeader><CardTitle className="font-display">Receitas por forma de pagamento</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Forma</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">% do total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {Object.keys(byMethod).length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-12">Sem receitas</TableCell></TableRow>
                    ) : Object.entries(byMethod).map(([m, v]) => (
                      <TableRow key={m}>
                        <TableCell>{methodLabel[m] ?? m}</TableCell>
                        <TableCell className="text-right">{fmt(v)}</TableCell>
                        <TableCell className="text-right">{totalReceitas ? ((v / totalReceitas) * 100).toFixed(1) : "0"}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="print:!block">
            <Card className="shadow-soft">
              <CardHeader><CardTitle className="font-display">Despesas por categoria</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">% do total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {Object.keys(byCategory).length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-12">Sem despesas</TableCell></TableRow>
                    ) : Object.entries(byCategory).map(([c, v]) => (
                      <TableRow key={c}>
                        <TableCell>{catLabel[c] ?? c}</TableCell>
                        <TableCell className="text-right">{fmt(v)}</TableCell>
                        <TableCell className="text-right">{totalDespesas ? ((v / totalDespesas) * 100).toFixed(1) : "0"}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="print:!block">
            <Card className="shadow-soft">
              <CardHeader><CardTitle className="font-display">Atendimentos no período</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div><p className="text-xs text-muted-foreground">Total</p><p className="font-display text-2xl">{apptStats.total}</p></div>
                  <div><p className="text-xs text-muted-foreground">Compareceram</p><p className="font-display text-2xl text-success">{apptStats.attended}</p></div>
                  <div><p className="text-xs text-muted-foreground">Faltaram</p><p className="font-display text-2xl text-destructive">{apptStats.missed}</p></div>
                  <div><p className="text-xs text-muted-foreground">Cancelados</p><p className="font-display text-2xl">{apptStats.cancelled}</p></div>
                  <div><p className="text-xs text-muted-foreground">Agendados</p><p className="font-display text-2xl">{apptStats.scheduled}</p></div>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Paciente</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredAppts.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sem atendimentos</TableCell></TableRow>
                    ) : filteredAppts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{format(new Date(a.scheduled_at), "dd/MM/yy HH:mm")}</TableCell>
                        <TableCell>{a.patients?.name ?? "—"}</TableCell>
                        <TableCell className="capitalize">{a.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
