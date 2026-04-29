# Riscos de Runtime — Hub Desktop (Electron + NestJS + SQLite + Prisma 24/7)

> **Status:** Vigente a partir de Sprint 0
> **Owner:** Tech Lead + SRE
> **Cross-link:** ADR-017 (observability), ADR-019 (backup), `SPIKE-SQLITE-OUTBOX.md`, `SLO-INTEGRACAO.md`

---

## 1. Contexto

O módulo Integração ERP roda **24/7 em estação de campo Windows**, dentro do mesmo processo Electron que hospeda o produto-base. A stack (Electron + NestJS + Prisma + SQLite + better-sqlite3 + serialport) é estável em horizonte de horas, mas tem riscos conhecidos quando mantida em execução contínua sem reciclagem. Este documento cataloga os riscos, monitoramento e mitigação.

---

## 2. Catálogo de riscos

### 2.1. Memory leak Node.js

**Sintoma:** RSS cresce de 150MB para 600MB+ em 48-72h sem queda.
**Causa típica:** closures retidos em event listeners não removidos, caches sem TTL, Buffers acumulados em streams não drenadas.
**Mitigação:**

- Heap snapshot a cada 4h durante o spike (`v8.writeHeapSnapshot`).
- **Reciclagem preventiva** do worker outbox a cada 24h em janela ociosa (idle < 5 ticket/h por 30min).
- **Limite hard de RAM:** 512MB por processo worker; ultrapassou → SIGTERM + restart automático supervisionado.
- Monitorar `process.memoryUsage().heapUsed` e `rss` com Prometheus.

### 2.2. IPC Electron backpressure

**Sintoma:** UI congela ou fica stale; main process com event loop lag.
**Causa típica:** `webContents.send` em loop sem flow control; payload grande via IPC.
**Mitigação:**

- **Nunca enviar payload > 1MB via IPC** — paginar ou expor via endpoint local HTTP.
- Throttle de 100ms em eventos de telemetria para UI.
- Backpressure: se renderer não confirmar recebimento em 500ms, suspender envios e bufferizar no main com cap de 100 mensagens.
- Métrica: `ipc_queue_depth` exposta via Prom.

### 2.3. Prisma client connection pool

**Sintoma:** `Timed out fetching a new connection from the pool`.
**Causa típica:** SQLite é single-writer; Prisma tenta abrir múltiplas conexões e contende.
**Mitigação:**

- **Pool size = 1** (`?connection_limit=1` na DATABASE_URL).
- **Connection timeout 30s** (margem para checkpoint WAL).
- **Reconnect automático**: wrapper que recria PrismaClient se erro for `P1001` (can't reach DB) ou `P2024` (timeout).
- Health check no boot: `SELECT 1` em < 1s ou abortar.

### 2.4. serialport handle leak

**Sintoma:** após dezenas de abertura/fechamento de balança, `Error: Resource temporarily unavailable` ao abrir nova porta.
**Causa típica:** handle não fechado em erro; `port.close()` não esperado.
**Mitigação:**

- Garantir `await port.close()` em **todo** caminho de saída (try/finally).
- Em testes, `afterEach` força `close` + `removeAllListeners`.
- Monitorar handles abertos no Windows via `handle.exe` em smoke teste.
- Reciclagem do processo "balança" se contagem de handles abertos > 50.

### 2.5. NSIS auto-update durante operação

**Sintoma:** instalador acionado durante pesagem ativa, processo morto, ticket perdido.
**Causa típica:** electron-updater dispara em background sem checar estado.
**Mitigação:**

- **Bloquear update em horário comercial** (default: 06:00-22:00 local) — configurável por cliente.
- Aplicar update **só em janela de manutenção** (madrugada local) ou após 30min sem atividade.
- Pré-update: drenar outbox (esperar `pending=0`), commitar transações, fechar serialport.
- UI notifica "atualização disponível, aplicar agora?" com snooze de 4h.

### 2.6. Long-running Prisma + SQLite WAL

**Sintoma:** WAL cresce indefinidamente (>500MB), checkpoint não acompanha.
**Causa típica:** transação aberta longa segura por reader bloqueia checkpoint.
**Mitigação:**

- Transações com timeout de 30s no Prisma (`tx({ timeout: 30000 })`).
- Checkpoint manual a cada hora em janela idle (`PRAGMA wal_checkpoint(TRUNCATE)`).
- Alerta P2 se WAL > 200MB por > 30 min.

### 2.7. Event loop lag

**Sintoma:** latência de healthcheck sobe; SLO p95 estourado.
**Causa típica:** operação síncrona pesada no main process (parsing XML grande, hash de arquivo).
**Mitigação:**

- Mover CPU-bound para `worker_threads`.
- Métrica `event_loop_lag_p95_ms` exposta; alerta se > 100ms por 5min.

---

## 3. Telemetria obrigatória

Métricas Prometheus expostas pelo backend (porta interna):

| Categoria  | Métrica                               | Tipo      | Alerta                                    |
| ---------- | ------------------------------------- | --------- | ----------------------------------------- |
| Memória    | `process_resident_memory_bytes`       | gauge     | P2 se > 80% do limite (512MB) por > 30min |
| Memória    | `nodejs_heap_size_used_bytes`         | gauge     | P3 se cresce > 5%/h por 6h                |
| IPC        | `ipc_queue_depth`                     | gauge     | P2 se > 50 por > 1min                     |
| Prisma     | `prisma_pool_wait_ms`                 | histogram | P2 se p95 > 5s                            |
| serialport | `serialport_open_handles`             | gauge     | P2 se > 30                                |
| WAL        | `sqlite_wal_size_bytes`               | gauge     | P2 se > 200MB por > 30min                 |
| Event loop | `nodejs_event_loop_lag_seconds`       | histogram | P2 se p95 > 100ms por 5min                |
| Update     | `update_blocked_business_hours_total` | counter   | informativo                               |

Dashboards: `grafana/integration-hub-runtime.json` (a criar Sprint 2).

---

## 4. Validação no spike

O spike SQLite (Sprint 0, ver `SPIKE-SQLITE-OUTBOX.md`) **deve incluir**:

- Captura de heap snapshot a cada 4h por 7 dias.
- Medição de IPC sob carga 10k mensagens/min main↔renderer.
- Verificação de Prisma client estável após 7 dias contínuos.
- Contagem de handles serialport ao final do teste.

Resultado alimenta refinamento dos thresholds nesta tabela.
