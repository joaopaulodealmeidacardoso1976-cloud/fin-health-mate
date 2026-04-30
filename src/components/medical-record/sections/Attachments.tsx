import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SectionCard } from "../SectionCard";
import { Paperclip, Trash2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { useAuth } from "@/hooks/useAuth";

interface Att { id: string; file_url: string; file_name: string; file_type: string | null; category: string | null; uploaded_at: string; }

export const Attachments = ({ recordId, patientId }: { recordId: string; patientId: string }) => {
  const { user } = useAuth();
  const [list, setList] = useState<Att[]>([]);
  const [category, setCategory] = useState("");

  const load = async () => {
    const { data } = await supabase.from("record_attachments").select("*").eq("record_id", recordId).order("uploaded_at", { ascending: false });
    setList((data ?? []) as Att[]);
  };
  useEffect(() => { load(); }, [recordId]);

  const upload = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/${recordId}/attachments/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("medical-records").upload(path, file);
    if (error) { toast.error(error.message); return; }
    await supabase.from("record_attachments").insert({
      record_id: recordId, file_url: path, file_name: file.name, file_type: file.type, category: category || null,
    });
    logAudit({ record_id: recordId, patient_id: patientId, section: "attachments", action: "upload" });
    toast.success("Arquivo enviado");
    setCategory("");
    load();
  };

  const download = async (a: Att) => {
    const { data } = await supabase.storage.from("medical-records").createSignedUrl(a.file_url, 60);
    if (data?.signedUrl) {
      const link = document.createElement("a"); link.href = data.signedUrl; link.download = a.file_name; link.click();
    }
  };

  const remove = async (a: Att) => {
    if (!confirm("Excluir anexo?")) return;
    await supabase.storage.from("medical-records").remove([a.file_url]);
    await supabase.from("record_attachments").delete().eq("id", a.id);
    load();
  };

  return (
    <SectionCard title="Documentos e Anexos" icon={<Paperclip className="h-5 w-5" />}>
      <div className="flex flex-col md:flex-row gap-2 mb-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex-1">
          <Label>Categoria (opcional)</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Laudo, Imagem, Termo" />
        </div>
        <div className="flex items-end">
          <Label className="cursor-pointer inline-flex items-center text-sm bg-gold text-primary hover:bg-gold/90 rounded-md px-4 py-2 font-medium">
            <Upload className="h-4 w-4 mr-2" />Enviar arquivo
            <input type="file" className="hidden" onChange={(e) => e.target.files && upload(e.target.files[0])} />
          </Label>
        </div>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum anexo</p> :
          list.map((a) => (
            <div key={a.id} className="flex items-center justify-between border border-border rounded-md p-3">
              <button onClick={() => download(a)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                <FileText className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.file_name}</p>
                  <p className="text-xs text-muted-foreground">{a.category && `${a.category} • `}{new Date(a.uploaded_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </button>
              <Button variant="ghost" size="icon" onClick={() => remove(a)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
      </div>
    </SectionCard>
  );
};
