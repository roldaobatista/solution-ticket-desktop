# 004 — Outbox, Inbox, Retry e DLQ

> Owner: Eng | Última revisão: 2026-04-27 | Versão: 5

**Versão**: 1.0 — 2026-04-26
**ADRs base**: ADR-002 (outbox local-first), ADR-005 (conectores)

---

## 1. Outbox Pattern

### 1.1 Problema

Pesagem fecha em uma transação no SQLite. Envio ao ERP é uma operação remota, lenta, falível. Como garantir que **nenhum ticket fica sem ser enviado** mesmo se a aplicação cair entre o commit do ticket e o envio?

### 1.2 Solução

Outbox transacional: na **mesma transação** que persiste o ticket, persistir o evento de integração na tabela `integracao_outbox`. Um worker assíncrono lê eventos `PENDING` e despacha.

```
BEGIN TRANSACTION
  INSERT INTO tpesagens VALUES (...)        -- evento de domínio
  INSERT INTO integracao_outbox VALUES (...) -- evento de integração
COMMIT
```

Se o commit falha → nada acontece. Se o commit passa → ambos persistidos. Worker pode falhar muitas vezes; eventos só somem do outbox quando confirmados.

---

## 2. Schema do Outbox

```sql
CREATE TABLE integracao_outbox (
  id              TEXT PRIMARY KEY,
  profileId       TEXT NOT NULL,
  eventType       TEXT NOT NULL,
  entityType      TEXT NOT NULL,
  entityId        TEXT NOT NULL,
  revision        INTEGER NOT NULL DEFAULT 0,
  idempotencyKey  TEXT NOT NULL UNIQUE,
  payloadCanonical TEXT NOT NULL,        -- JSON
  payloadRemote   TEXT,                  -- JSON (após mapping)
  status          TEXT NOT NULL,
  attempts        INTEGER DEFAULT 0,
  nextRetryAt     DATETIME,
  lastError       TEXT,
  lastErrorCategory TEXT,                -- 'technical' | 'business'
  correlationId   TEXT,
  createdAt       DATETIME NOT NULL,
  processedAt     DATETIME,

  INDEX idx_outbox_status_next (status, nextRetryAt),
  INDEX idx_outbox_profile (profileId)
);
```

### 2.1 Estados (state machine)

```
                  ┌──────────────────┐
                  │     PENDING      │ ◀──┐
                  └────────┬─────────┘    │
                           │              │ recovery (>10min)
                  worker pega + lock      │
                           ▼              │
                  ┌──────────────────┐    │
                  │   PROCESSING     │ ───┘
                  └────────┬─────────┘
            ┌──────────────┼───────────────┐
            ▼              ▼               ▼
     ┌──────────┐   ┌─────────────┐  ┌──────────────────┐
     │   SENT   │   │   FAILED_   │  │   FAILED_        │
     │          │   │   TECHNICAL │  │   BUSINESS       │
     └────┬─────┘   └──────┬──────┘  └────────┬─────────┘
          │                │                  │
          ▼                ▼                  ▼
     ┌──────────┐   ┌──────────────┐   ┌──────────────┐
     │CONFIRMED │   │WAITING_RETRY │   │  DEAD_LETTER │
     └──────────┘   └──────┬───────┘   └──────────────┘
                           │ backoff
                           ▼
                       PENDING
                  (depois de N: DEAD_LETTER)
```

### 2.2 Estados (descrição)

| Estado             | Descrição                                                                 | Próximo                            |
| ------------------ | ------------------------------------------------------------------------- | ---------------------------------- |
| `PENDING`          | Aguardando processamento                                                  | `PROCESSING`                       |
| `PROCESSING`       | Worker pegou, em execução                                                 | `SENT` / `FAILED_*`                |
| `SENT`             | Enviado, aguardando confirmação assíncrona                                | `CONFIRMED`                        |
| `CONFIRMED`        | Confirmado pelo ERP (terminal)                                            | —                                  |
| `FAILED_TECHNICAL` | Erro transiente, vai para retry                                           | `WAITING_RETRY`                    |
| `WAITING_RETRY`    | Aguardando próximo backoff                                                | `PENDING`                          |
| `FAILED_BUSINESS`  | Erro de negócio, requer humano                                            | `DEAD_LETTER`                      |
| `DEAD_LETTER`      | Excedeu retries ou erro de negócio (terminal técnico, requer ação humana) | reprocessamento manual → `PENDING` |
| `CANCELLED`        | Cancelado pelo operador (terminal)                                        | —                                  |
| `IGNORED`          | Ignorado com justificativa (terminal)                                     | —                                  |

