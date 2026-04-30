## Prontuário do Paciente — MVP completo

Aba digital centralizando todas as informações clínicas, com 12 seções funcionais, suporte a clínica médica e odontológica, anexos, geração de receita em PDF e auditoria.

### Acesso

- Novo item **"Prontuários"** no menu lateral → lista todos os pacientes com busca → abre o prontuário.
- Botão **"Abrir prontuário"** na lista de Pacientes existente.
- Rota: `/prontuarios` (lista) e `/prontuarios/:patientId` (prontuário individual).

### Layout

- Cabeçalho fixo com **Dashboard resumido**: nome, idade, foto/iniciais, alergias em destaque (badge vermelho), risco, próximo retorno.
- Menu lateral interno com as 12 seções (ícones + labels), navegação por âncora/aba.
- Cards organizados, responsivo desktop/tablet, tokens semânticos do design system (gold/sidebar já existentes).

### Seções implementadas

1. **Identificação** — nome, nascimento, idade automática, sexo, CPF, telefone, e-mail, endereço, contato de emergência, **tipo de atendimento (médico/odontológico)**.
2. **Anamnese** — queixa principal, HDA, histórico pregresso/familiar, alergias, medicações contínuas, hábitos (tabagismo, álcool, atividade), condições crônicas.
3. **Exame Clínico** — sinais vitais (PA, FC, Temp, SpO₂, peso, altura, IMC auto) + observações. Se odontológico → **odontograma interativo SVG** (32 dentes, marcação de status: hígido, cárie, restaurado, ausente, tratamento).
4. **Diagnóstico** — principal, secundários (lista), CID-10 com autocomplete (lista local dos mais comuns), grau de risco (baixo/médio/alto).
5. **Projeto Terapêutico** — objetivos, plano, intervenções, profissionais envolvidos, frequência.
6. **Tratamento** — procedimentos realizados, evolução em timeline (data + profissional + descrição).
7. **Exames** — solicitação (lista), resultados anexados (PDF/imagem), interpretação.
8. **Prescrições** — medicamento, dosagem, frequência, duração; **gerar receita em PDF (jsPDF)** com cabeçalho da clínica.
9. **Evolução Clínica** — timeline cronológica de notas por atendimento.
10. **Documentos e Anexos** — upload livre, organização por tipo/data.
11. **Agenda e Retornos** — integra com `appointments` existente; mostra próximas consultas, histórico, alerta de retorno.
12. **Segurança e Auditoria** — log de criação/edição (usuário, data, seção, ação) visível ao admin.

### Funcionalidades inteligentes

- Busca rápida dentro do prontuário (filtro por seção/conteúdo).
- Autocomplete CID-10 e medicamentos comuns (lista local inicial).
- Reuso de prescrições anteriores (botão "duplicar").
- Alertas críticos no topo (alergias, alto risco).

### Banco de dados (migration)

Novas tabelas, todas com `owner_id uuid default auth.uid()`, RLS owner-or-admin (mesmo padrão das tabelas existentes):

- `medical_records` (1 por paciente) — `patient_id`, `record_type` ('medical'|'dental'), identificação extra (CPF, endereço, sexo, nascimento, contato_emergência).
- `anamnesis` — campos de anamnese (FK record).
- `clinical_exams` — sinais vitais + observações + `dental_chart jsonb` (odontograma).
- `diagnoses` — principal, secundários (jsonb), CID, risco.
- `therapeutic_plans` — objetivos, plano, intervenções, profissionais, frequência.
- `treatments` — entradas de timeline (procedimento, profissional, data, notas).
- `exam_requests` — exame solicitado, resultado_url, interpretação.
- `prescriptions` + `prescription_items` — receita com vários medicamentos.
- `clinical_evolution` — timeline de notas.
- `record_attachments` — arquivos genéricos (tipo, url, nome, data).
- `audit_log` — `user_id`, `record_id`, `section`, `action`, `details jsonb`, `created_at`.

Bucket de Storage **`medical-records`** (privado), políticas: owner pode ler/escrever em pasta `{user_id}/...`.

Campos extras em `patients`: `birth_date`, `cpf`, `gender`, `address`, `emergency_contact` (nullable, retrocompatível).

### Arquitetura de código

```text
src/pages/
  MedicalRecords.tsx          (lista de pacientes para abrir prontuário)
  MedicalRecord.tsx           (página do prontuário, layout + roteamento de seções)
src/components/medical-record/
  RecordHeader.tsx            (dashboard resumido + alertas)
  RecordSidebar.tsx           (menu interno das 12 seções)
  sections/
    Identification.tsx
    Anamnesis.tsx
    ClinicalExam.tsx          (renderiza Odontogram se dental)
    Odontogram.tsx
    Diagnosis.tsx
    TherapeuticPlan.tsx
    Treatment.tsx
    Exams.tsx
    Prescriptions.tsx         (com generatePrescriptionPDF)
    Evolution.tsx
    Attachments.tsx
    AppointmentsHistory.tsx
    AuditLog.tsx
  hooks/
    useMedicalRecord.ts       (carrega registro completo)
    useAuditLog.ts            (registra ações)
src/lib/
  cid10.ts                    (lista local de códigos comuns)
  medications.ts              (lista local de medicamentos comuns)
  pdf.ts                      (jsPDF helper p/ receita)
```

Dependências novas: `jspdf` (PDF cliente).

### Segurança

- Todas as tabelas com RLS `owner_id = auth.uid() OR has_role(admin)`.
- Storage bucket privado, signed URLs para anexos.
- Validação Zod em todos os formulários.
- Audit log gravado em cada save (insert/update) automaticamente via hook.

### Entrega

- Migration única com todas as tabelas, bucket, RLS e políticas.
- Após aprovação da migration: implemento UI + hooks + PDF.
- Botão "Abrir prontuário" adicionado em `Patients.tsx`.
- Item "Prontuários" adicionado em `AppLayout.tsx`.

Aprova o plano para eu seguir com a migration e implementação?