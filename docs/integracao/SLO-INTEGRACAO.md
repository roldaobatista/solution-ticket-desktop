# SLOs e SLIs do Módulo Integração

**Versão**: 1.0 — 2026-04-27 (criado a partir da Auditoria Rodada 5 — CRITICAL C6)
**Audiência**: `SRE-Agent`, `Support-Agent`, `Agent-Orchestrator`
**Atualização**: a cada GA de conector novo ou após incidente que invalide watermark
**Documentos relacionados**: `004-outbox-inbox-retry.md`, `CAPACITY.md`, `ON-CALL.md`, `ESTRATEGIA-RELAY-CLOUD.md`

---

## 1. Por que existe este documento

A Auditoria 10-Agentes (Rodada 5, Agente 3 — DevOps/SRE) identificou que **nenhum dos 95 documentos** define SLOs/SLIs explícitos. Sem isso:

- Não há contrato de qualidade quantificável com cliente Enterprise.
- Alertas viram ruído (treshold arbitrário "DLQ > 10").
- Error budget invisível → time prioriza feature em vez de confiabilidade.
- GA do Sprint 6 fica refém de "achismo" de qualidade.

Este documento fecha a lacuna definindo SLIs (o que medir), SLOs (a meta), error budget (orçamento de falha) e burn-rate alerts (quando acordar alguém).

---

## 2. SLIs (Service Level Indicators) por dimensão

### 2.1 Outbox — latência de entrega

| SLI                           | Definição                                                              | Coleta                            |
| ----------------------------- | ---------------------------------------------------------------------- | --------------------------------- |
| `outbox_delivery_p95_seconds` | p95 do tempo entre `createdAt` e `processedAt` (status=SENT/CONFIRMED) | Prometheus histogram, janela 5min |
| `outbox_delivery_p99_seconds` | idem p99                                                               | idem                              |
| `outbox_lock_wait_ms`         | tempo gasto aguardando lock pessimista do SQLite                       | Histogram instrumentado no worker |

### 2.2 Outbox — taxa de sucesso

| SLI                    | Definição                                                                | Coleta                               |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| `outbox_success_ratio` | `SENT+CONFIRMED / (SENT+CONFIRMED+FAILED_*+DEAD_LETTER)` por janela 5min | derivado de `outbox_processed_total` |
| `outbox_dlq_count`     | gauge atual de itens em DEAD_LETTER                                      | direto da tabela                     |
| `outbox_pending_count` | gauge de itens em PENDING (proxy de saturação)                           | direto da tabela                     |

### 2.3 Inbox — freshness

| SLI                           | Definição                                                               | Coleta                                                       |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| `inbox_freshness_p95_seconds` | p95 do tempo entre webhook recebido no relay e `processedAt` no desktop | timestamp do relay propagado em header `X-Relay-Received-At` |
| `inbox_lag_seconds`           | gauge de idade do item PENDING mais antigo                              | query SQL `min(createdAt)` periódica                         |

### 2.4 API pública (`:3002`) — disponibilidade

| SLI                       | Definição                                      | Coleta             |
| ------------------------- | ---------------------------------------------- | ------------------ |
| `api_public_availability` | `(req_total - req_5xx) / req_total` por minuto | Prometheus counter |
| `api_public_p95_ms`       | latência p95                                   | Histogram          |

### 2.5 Saturação (USE)

| SLI                            | Definição                                            | Coleta                           |
| ------------------------------ | ---------------------------------------------------- | -------------------------------- |
| `worker_busy_ratio`            | `time_busy / time_window` (0–1) por worker           | instrumentação no loop principal |
| `sqlite_wal_size_bytes`        | tamanho do arquivo `-wal`                            | filesystem stat a cada 30s       |
| `outbox_lock_contention_total` | counter de tentativas de lock que aguardaram > 100ms | instrumentação                   |
| `worker_queue_length`          | `outbox_pending_count` reaproveitado como saturação  | gauge                            |

---

## 3. SLOs (Service Level Objectives)

| SLO                                  | Meta            | Janela          | Notas                                                           |
| ------------------------------------ | --------------- | --------------- | --------------------------------------------------------------- |
| **Latência outbox p95**              | ≤ 30 s          | 28 dias rolling | medida com Mock; conector real respeita teto de `CAPACITY.md`   |
| **Taxa de sucesso entrega ERP**      | ≥ 99,0 %        | 28 dias rolling | excluir falhas de negócio (FAILED_BUSINESS) — só técnicas pesam |
| **Freshness inbox** (event→aplicado) | p95 ≤ 60 s      | 28 dias rolling | inclui propagação relay → desktop                               |
| **Disponibilidade API pública**      | ≥ 99,5 % mensal | mês corrente    | `:3002` LAN; degrada com backend offline                        |
| **DLQ idade do mais antigo**         | ≤ 24 h          | contínuo        | item em DLQ > 24h é violação operacional                        |

