// Lista local de códigos CID-10 mais comuns (subset)
export interface Cid10Item { code: string; description: string; }

export const CID10: Cid10Item[] = [
  { code: "A09", description: "Diarreia e gastroenterite de origem infecciosa presumível" },
  { code: "B34.9", description: "Infecção viral não especificada" },
  { code: "E11", description: "Diabetes mellitus tipo 2" },
  { code: "E66", description: "Obesidade" },
  { code: "E78", description: "Distúrbios do metabolismo de lipoproteínas" },
  { code: "F32", description: "Episódios depressivos" },
  { code: "F41", description: "Outros transtornos ansiosos" },
  { code: "G43", description: "Enxaqueca" },
  { code: "H10", description: "Conjuntivite" },
  { code: "I10", description: "Hipertensão essencial (primária)" },
  { code: "I20", description: "Angina pectoris" },
  { code: "I25", description: "Doença isquêmica crônica do coração" },
  { code: "J00", description: "Nasofaringite aguda (resfriado comum)" },
  { code: "J02", description: "Faringite aguda" },
  { code: "J03", description: "Amigdalite aguda" },
  { code: "J06", description: "Infecções agudas das vias aéreas superiores" },
  { code: "J11", description: "Influenza (gripe)" },
  { code: "J18", description: "Pneumonia por microorganismo não especificado" },
  { code: "J20", description: "Bronquite aguda" },
  { code: "J45", description: "Asma" },
  { code: "K02", description: "Cárie dentária" },
  { code: "K04", description: "Doenças da polpa e dos tecidos periapicais" },
  { code: "K05", description: "Gengivite e doenças periodontais" },
  { code: "K08", description: "Outros transtornos dos dentes e estruturas de suporte" },
  { code: "K21", description: "Doença de refluxo gastroesofágico" },
  { code: "K29", description: "Gastrite e duodenite" },
  { code: "L20", description: "Dermatite atópica" },
  { code: "L70", description: "Acne" },
  { code: "M54", description: "Dorsalgia" },
  { code: "M79", description: "Outros transtornos dos tecidos moles" },
  { code: "N39", description: "Outros transtornos do trato urinário" },
  { code: "R05", description: "Tosse" },
  { code: "R10", description: "Dor abdominal e pélvica" },
  { code: "R51", description: "Cefaleia" },
  { code: "Z00", description: "Exame geral e investigação de pessoas sem queixas" },
  { code: "Z01", description: "Outros exames especiais e investigações" },
];

export function searchCid10(query: string): Cid10Item[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return CID10.filter(
    (item) => item.code.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
  ).slice(0, 8);
}
