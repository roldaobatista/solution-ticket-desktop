# Backlog Detalhado — Sprint 3 (Logs, Retry e Mock Connector)

**Sprint**: 3 — Fase 0 — semanas 7–8
**Total story points (recalibrado)**: 25 pts (era 35)
**Objetivo**: completar resiliência (retry/DLQ/mascaramento) + entregar **Mock Connector** funcional.

> ⚠️ Replanejado: S3-06 (Recovery órfãos) e S3-07 (Logs Pino) movidos para Sprint 4. S3-05 reduzido a 4 cenários core (resto Sprint 4).

**Pré-requisitos**: Sprint 2 (outbox + worker funcionais).

> **DoR e DoD por history**: ver `BACKLOG-SPRINT-0-1.md` (blocos no topo). Aplicam-se a todas as histórias.
> **Estratégia de testes**: ver `ESTRATEGIA-TESTES.md`.

---

## User Stories

### S3-01 — `RetryPolicyService` com backoff exponencial + jitter

**Como** Sistema
**Quero** política de retry configurável e robusta
**Para** absorver falhas transientes sem sobrecarregar ERP

**Critérios de aceite**:

- [ ] Backoff: `baseDelay * 2^attempt` (default base 30s)
- [ ] Jitter ±25% para evitar thundering herd
- [ ] Limite máximo de delay: 1h
- [ ] Limite de tentativas configurável por conector (default 5)
- [ ] Após N tentativas → DLQ
- [ ] Função pura `computeNextRetry(attempt, baseDelay)` testada
- [ ] Cobertura 100%

**Estimativa**: 3 pontos
**Responsável**: Dev Pleno

---

### S3-02 — `DeadLetterService` com classificação técnico/negócio

**Como** Sistema
**Quero** separar erros que devem retentar dos que não devem
**Para** evitar loop infinito em erro de negócio

**Critérios de aceite**:

- [ ] Erro técnico (`FAILED_TECHNICAL`): timeout, 5xx, network error → entra em retry
- [ ] Erro de negócio (`FAILED_BUSINESS`): 4xx semântico, validação falhou → vai direto pra DLQ
- [ ] Conector classifica via `errors.ts` próprio
- [ ] DLQ exibida na UI (Sprint 5)
- [ ] Testes cobrindo 10 cenários (5 técnicos + 5 negócio)

**Estimativa**: 5 pontos
**Responsável**: Dev Sênior

---

### S3-03 — Mascaramento de payload em logs

**Como** Compliance / Suporte
**Quero** que logs nunca contenham CPF, CNPJ, senhas, tokens
**Para** atender LGPD e segurança

**Critérios de aceite**:

- [ ] `MaskingService` com regras configuráveis
- [ ] Padrões mascarados: CPF, CNPJ, e-mail (parcial), token, senha, chave PIX
- [ ] Aplicado automaticamente em `IntegrationLogService.log()`
- [ ] Performance: < 5ms por payload de 50KB
- [ ] Testes com 20 payloads diferentes
- [ ] Whitelist configurável (alguns campos podem aparecer parcialmente)

**Estimativa**: 5 pontos
**Responsável**: Dev Pleno + revisão de segurança

---

### S3-04 — **`MockErpConnector`** com 6 cenários simuláveis

**Como** Tech Lead
**Quero** Mock Connector que simula sucesso e todos os erros
**Para** validar arquitetura sem depender de ERP real

**Critérios de aceite**:

- [ ] Implementa `IErpConnector` completa
- [ ] Configuração via header customizado simula cenários:
  - `x-mock-scenario: success` → 200 OK
  - `x-mock-scenario: timeout` → não responde por 30s
  - `x-mock-scenario: error-500` → 500
  - `x-mock-scenario: error-404` → 404 (negócio)
  - `x-mock-scenario: rate-limit` → 429 com Retry-After
  - `x-mock-scenario: duplicate` → simula resposta de evento já processado
- [ ] Configurável via UI (sprint 5) ou via API
- [ ] Latência configurável (50ms–5s)
- [ ] Disponível apenas em ambiente de dev/teste (flag `INTEGRATION_MOCK_ENABLED`)
- [ ] Documentação em `docs/integracao/MOCK-CONNECTOR.md`

