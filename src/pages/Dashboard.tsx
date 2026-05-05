import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar, Treemap,
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
  const [expensesTreemap, setExpensesTreemap] = useState<{ name: string; size: number }[]>([]);

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
        supabase.from("expenses").select("amount, spent_at, category").gte("spent_at", start.toISOString()).lte("spent_at", end.toISOString()),
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

      // Attendance buckets (atendidos vs faltosos)
      const attBuckets: Record<string, { atendidos: number; faltosos: number }> = {};
      const initAtt = (key: string) => { if (!attBuckets[key]) attBuckets[key] = { atendidos: 0, faltosos: 0 }; };
      intervals.forEach((d) => initAtt(keyFn(d)));
      (appts ?? []).forEach((a: any) => {
        const k = keyFn(new Date(a.scheduled_at));
        initAtt(k);
        if (a.status === "attended") attBuckets[k].atendidos += 1;
        else if (a.status === "missed") attBuckets[k].faltosos += 1;
      });
      setAttendanceSeries(Object.entries(attBuckets).map(([label, v]) => ({ label, ...v })));

      // Methods pie
      const methodLabels: Record<string, string> = { credit_card: "Crédito", debit_card: "Débito", pix: "Pix", cash: "Dinheiro" };
      const methodTotals: Record<string, number> = {};
      (pays ?? []).forEach((p: any) => { methodTotals[p.method] = (methodTotals[p.method] ?? 0) + Number(p.amount); });
      setMethodData(Object.entries(methodTotals).map(([k, v]) => ({ name: methodLabels[k] ?? k, value: v })));

      // Expenses treemap by category
      const catLabels: Record<string, string> = { materials: "Materiais", cleaning: "Limpeza", salaries: "Salários", rent: "Aluguel", utilities: "Utilidades", other: "Outros" };
      const catTotals: Record<string, number> = {};
      (exps ?? []).forEach((e: any) => { catTotals[e.category] = (catTotals[e.category] ?? 0) + Number(e.amount); });
      setExpensesTreemap(Object.entries(catTotals).map(([k, v]) => ({ name: catLabels[k] ?? k, size: v })));
    })();
  }, [range]);

  const goldShades = ["hsl(38, 45%, 58%)", "hsl(36, 40%, 45%)", "hsl(40, 50%, 70%)", "hsl(220, 13%, 35%)"];

  return (
    <div className="flex flex-col gap-3 max-w-7xl mx-auto h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Acompanhe receitas, despesas e desempenho</p>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon={<Wallet />} label="Receita" value={fmt(stats.revenue)} accent="gold" />
        <KpiCard icon={<TrendingUp />} label="Lucro bruto" value={fmt(stats.revenue)} accent="success" />
        <KpiCard icon={<TrendingDown />} label="Despesas" value={fmt(stats.expenses)} />
        <KpiCard icon={<DollarSign />} label="Lucro líquido" value={fmt(stats.profit)} accent={stats.profit >= 0 ? "success" : "destructive"} />
        <KpiCard icon={<CalendarCheck />} label="Atendidos" value={`${stats.attendedCount} / ${stats.appointmentsCount}`} />
        <KpiCard icon={<Users />} label="Pacientes" value={String(stats.patientsCount)} accent="gold" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3 flex-1 min-h-0">
        <Card className="lg:col-span-2 shadow-soft flex flex-col min-h-0">
          <CardHeader className="py-3">
            <CardTitle className="font-display text-base">Receita vs. Despesa</CardTitle>
            <CardDescription className="text-xs">Evolução no período selecionado</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pb-3">
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

        <Card className="shadow-soft flex flex-col min-h-0">
          <CardHeader className="py-3">
            <CardTitle className="font-display text-base">Formas de pagamento</CardTitle>
            <CardDescription className="text-xs">Distribuição no período</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pb-3">
            {methodData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-16">Sem pagamentos no período</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {methodData.map((_, i) => <Cell key={i} fill={goldShades[i % goldShades.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 flex-1 min-h-0">
        <Card className="shadow-soft flex flex-col min-h-0">
          <CardHeader className="py-3">
            <CardTitle className="font-display text-base">Atendidos vs. Faltosos</CardTitle>
            <CardDescription className="text-xs">Comparativo de comparecimento no período</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                <XAxis dataKey="label" stroke="hsl(220, 9%, 46%)" fontSize={12} />
                <YAxis stroke="hsl(220, 9%, 46%)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(40,15%,88%)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="atendidos" name="Atendidos" fill="hsl(38, 45%, 58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="faltosos" name="Faltosos" fill="hsl(220, 13%, 35%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft flex flex-col min-h-0">
          <CardHeader className="py-3">
            <CardTitle className="font-display text-base">Despesas por categoria</CardTitle>
            <CardDescription className="text-xs">Distribuição proporcional no período</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pb-3">
            {expensesTreemap.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-16">Sem despesas no período</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={expensesTreemap}
                  dataKey="size"
                  nameKey="name"
                  stroke="hsl(0,0%,100%)"
                  content={<TreemapCell />}
                >
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                </Treemap>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const treemapColors = ["hsl(38, 45%, 58%)", "hsl(36, 40%, 45%)", "hsl(40, 50%, 70%)", "hsl(220, 13%, 35%)", "hsl(40, 30%, 50%)", "hsl(36, 25%, 60%)"];
const TreemapCell = (props: any) => {
  const { x, y, width, height, index, name, size } = props;
  const fill = treemapColors[index % treemapColors.length];
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="hsl(0,0%,100%)" />
      {width > 70 && height > 30 && (
        <>
          <text x={x + 8} y={y + 18} fill="hsl(0,0%,100%)" fontSize={12} fontWeight={600}>{name}</text>
          <text x={x + 8} y={y + 34} fill="hsl(0,0%,100%)" fontSize={11} opacity={0.9}>{fmt(Number(size))}</text>
        </>
      )}
    </g>
  );
};



const KpiCard = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: "gold" | "success" | "destructive" }) => (
  <Card className="shadow-soft">
    <CardContent className="p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
          <p className={`text-base lg:text-lg font-display mt-1 truncate ${accent === "destructive" ? "text-destructive" : accent === "success" ? "text-success" : accent === "gold" ? "text-gold-deep" : ""}`}>{value}</p>
        </div>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${accent === "gold" ? "bg-gold-soft text-gold-deep" : "bg-muted text-muted-foreground"} [&_svg]:h-4 [&_svg]:w-4`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
