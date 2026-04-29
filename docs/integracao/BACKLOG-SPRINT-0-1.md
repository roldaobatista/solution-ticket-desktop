# Backlog Detalhado — Sprint 0 e Sprint 1

**Módulo**: Integração ERP
**Referências**: `docs/PLANO-MODULO-INTEGRACAO.md`, `docs/GUIA-INTEGRACAO-ERP.md`
**Versão**: 1.1 — 2026-04-27 (Sprint 0 enxugado para gate-blockers; ADRs não-críticas movidas para S2–S4)
**Sprint duração**: 2 semanas

---

## v1.1 — Mudanças

> Em resposta à Auditoria R5 Agente 6: "Sprint 0 virou catch-all (7 histórias mistas)".

**Sprint 0 fica APENAS com gate-bloqueadores**:

1. Spike DPAPI (S0-01)
2. Decisão Bling/Sankhya (S0-05)
3. Sinal externo de cliente piloto (S0-04) — **owner agentico: CommercialOpsAgent**
4. CI/CD básico (S0-06)

**Movido para fora do S0**:

- **S0-02** (Spike SQLite WAL) → **Sprint 2** (relevância: aparece junto com outbox concreto, evitando spike sem código consumidor)
- **S0-03** (publicar 6 ADRs) → **dividida**: ADR-001/002/003 ficam em S0 (são pré-requisitos diretos do código S1). **ADR-004 (DPAPI) → S2** (após resultado do spike); **ADR-005 (conectores plugáveis) → S3** (após interface IErpConnector consolidada); **ADR-006 (não expor backend) → S4** (formaliza decisão já vigente).
- **S0-07** (detalhamento backlog S1) → **task contínua de PM/Tech Lead, não story** com pontos.

---

## Definition of Ready (DoR) — vale para todos os sprints deste módulo

História só entra em Sprint Planning se atender **todos** os critérios:

- [ ] (a) Tem **critério de aceite testável** (mensurável, observável)
- [ ] (b) **Massa de teste identificada** (fixture existente OU spec de geração — ver `ESTRATEGIA-TESTES.md` §6)
- [ ] (c) **Sandbox / mock disponível** (se conector externo, sandbox testado nos últimos 7 dias; se Hub interno, Mock Connector)
- [ ] (d) **Dependências mapeadas** (técnicas, de squad e externas — ERP, jurídico, sec)
- [ ] (e) **Story points estimados** por ≥ 2 subagentes independentes

`Agent-Orchestrator` recusa história sem DoR. Backlog grooming semanal mantém DoR limpo.

---

## Definition of Done por history (vale para qualquer S\*-XX)

Cada história fecha apenas se:

- [ ] Critérios de aceite verdes (todos)
- [ ] **Review agentico validado por ≥ 1 reviewer independente**
- [ ] **Cobertura de teste ≥ 70% nas linhas novas** (95% se componente crítico — outbox/idempotency/mapping/credenciais)
- [ ] CI verde (lint, types, unit, integration, contract aplicável)
- [ ] Documentação atualizada se afeta API ou comportamento observável
- [ ] **Evidência visual gravada** (vídeo curto ou Playwright trace) para histórias de UX/UI

---

## Sprint 0 — Preparação (semanas 1–2)

### Objetivo do sprint

Garantir que o time tem **todas as decisões, spikes técnicos e backlog** antes de escrever uma linha de código de produção.

### Entregáveis do sprint

- 6 ADRs publicadas
- 2 spikes técnicos validados
- Cliente piloto identificado
- Backlog do Sprint 1 detalhado e estimado
- Pipeline CI/CD configurado

### User Stories

#### S0-01 — Spike: validar DPAPI no Electron

**Como** Tech Lead
**Quero** validar se DPAPI funciona via IPC Electron → backend
**Para** decidir entre DPAPI nativo e fallback `node-keytar`

**Critérios de aceite**:

