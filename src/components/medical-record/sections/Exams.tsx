import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import { FlaskConical, Trash2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { useAuth } from "@/hooks/useAuth";

interface ExamRequest {
  id: string; exam_name: string; requested_at: string;
  result_url: string | null; result_filename: string | null; interpretation: string | null;
}

export const Exams = ({ recordId, patientId }: { recordId: string; patientId: string }) => {
  const { user } = useAuth();
  const [list, setList] = useState<ExamRequest[]>([]);
  const [form, setForm] = useState({ exam_name: "" });

  const load = async () => {
    const { data } = await supabase.from("exam_requests").select("*").eq("record_id", recordId).order("requested_at", { ascending: false });
    setList((data ?? []) as ExamRequest[]);
  };
  useEffect(() => { load(); }, [recordId]);

  const add = async () => {
    if (!form.exam_name.trim()) return;
    const { error } = await supabase.from("exam_requests").insert({ record_id: recordId, exam_name: form.exam_name });
    if (error) { toast.error(error.message); return; }
    setForm({ exam_name: "" });
    logAudit({ record_id: recordId, patient_id: patientId, section: "exams", action: "create" });
    load();
  };

  const upload = async (id: string, file: File) => {
    if (!user) return;
    const path = `${user.id}/${recordId}/exams/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("medical-records").upload(path, file);
    if (upErr) { toast.error(upErr.message); return; }
    await supabase.from("exam_requests").update({ result_url: path, result_filename: file.name }).eq("id", id);
    logAudit({ record_id: recordId, patient_id: patientId, section: "exams", action: "upload_result" });
    toast.success("Resultado anexado");
    load();
  };

  const download = async (path: string, name: string) => {
    const { data } = await supabase.storage.from("medical-records").createSignedUrl(path, 60);
    if (data?.signedUrl) {
      const a = document.createElement("a"); a.href = data.signedUrl; a.download = name; a.click();
    }
  };

  const updateInterp = async (id: string, text: string) => {
    await supabase.from("exam_requests").update({ interpretation: text }).eq("id", id);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este exame?")) return;
    await supabase.from("exam_requests").delete().eq("id", id);
    load();
  };

  return (
    <SectionCard title="Exames" icon={<FlaskConical className="h-5 w-5" />}>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Solicitar exame (ex: Hemograma completo)" value={form.exam_name} onChange={(e) => setForm({ exam_name: e.target.value })} />
        <Button onClick={add} className="bg-gold text-primary hover:bg-gold/90">Solicitar</Button>
      </div>
      <div className="space-y-3">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum exame solicitado</p> :
          list.map((e) => (
            <div key={e.id} className="border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium">{e.exam_name}</p>
                  <p className="text-xs text-muted-foreground">Solicitado em {new Date(e.requested_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {e.result_url ? (
                    <Button variant="outline" size="sm" onClick={() => download(e.result_url!, e.result_filename ?? "exame")}>
                      <FileText className="h-4 w-4 mr-1" />{e.result_filename}
                    </Button>
                  ) : (
                    <Label className="cursor-pointer inline-flex items-center text-sm border border-input bg-background hover:bg-accent rounded-md px-3 py-1.5">
                      <Upload className="h-4 w-4 mr-1" />Anexar
                      <input type="file" className="hidden" onChange={(ev) => ev.target.files && upload(e.id, ev.target.files[0])} />
                    </Label>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <Textarea className="mt-2" placeholder="Interpretação do resultado..." defaultValue={e.interpretation ?? ""} onBlur={(ev) => updateInterp(e.id, ev.target.value)} rows={2} />
            </div>
          ))}
      </div>
    </SectionCard>
  );
};
