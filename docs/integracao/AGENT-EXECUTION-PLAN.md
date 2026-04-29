# Modulo Integracao ERP Agentic Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** transformar a documentacao e a implementacao futura do modulo Integracao ERP em uma fila executavel por subagentes, com gates por evidencia e sem assinatura humana.

**Architecture:** `Agent-Orchestrator` quebra o trabalho em tarefas, despacha subagentes especialistas, exige revisao independente e fecha gates com artefatos do `EVIDENCE-MANIFEST.md`. Dependencias externas ficam fora do caminho critico tecnico e usam fallback de `EXTERNAL-DEPENDENCIES.md`.

**Tech Stack:** Electron, Next.js, NestJS, Prisma, SQLite, OpenTelemetry, Playwright, Jest, Pact/Schemathesis, Semgrep, OWASP ZAP, gitleaks.

---

## File Structure

| Arquivo                                                | Responsabilidade                             |
| ------------------------------------------------------ | -------------------------------------------- |
| `docs/integracao/AGENTIC-EXECUTION-OPERATING-MODEL.md` | regra de precedencia, subagentes e protocolo |
| `docs/integracao/AGENT-GATES-MATRIX.md`                | gates humanos convertidos em gates agenticos |
| `docs/integracao/EVIDENCE-MANIFEST.md`                 | contrato de artefatos exigidos               |
| `docs/integracao/EXTERNAL-DEPENDENCIES.md`             | dependencias externas e fallback             |
| `docs/integracao/DISCOVERY-BLOCKERS.md`                | lacunas factuais por ERP                     |
| `docs/PLANO-MODULO-INTEGRACAO.md`                      | plano-mestre com referencias agenticas       |
| `docs/GUIA-INTEGRACAO-ERP.md`                          | referencia tecnica sem bloqueios humanos     |
| `docs/integracao/BACKLOG-SPRINT-*.md`                  | backlog executavel por subagentes            |
| `docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md`        | TECH_READY/PILOT_READY/COMMERCIAL_GA_READY   |

---

### Task 1: Normalizar Governanca Agentica

**Files:**

- Modify: `docs/PLANO-MODULO-INTEGRACAO.md`
- Modify: `docs/README.md`
- Reference: `docs/integracao/AGENTIC-EXECUTION-OPERATING-MODEL.md`

- [ ] **Step 1: Atualizar referencias canonicas**

Adicionar nota de precedencia agentica no topo do plano e do README.

- [ ] **Step 2: Remover gates humanos bloqueantes**

Trocar Steering/CISO/DPO/CFO/CEO como aprovadores por subagentes e decision records.

- [ ] **Step 3: Verificar termos restantes**

Run: `rg -n -i "Steering|assinatura formal|DPO assin|CISO assina|CEO aprova|CFO\\+CEO|termo de aceite assinado" docs`

Expected: ocorrencias restantes devem estar marcadas como dependencia externa, historico ou termo traduzido pela matriz agentica.

### Task 2: Separar Gate Tecnico de Dependencia Externa

**Files:**

- Modify: `docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md`
- Modify: `docs/integracao/009-criterios-homologacao.md`
- Modify: `docs/integracao/templates/relatorio-homologacao.md`
- Modify: `docs/integracao/templates/termo-aceite-cliente.md`

- [ ] **Step 1: Introduzir estados**

Usar `TECH_READY`, `PILOT_READY` e `COMMERCIAL_GA_READY` em vez de "aprovado/assinado".

- [ ] **Step 2: Converter H4/H5**

Cliente real vira fonte de evidencia opcional; cenarios tambem podem ser executados por `QA-Automation-Agent` com fixture/sandbox.

- [ ] **Step 3: Verificar**

Run: `rg -n -i "assina|assinado|Aprovações|Assinatura" docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md docs/integracao/templates`

Expected: nenhuma assinatura como gate interno.

### Task 3: Agentizar Backlogs e Runbooks

**Files:**

- Modify: `docs/integracao/BACKLOG-SPRINT-0-1.md`
- Modify: `docs/integracao/BACKLOG-SPRINT-5.md`
- Later: `docs/integracao/BACKLOG-SPRINT-2.md` a `BACKLOG-SPRINT-9-10-11.md`
- Later: `docs/runbooks/integracao/*.md`

- [ ] **Step 1: DoR/DoD agenticos**

Trocar planning poker/devs/review humano por estimativa e review de subagentes.

- [ ] **Step 2: Mover itens comerciais para dependencia externa**

Cliente piloto, contrato, aceite e Steering nao podem bloquear historia tecnica.

- [ ] **Step 3: Verificar**

Run: `rg -n -i "Steering|assinado|aprova|CEO|CFO|PM decide|Tech Lead contratado" docs/integracao/BACKLOG-SPRINT-*.md`

Expected: ocorrencias restantes devem apontar para `AGENT-GATES-MATRIX.md` ou `EXTERNAL-DEPENDENCIES.md`.

### Task 4: Implementar Futuro Chassi com Subagentes

**Files:**

- Create: `backend/src/integracao/integracao.module.ts`
- Create: `backend/src/integracao/README.md`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/prisma/schema.prisma`
- Test: `backend/src/integracao/**/*.spec.ts`

- [ ] **Step 1: Backend-Agent cria esqueleto**

Criar modulo NestJS isolado seguindo `001-arquitetura-integration-hub.md`.

- [ ] **Step 2: QA-Automation-Agent escreve testes de carga/contrato quando houver componente**

Comecar pelo Mock Connector antes de ERP real.

- [ ] **Step 3: Security-Agent revisa segredos e payloads**

Sem payload sensivel em log; secret scan obrigatorio.

- [ ] **Step 4: Verificar**

Run: `pnpm --filter backend test -- integracao`

Expected: testes do modulo passam e artefatos entram no manifest.

### Task 5: Homologar Conector por Evidencia

**Files:**

- Modify/Create: `docs/integracao/relatorios-homologacao/<erp>-<data>.md`
- Modify: `docs/runbooks/integracao/<erp>.md`
- Test: TCK/contract/e2e/carga conforme `EVIDENCE-MANIFEST.md`

- [ ] **Step 1: ERP-Specialist-Agent fecha discovery**

Resolver ou registrar blockers em `DISCOVERY-BLOCKERS.md`.

- [ ] **Step 2: Backend-Agent implementa contra contrato**

Sem ERP real, usar mock parametrizado.

- [ ] **Step 3: QA-Automation-Agent roda H1-H5**

Gerar `TECH_READY` se evidencias tecnicas passarem.

- [ ] **Step 4: Agent-Orchestrator decide estado**

`TECH_READY`, `PILOT_READY` ou `COMMERCIAL_GA_READY` conforme matriz.
