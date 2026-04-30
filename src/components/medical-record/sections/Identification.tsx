import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "../SectionCard";
import { User } from "lucide-react";
import { toast } from "sonner";
import { calculateAge } from "@/lib/age";
import { logAudit } from "@/hooks/useAuditLog";
import type { MedicalRecord } from "@/hooks/useMedicalRecord";

interface Patient {
  id: string; name: string; phone: string | null; email: string | null;
  birth_date: string | null; cpf: string | null; gender: string | null;
  address: string | null; emergency_contact: string | null;
}

export const Identification = ({ patient, record, onTypeChange, onPatientUpdate }: {
  patient: Patient; record: MedicalRecord;
  onTypeChange: (t: "medical" | "dental") => void;
  onPatientUpdate: () => void;
}) => {
  const [form, setForm] = useState(patient);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(patient); }, [patient]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("patients").update({
      name: form.name, phone: form.phone, email: form.email,
      birth_date: form.birth_date, cpf: form.cpf, gender: form.gender,
      address: form.address, emergency_contact: form.emergency_contact,
    }).eq("id", patient.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Identificação atualizada");
    logAudit({ record_id: record.id, patient_id: patient.id, section: "identification", action: "update" });
    onPatientUpdate();
  };

  const age = calculateAge(form.birth_date);

  return (
    <SectionCard title="Identificação do Paciente" icon={<User className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Nome completo</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div>
          <Label>Tipo de atendimento</Label>
          <Select value={record.record_type} onValueChange={(v) => onTypeChange(v as "medical" | "dental")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="medical">Médico</SelectItem>
              <SelectItem value="dental">Odontológico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Data de nascimento</Label><Input type="date" value={form.birth_date ?? ""} onChange={(e) => setForm({ ...form, birth_date: e.target.value || null })} /></div>
        <div><Label>Idade</Label><Input value={age !== null ? `${age} anos` : "—"} disabled /></div>
        <div>
          <Label>Sexo</Label>
          <Select value={form.gender ?? ""} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="F">Feminino</SelectItem>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="O">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>CPF / Documento</Label><Input value={form.cpf ?? ""} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
        <div><Label>Telefone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label>E-mail</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>Endereço</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>Contato de emergência</Label><Input value={form.emergency_contact ?? ""} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold text-primary hover:bg-gold/90">Salvar</Button>
      </div>
    </SectionCard>
  );
};