- [ ] POC funcional encriptando/decriptando string de teste
- [ ] Medição de latência (esperado < 50ms)
- [ ] Documentar limitações encontradas
- [ ] Decisão registrada na ADR-004

**Estimativa**: 3 dias
**Responsável**: Tech Lead + Dev Sênior

---

#### S0-02 — Spike: SQLite WAL + outbox throughput

**Como** Tech Lead
**Quero** validar que SQLite suporta 1000 eventos/min em outbox sem lock
**Para** confirmar que não precisamos de banco separado

**Critérios de aceite**:

- [ ] Benchmark com 10.000 inserts em outbox + 5 workers concorrentes
- [ ] WAL mode habilitado
- [ ] Métricas de latência p50/p95/p99
- [ ] Documentar configuração final em ADR-002

**Estimativa**: 2 dias
**Responsável**: Dev Sênior

---

#### S0-03 — Publicar ADR-001 a ADR-006

**Como** Tech Lead
**Quero** todas as decisões arquiteturais documentadas
**Para** que o time tenha base comum sem retrabalho

**Critérios de aceite**:

- [ ] ADR-001 (módulo isolado) publicada
- [ ] ADR-002 (outbox local-first) publicada
- [ ] ADR-003 (modelo canônico versionado) publicada
- [ ] ADR-004 (credenciais DPAPI) publicada
- [ ] ADR-005 (conectores plugáveis) publicada
- [ ] ADR-006 (não expor backend publicamente) publicada
- [ ] Todas revisadas por `Architecture-Agent` e registradas em decision record

**Estimativa**: 5 dias (paralelo aos spikes)
**Responsável**: Tech Lead

---

#### S0-04 — Registrar sinal externo de cliente piloto técnico (Fase 0)

**Como** PM
**Quero** registrar 1 cliente, lead ou fixture validável para o conector REST genérico
**Para** ter feedback real ao final da Fase 0

**Critérios de aceite**:

- [ ] Cliente/lead/fixture identificado e registrado em `EXTERNAL-DEPENDENCIES.md`
- [ ] Acordo de "beta privado", quando houver, anexado como dependência externa
- [ ] Cenário de teste definido (qual ticket, qual sistema receptor)
- [ ] Cronograma de validação alinhado (mês 3)

**Estimativa**: 5 dias
**Responsável agentico**: `CommercialOpsAgent` + `DiscoveryResearchAgent`
**Gate**: ver `AGENT-GATES-MATRIX.md`; ausência de cliente real não bloqueia chassi técnico.

---

#### S0-05 — Decidir conector piloto da Fase 1 (Bling vs Sankhya)

**Como** PM
**Quero** decidir entre Bling e Sankhya como piloto da Fase 1
**Para** que a equipe possa começar Discovery (etapa 1 do playbook)

**Critérios de aceite**:

- [ ] Análise comparativa (esforço, ciclo de venda, deal pipeline)
- [ ] Cliente piloto identificado para o ERP escolhido
- [ ] Decisão documentada e comunicada ao time
- [ ] Discovery (`docs/integracao/contratos/<erp>.md`) iniciado

**Tie-break (regra de desempate quando os 2 ERPs estiverem viáveis)**:

1. Cliente com evidência externa mais madura vence (contrato/LOI, quando existir, entra como dependência externa)
2. Se ambos no mesmo dia: priorizar **Bling** (OAuth Loopback validado, ciclo curto)
3. Se Bling não tem cliente em até dia 5: ir com Sankhya (mesmo sem cliente piloto, usar sandbox público)
4. Se nenhum cliente em dia 5: `Agent-Orchestrator` decide entre Bling/Sankhya com `CommercialOpsAgent`, baseado em pipeline qualitativo (não-bloquear o backlog)

**Estimativa**: 5 dias
**Responsável**: PM + Tech Lead

---

