# Backlog Detalhado — Sprint 2 (Eventos e Outbox)

**Sprint**: 2 — Fase 0 — semanas 5–6
**Total story points (recalibrado)**: 23 pts (era 29)
**Objetivo**: implementar **eventos de domínio** + **outbox transacional** + **worker com lock** + **idempotência**.

> ⚠️ Sprint replanejado conforme `REPLANEJAMENTO-STORY-POINTS.md`. S2-07 (Métricas Prometheus) movido para Sprint 3. Histórias marcadas Must (M) / Should (S) / Could (C).

**Pré-requisitos**: Sprint 1 concluído (módulo + tabelas + interface `IErpConnector`).

> **DoR e DoD por history**: ver `BACKLOG-SPRINT-0-1.md` no topo (blocos "Definition of Ready" e "Definition of Done por history"). Aplicam-se a todas as histórias deste sprint.
> **Estratégia de testes**: ver `ESTRATEGIA-TESTES.md`.

---

## User Stories

### S2-01 — `IntegrationEventFactoryService`

**Como** Dev Backend
**Quero** converter eventos de domínio em `IntegrationEvent` canônico
**Para** que outbox tenha formato padrão independente de origem

**Critérios de aceite**:

- [ ] Service criado em `events/integration-event-factory.service.ts`
- [ ] Aceita evento de domínio (ex: `WeighingTicketClosedEvent`)
- [ ] Devolve `IntegrationEvent` com: `eventType`, `entityType`, `entityId`, `revision`, `payloadCanonical`, `idempotencyKey`, `correlationId`
- [ ] Cobertura de teste ≥ 90%
- [ ] Suporta extensão para novos eventos sem modificação (Open/Closed)

**Estimativa**: 3 pontos
**Responsável**: Dev Sênior
**Dependências**: S1-06 (interface)

---

### S2-02 — `DomainEventListenerService`

**Como** Dev Backend
**Quero** escutar eventos de domínio do módulo `ticket`
**Para** que pesagens fechadas/canceladas/alteradas alimentem a outbox

**Critérios de aceite**:

- [ ] Listener registrado para `weighing.ticket.closed`, `weighing.ticket.cancelled`, `weighing.ticket.corrected`
- [ ] Usa `EventEmitter2` do NestJS
- [ ] Em caso de falha no listener, evento é gravado em log mas NÃO bloqueia o módulo emissor
- [ ] Testes e2e: emitir evento via `EventEmitter` → ver registro na outbox

**Estimativa**: 3 pontos
**Responsável**: Dev Pleno
**Dependências**: S2-01

---

### S2-03 — `OutboxService.enqueue()` transacional

**Como** Dev Backend
**Quero** que o enqueue aconteça na **mesma transação** que o evento de domínio
**Para** garantir at-least-once sem perda

**Critérios de aceite**:

- [ ] Método `enqueue(event, tx?)` aceita transação Prisma opcional
- [ ] Quando chamado dentro de `prisma.$transaction()`, usa o mesmo client
- [ ] Idempotency key calculada: `{tenant}:{empresa}:{unidade}:{ticket}:{revision}`
- [ ] Inserção falha se idempotency key duplicada (UNIQUE constraint)
- [ ] Status inicial: `PENDING`
- [ ] Cobertura ≥ 95% incluindo cenários de rollback

**Estimativa**: 5 pontos
**Responsável**: Dev Sênior
**Dependências**: S2-01

---

### S2-04 — `QueueWorkerService` com lock pessimista

**Como** Sistema
**Quero** worker que processa outbox sem que dois workers peguem o mesmo evento
**Para** evitar duplicidade no ERP

**Critérios de aceite**:

- [ ] Worker roda em intervalo configurável (default: 5s)
- [ ] Pega N eventos por iteração (default: 10)
- [ ] Lock via `UPDATE ... SET status = 'PROCESSING' WHERE id IN (...) AND status = 'PENDING' RETURNING ...`
- [ ] Workers concorrentes (test: 2 instâncias) não pegam mesmo evento
- [ ] Em caso de crash do worker, eventos em `PROCESSING` há > 5min voltam para `PENDING` (recovery job)
- [ ] Testes de concorrência passando

