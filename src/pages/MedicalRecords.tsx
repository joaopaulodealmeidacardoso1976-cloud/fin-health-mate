import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FolderOpen } from "lucide-react";

interface Patient { id: string; name: string; phone: string | null; }

const MedicalRecords = () => {
  const [list, setList] = useState<Patient[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "Prontuários | DADOSTOP CLINIC";
    (async () => {
      const { data } = await supabase.from("patients").select("id,name,phone").order("name");
      setList((data ?? []) as Patient[]);
    })();
  }, []);

  const filtered = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar paciente..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0 divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum paciente encontrado</p>
          ) : filtered.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.phone ?? "—"}</p>
              </div>
              <Button asChild size="sm" className="bg-gold text-primary hover:bg-gold/90">
                <Link to={`/prontuarios/${p.id}`}>
                  <FolderOpen className="h-4 w-4 mr-1" />Abrir prontuário
                </Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalRecords;
