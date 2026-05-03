import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard } from "../SectionCard";
import { FlaskConical, Trash2, Upload, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { useAuth } from "@/hooks/useAuth";
import { searchExams } from "@/lib/exams";
import { generateExamRequestPdf } from "@/lib/pdf";
import { useProfessional } from "@/hooks/useProfessional";
import { useClinic, loadImageAsDataUrl } from "@/hooks/useClinic";
import { calculateAge } from "@/lib/age";

interface ExamRequest {
  id: string; exam_name: string; requested_at: string;
  result_url: string | null; result_filename: string | null; interpretation: string | null;
}

interface Props {
  recordId: string;
  patientId: string;
  patientName?: string;
  patientCpf?: string | null;
  patientBirthDate?: string | null;
}

export const Exams = ({ recordId, patientId, patientName = "", patientCpf = null, patientBirthDate = null }: Props) => {
  const { user } = useAuth();
  const { profile } = useProfessional();
  const { clinic } = useClinic();
  const [list, setList] = useState<ExamRequest[]>([]);
  const [examName, setExamName] = useState("");
  const [showSugg, setShowSugg] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [clinicalInfo, setClinicalInfo] = useState("");

  const load = async () => {
    const { data } = await supabase.from("exam_requests").select("*").eq("record_id", recordId).order("requested_at", { ascending: false });
    setList((data ?? []) as ExamRequest[]);
  };
  useEffect(() => { load(); }, [recordId]);

  const add = async (name?: string) => {
    const value = (name ?? examName).trim();
    if (!value) return;
    const { error } = await supabase.from("exam_requests").insert({ record_id: recordId, exam_name: value });
    if (error) { toast.error(error.message); return; }
    setExamName(""); setShowSugg(false);
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
    setSelected((s) => { const c = { ...s }; delete c[id]; return c; });
    load();
  };

  const printRequest = (exams: ExamRequest[]) => {
    if (!exams.length) { toast.error("Selecione ao menos um exame"); return; }
    const registry = profile?.registry
      ? `${profile.meta.council}${profile.uf ? `/${profile.uf}` : ""} ${profile.registry}`
      : null;
    generateExamRequestPdf({
      clinicName: "DADOSTOP CLINIC",
      patientName: patientName || "Paciente",
      patientCpf,
      patientAge: calculateAge(patientBirthDate),
      exams: exams.map((e) => ({ name: e.exam_name, notes: e.interpretation })),
      clinicalInfo: clinicalInfo || null,
      issuedAt: new Date(),
      professional: profile?.fullName ?? null,
      professionalRegistry: registry,
    });
  };

  const printSelected = () => printRequest(list.filter((e) => selected[e.id]));
  const printAll = () => printRequest(list);

  const suggestions = searchExams(examName);

  return (
    <SectionCard title="Exames" icon={<FlaskConical className="h-5 w-5" />}>
      <div className="flex gap-2 mb-2 relative">
        <div className="flex-1 relative">
          <Input
            placeholder="Solicitar exame (ex: Hemograma completo)"
            value={examName}
            onChange={(e) => { setExamName(e.target.value); setShowSugg(true); }}
            onFocus={() => setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 150)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          />
          {showSugg && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto">
              {suggestions.map((s) => (
                <button key={s} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(s)}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent">{s}</button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={() => add()} className="bg-gold text-primary hover:bg-gold/90">Solicitar</Button>
      </div>

      {list.length > 0 && (
        <div className="mb-3 p-3 bg-muted/30 rounded-md space-y-2">
          <Label className="text-xs">Informações clínicas (opcional, sai impresso)</Label>
          <Textarea rows={2} placeholder="Hipóteses diagnósticas, motivo do pedido..." value={clinicalInfo} onChange={(e) => setClinicalInfo(e.target.value)} />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={printSelected}>
              <Printer className="h-4 w-4 mr-1" />Imprimir selecionados
            </Button>
            <Button size="sm" className="bg-gold text-primary hover:bg-gold/90" onClick={printAll}>
              <Printer className="h-4 w-4 mr-1" />Imprimir todos
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum exame solicitado</p> :
          list.map((e) => (
            <div key={e.id} className="border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <Checkbox
                    className="mt-1"
                    checked={!!selected[e.id]}
                    onCheckedChange={(v) => setSelected((s) => ({ ...s, [e.id]: !!v }))}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{e.exam_name}</p>
                    <p className="text-xs text-muted-foreground">Solicitado em {new Date(e.requested_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => printRequest([e])} title="Imprimir solicitação"><Printer className="h-4 w-4" /></Button>
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