### 2.3 Ordering e partition key (ADR-014)

A unidade de ordenação do outbox é a tripla **`(profileId, entityType, entityId)`** — chamamos isso de **partition key**. Eventos com a mesma chave são processados em ordem **FIFO estrita**; eventos com chaves diferentes podem processar em paralelo.

**Por quê**: dois eventos sobre a mesma entidade (ex: ticket criado `r=1` + ticket atualizado `r=2`) NUNCA podem chegar ao ERP fora de ordem — geraria estado inconsistente.

**Como**:

- Tabela auxiliar `integracao_outbox_partition_lock(profileId, entityType, entityId, lockedAt, workerId)`.
- Worker, ao tentar pegar evento com `(p,t,e)`, faz `INSERT ... ON CONFLICT DO NOTHING`. Se outro worker já tem o lock → pula esse evento e pega o próximo de outra partição.
- Lock liberado quando evento sai de `PROCESSING` (sucesso ou falha terminal).
- Recovery (`PROCESSING > 10min`) também libera o lock.

**Concurrency**: `WORKER_CONCURRENCY > 1` é seguro — paralelismo aplica-se **entre partições**, nunca dentro de uma. Para volumes típicos (1 cliente, ~100 ev/min), `concurrency=1` já basta.

### 2.4 Reconciliação por revision

Quando ERP responde conflito (409 ou versão divergente), conector compara `revision` local vs remoto:

| Caso            | Ação                                                                                |
| --------------- | ----------------------------------------------------------------------------------- |
| Local > Remoto  | Força update no ERP (push wins)                                                     |
| Local < Remoto  | Descarta push (provável race com pull); marca `IGNORED` com motivo "stale revision" |
| Local == Remoto | Idempotência; marca `CONFIRMED` sem repetir chamada                                 |

Ver ADR-014 para racional completo.

### 2.5 Timeout SENT → CONFIRMED

Eventos em `SENT` sem confirmação assíncrona após `SENT_TO_CONFIRMED_TIMEOUT_MS` (default **1h**, configurável por conector):

- Se conector implementa `getRemoteStatus(externalId)`: consulta o ERP. Confirmado → `CONFIRMED`. Não encontrado → volta para `PENDING`.
- Se conector NÃO implementa: marca `CONFIRMED` por timeout + emite warning no log.

Cron de varredura: a cada 5min. Métrica: `outbox_sent_timeout_total{connector,resolution}`.

---

## 3. Worker

### 3.1 Loop principal

```typescript
while (running) {
  const events = await acquireLock(BATCH_SIZE); // pessimist lock
  if (events.length === 0) {
    await sleep(POLL_INTERVAL); // 5s default
    continue;
  }
  await Promise.all(events.map(processEvent));
}
```

### 3.2 Lock pessimista (SQLite)

```sql
UPDATE integracao_outbox
SET status = 'PROCESSING', processedAt = NULL
WHERE id IN (
  SELECT id FROM integracao_outbox
  WHERE status = 'PENDING'
    AND (nextRetryAt IS NULL OR nextRetryAt <= datetime('now'))
  ORDER BY createdAt
  LIMIT 10
)
RETURNING *;
```

`RETURNING *` (SQLite 3.35+) atomicamente atualiza e devolve. Garante que dois workers concorrentes não pegam o mesmo evento.

### 3.3 Processamento de evento