### 3.1 Tabela RED + USE

| Sinal            | Métrica                                                                | Regra                              |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| **Rate**         | `outbox_processed_total[1m]`                                           | espera valores > 0 em janela ativa |
| **Errors**       | `outbox_processed_total{status=~"FAILED.*\|DEAD_.*"}[1m]`              | proporcional ao SLO de sucesso     |
| **Duration**     | `outbox_delivery_p95_seconds`                                          | proporcional ao SLO de latência    |
| **Utilization**  | `worker_busy_ratio`                                                    | alerta se > 0,85 sustentado 15min  |
| **Saturation**   | `outbox_pending_count`, `outbox_lock_wait_ms`, `sqlite_wal_size_bytes` | watermarks — ver §6                |
| **Errors (USE)** | `outbox_lock_contention_total[5m]`                                     | alerta se > 50/min                 |

---

## 3.2 SLOs por conector

SLO global (§3) garante média; mas cliente Enterprise contrata **conector específico**. Cada conector tem SLI próprio — meta calibrada com `CAPACITY.md`.

| Conector              | Latência p95 (entrega) | Taxa de sucesso técnica | Freshness inbox p95 | Notas                                    |
| --------------------- | ---------------------- | ----------------------- | ------------------- | ---------------------------------------- |
| **Bling**             | ≤ 60 s                 | ≥ 99,0 %                | ≤ 90 s              | rate-limit 3 req/s domina latência       |
| **Omie**              | ≤ 90 s                 | ≥ 99,0 %                | ≤ 120 s             | limit por endpoint; pico tem cauda longa |
| **Sankhya**           | ≤ 30 s                 | ≥ 99,3 %                | ≤ 60 s              | I/O-bound; SLO mais apertado             |
| **TOTVS Protheus**    | ≤ 120 s                | ≥ 98,5 %                | ≤ 180 s             | lock SD1/SD2 alarga p95                  |
| **SAP S/4HANA Cloud** | ≤ 30 s                 | ≥ 99,5 %                | ≤ 45 s              | Event Mesh permite SLO mais agressivo    |
| **Senior**            | ≤ 60 s                 | ≥ 99,0 %                | ≤ 90 s              | varia com licença do cliente             |

Conector novo entra com SLO **provisório** (cópia do mais próximo na tabela), promovido a oficial após 30 dias de baseline.

---

## 3.3 SLI decomposto por componente

SLO global (§3) e SLO por conector (§3.2) capturam o **resultado de ponta-a-ponta**. Mas a cadeia tem 5 componentes independentes — cada um com seu próprio modo de falha. Decompor SLI/SLO por componente permite isolar root cause em incidente e diferenciar runbook por origem.

| Componente                            | Disponibilidade (mensal)                                        | Latência (p95)                                                   | Taxa de sucesso (técnica)        | Freshness                                               | Coleta principal                                  |
| ------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| **(a) App local Electron + SQLite**   | ≥ 99,5 % uptime do processo (excl. desligamento manual cliente) | abertura de janela ≤ 3 s; lock SQLite ≤ 100 ms p95               | crash-free session ≥ 99,9 %      | n/a                                                     | health-check do main process; `app.crashed` event |
| **(b) Outbox processor** (worker)     | ≥ 99,9 % do tempo com worker ativo                              | dispatch p95 ≤ 5 s (decisão de enviar); end-to-end conforme §3.2 | ≥ 99,5 % de loops sem erro fatal | gauge `outbox_pending_count` decresce em janela de 60 s | métricas internas (Prometheus)                    |
| **(c) Conector específico** (por ERP) | conforme contrato do ERP (Bling 99 %, SAP S/4 99,5 %)           | conforme §3.2 (varia por ERP)                                    | conforme §3.2                    | conforme §3.2                                           | métricas labeled `connector=<erp>`                |
| **(d) Relay cloud**                   | ≥ 99,9 % mensal (`RELAY-CLOUD-SECURITY-SPEC.md` §5.3)           | p95 ≤ 200 ms ingress→egress                                      | ≥ 99,5 % de requisições não-5xx  | webhook→outbox local p95 ≤ 30 s                         | Cloudflare Analytics + métricas custom            |
| **(e) API pública (`:3002`)**         | ≥ 99,5 % mensal                                                 | p95 ≤ 100 ms (overhead local)                                    | ≥ 99,9 % (5xx)                   | n/a                                                     | métricas Prometheus do NestJS                     |

