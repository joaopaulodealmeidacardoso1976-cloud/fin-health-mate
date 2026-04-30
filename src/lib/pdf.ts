import jsPDF from "jspdf";

export interface PrescriptionPdfInput {
  clinicName: string;
  patientName: string;
  patientCpf?: string | null;
  professional?: string | null;
  prescribedAt: Date;
  items: { medication: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }[];
  notes?: string | null;
}

export function generatePrescriptionPdf(input: PrescriptionPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(input.clinicName, pageW / 2, y, { align: "center" });
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Receituário", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setLineWidth(0.3);
  doc.line(15, y, pageW - 15, y);
  y += 8;

  doc.setFontSize(11);
  doc.text(`Paciente: ${input.patientName}`, 15, y);
  y += 6;
  if (input.patientCpf) {
    doc.text(`CPF/Documento: ${input.patientCpf}`, 15, y);
    y += 6;
  }
  doc.text(`Data: ${input.prescribedAt.toLocaleDateString("pt-BR")}`, 15, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Prescrição:", 15, y);
  y += 7;
  doc.setFont("helvetica", "normal");

  input.items.forEach((it, idx) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}. ${it.medication}`, 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const parts: string[] = [];
    if (it.dosage) parts.push(`Dosagem: ${it.dosage}`);
    if (it.frequency) parts.push(`Frequência: ${it.frequency}`);
    if (it.duration) parts.push(`Duração: ${it.duration}`);
    if (parts.length) {
      const lines = doc.splitTextToSize(parts.join(" • "), pageW - 30);
      doc.text(lines, 20, y);
      y += lines.length * 5;
    }
    if (it.instructions) {
      const lines = doc.splitTextToSize(`Instruções: ${it.instructions}`, pageW - 30);
      doc.text(lines, 20, y);
      y += lines.length * 5;
    }
    y += 3;
  });

  if (input.notes) {
    if (y > 240) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Observações:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(input.notes, pageW - 30);
    doc.text(lines, 15, y);
    y += lines.length * 5;
  }

  y = Math.max(y + 30, 250);
  doc.line(pageW / 2 - 40, y, pageW / 2 + 40, y);
  doc.text(input.professional ?? "Assinatura do profissional", pageW / 2, y + 5, { align: "center" });

  doc.save(`receita-${input.patientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
