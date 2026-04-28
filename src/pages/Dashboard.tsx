import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { startOfWeek, startOfMonth, startOfYear, format, eachDayOfInterval, eachMonthOfInterval, endOfMonth, endOfYear, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Wallet, TrendingUp, Users, CalendarCheck, TrendingDown, DollarSign } from "lucide-react";

type Range = "week" | "month" | "year";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Dashboard = () => {
  const [range, setRange] = useState<Range>("month");
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, profit: 0, patientsCount: 0, appointmentsCount: 0, attendedCount: 0 });
  const [series, setSeries] = useState<{ label: string; receita: number; despesa: number }[]>([]);
  const [attendanceSeries, setAttendanceSeries] = useState<{ label: string; atendidos: number; faltosos: number }[]>([]);
  const [methodData, setMethodData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    document.title = "Visão geral | Painel Clínico";
  }, []);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const start = range === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : range === "month" ? startOfMonth(now) : startOfYear(now);
      const end = range === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : range === "month" ? endOfMonth(now) : endOfYear(now);

      const [{ data: pays }, { data: exps }, { data: appts }, { count: patientsCount }] = await Promise.all([
        supabase.from("payments").select("amount, method, paid_at").gte("paid_at", start.toISOString()).lte("paid_at", end.toISOString()),
        supabase.from("expenses").select("amount, spent_at").gte("spent_at", start.toISOString()).lte("spent_at", end.toISOString()),
        supabase.from("appointments").select("status, scheduled_at").gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString()),
        supabase.from("patients").select("id", { count: "exact", head: true }),
      ]);

      const revenue = (pays ?? []).reduce((s, p: any) => s + Number(p.amount), 0);
      const expenses = (exps ?? []).reduce((s, e: any) => s + Number(e.amount), 0);
      const attendedCount = (appts ?? []).filter((a: any) => a.status === "attended").length;
      setStats({ revenue, expenses, profit: revenue - expenses, patientsCount: patientsCount ?? 0, appointmentsCount: appts?.length ?? 0, attendedCount });

      // Build time series buckets
      const buckets: Record<string, { receita: number; despesa: number }> = {};
      const initBucket = (key: string) => { if (!buckets[key]) buckets[key] = { receita: 0, despesa: 0 }; };
      const keyFn = (d: Date) =>
        range === "year" ? format(d, "MMM", { locale: ptBR }) : format(d, "dd/MM");
      const intervals =
        range === "year" ? eachMonthOfInterval({ start, end }) : eachDayOfInterval({ start, end });
      intervals.forEach((d) => initBucket(keyFn(d)));
      (pays ?? []).forEach((p: any) => { const k = keyFn(new Date(p.paid_at)); initBucket(k); buckets[k].receita += Number(p.amount); });
      (exps ?? []).forEach((e: any) => { const k = keyFn(new Date(e.spent_at)); initBucket(k); buckets[k].despesa += Number(e.amount); });
      setSeries(Object.entries(buckets).map(([label, v]) => ({ label, ...v })));

      // Methods pie
      const methodLabels: Record<string, string> = { credit_card: "Crédito", debit_card: "Débito", pix: "Pix", cash: "Dinheiro" };
      const methodTotals: Record<string, number> = {};
      (pays ?? []).forEach((p: any) => { methodTotals[p.method] = (methodTotals[p.method] ?? 0) + Number(p.amount); });
      setMethodData(Object.entries(methodTotals).map(([k, v]) => ({ name: methodLabels[k] ?? k, value: v })));
    })();
  }, [range]);

  const goldShades = ["hsl(38, 45%, 58%)", "hsl(36, 40%, 45%)", "hsl(40, 50%, 70%)", "hsl(220, 13%, 35%)"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Acompanhe receitas, despesas e desempenho</p>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard icon={<Wallet />} label="Receita" value={fmt(stats.revenue)} accent="gold" />
        <KpiCard icon={<TrendingUp />} label="Lucro bruto" value={fmt(stats.revenue)} accent="success" />
        <KpiCard icon={<TrendingDown />} label="Despesas" value={fmt(stats.expenses)} />
        <KpiCard icon={<DollarSign />} label="Lucro líquido" value={fmt(stats.profit)} accent={stats.profit >= 0 ? "success" : "destructive"} />
        <KpiCard icon={<CalendarCheck />} label="Atendidos" value={`${stats.attendedCount} / ${stats.appointmentsCount}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Receita vs. Despesa</CardTitle>
            <CardDescription>Evolução no período selecionado</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(38, 45%, 58%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(38, 45%, 58%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(220, 13%, 35%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(220, 13%, 35%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                <XAxis dataKey="label" stroke="hsl(220, 9%, 46%)" fontSize={12} />
                <YAxis stroke="hsl(220, 9%, 46%)" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(40,15%,88%)", borderRadius: 8 }} formatter={(v: any) => fmt(Number(v))} />
                <Area type="monotone" dataKey="receita" stroke="hsl(38, 45%, 58%)" strokeWidth={2} fill="url(#rev)" />
                <Area type="monotone" dataKey="despesa" stroke="hsl(220, 13%, 35%)" strokeWidth={2} fill="url(#exp)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Formas de pagamento</CardTitle>
            <CardDescription>Distribuição no período</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {methodData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-16">Sem pagamentos no período</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {methodData.map((_, i) => <Cell key={i} fill={goldShades[i % goldShades.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-display">Pacientes no sistema</CardTitle>
          <CardDescription>Total cadastrado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gold-soft flex items-center justify-center">
              <Users className="h-6 w-6 text-gold-deep" />
            </div>
            <p className="text-3xl font-display">{stats.patientsCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KpiCard = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: "gold" | "success" | "destructive" }) => (
  <Card className="shadow-soft">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`text-2xl font-display mt-2 ${accent === "destructive" ? "text-destructive" : accent === "success" ? "text-success" : accent === "gold" ? "text-gold-deep" : ""}`}>{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${accent === "gold" ? "bg-gold-soft text-gold-deep" : "bg-muted text-muted-foreground"}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