Regras de composição:

- **SLO global** (§3) é função multiplicativa dos componentes em série; quebra em um componente derruba o SLO global proporcionalmente.
- **Atribuição de incidente**: post-mortem identifica componente dominante (>50 % do tempo de queima do budget) e atribui a ele.
- **Runbook diferenciado**: ver `ON-CALL.md` §"SLI por componente" para mapa Sev × componente × runbook.

---

## 3.4 Pipeline de telemetria implementado

ADR-017 referenciada não basta — esta seção é a **spec executiva** do pipeline observável que sustenta os SLI/SLO acima.

### Camadas

1. **Coletor local — OpenTelemetry Collector embutido no Electron**
   - Modo padrão: **agregação local** (sem export remoto). Calcula histograms, counters, gauges no processo do app.
   - Buffer ring de 24 h em memória + spill para disco (`%APPDATA%/...//otel-buffer/`) limitado a 500 MB.
   - **Sem PII por default**: regex de mascaramento aplicado antes de qualquer span/log sair do processo (mesmo padrão de `RELAY-CLOUD-SECURITY-SPEC.md` §7.3).
2. **Export opt-in — Grafana Cloud (ou compatível OTLP)**
   - Cliente Tier-1 ou Enterprise pode habilitar em Configurações → Telemetria.
   - Toggle visível "**Telemetria opcional — enviar métricas anonimizadas para suporte**" no setup inicial e nas configurações.
   - Endpoint configurável (default: tenant Grafana Cloud da Solution Ticket).
   - Auth via API token gravado em DPAPI.
3. **Audit log (separado do pipeline OTel)** — assinado, hash chain (ADR-018), exportado semanalmente.

### Retenção

| Tipo              | Local                   | Cloud (opt-in)                   | Notas                                |
| ----------------- | ----------------------- | -------------------------------- | ------------------------------------ |
| Traces            | 24 h ring + 7 d disco   | **30 dias** Grafana Cloud        | sampling 10 % default; 100 % em erro |
| Métricas          | 90 dias resolução 1 min | **90 dias**                      | downsampling 1h após 30 dias         |
| Logs estruturados | 30 dias rolling         | **90 dias**                      | mascaramento PII antes de export     |
| **Audit log**     | indefinido local        | **5 anos** S3 Object Lock (WORM) | hash chain assinado, ADR-018         |

### Privacidade e LGPD

- Telemetria desligada = funciona offline; nunca bloqueia operação.
- Toggle por categoria: traces / métricas / logs (granularidade).
- Cliente recebe relatório anual do que foi coletado (transparência LGPD Art. 9).
- Direito ao esquecimento: export de telemetria pode ser purgado por tenant em ≤ 30 dias.

### Ferramentas

- **OTel Collector**: `otelcol-contrib` v0.95+ embutido como sidecar (~30 MB).
- **Backend cloud default**: Grafana Cloud (free tier para até 10k séries; suficiente até 100 tenants Tier-1).
- **Alternativa Enterprise**: cliente pode apontar para próprio Datadog / New Relic / Honeycomb.

---

## 4. Error budget

### 4.1 Cálculo

Para SLO de sucesso ≥ 99 % mensal:

- **Budget de falha**: 1 % das requisições do mês.
- Em tempo: 1 % de 30 dias = **7 h 22 min** de indisponibilidade aceitável por mês.
- Em volume: 1 % de 1 M eventos = 10 000 falhas técnicas aceitáveis por mês.

### 4.2 Política de uso

| Budget consumido | Postura do time                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| < 25 %           | velocidade normal — features novas                                                                                                |
| 25–50 %          | revisar últimas releases — debt técnico ganha prioridade                                                                          |
| 50–75 %          | feature freeze parcial — só refactor para confiabilidade                                                                          |
| 75–100 %         | **freeze total** — só fixes de SLO até budget renovar; **pausa lançamento de novos conectores** até recuperar                     |
| > 100 %          | **incident review obrigatório**, plano de recuperação publicado; freeze de novos conectores mantido por mais 1 mês após recuperar |

### 4.2.1 Política de freeze de novos conectores

Quando o budget queima ≥ 75 % em qualquer SLO global ou por conector já em GA:

- Pausa imediata do roadmap de **novos conectores** (não afeta evolução dos já em GA).
- Time foca em recuperar confiabilidade do conector que está queimando budget.
- Decisão de retomar: `Agent-Orchestrator` com parecer do `SRE-Agent`. Critério: budget ≥ 50 % por 7 dias consecutivos.
- Comunicação ao Comercial: Pré-vendas qualifica que prospect aguardará próxima janela (transparente, evita commitment estourado).