#### S0-06 — Configurar pipeline CI/CD para `src/integracao/`

**Como** SRE
**Quero** pipeline rodando lint + types + testes do módulo desde o início
**Para** garantir qualidade contínua

**Critérios de aceite**:

- [ ] Job dedicado para `backend/src/integracao/`
- [ ] Cobertura de testes reportada
- [ ] Bloqueio de merge se cobertura < 70% no módulo
- [ ] Tempo total do job < 5 min

**Estimativa**: 3 dias
**Responsável**: SRE

---

#### S0-07 — Detalhar e estimar backlog do Sprint 1

**Como** Tech Lead
**Quero** todas as histórias do Sprint 1 com critérios de aceite e estimativas
**Para** que o sprint comece com clareza total

**Critérios de aceite**:

- [ ] Todas as histórias S1-\* abaixo refinadas
- [ ] Estimativas em story points ou dias
- [ ] Dependências mapeadas
- [ ] Sprint Planning agendado

**Estimativa**: 2 dias
**Responsável**: Tech Lead + Dev Sênior + PM

---

### Riscos do Sprint 0

| Risco                                      | Mitigação                                                            |
| ------------------------------------------ | -------------------------------------------------------------------- |
| DPAPI exige permissões elevadas no Windows | Testar em conta padrão de usuário; se falhar, fallback `node-keytar` |
| Cliente piloto da Fase 1 não fechado       | Manter 2 opções (Bling e Sankhya) ativas até decisão final           |
| Spike SQLite mostra gargalo                | Plano B: outbox em arquivo SQLite separado                           |

---

## Sprint 1 — Banco e módulo (semanas 3–4)

### Objetivo do sprint

Criar **esqueleto do módulo** + **13 tabelas Prisma** + **permissões base**. Sem lógica de negócio ainda.

### Entregáveis do sprint

- `IntegracaoModule` registrado no NestJS
- Schema Prisma das 13 tabelas com migration
- 10 permissões cadastradas no seed
- CRUD básico de `IntegracaoProfile` via Controller admin
- Testes unitários do módulo (≥ 70% cobertura)

### User Stories

#### S1-01 — Criar `IntegracaoModule` no backend

**Como** Tech Lead
**Quero** o módulo registrado no `AppModule` com estrutura de pastas conforme ADR-001
**Para** servir de base para todo desenvolvimento futuro

**Critérios de aceite**:

- [ ] `backend/src/integracao/integracao.module.ts` criado
- [ ] Estrutura de subpastas conforme `docs/PLANO-MODULO-INTEGRACAO.md` seção 12
- [ ] Importado em `app.module.ts`
- [ ] Aplicação sobe sem erros
- [ ] README do módulo escrito

**Estimativa**: 2 pontos
**Responsável**: Dev Sênior
**Dependências**: S0-03 (ADR-001)

---

#### S1-02 — Schema Prisma das 13 tabelas

**Como** Dev Backend
**Quero** todas as tabelas `integracao_*` definidas em `schema.prisma`
**Para** ter base de dados pronta para os próximos sprints

**Critérios de aceite**:

- [ ] 13 modelos Prisma criados (lista em PLANO seção 12.1)
- [ ] Relacionamentos corretos com `tunidades`, `tempresas`, `tpesagens`
- [ ] Migration aplicada via `pnpm db:migrate`
- [ ] `prisma generate` sem erros
- [ ] Banco existente não corrompido (testar com `db:seed`)
- [ ] Documentação dos campos em comentários do schema

**Estimativa**: 5 pontos
**Responsável**: Dev Backend Pleno
**Dependências**: S1-01

---

#### S1-03 — Cadastrar 10 permissões do módulo no seed

**Como** Dev Backend
**Quero** as 10 permissões `INTEGRACAO_*` no seed
**Para** que o sistema reconheça as ações restritas

**Critérios de aceite**:

