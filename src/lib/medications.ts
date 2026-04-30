// Lista local de medicamentos comuns
export const MEDICATIONS: string[] = [
  "Amoxicilina 500mg",
  "Azitromicina 500mg",
  "Cefalexina 500mg",
  "Ciprofloxacino 500mg",
  "Dipirona 500mg",
  "Paracetamol 750mg",
  "Ibuprofeno 600mg",
  "Diclofenaco 50mg",
  "Nimesulida 100mg",
  "Omeprazol 20mg",
  "Pantoprazol 40mg",
  "Ranitidina 150mg",
  "Losartana 50mg",
  "Enalapril 10mg",
  "Captopril 25mg",
  "Hidroclorotiazida 25mg",
  "Atenolol 50mg",
  "Metformina 850mg",
  "Glibenclamida 5mg",
  "Sinvastatina 20mg",
  "Atorvastatina 20mg",
  "Sertralina 50mg",
  "Fluoxetina 20mg",
  "Clonazepam 2mg",
  "Loratadina 10mg",
  "Cetirizina 10mg",
  "Prednisona 20mg",
  "Salbutamol spray",
  "Clorexidina 0,12% (bochecho)",
  "Benzocaína gel 20%",
];

export function searchMedications(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return MEDICATIONS.filter((m) => m.toLowerCase().includes(q)).slice(0, 8);
}
