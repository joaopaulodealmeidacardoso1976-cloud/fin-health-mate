export type ProfessionalCategory =
  | "medical"
  | "dental"
  | "psychology"
  | "nutrition"
  | "physiotherapy"
  | "speech_therapy"
  | "nursing"
  | "occupational_therapy"
  | "physical_education";

export type RecordSection =
  | "identification"
  | "anamnesis"
  | "exam"
  | "diagnosis"
  | "plan"
  | "treatment"
  | "exams"
  | "prescriptions"
  | "nutrition_plan"
  | "exercise_plan"
  | "assessment"
  | "documents"
  | "evolution"
  | "attachments"
  | "appointments"
  | "audit";

export interface CategoryMeta {
  id: ProfessionalCategory;
  label: string;
  council: string;       // CRM, CRO, CRP...
  sections: RecordSection[];
  documentTypes: { value: string; label: string }[];
}

const COMMON_END: RecordSection[] = ["evolution", "attachments", "appointments", "audit"];
const COMMON_START: RecordSection[] = ["identification", "anamnesis"];

export const CATEGORIES: Record<ProfessionalCategory, CategoryMeta> = {
  medical: {
    id: "medical", label: "Médico", council: "CRM",
    sections: [...COMMON_START, "exam", "diagnosis", "plan", "treatment", "exams", "prescriptions", "documents", ...COMMON_END],
    documentTypes: [
      { value: "atestado", label: "Atestado médico" },
      { value: "relatorio", label: "Relatório médico" },
      { value: "laudo", label: "Laudo médico" },
      { value: "declaracao", label: "Declaração de comparecimento" },
      { value: "encaminhamento", label: "Encaminhamento" },
    ],
  },
  dental: {
    id: "dental", label: "Odontólogo", council: "CRO",
    sections: [...COMMON_START, "exam", "diagnosis", "plan", "treatment", "exams", "prescriptions", "documents", ...COMMON_END],
    documentTypes: [
      { value: "atestado", label: "Atestado odontológico" },
      { value: "relatorio", label: "Relatório clínico" },
      { value: "laudo", label: "Laudo odontológico" },
      { value: "declaracao", label: "Declaração de comparecimento" },
      { value: "encaminhamento", label: "Encaminhamento" },
    ],
  },
  psychology: {
    id: "psychology", label: "Psicólogo", council: "CRP",
    sections: [...COMMON_START, "diagnosis", "plan", "assessment", "documents", ...COMMON_END],
    documentTypes: [
      { value: "atestado_psi", label: "Atestado psicológico" },
      { value: "relatorio_psi", label: "Relatório psicológico" },
      { value: "laudo_psi", label: "Laudo psicológico" },
      { value: "declaracao", label: "Declaração de comparecimento" },
      { value: "encaminhamento", label: "Encaminhamento" },
    ],
  },
  nutrition: {
    id: "nutrition", label: "Nutricionista", council: "CRN",
    sections: [...COMMON_START, "exam", "plan", "exams", "nutrition_plan", "documents", ...COMMON_END],
    documentTypes: [
      { value: "plano_alimentar", label: "Plano alimentar (resumo)" },
      { value: "atestado_nutri", label: "Atestado nutricional" },
      { value: "declaracao", label: "Declaração de comparecimento" },
      { value: "encaminhamento", label: "Encaminhamento" },
    ],
  },
  physiotherapy: {
    id: "physiotherapy", label: "Fisioterapeuta", council: "CREFITO",
    sections: [...COMMON_START, "exam", "plan", "treatment", "assessment", "exercise_plan", "documents", ...COMMON_END],
    documentTypes: [
      { value: "atestado_fisio", label: "Atestado fisioterápico" },
      { value: "plano_fisio", label: "Plano de tratamento fisioterápico" },
      { value: "laudo_fisio", label: "Laudo fisioterápico" },
      { value: "declaracao", label: "Declaração de comparecimento" },
      { value: "encaminhamento", label: "Encaminhamento" },
    ],
  },
  speech_therapy: {
    id: "speech_therapy", label: "Fonoaudiólogo", council: "CRFa",
    sections: [...COMMON_START, "exam", "plan", "treatment", "assessment", "documents", ...COMMON_END],
    documentTypes: [
      { value: "atestado_fono", label: "Atestado fonoaudiológico" },
      { value: "plano_fono", label: "Plano fonoaudiológico" },
      { value: "laudo_fono", label: "Laudo fonoaudiológico" },
      { value: "declaracao", label: "Declaração de comparecimento" },
      { value: "encaminhamento", label: "Encaminhamento" },
    ],
  },
  nursing: {
    id: "nursing", label: "Enfermeiro", council: "COREN",
    sections: [...COMMON_START, "exam", "diagnosis", "plan", "treatment", "exams", "documents", ...COMMON_END],
    documentTypes: [
      { value: "relatorio_enf", label: "Relatório de enfermagem" },
      { value: "declaracao", label: "Declaração de comparecimento" },
    ],
  },
  occupational_therapy: {
    id: "occupational_therapy", label: "Terapeuta Ocupacional", council: "CREFITO",
    sections: [...COMMON_START, "exam", "plan", "treatment", "assessment", "documents", ...COMMON_END],
    documentTypes: [
      { value: "atestado_to", label: "Atestado terapêutico ocupacional" },
      { value: "plano_to", label: "Plano de intervenção ocupacional" },
      { value: "laudo_to", label: "Laudo terapêutico ocupacional" },
      { value: "declaracao", label: "Declaração de comparecimento" },
      { value: "encaminhamento", label: "Encaminhamento" },
    ],
  },
  physical_education: {
    id: "physical_education", label: "Educador Físico", council: "CREF",
    sections: [...COMMON_START, "exam", "plan", "treatment", "assessment", "exercise_plan", "documents", ...COMMON_END],
    documentTypes: [
      { value: "plano_treino", label: "Plano de treino" },
      { value: "avaliacao_fisica", label: "Avaliação física" },
      { value: "declaracao", label: "Declaração de comparecimento" },
    ],
  },
};

export const CATEGORY_OPTIONS = Object.values(CATEGORIES).map((c) => ({ value: c.id, label: `${c.label} (${c.council})` }));

export function getCategory(id: string | null | undefined): CategoryMeta {
  if (id && (CATEGORIES as any)[id]) return CATEGORIES[id as ProfessionalCategory];
  return CATEGORIES.medical;
}

export function isSectionVisible(category: ProfessionalCategory, section: RecordSection): boolean {
  return CATEGORIES[category].sections.includes(section);
}

export function formatRegistry(category: ProfessionalCategory, registry: string | null | undefined, uf?: string | null): string | null {
  if (!registry) return null;
  const council = CATEGORIES[category].council;
  return `${council}${uf ? `/${uf}` : ""} ${registry}`;
}