**Estimativa**: 8 pontos
**Responsável**: Dev Sênior
**Dependências**: S2-03

---

### S2-05 — Cálculo de `idempotencyKey` determinística

**Como** Dev Backend
**Quero** chave que garante mesma operação = mesma chave
**Para** que retries não dupliquem no ERP

**Critérios de aceite**:

- [ ] Função pura `computeIdempotencyKey(event)` em `events/idempotency.util.ts`
- [ ] Algoritmo: SHA-256 de `tenant|empresa|unidade|entityId|eventType|revision`
- [ ] Mesma entrada → mesma saída (testado com 1000 entradas)
- [ ] Cobertura 100%
- [ ] Documentado em ADR-002 (já existe; apenas link)

**Estimativa**: 2 pontos
**Responsável**: Dev Pleno
**Dependências**: nenhuma

---

### S2-06 — Testes de concorrência (2 workers, 0 duplicidade)

**Como** QA / Tech Lead
**Quero** suíte de teste que valida concorrência
**Para** garantir que arquitetura aguenta produção

**Critérios de aceite**:

- [ ] Teste e2e: 2 workers + 100 eventos pendentes → cada evento processado exatamente 1x
- [ ] Teste com Mock Connector que simula latência (50–500ms)
- [ ] Métrica reportada: throughput (eventos/seg)
- [ ] Teste roda no CI em < 60s
- [ ] Documentação do cenário em `docs/integracao/004-outbox-inbox-retry.md`

**Estimativa**: 5 pontos
**Responsável**: Dev Sênior + QA
**Dependências**: S2-04

---

### S2-07 — Métricas básicas do worker (Prometheus format)

**Como** SRE
**Quero** métricas expostas em `/metrics`
**Para** monitorar desempenho desde o início

**Critérios de aceite**:

- [ ] Métricas: `outbox_pending_count`, `outbox_processing_count`, `outbox_processed_total`, `outbox_failed_total`, `outbox_duration_seconds` (histogram)
- [ ] Endpoint `/metrics` exposto (apenas localhost)
- [ ] Labels por `tenantId` e `connectorCode`
- [ ] Documentado para futura integração com Grafana

**Estimativa**: 3 pontos
**Responsável**: SRE + Dev Pleno
**Dependências**: S2-04

---

## Definition of Done do Sprint 2

- [ ] Todos os critérios de aceite das histórias S2-\* validados
- [ ] DoD por history cumprida em todas as S2-\* (cobertura ≥ 70% linhas novas; 95% em outbox/idempotency)
- [ ] PRs com code review registrado (≥ 1 par)
- [ ] CI verde (lint + types + unit + integration)
- [ ] **TCK ≥ 50% rodando contra Mock Connector** (ID-01..ID-08 obrigatórios neste sprint)
- [ ] **Contract test verde** consumer-side (Pact) para `pushEvent` (1 happy + 1 erro)
- [ ] **Smoke E2E** Playwright: ticket fechado → outbox → mock → SENT
- [ ] Demo gravada
- [ ] Benchmark: 1000 eventos processados em < 60s sem duplicidade
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-2/`**

## Capacity

| Recurso    | Disponibilidade                    |
| ---------- | ---------------------------------- |
| Tech Lead  | 30% (review + ADR-002 atualização) |
| Dev Sênior | 100%                               |
| Dev Pleno  | 100%                               |
| SRE        | 30% (métricas)                     |

**Total story points**: 23 (recalibrado — S2-07 movido para Sprint 3 conforme REPLANEJAMENTO-STORY-POINTS.md)

## Riscos

| Risco                                           | Mitigação                                               |
| ----------------------------------------------- | ------------------------------------------------------- |
| Lock SQLite gera deadlock sob alta concorrência | WAL mode + timeout configurável; spike S0-02 já validou |
| Recovery job mal calibrado reprocessa demais    | Threshold de 5min configurável + alerta                 |
| EventEmitter2 do NestJS não escala              | Fallback para outbox direto sem listener (Sprint 3)     |