**Estimativa**: 8 pontos
**Responsável**: Dev Sênior

---

### S3-05 — Testes e2e: ticket → outbox → mock → retry → DLQ

**Como** QA
**Quero** suíte e2e que valida fluxo completo
**Para** garantir que arquitetura funciona ponta-a-ponta

**Critérios de aceite**:

- [ ] Cenário 1: ticket fechado → outbox → mock-success → status `CONFIRMED`
- [ ] Cenário 2: ticket fechado → mock-error-500 → 5 retries → DLQ
- [ ] Cenário 3: ticket fechado → mock-error-404 → DLQ direto (sem retry)
- [ ] Cenário 4: ticket fechado → mock-timeout → retry → eventualmente sucesso
- [ ] Cenário 5: ticket duplicado (mesmo idempotency key) → 1 envio efetivo
- [ ] Cenário 6: 100 tickets em paralelo → 100 processados sem duplicidade
- [ ] Suíte roda no CI em < 5min

**Estimativa**: 8 pontos
**Responsável**: QA + Dev Pleno

---

### S3-06 — Recovery de eventos órfãos

**Como** Sistema
**Quero** que eventos travados em `PROCESSING` voltem para `PENDING`
**Para** que crash do worker não trave eventos

**Critérios de aceite**:

- [ ] Job a cada 5 min checa eventos em `PROCESSING` há > 10 min
- [ ] Reseta para `PENDING` com log de recovery
- [ ] Métrica: `outbox_recovery_count`
- [ ] Teste: matar worker no meio de processamento → evento volta após 10min

**Estimativa**: 3 pontos
**Responsável**: Dev Pleno

---

### S3-07 — Logs estruturados (Pino) com correlation ID

**Como** Suporte
**Quero** logs em JSON com correlation ID propagado
**Para** rastrear evento ponta-a-ponta

**Critérios de aceite**:

- [ ] Pino configurado como logger padrão do módulo
- [ ] Correlation ID gerado no `IntegrationEventFactoryService` e propagado até resposta do conector
- [ ] Campos padrão: `timestamp`, `level`, `correlationId`, `tenantId`, `eventId`, `entityType`, `entityId`
- [ ] Logs vão para `%APPDATA%\@solution-ticket\electron\logs\integration.log`
- [ ] Rotação diária + retenção 30 dias

**Estimativa**: 3 pontos
**Responsável**: Dev Pleno + SRE

---

## Definition of Done do Sprint 3

- [ ] Todos os critérios das histórias S3-\* validados
- [ ] DoD por history cumprida (cobertura ≥ 70% linhas novas; 100% em RetryPolicy)
- [ ] CI verde (lint + types + unit + integration)
- [ ] **TCK ≥ 70%** contra Mock (Resilience RE-01..RE-12 + Idempotency)
- [ ] **Contract test verde** Hub↔Mock (`pushEvent`, `cancelEvent`, erros 4xx/5xx)
- [ ] **Smoke E2E** Playwright: 50 tickets com mix de cenários — sem perda
- [ ] Logs em formato JSON com correlation ID (sem PII em claro — gitleaks verde)
- [ ] Documentação do Mock Connector publicada
- [ ] Demo gravada
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-3/`**

## Capacity

| Recurso    | Disponibilidade        |
| ---------- | ---------------------- |
| Tech Lead  | 30% (review)           |
| Dev Sênior | 100%                   |
| Dev Pleno  | 100%                   |
| SRE        | 20% (logs)             |
| QA         | 50% (entrou no Sprint) |

**Total story points**: 25 (recalibrado — S3-06/S3-07 movidos para Sprint 4; S3-05 reduzido a 4 cenários)

## Riscos

| Risco                                                 | Mitigação                                  |
| ----------------------------------------------------- | ------------------------------------------ |
| Mascaramento muito agressivo esconde info útil        | Whitelist configurável; testar com suporte |
| Mock Connector vira "só para dev" e não é usado em CI | Forçar uso em testes e2e                   |
| Pino logging tem overhead em alto volume              | Benchmark: 1000 logs/seg sem degradação    |