- [ ] 10 permissões adicionadas ao seed (lista em PLANO seção 12.2)
- [ ] Permissões atribuídas ao perfil `Administrador` por padrão
- [ ] `MATRIZ-PERMISSOES.md` atualizada
- [ ] Seed executa sem erro

**Estimativa**: 2 pontos
**Responsável**: Dev Pleno
**Dependências**: S1-02

---

#### S1-04 — `ConnectorAdminController` com CRUD de Profile

**Como** administrador
**Quero** criar/listar/editar perfis de integração via API
**Para** configurar conectores (futuros)

**Critérios de aceite**:

- [ ] Endpoints: `GET /api/v1/integration/profiles`, `POST`, `PATCH`, `DELETE`
- [ ] Validação com class-validator
- [ ] Permissão `INTEGRACAO_VER` / `INTEGRACAO_CRIAR` / `INTEGRACAO_EDITAR` aplicada
- [ ] Swagger/OpenAPI gerado
- [ ] Testes e2e cobrindo cenários happy path + 403
- [ ] Cobertura ≥ 80%

**Estimativa**: 5 pontos
**Responsável**: Dev Sênior
**Dependências**: S1-02, S1-03

---

#### S1-05 — Esqueletos `OutboxService` e `IntegrationLogService`

**Como** Dev Backend
**Quero** as classes criadas com métodos vazios documentados
**Para** que próximos sprints implementem a lógica

**Critérios de aceite**:

- [ ] `OutboxService` com métodos: `enqueue`, `dequeue`, `markSent`, `markFailed`, `getPending`
- [ ] `IntegrationLogService` com métodos: `log`, `getByCorrelationId`
- [ ] Interfaces TypeScript completas
- [ ] JSDoc documentando comportamento esperado
- [ ] Testes unitários "skeleton" passando (sem implementação ainda)

**Estimativa**: 2 pontos
**Responsável**: Dev Pleno
**Dependências**: S1-01

---

#### S1-06 — Interface `IErpConnector` definida

**Como** Tech Lead
**Quero** a interface canônica de conector finalizada
**Para** que conectores futuros sigam o mesmo contrato

**Critérios de aceite**:

- [ ] Interface conforme PLANO seção 5.3
- [ ] Tipos `ConnectorCapabilities`, `ConnectorConfig`, `IntegrationContext`, `CanonicalIntegrationEvent`, `PullResult`, `PushResult` definidos
- [ ] Documentação JSDoc completa
- [ ] Exemplo em comentário mostrando implementação
- [ ] Compila sem erros

**Estimativa**: 3 pontos
**Responsável**: Tech Lead
**Dependências**: S1-01

---

#### S1-07 — Setup OpenTelemetry no módulo

**Como** SRE
**Quero** correlation ID propagado em todas as chamadas do módulo
**Para** que rastreamento esteja pronto desde o início

**Critérios de aceite**:

- [ ] OpenTelemetry SDK instalado
- [ ] Middleware de correlation ID nos endpoints `/api/v1/integration/*`
- [ ] Logs estruturados (JSON) saindo via Pino
- [ ] Documentação de como ler traces

**Estimativa**: 3 pontos
**Responsável**: SRE + Dev Sênior
**Dependências**: S1-01

---

### Definition of Done do Sprint 1

- [ ] Todos os critérios de aceite das histórias S1-\* validados
- [ ] DoD por history (§topo) cumprida em todas as S1-\*
- [ ] PRs com code review registrado (≥ 1 par)
- [ ] CI verde (lint + types + unit + integration)
- [ ] Cobertura ≥ 70% nas linhas novas (95% em outbox skeleton e cofre)
- [ ] **Contract test (Pact) consumer-side configurado** com 1 interaction smoke (referência: `CONTRACT-TESTING.md`)
- [ ] **Smoke E2E mínimo** (Playwright): subir backend + criar profile via API + listar
- [ ] Aplicação sobe e endpoints `/api/v1/integration/*` respondem
- [ ] Sprint Review com demo gravada
- [ ] **Evidências (relatórios CI, vídeo demo, cobertura) arquivadas em `docs/auditoria/sprint-1/`**