```typescript
async function processEvent(event) {
  const correlationId = event.correlationId;
  log.info({ correlationId, eventId: event.id }, 'processing');

  try {
    const profile = await getProfile(event.profileId);
    const connector = factory.create(profile);
    const mapping = await getMapping(profile.id, event.entityType);

    // 1. Mapping
    const payloadRemote = mappingEngine.apply(event.payloadCanonical, mapping);

    // 2. Validação
    const validation = await validator.validate(payloadRemote, mapping);
    if (!validation.valid) {
      throw new BusinessError('VALIDATION_FAILED', validation.errors);
    }

    // 3. Push para o ERP
    const result = await connector.pushEvent({
      profile,
      payload: payloadRemote,
      idempotencyKey: event.idempotencyKey,
    });

    // 4. Sucesso
    await markSent(event.id, result);
    await externalLink.upsert(event.entityId, result.externalId);
  } catch (err) {
    if (isBusinessError(err)) {
      await markBusinessFailure(event.id, err); // → DLQ
    } else {
      await scheduleRetry(event.id, err); // → WAITING_RETRY
    }
  }
}
```

---

## 4. Retry policy

### 4.1 Backoff exponencial + jitter

```typescript
function nextDelay(attempt: number): number {
  const base = 30_000; // 30s
  const exp = base * Math.pow(2, attempt);
  const jitter = exp * (0.75 + Math.random() * 0.5); // ±25%
  return Math.min(jitter, 3_600_000); // máx 1h
}
```

| Tentativa | Delay aproximado |
| --------- | ---------------- |
| 1         | 30s              |
| 2         | 60s              |
| 3         | 2min             |
| 4         | 4min             |
| 5         | 8min             |
| 6         | 16min            |
| 7         | 32min            |
| 8+        | 1h (capped)      |

### 4.2 Limite de tentativas

- Default: **5 tentativas** antes de DLQ
- Configurável por conector via `capabilities()`

### 4.3 Classificação técnico vs negócio

**Técnico** (retenta):

- `ETIMEDOUT`, `ECONNREFUSED`, `EAI_AGAIN`
- HTTP 5xx
- HTTP 429 (com `Retry-After`)
- HTTP 408
- Erro de rede do socket

**Negócio** (NÃO retenta):

- HTTP 400 (validação)
- HTTP 404 (recurso não existe)
- HTTP 409 (conflito de regra)
- HTTP 422 (regra de negócio)
- HTTP 403 (permissão)

Conector implementa `errors.ts` com função `classify(err): 'technical' | 'business'`.

---

## 5. Dead Letter Queue (DLQ)

### 5.1 Quando entra

- Erro de negócio (entrada direta)
- Erro técnico após N tentativas

### 5.2 O que fazer

- Aparece em alerta operacional
- Operador investiga via UI
- Ações:
  - **Reprocessar**: corrige causa raiz e move para `PENDING`
  - **Cancelar**: marca como `CANCELLED` (não envia)
  - **Ignorar**: marca como `IGNORED` com justificativa obrigatória

### 5.3 Métricas e alertas

- `outbox_dlq_count` (gauge) — watermark calibrado por tier (substitui ">10" arbitrário, ver Auditoria Rodada 5):
  - **Tier Pro**: warn > 5, crit > 25
  - **Tier Enterprise**: warn > 2, crit > 10
- Alerta quando idade do mais antigo > 24h (independente do tier)
- **Alerta novo (ADR-014)**: `outbox_dlq_reprocessed_total{idempotencyKey}` ≥ 3 em 30d → incidente (provável bug sistêmico de mapping ou regra de negócio)
- Detalhes em `SLO-INTEGRACAO.md` §6.

### 5.4 TTL e arquivamento (ADR-014)

DLQ não cresce indefinidamente:

- Item ganha campo `dlqEnteredAt` ao entrar em `DEAD_LETTER`.
- Cron diário: itens com `dlqEnteredAt < now - 90d` são movidos para `integracao_outbox_archive` (mesma estrutura, sem índices ativos para reduzir custo de manutenção).
- Após 5 anos no archive (alinhamento com retenção fiscal LGPD/SPED), purge.
- Métrica: `outbox_dlq_archived_total{reason}`.

**Política**: 90 dias é janela suficiente para investigação humana de qualquer DLQ; após isso, valor operacional decai a zero. Arquivamento preserva auditabilidade sem inflar tabela quente.

### 5.4.1 Política de descarte/escalation DLQ (orçamento operacional)

Item em DLQ não fica esquecido — tem ciclo de escalation explícito antes do arquivamento.

