import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "../SectionCard";
import { FileSignature, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";
import { generateClinicalDocumentPdf } from "@/lib/pdf";
import { ProfessionalCategory, getCategory } from "@/lib/professionalCategories";
import { useProfessional } from "@/hooks/useProfessional";
import { useClinic, loadImageAsDataUrl } from "@/hooks/useClinic";

interface Doc { id: string; doc_type: string; title: string; content: string; issued_at: string; }

export const ClinicalDocuments = ({ recordId, patientId, patientName, category }: { recordId: string; patientId: string; patientName: string; category: ProfessionalCategory }) => {
  const { profile } = useProfessional();
  const { clinic } = useClinic();
  const meta = getCategory(category);
  const [list, setList] = useState<Doc[]>([]);
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState(meta.documentTypes[0]?.value ?? "atestado");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const load = async () => {
    const { data } = await supabase.from("clinical_documents").select("*").eq("record_id", recordId).order("issued_at", { ascending: false });
    setList((data ?? []) as Doc[]);
  };
  useEffect(() => { load(); }, [recordId]);

  const save = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Preencha título e conteúdo"); return; }
    const { error } = await supabase.from("clinical_documents").insert({
      record_id: recordId, category, doc_type: docType, title, content,
    } as any);
    if (error) { toast.error(error.message); return; }
    logAudit({ record_id: recordId, patient_id: patientId, section: "documents", action: "create" });
    toast.success("Documento salvo");
    setOpen(false); setTitle(""); setContent(""); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir documento?")) return;
    await supabase.from("clinical_documents").delete().eq("id", id);
    load();
  };

  const downloadPdf = async (d: Doc) => {
    const logo = await loadImageAsDataUrl(clinic.logoUrl);
    generateClinicalDocumentPdf({
      clinicName: clinic.name,
      clinicLogoDataUrl: logo,
      patientName, title: d.title, content: d.content, docType: meta.documentTypes.find(t => t.value === d.doc_type)?.label ?? d.doc_type,
      issuedAt: new Date(d.issued_at),
      professional: profile?.fullName ?? null,
      professionalRegistry: profile?.registry ? `${profile.meta.council}${profile.uf ? `/${profile.uf}` : ""} ${profile.registry}` : null,
    });
  };

  return (
    <SectionCard title="Documentos / Atestados" icon={<FileSignature className="h-5 w-5" />}
      action={!open && <Button size="sm" onClick={() => setOpen(true)} className="bg-gold text-primary hover:bg-gold/90"><Plus className="h-4 w-4 mr-1" />Novo</Button>}>
      {open && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Tipo de documento</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meta.documentTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          </div>
          <div><Label>Conteúdo</Label><Textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Texto que aparecerá no documento..." /></div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setOpen(false); setTitle(""); setContent(""); }}>Cancelar</Button>
            <Button onClick={save} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum documento</p> :
          list.map((d) => (
            <div key={d.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">{meta.documentTypes.find(t => t.value === d.doc_type)?.label ?? d.doc_type} • {new Date(d.issued_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => downloadPdf(d)}><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
      </div>
    </SectionCard>
  );
};