> TCK%: ainda não aplicável (TCK começa Sprint -2 e estende-se até Sprint 1).
> Referência: `ESTRATEGIA-TESTES.md` para pirâmide e ferramentas.

### Capacity do Sprint 1 (estimado)

- Tech Lead: 50% disponível (resto: ADRs, code review)
- Dev Sênior: 100%
- Dev Pleno: 100%
- Frontend: 0% (entra no Sprint 5)
- SRE: 30% (CI + OpenTelemetry)

**Total story points planejados**: 22
**Velocity esperada**: 18–22 pontos (sprint inicial, time se calibrando)

---

## Histórias para próximos sprints (preview)

### Sprint 2 — Eventos e outbox

- S2-01: `IntegrationEventFactoryService` — converte evento de domínio em `IntegrationEvent`
- S2-02: `DomainEventListenerService` — escuta `weighing.ticket.closed`
- S2-03: Implementar `OutboxService.enqueue` transacional
- S2-04: `QueueWorkerService` — worker com lock de evento
- S2-05: Cálculo de `idempotencyKey` determinística
- S2-06: Testes de concorrência (2 workers, mesmo evento, 0 duplicidade)

### Sprint 3 — Logs, retry e Mock Connector

- S3-01: `RetryPolicyService` com backoff + jitter
- S3-02: `DeadLetterService` com classificação técnico/negócio
- S3-03: Mascaramento de payload (regex + denylist de campos)
- S3-04: **`MockErpConnector`** com 6 cenários simuláveis
- S3-05: Testes e2e: ticket → outbox → mock → retry → DLQ
- S3-06: Métricas Prometheus exportadas

### Sprint 4 — Modelo canônico + Mapping Engine

- S4-01: 8 schemas canônicos (`CanonicalWeighingTicket` + 7)
- S4-02: `MappingEngineService` com 9 transformações
- S4-03: Parser e validador de YAML de mapping
- S4-04: `EquivalenceTableService`
- S4-05: `ValidationService` pré-envio
- S4-06: Testes de transformação (matriz de tipos)

### Sprint 5 — Conectores genéricos + API + UI

- S5-01: `GenericRestConnector`
- S5-02: `GenericCsvXmlConnector`
- S5-03: `GenericSftpConnector`
- S5-04: `PublicIntegrationController` v1
- S5-05: Tela de Conectores (frontend)
- S5-06: Tela de Eventos (frontend)
- S5-07: Reconciliação básica
- S5-08: **Demo end-to-end com cliente piloto técnico**

---

## Estimativas agregadas

| Sprint | Story points     | Devs alocados                   | Risco                                |
| ------ | ---------------- | ------------------------------- | ------------------------------------ |
| 0      | n/a (preparação) | Time todo                       | Médio (depende de decisões externas) |
| 1      | 22               | 2 backend + 0.3 SRE             | Baixo                                |
| 2      | ~25              | 2 backend                       | Médio (concorrência)                 |
| 3      | ~28              | 2 backend + 0.5 QA              | Médio                                |
| 4      | ~30              | 2 backend                       | Alto (modelo canônico afeta tudo)    |
| 5      | ~35              | 2 backend + 1 frontend + 0.5 QA | Alto (entrega final Fase 0)          |

---

## Notas de planejamento

- Histórias S0-\* não consomem capacity de dev — são preparação
- Histórias S1-\* são o "primeiro código de produção"
- Code review obrigatório, mesmo que time tenha apenas 2 devs
- Daily de 15min com bloqueios visíveis em board (Linear/Jira)
- Sprint Review publicado como evidence pack para revisão agentic
- Retrospectiva sempre na sexta-feira da semana 2