| Idade do item em DLQ | Ação                                                                                                                           | Severidade alerta                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| 0–7 dias             | item visível em UI; operador trata no fluxo normal                                                                             | sem alerta                        |
| **> 7 dias**         | alerta operacional dispara                                                                                                     | **P3** (próximo dia útil)         |
| **> 30 dias**        | item entra em **fila de reprocessamento manual obrigatório** — Suporte L2 abre tarefa formal; operador local notificado        | P3 com escalation a L2            |
| **> 90 dias**        | item é **arquivado em storage frio com hash chain** (ADR-018); removido da tabela quente; ainda recuperável via `audit verify` | sem alerta — automático           |
| Descarte definitivo  | **APENAS após análise humana documentada** (justificativa em campo `disposalReason`); nunca automático                         | bloqueia se justificativa ausente |

### Operacionalização

- Cron diário às 03h BRT varre DLQ:
  - `dlqEnteredAt < now - 7d` → emite alerta P3 (uma vez por item).
  - `dlqEnteredAt < now - 30d` → cria task em sistema de tickets de suporte L2 com link direto.
  - `dlqEnteredAt < now - 90d` → move para `integracao_outbox_archive` (já existe §5.4); calcula hash chain do registro arquivado.
- Métricas:
  - `outbox_dlq_age_buckets{tenant,connector,bucket=<7d|7-30d|30-90d|>90d>}` — histograma de idade.
  - `outbox_dlq_archived_total{reason}` (já existente em §5.4).
  - `outbox_dlq_disposal_total{tenant,connector,reason}` — só incrementa quando humano descarta com justificativa.
- UI: tela do operador exibe idade em dias e badge de severidade.
- Garantia: descarte definitivo (não arquivamento) requer aprovação tech lead + justificativa em campo obrigatório; auditável.

---

## 5.5 Watermarks e dimensionamento (Auditoria Rodada 5)

A fila do outbox tem dois sinais de saturação que precisam de watermark explícito:

| Sinal                   | Warn     | Crit    | Procedimento                                                                                                                  |
| ----------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `outbox_pending_count`  | > 1.000  | > 5.000 | (warn) investigar conector lento; (crit) abrir P1, escalar `WORKER_CONCURRENCY` (após validar lock SQLite), comunicar cliente |
| `sqlite_wal_size_bytes` | > 500 MB | > 1 GB  | (warn) `PRAGMA wal_checkpoint(TRUNCATE)`; (crit) `VACUUM` em janela de manutenção, abrir P1                                   |

Para Tier Enterprise, watermarks são mais agressivos — ver `SLO-INTEGRACAO.md` §6.

### Procedimento `VACUUM` (crítico)

1. Notificar cliente (janela de manutenção 10–30 min).
2. Parar Solution Ticket (worker fica idle).
3. Backup do banco.
4. `sqlite3 solution-ticket.db "VACUUM;"` (pode levar minutos em banco grande).
5. Restart e validar `outbox_pending_count` voltando ao normal.
6. Se WAL não reduz: investigar long-running transaction não-fechada (bug); abrir issue.

---

## 5.6 Poison message

Mensagem que **crasha o worker** (ex: payload com regex catastrófico no JSONata, OOM no mapping) tem tratamento especial: NÃO incrementar `attempts`, isolar imediatamente.

### Detecção

- Worker é envolvido em try/catch global.
- Crash não-recuperável (OOM, RangeError, segfault no nativo) → handler grava o `eventId` em log e marca:

```sql
UPDATE integracao_outbox
SET status = 'POISON',
    lastError = 'WORKER_CRASH:<reason>',
    lastErrorCategory = 'technical'
WHERE id = ?;
-- attempts NÃO é incrementado (poison ≠ retry normal)
```

### Estado `POISON`

- Terminal técnico até intervenção humana.
- Bloqueia 1 mensagem, **não bloqueia o batch** (worker pula e segue).
- Alerta P2 (ack ≤ 1 h): "evento POISON — investigar payload em <eventId>".
- Resolução: humano decide entre `IGNORED` (com justificativa), `CANCELLED`, ou `PENDING` (após corrigir mapping/regra).

### Por que separado de DEAD_LETTER

- DLQ implica "tentamos N vezes e ERP rejeitou".
- POISON implica "nem chegou ao ERP — quebrou o worker".
- Tratamento diferente: DLQ pode reprocessar; POISON precisa investigar bug local primeiro.

