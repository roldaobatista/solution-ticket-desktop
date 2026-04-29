# ADR-014: Modelo de Consistência Outbox/Inbox — Ordering, Idempotência, DLQ TTL

**Status**: Aceita (resolve achado CRITICAL/HIGH "ADR-014 ausente" da Rodada 5)
**Data**: 2026-04-27
**Autores**: equipe ST
**ADRs base**: ADR-002 (outbox local-first), ADR-005 (conectores), ADR-010 (single-tenant), ADR-013 (split de portas)

---

## Contexto

O `004-outbox-inbox-retry.md` define o pipeline outbox → worker → conector → inbox, mas várias decisões de consistência ficaram **implícitas**:

1. **Ordering**: o outbox processa em paralelo (`WORKER_CONCURRENCY` configurável) e não documenta como dois eventos da mesma entidade (`entityId`) ficam em ordem ao chegarem no ERP. Risco real: revisão `r=2` chega antes de `r=1` por scheduling de retry, e o ERP grava o estado errado.
2. **Garantia de entrega**: o pattern é at-least-once (worker pode crashar entre `connector.pushEvent` e `markSent`), mas o conector não tem contrato explícito de **dedup** no lado remoto.
3. **Reconciliação**: quando ERP retorna conflito (HTTP 409, ou versão divergente), não está claro **quem vence** — local ou remoto.
4. **DLQ**: a Rodada 4 já alertou que DLQ não tem TTL — eventos crescem para sempre. Sem política, o cliente acumula gigabytes de payload morto.
5. **Estado SENT**: o `004` define `SENT → CONFIRMED` mas não define **timeout** entre os dois. Eventos podem ficar em `SENT` para sempre se o ERP nunca confirma assincronamente.

---

## Decisão

### (a) Ordering FIFO por `entityId` via partition key

- A unidade de ordenação é `(profileId, entityType, entityId)`. Eventos com mesma chave **nunca** processam em paralelo.
- Implementação: o lock pessimista do worker (`004` §3.2) ganha cláusula extra: ao pegar um evento com `entityId=X`, marca um lock leve em `integracao_outbox_partition_lock(profileId, entityType, entityId)`. Outro worker pegando outro evento com mesmo `(p,t,e)` aguarda.
- Concurrency entre **partições diferentes** continua livre — preserva throughput.
- `WORKER_CONCURRENCY > 1` é seguro para entidades distintas; **nunca** quebra ordem dentro de uma partição.

### (b) Modelo at-least-once + dedup via idempotencyKey

- Outbox é **at-least-once** por design (transação local + retry).
- Dedup remota é responsabilidade do conector via `idempotencyKey` (ver `004` §7).
- Inbox é **at-least-once** com dedup via UNIQUE em `idempotencyKey` (sourceEventId do ERP).
- Conector que não suporta header de idempotência precisa documentar isso em `capabilities()` e a homologação trata como risco aceito (anotação no playbook universal).

### (c) Reconciliação por revision (revision maior vence)

- Toda entidade canônica carrega `revision` (inteiro monotônico por `entityId`).
- ERP retorna conflito (409 ou similar) → conector compara revision local vs remoto:
  - Local > Remoto → **força update** (local é fonte de verdade quando o evento veio do ST).
  - Local < Remoto → **descarta o push** (ERP já tem versão mais nova; provável race com pull).
  - Local == Remoto → **idempotência**, marca `CONFIRMED` sem repetir.
- Inbox aplica a mesma regra na direção oposta: se evento do ERP traz revision menor que o estado local, descarta.

### (d) DLQ TTL 90 dias → arquivar; alerta separado para reprocessamento

- Itens em `DEAD_LETTER` ganham campo `dlqEnteredAt`. Cron diário arquiva itens com `dlqEnteredAt < now - 90d` para `integracao_outbox_archive` (mesma estrutura, sem índices ativos). Após 5 anos no archive (alinhamento com retenção fiscal), purge.
- Alerta novo: **"DLQ reprocessada N vezes"** — se mesmo `idempotencyKey` voltou ao DLQ ≥ 3 vezes em 30 dias, gera incidente (provável bug de mapping ou regra de negócio). Métrica: `outbox_dlq_reprocessed_total{idempotencyKey}`.

### (e) Tratamento explícito SENT → CONFIRMED com timeout

- Default `SENT_TO_CONFIRMED_TIMEOUT_MS = 3_600_000` (1h). Configurável por conector.
- Cron a cada 5min varre `SENT` com `processedAt < now - timeout`:
  - Conector tem `getRemoteStatus(externalId)` → consulta ERP. Se ERP confirma → `CONFIRMED`. Se ERP não tem → volta para `PENDING` (retry).
  - Conector sem `getRemoteStatus` → marca como `CONFIRMED` por timeout (assume sucesso) **e** emite warning no log.
- Métrica: `outbox_sent_timeout_total{connector,resolution}`.

---

## Consequências

### Positivas

- Ordering FIFO previsível por entidade — cliente nunca vê estado fora de ordem no ERP.
- DLQ não vira lixão eterno; alerta de reprocessamento captura bugs sistêmicos.
- Estado `SENT` deixa de ser "limbo permanente"; sempre converge.
- Reconciliação por revision fecha race condition push×pull (problema real em ERPs com webhook + polling juntos).

### Negativas

- Lock por partição reduz paralelismo nominal (mas raramente é gargalo na prática — eventos da mesma `entityId` são correlacionados).
- Cron extra (`SENT_TIMEOUT_SCAN`) — overhead pequeno mas existe.
- Conectores precisam (idealmente) implementar `getRemoteStatus()` — opcional, mas recomendado.

### Riscos residuais

- Lock por partição pode gerar **starvation** se uma partição tem evento problemático que nunca completa (mitigação: o evento problemático cai em DLQ após `MAX_ATTEMPTS`, liberando a partição).
- Revision como inteiro monotônico exige que o emissor de eventos respeite ordem — documentar no `events/` factory.

---

## Alternativas consideradas

- **Kafka-style log com ordering global** (`partition by entityId` em tópico Kafka): rejeitada — exige broker, fora do local-first; ROI baixo para volume previsto (≤1000 ev/min).
- **Ordering global FIFO** (worker single-threaded): rejeitada — corta throughput desnecessariamente; partition por `entityId` cobre 99% dos casos práticos.
- **Last-Write-Wins por timestamp** ao invés de revision: rejeitada — clocks de cliente vs ERP não sincronizam; revision é determinística.
- **DLQ sem TTL** (status quo): rejeitada — Rodada 4 mostrou que cliente médio acumularia ~50MB/ano só de payload morto.

---

## Referências

- ADR-002 — Outbox local-first
- ADR-005 — Conectores plugáveis
- ADR-010 — Single-tenant
- ADR-013 — API pública em porta separada
- `004-outbox-inbox-retry.md` — pipeline detalhado (estados, retry, idempotência)
- `006-mapping-engine.md` — semantic de revision no canônico
- Auditoria 10-agentes Rodada 5 — finding "ADR-014 ausente"
