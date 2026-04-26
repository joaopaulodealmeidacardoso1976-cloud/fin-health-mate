import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Trash2, Package } from "lucide-react";

type Item = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  notes: string | null;
};

const Inventory = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [openItem, setOpenItem] = useState(false);
  const [openMov, setOpenMov] = useState<{ item: Item; type: "in" | "out" } | null>(null);

  useEffect(() => {
    document.title = "Almoxarifado | Painel Clínico";
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase.from("inventory_items").select("*").order("name");
    if (error) return toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    setItems((data ?? []) as Item[]);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      category: String(fd.get("category") || "").trim() || null,
      unit: String(fd.get("unit") || "un"),
      quantity: Number(fd.get("quantity") || 0),
      min_quantity: Number(fd.get("min_quantity") || 0),
      unit_price: Number(fd.get("unit_price") || 0),
      notes: String(fd.get("notes") || "").trim() || null,
    };
    if (!payload.name) return;
    const { error } = await supabase.from("inventory_items").insert(payload);
    if (error) return toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    toast({ title: "Item adicionado" });
    setOpenItem(false);
    load();
  };

  const handleMovement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!openMov) return;
    const fd = new FormData(e.currentTarget);
    const qty = Number(fd.get("quantity") || 0);
    if (qty <= 0) return toast({ title: "Quantidade inválida", variant: "destructive" });
    const { error } = await supabase.from("inventory_movements").insert({
      item_id: openMov.item.id,
      movement_type: openMov.type,
      quantity: qty,
      reason: String(fd.get("reason") || "").trim() || null,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: openMov.type === "in" ? "Entrada registrada" : "Saída registrada" });
    setOpenMov(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este item?")) return;
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Item excluído" });
    load();
  };

  const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.min_quantity));
  const totalValue = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Controle de materiais e insumos</p>
        <Dialog open={openItem} onOpenChange={setOpenItem}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Novo item</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Nome *</Label><Input name="name" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Categoria</Label><Input name="category" placeholder="Ex.: Material" /></div>
                <div><Label>Unidade</Label><Input name="unit" defaultValue="un" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Quantidade</Label><Input name="quantity" type="number" step="0.01" defaultValue={0} /></div>
                <div><Label>Mínimo</Label><Input name="min_quantity" type="number" step="0.01" defaultValue={0} /></div>
                <div><Label>Preço unit.</Label><Input name="unit_price" type="number" step="0.01" defaultValue={0} /></div>
              </div>
              <div><Label>Observações</Label><Textarea name="notes" rows={2} /></div>
              <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Itens cadastrados</p>
              <p className="text-2xl font-display mt-2">{items.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Package /></div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Valor em estoque</p>
              <p className="text-2xl font-display mt-2 text-gold-deep">{fmt(totalValue)}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gold-soft flex items-center justify-center text-gold-deep"><Package /></div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Estoque baixo</p>
              <p className={`text-2xl font-display mt-2 ${lowStock.length ? "text-destructive" : ""}`}>{lowStock.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><AlertTriangle /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-display">Itens do almoxarifado</CardTitle>
          <CardDescription>Gerencie entradas, saídas e níveis mínimos</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhum item cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Qtde</TableHead>
                  <TableHead className="text-right">Mín.</TableHead>
                  <TableHead className="text-right">Preço un.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => {
                  const low = Number(i.quantity) <= Number(i.min_quantity);
                  return (
                    <TableRow key={i.id}>
                      <TableCell>
                        <div className="font-medium">{i.name}</div>
                        {i.notes && <div className="text-xs text-muted-foreground">{i.notes}</div>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{i.category ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <span className={low ? "text-destructive font-medium" : ""}>{Number(i.quantity)}</span> {i.unit}
                        {low && <Badge variant="destructive" className="ml-2">Baixo</Badge>}
                      </TableCell>
                      <TableCell className="text-right">{Number(i.min_quantity)}</TableCell>
                      <TableCell className="text-right">{fmt(Number(i.unit_price))}</TableCell>
                      <TableCell className="text-right">{fmt(Number(i.quantity) * Number(i.unit_price))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setOpenMov({ item: i, type: "in" })} title="Entrada">
                            <ArrowDownToLine className="h-4 w-4 text-success" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setOpenMov({ item: i, type: "out" })} title="Saída">
                            <ArrowUpFromLine className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(i.id)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!openMov} onOpenChange={(o) => !o && setOpenMov(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {openMov?.type === "in" ? "Entrada" : "Saída"} — {openMov?.item.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMovement} className="space-y-4">
            <div>
              <Label>Quantidade ({openMov?.item.unit})</Label>
              <Input name="quantity" type="number" step="0.01" min="0.01" required autoFocus />
            </div>
            <div>
              <Label>Motivo</Label>
              <Input name="reason" placeholder="Ex.: Compra / Uso em consulta" />
            </div>
            <DialogFooter><Button type="submit">Confirmar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