---

## 6. Recovery de eventos órfãos

Worker pode crashar deixando evento em `PROCESSING`. Job de recovery roda a cada 5min:

```sql
UPDATE integracao_outbox
SET status = 'PENDING',
    attempts = attempts + 1
WHERE status = 'PROCESSING'
  AND processedAt < datetime('now', '-10 minutes')
  AND status != 'POISON'; -- poison fica isolado
```

Métrica: `outbox_recovery_count`.

> Se um evento entra em recovery e **crasha o worker novamente**, é promovido a `POISON` em vez de continuar girando. Isso evita que 1 payload tóxico bloqueie a fila inteira.

---

## 7. Idempotência

### 7.1 Cálculo da chave

```typescript
function computeIdempotencyKey(event: IntegrationEvent): string {
  const parts = [
    event.tenantId,
    event.companyId,
    event.unitId,
    event.entityId,
    event.eventType,
    event.revision.toString(),
  ];
  return sha256(parts.join('|'));
}
```

### 7.2 Garantia

- UNIQUE constraint na coluna `idempotencyKey` impede dupla inserção
- Worker passa a chave para o conector
- Conector inclui chave em request ao ERP (header customizado quando ERP suportar)
- Em retry, mesma chave → ERP responde "já processado" sem duplicar

### 7.3 Idempotency-Key externa ↔ idempotencyKey do outbox

Quando o evento entra **pela API pública** (`POST /api/v1/integration/...` na porta `:3002`, ver ADR-013), o cliente envia header `Idempotency-Key: <uuid-v4-externo>`. Esse UUID é **diferente** do idempotencyKey interno do outbox — precisa de mapeamento determinístico:

```typescript
function deriveOutboxIdempotencyKey(
  externalIdempotencyKey: string,
  event: IntegrationEvent,
): string {
  // UUID externo entra como prefixo determinístico no sha256 interno
  const parts = [
    `ext:${externalIdempotencyKey}`, // <-- prefixo do UUID externo
    event.tenantId,
    event.companyId,
    event.unitId,
    event.entityId,
    event.eventType,
    event.revision.toString(),
  ];
  return sha256(parts.join('|'));
}
```

**Garantias**:

- Mesmo `Idempotency-Key` externo + mesmo evento → mesmo `idempotencyKey` interno → UNIQUE constraint do outbox impede duplicidade.
- Cliente reenviando o mesmo POST por timeout de rede recebe o mesmo `correlationId` em < 24h (cache da API pública conforme `003-api-publica-v1.md` §7).
- Se cliente reusa `Idempotency-Key` externo para evento **diferente** → outbox aceita normalmente (chave interna difere por revision/entityId), e a API pública valida via cache de 24h se a payload bate; caso não bate → 409.

---

## 8. Inbox (eventos recebidos)

Espelhamento do outbox para eventos vindos do ERP (via webhook/relay/polling).

```sql
CREATE TABLE integracao_inbox (
  id              TEXT PRIMARY KEY,
  profileId       TEXT NOT NULL,
  sourceEventId   TEXT NOT NULL,         -- ID do ERP
  entityType      TEXT NOT NULL,
  externalId      TEXT,
  payloadRemote   TEXT NOT NULL,
  payloadCanonical TEXT,
  status          TEXT NOT NULL,
  idempotencyKey  TEXT NOT NULL UNIQUE,
  createdAt       DATETIME NOT NULL,
  processedAt     DATETIME
);
```

### 8.1 Fluxo

1. Webhook/agent grava em inbox com `idempotencyKey = sourceEventId`
2. Inbox processor lê itens `PENDING`
3. Mapping reverso (ERP → canônico)
4. Atualiza estado local (ex: bloqueia cliente, marca pedido liberado)
5. Status → `CONFIRMED`

### 8.2 Idempotência

Mesmo `sourceEventId` → unique constraint impede duplicidade.

---

## 9. Métricas Prometheus

```
outbox_pending_count{tenant,connector}
outbox_processing_count{tenant,connector}
outbox_dlq_count{tenant,connector}
outbox_processed_total{tenant,connector,status}
outbox_duration_seconds{tenant,connector,status}  (histogram)
outbox_retry_total{tenant,connector,attempt}
outbox_recovery_count{tenant}
inbox_pending_count{tenant,connector}
inbox_processed_total{tenant,connector,status}
```

