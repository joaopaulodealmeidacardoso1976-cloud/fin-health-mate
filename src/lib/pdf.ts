import jsPDF from "jspdf";

export interface PrescriptionPdfInput {
  clinicName: string;
  clinicLogoDataUrl?: string | null;
  patientName: string;
  patientCpf?: string | null;
  patientAge?: number | null;
  professional?: string | null;
  professionalRegistry?: string | null;
  prescribedAt: Date;
  items: { medication: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }[];
  notes?: string | null;
}

export function generatePrescriptionPdf(input: PrescriptionPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = drawClinicHeader(doc, input.clinicName, input.clinicLogoDataUrl ?? null, "Receituário");

  doc.setFontSize(11);
  doc.text(`Paciente: ${input.patientName}`, 15, y);
  y += 6;
  if (input.patientAge != null) {
    doc.text(`Idade: ${input.patientAge} anos`, 15, y);
    y += 6;
  }
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
  if (input.professionalRegistry) {
    doc.text(input.professionalRegistry, pageW / 2, y + 10, { align: "center" });
  }

  doc.save(`receita-${input.patientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

// ----- Helpers compartilhados -----

export function drawClinicHeader(doc: jsPDF, clinicName: string, logoDataUrl: string | null, subtitle: string) {
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;
  if (logoDataUrl) {
    try {
      const fmt = logoDataUrl.includes("image/png") ? "PNG" : (logoDataUrl.includes("image/webp") ? "WEBP" : "JPEG");
      doc.addImage(logoDataUrl, fmt, 15, y, 20, 20);
    } catch {}
  }
  doc.setFont("helvetica", "bold").setFontSize(18);
  doc.text(clinicName, pageW / 2, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(11);
  doc.text(subtitle, pageW / 2, y + 15, { align: "center" });
  y += 22;
  doc.setLineWidth(0.3);
  doc.line(15, y, pageW - 15, y);
  return y + 8;
}

function header(doc: jsPDF, clinicName: string, subtitle: string, logoDataUrl: string | null = null) {
  return drawClinicHeader(doc, clinicName, logoDataUrl, subtitle);
}

function signature(doc: jsPDF, professional: string | null | undefined, registry: string | null | undefined, fromY: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const y = Math.max(fromY + 30, 250);
  doc.line(pageW / 2 - 40, y, pageW / 2 + 40, y);
  doc.text(professional ?? "Assinatura do profissional", pageW / 2, y + 5, { align: "center" });
  if (registry) doc.text(registry, pageW / 2, y + 10, { align: "center" });
}

function patientBlock(doc: jsPDF, name: string, issuedAt: Date, fromY: number) {
  doc.setFontSize(11);
  doc.text(`Paciente: ${name}`, 15, fromY);
  doc.text(`Data: ${issuedAt.toLocaleDateString("pt-BR")}`, 15, fromY + 6);
  return fromY + 14;
}

// ----- Plano alimentar -----
export interface NutritionPdfInput {
  clinicName: string;
  clinicLogoDataUrl?: string | null;
  patientName: string;
  title: string;
  meals: { name: string; time?: string; items?: string }[];
  guidelines?: string | null;
  validUntil?: string | null;
  issuedAt: Date;
  professional?: string | null;
  professionalRegistry?: string | null;
}
export function generateNutritionPlanPdf(input: NutritionPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = header(doc, input.clinicName, input.title, input.clinicLogoDataUrl ?? null);
  y = patientBlock(doc, input.patientName, input.issuedAt, y);
  if (input.validUntil) { doc.text(`Válido até: ${new Date(input.validUntil).toLocaleDateString("pt-BR")}`, 15, y); y += 8; }

  input.meals.forEach((m) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text(`${m.name}${m.time ? ` — ${m.time}` : ""}`, 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    if (m.items) {
      const lines = doc.splitTextToSize(m.items, pageW - 30);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 2;
    }
  });
  if (input.guidelines) {
    if (y > 240) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFont("helvetica", "bold").text("Orientações:", 15, y); y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(input.guidelines, pageW - 30);
    doc.text(lines, 15, y); y += lines.length * 5;
  }
  signature(doc, input.professional, input.professionalRegistry, y);
  doc.save(`plano-alimentar-${input.patientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

// ----- Plano de exercícios -----
export interface ExercisePdfInput {
  clinicName: string;
  clinicLogoDataUrl?: string | null;
  patientName: string;
  title: string;
  exercises: { name: string; sets?: string; reps?: string; load?: string; rest?: string; notes?: string }[];
  frequency?: string | null;
  durationWeeks?: number | null;
  notes?: string | null;
  issuedAt: Date;
  professional?: string | null;
  professionalRegistry?: string | null;
}
export function generateExercisePlanPdf(input: ExercisePdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = header(doc, input.clinicName, input.title, input.clinicLogoDataUrl ?? null);
  y = patientBlock(doc, input.patientName, input.issuedAt, y);
  const meta: string[] = [];
  if (input.frequency) meta.push(`Frequência: ${input.frequency}`);
  if (input.durationWeeks) meta.push(`Duração: ${input.durationWeeks} semanas`);
  if (meta.length) { doc.text(meta.join(" • "), 15, y); y += 8; }

  input.exercises.forEach((ex, i) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold").text(`${i + 1}. ${ex.name}`, 15, y); y += 6;
    doc.setFont("helvetica", "normal");
    const parts: string[] = [];
    if (ex.sets) parts.push(`${ex.sets} séries`);
    if (ex.reps) parts.push(`${ex.reps} reps`);
    if (ex.load) parts.push(`carga: ${ex.load}`);
    if (ex.rest) parts.push(`desc.: ${ex.rest}`);
    if (parts.length) { doc.text(parts.join(" • "), 20, y); y += 5; }
    if (ex.notes) { const lines = doc.splitTextToSize(ex.notes, pageW - 35); doc.text(lines, 20, y); y += lines.length * 5; }
    y += 2;
  });
  if (input.notes) {
    if (y > 240) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFont("helvetica", "bold").text("Observações:", 15, y); y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(input.notes, pageW - 30);
    doc.text(lines, 15, y); y += lines.length * 5;
  }
  signature(doc, input.professional, input.professionalRegistry, y);
  doc.save(`plano-exercicios-${input.patientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

// ----- Documento clínico genérico (atestados, relatórios) -----
export interface ClinicalDocPdfInput {
  clinicName: string;
  clinicLogoDataUrl?: string | null;
  patientName: string;
  title: string;
  docType: string;
  content: string;
  issuedAt: Date;
  professional?: string | null;
  professionalRegistry?: string | null;
}
export function generateClinicalDocumentPdf(input: ClinicalDocPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = header(doc, input.clinicName, input.docType, input.clinicLogoDataUrl ?? null);
  y = patientBlock(doc, input.patientName, input.issuedAt, y);
  doc.setFont("helvetica", "bold").setFontSize(13).text(input.title, pageW / 2, y, { align: "center" });
  y += 10;
  doc.setFont("helvetica", "normal").setFontSize(11);
  const lines = doc.splitTextToSize(input.content, pageW - 30);
  lines.forEach((line: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.text(line, 15, y);
    y += 6;
  });
  signature(doc, input.professional, input.professionalRegistry, y);
  doc.save(`${input.docType.toLowerCase().replace(/\s+/g, "-")}-${input.patientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

// ----- Solicitação de exames -----
export interface ExamRequestPdfInput {
  clinicName: string;
  clinicLogoDataUrl?: string | null;
  patientName: string;
  patientCpf?: string | null;
  patientAge?: number | null;
  exams: { name: string; notes?: string | null }[];
  clinicalInfo?: string | null;
  issuedAt: Date;
  professional?: string | null;
  professionalRegistry?: string | null;
}
export function generateExamRequestPdf(input: ExamRequestPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = header(doc, input.clinicName, "Solicitação de Exames", input.clinicLogoDataUrl ?? null);
  doc.setFontSize(11);
  doc.text(`Paciente: ${input.patientName}`, 15, y); y += 6;
  if (input.patientAge != null) { doc.text(`Idade: ${input.patientAge} anos`, 15, y); y += 6; }
  if (input.patientCpf) { doc.text(`CPF/Documento: ${input.patientCpf}`, 15, y); y += 6; }
  doc.text(`Data: ${input.issuedAt.toLocaleDateString("pt-BR")}`, 15, y); y += 10;

  doc.setFont("helvetica", "bold").text("Solicito os exames abaixo:", 15, y); y += 7;
  doc.setFont("helvetica", "normal");
  input.exams.forEach((e, i) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold").text(`${i + 1}. ${e.name}`, 15, y); y += 6;
    if (e.notes) {
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(e.notes, pageW - 30);
      doc.text(lines, 20, y); y += lines.length * 5;
    }
    y += 2;
  });

  if (input.clinicalInfo) {
    if (y > 240) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFont("helvetica", "bold").text("Informações clínicas:", 15, y); y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(input.clinicalInfo, pageW - 30);
    doc.text(lines, 15, y); y += lines.length * 5;
  }

  signature(doc, input.professional, input.professionalRegistry, y);
  doc.save(`solicitacao-exames-${input.patientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
