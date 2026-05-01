## Prontuário multi-categoria por profissional

Hoje o prontuário só conhece dois tipos: **medical** e **dental**. Vamos expandir para **9 categorias profissionais**, com o tipo derivado do **profissional logado** (configurado no perfil), e adaptar seções, campos e documentos por categoria.

### Categorias e conselhos suportados

| Categoria | Conselho | Foco clínico principal |
|---|---|---|
| Médico | CRM | Anamnese geral, sinais vitais, prescrição |
| Odontólogo | CRO | Odontograma, plano odontológico |
| Psicólogo | CRP | Queixa emocional, hipótese diagnóstica (CID-F), evolução, atestado |
| Nutricionista | CRN | Antropometria, recordatório alimentar, plano alimentar |
| Fisioterapeuta | CREFITO | Avaliação postural/ADM/força, plano de exercícios |
| Fonoaudiólogo | CRFa | Avaliação de fala/audição/linguagem, plano terapêutico |
| Enfermeiro | COREN | Sinais vitais, evolução, procedimentos |
| Terapeuta Ocupacional | CREFITO | Avaliação funcional/AVDs, plano de intervenção |
| Educador Físico | CREF | Avaliação física, plano de treino |

### Definição da categoria

- Cada usuário escolhe sua **categoria profissional** + **número do conselho** no perfil.
- O prontuário se adapta automaticamente ao logar (sem campo no paciente).
- Admin pode atender qualquer paciente (vê tudo).

### Mudanças por categoria

**1. Seções visíveis (sidebar do prontuário):**

```text
                       Méd Odo Psi Nut Fis Fon Enf TO  Edf
Identificação           ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓
Anamnese                ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓
Exame Clínico           ✓   ✓   —   ✓   ✓   ✓   ✓   ✓   ✓
Odontograma             —   ✓   —   —   —   —   —   —   —
Diagnóstico (CID)       ✓   ✓   ✓   —   —   —   ✓   —   —
Plano (terapêutico)     ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓
Tratamento/Procedim.    ✓   ✓   —   —   ✓   ✓   ✓   ✓   ✓
Exames laboratoriais    ✓   ✓   —   ✓   —   —   ✓   —   —
Prescrições/Receita     ✓   ✓   —   —   —   —   —   —   —
Plano alimentar         —   —   —   ✓   —   —   —   —   —
Plano de exercícios     —   —   —   —   ✓   —   —   —   ✓
Avaliação funcional     —   —   ✓   —   ✓   ✓   —   ✓   ✓
Evolução                ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓
Anexos                  ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓
Agenda                  ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓
Auditoria               ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓
```

**2. Campos específicos:**

- **Exame Clínico**: psicólogo não tem; nutri ganha **antropometria** (circunferências cintura/quadril/braço, dobras, % gordura); fisio ganha **avaliação postural + ADM + força (escala 0-5)**; fono ganha campos de avaliação fonoaudiológica; T.O. ganha **AVDs (Katz/Lawton)**; ed. físico ganha **testes físicos** (PA esforço, VO₂, flexibilidade).
- **Anamnese**: psico ganha "queixa emocional/história psíquica"; nutri ganha "hábitos alimentares + objetivo"; fisio ganha "queixa funcional + dor (EVA)".

**3. Documentos próprios (PDF) — além da receita:**

- Médico/Odonto: **Receita** (já existe) + **Atestado**.
- Psicólogo: **Atestado psicológico**, **Relatório psicológico**.
- Nutricionista: **Plano alimentar** (cabeçalho + refeições + orientações).
- Fisioterapeuta: **Plano de tratamento fisioterápico** (objetivos + condutas + frequência).
- Fonoaudiólogo: **Plano fonoaudiológico**.
- Enfermeiro: **Relatório de enfermagem**.
- T.O.: **Plano de intervenção ocupacional**.
- Ed. físico: **Plano de treino**.

Todos com cabeçalho da clínica, dados do paciente, conteúdo, e assinatura "Nome — CONSELHO/UF nº".

### Implementação técnica

**Banco de dados (1 migration):**

- Em `profiles`: adicionar `professional_category text` e `professional_registry text` (CRP/CRN/etc).
- Nova tabela `professional_assessments` (avaliações específicas por categoria) com campos jsonb flexíveis: `category text`, `data jsonb`, `record_id`, `owner_id`, RLS owner-or-admin.
- Nova tabela `nutrition_plans` (`record_id`, `title`, `meals jsonb`, `guidelines text`, `valid_until`).
- Nova tabela `exercise_plans` (`record_id`, `title`, `exercises jsonb`, `frequency text`, `duration_weeks`, `notes`).
- Nova tabela `clinical_documents` (genérica para atestados/relatórios): `record_id`, `category text`, `doc_type text`, `title`, `content text`, `issued_at`, RLS owner-or-admin.

**Frontend:**

- `src/lib/professionalCategories.ts`: enum + metadata (label, conselho, cor, seções visíveis, helpers).
- Hook `useProfessional()` lê `profiles.professional_category` + `professional_registry` do usuário logado (fallback para admin = "medical").
- `RecordSidebar` recebe `category` e filtra `SECTIONS` dinamicamente.
- `MedicalRecord.tsx` usa categoria do profissional logado em vez de `record.record_type` para decidir o que renderizar (mantém `record_type` para compatibilidade do odontograma).
- Novas seções:
  - `NutritionPlan.tsx` — refeições (café/lanche/almoço/jantar) + orientações + botão **gerar PDF plano alimentar**.
  - `ExercisePlan.tsx` — lista de exercícios (nome, séries, repetições, carga, descanso) + frequência + **PDF**.
  - `FunctionalAssessment.tsx` — formulário adaptado por categoria (psico/fisio/fono/TO/edf), salvo em `professional_assessments` com jsonb.
  - `ClinicalDocuments.tsx` — atestados e relatórios por categoria, com **PDF**.
- `Identification.tsx`: remover seletor médico/odonto e mostrar **categoria do profissional logado** (read-only badge), mantendo o toggle só para admins.
- Novas funções em `src/lib/pdf.ts`:
  - `generateNutritionPlanPdf`, `generateExercisePlanPdf`, `generateClinicalDocumentPdf`.
  - Atualizar assinatura para usar `${categoria.conselho}/UF ${registro}` automaticamente.
- Página `Profile`/área de configuração: campo **Categoria profissional** (select) + **Número do conselho** (input). Se ainda não existir, criar `src/pages/Profile.tsx` simples com link no header.

**Compatibilidade:**

- Prescrições continuam só para médico e odonto.
- Odontograma continua dependendo de `record_type='dental'`.
- Pacientes existentes continuam funcionando — categoria vem do profissional, não do paciente.

### Entrega

1. Migration (5 alterações de schema).
2. Página de perfil para definir categoria + conselho.
3. Lib de categorias + filtro dinâmico de seções.
4. Novas seções (nutrition, exercise, assessment, documents).
5. Novos PDFs.
6. Ajustes em `Prescriptions`, `RecordSidebar`, `Identification`, `MedicalRecord`.

Aprova o plano para eu implementar?