---

## 10. Limites e tuning

| Parâmetro               | Default        | Tunável                                |
| ----------------------- | -------------- | -------------------------------------- |
| `POLL_INTERVAL_MS`      | 5000           | Sim, por instalação                    |
| `BATCH_SIZE`            | 10             | Sim                                    |
| `MAX_ATTEMPTS`          | 5              | Sim, por conector                      |
| `BASE_DELAY_MS`         | 30000          | Sim, por conector                      |
| `MAX_DELAY_MS`          | 3600000        | Sim                                    |
| `RECOVERY_THRESHOLD_MS` | 600000 (10min) | Sim                                    |
| `WORKER_CONCURRENCY`    | 1              | Sim, mas testar lock antes de aumentar |

---

## 11. Benchmarks alvo

- 1000 eventos pendentes processados em < 60s (com Mock Connector)
- Latência p95 < 100ms (overhead do hub, sem o ERP)
- Sem deadlock em 24h sob carga contínua de 100 ev/min

---

## 11.5 Trace correlation (W3C + OpenTelemetry)

> Auditoria Rodada 5 (Agente 3): trace correlation sem padrão. Esta seção fecha o gap.

### 11.5.1 Padrão

- **Header HTTP**: `traceparent` (W3C Trace Context — RFC).
- Formato: `00-<trace-id 32 hex>-<span-id 16 hex>-<flags 2 hex>`.
- Toda requisição entrante (API pública, webhook relay, retry interno) propaga `traceparent`.
- Toda requisição saínte ao ERP injeta `traceparent` (header customizado quando ERP não suporta nativamente).

### 11.5.2 Instrumentação no conector base

```typescript
// backend/src/integracao/connectors/base.ts
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('solution-ticket-integracao', '1.0');

async function pushEventInstrumented(event, profile) {
  return tracer.startActiveSpan(
    `connector.${profile.connectorType}.pushEvent`,
    {
      attributes: {
        'integracao.profile_id': profile.id,
        'integracao.connector': profile.connectorType,
        'integracao.event_id': event.id,
        'integracao.idempotency_key': event.idempotencyKey,
        'integracao.correlation_id': event.correlationId,
      },
    },
    async (span) => {
      try {
        const result = await this.pushEvent(event, profile);
        span.setStatus({ code: 1 }); // OK
        return result;
      } catch (err) {
        span.recordException(err);
        span.setStatus({ code: 2, message: err.message });
        throw err;
      } finally {
        span.end();
      }
    },
  );
}
```

### 11.5.3 Fluxo de propagação

```
API pública / webhook relay
   │ (gera traceparent se ausente)
   ▼
Hub (worker outbox)
   │ (continua o trace, novo span "worker.process")
   ▼
Conector ERP
   │ (novo span "connector.<erp>.pushEvent")
   │ (header traceparent enviado ao ERP)
   ▼
ERP (idealmente continua o trace; se não, encerra aqui)
   │
   ▼ resposta
Inbox (webhook entrante)
   │ (novo span "inbox.process", com traceparent vindo do relay)
   ▼
Reconciliação
```

### 11.5.4 Backend de traces

- **Local-first**: traces ficam em arquivo (`logs/traces.jsonl`) + opcional export para coletor remoto.
- **Cloud (Tier Enterprise)**: opcional Honeycomb / Datadog / Jaeger via OTLP — configurável por instalação.
- **Privacidade**: atributos com PII (cpf, cnpj, nomes) NÃO entram em span. Só IDs internos + IDs externos do ERP.

### 11.5.5 Alertas baseados em trace

- p95 do trace end-to-end (API pública → ERP confirmado) > SLO de freshness inbox.
- Span do ERP com erro > taxa permitida pelo SLO de sucesso.
- Span do mapping engine demorando > 100ms (saturação).

---

## 12. Referências

- ADR-002 — Outbox local-first
- ADR-013 — API pública em porta separada (`:3002`)
- ADR-014 — Modelo de consistência outbox/inbox (ordering, DLQ TTL, SENT timeout)
- Chris Richardson, _Microservices Patterns_, Cap. 3
- `backend/src/integracao/queue/`