### 4.3 Renovação

Budget reinicia no dia 1º de cada mês UTC-3. Não acumula entre meses.

---

## 5. Burn-rate alerts (multi-window)

Detectam consumo anômalo do budget antes do mês acabar. Padrão Google SRE.

### 5.1 Fast burn — P1 (acordar agora)

- **Janela**: 1 h
- **Condição**: queima ≥ 14× a taxa esperada → consumiria budget de 14 dias em 1 h
- **Threshold**: `error_rate(1h) > 14 × (1 - SLO)` → para SLO 99 %: `error_rate(1h) > 14 %`
- **Severidade**: P1 (ack ≤ 15 min)
- **Runbook**: `008-runbook-suporte.md` §"Diagnóstico rápido"

### 5.2 Slow burn — P2 (próximo dia útil)

- **Janela**: 6 h
- **Condição**: queima ≥ 6× a taxa esperada → consumiria budget de 30 dias em 5 dias
- **Threshold**: `error_rate(6h) > 6 × (1 - SLO)` → para SLO 99 %: `error_rate(6h) > 6 %`
- **Severidade**: P2 (ack ≤ 1 h)

### 5.3 Janela longa — P3 (registro)

- **Janela**: 24 h
- **Condição**: queima ≥ 1× a taxa esperada por 24 h
- **Severidade**: P3 (próximo dia útil)

---

## 6. Watermarks de saturação (calibrados por tier)

| Métrica                   | Tier Pro — warn | Tier Pro — crit | Tier Enterprise — warn | Tier Enterprise — crit |
| ------------------------- | --------------- | --------------- | ---------------------- | ---------------------- |
| `outbox_pending_count`    | > 1 000         | > 5 000         | > 500                  | > 2 000                |
| `sqlite_wal_size_bytes`   | > 500 MB        | > 1 GB          | > 250 MB               | > 750 MB               |
| `outbox_dlq_count`        | > 5             | > 25            | > 2                    | > 10                   |
| `outbox_lock_wait_ms` p95 | > 100           | > 500           | > 50                   | > 250                  |
| `worker_busy_ratio`       | > 0,80          | > 0,95          | > 0,70                 | > 0,90                 |

> Watermark Enterprise mais agressivo porque SLA contratual é mais apertado.
> `outbox_dlq_count` substitui o limite arbitrário ">10" identificado pela auditoria.

---

## 7. Procedimento de resposta

| Sinal                            | Procedimento imediato                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `sqlite_wal_size_bytes` > crit   | rodar `VACUUM`; abrir P1; checar workers presos                                            |
| `outbox_pending_count` > crit    | escalar `WORKER_CONCURRENCY` (após teste de lock); investigar conector lento               |
| `outbox_dlq_count` > crit        | inspecionar 10 itens mais recentes; classificar negócio vs técnico; reprocessar ou ignorar |
| `outbox_lock_wait_ms` p95 > crit | reduzir `BATCH_SIZE`; checar workers concorrentes; medir contenção                         |
| `worker_busy_ratio` > crit       | conector saturado vs ERP — comparar com `CAPACITY.md`; comunicar cliente                   |

---

## 8. Métricas adicionais a publicar

```
# Latência
histogram_quantile(0.95, outbox_delivery_seconds_bucket)
histogram_quantile(0.95, outbox_lock_wait_ms_bucket)
histogram_quantile(0.95, inbox_freshness_seconds_bucket)

# Saturação
sqlite_wal_size_bytes
outbox_pending_count
outbox_dlq_count
worker_busy_ratio
outbox_lock_contention_total

# Sucesso
sum(rate(outbox_processed_total{status=~"SENT|CONFIRMED"}[5m]))
  /
sum(rate(outbox_processed_total{status!~"CANCELLED|IGNORED"}[5m]))
```

---

## 9. Revisão e governança

- **Revisão trimestral** dos SLOs vs realidade observada.
- **Após cada incidente P0/P1**: revisar se threshold detectou; se não, ajustar.
- **A cada conector novo em GA**: validar SLOs respeitam a capacidade real (`CAPACITY.md`).
- **Fechamento de mudança**: decision record do `SRE-Agent` + evidências de SLO/rollback.

---

## 10. Referências

- Google SRE Workbook — _Alerting on SLOs_ (multi-window burn-rate)
- ADR-002 — Outbox local-first
- `CAPACITY.md` — limites por conector (insumo dos SLOs)
- `004-outbox-inbox-retry.md` §3 — métricas Prometheus base
- `ON-CALL.md` — severidades e escalonamento
