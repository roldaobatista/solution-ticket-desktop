# Capacidade Real por Conector

> Owner: SRE | Última revisão: 2026-04-27 | Versão: 6

> 🔴 **DISCLAIMER (auditoria 5-isolados, 2026-04-27)**: **Todos os números neste documento são estimados até primeiro cliente em produção.** Não usar como baseline contratual antes de **S6 H3** (homologação Fase 3 do primeiro conector com cliente real). SLA comercial não deve fixar throughput absoluto enquanto a tabela tiver `Fonte = estimado`. Pré-vendas qualifica capacity por Discovery, não por anúncio público.

**Versão**: 1.0 — 2026-04-26 (criado a partir da auditoria 10-agentes — CRITICAL C5)
**Audiência**: SRE, Tech Lead, Pré-vendas (qualificar prospect grande)
**Atualização**: a cada release de conector

---

## Por que existe este documento

A meta declarada de **1.000 eventos/min** sustentados é **teórica** — limitada pelo Mock Connector. A capacidade **real por cliente** depende do rate limit e latência do **ERP-alvo**.

Auditoria identificou: prometer 1k ev/min sem qualificar por conector gera frustração comercial e operacional.

---

## Matriz de capacidade por conector

> **Fonte do dado** (coluna): `medido` = benchmark em sandbox/cliente real; `estimado` = derivado de doc oficial do ERP + experiência; `teórico` = só literatura/Mock, sem ERP real.
> Auditoria Rodada 5 (CRITICAL C5): **todas as células abaixo são `estimado`** até 1º cliente em produção fechar a baseline.

| Conector              | Rate limit ERP          | Throughput sustentável real    | Fonte    | Backlog seguro<sup>(1)</sup> | Tempo p/ drenar 1k eventos | Bottleneck dominante               | Limites adicionais                              |
| --------------------- | ----------------------- | ------------------------------ | -------- | ---------------------------- | -------------------------- | ---------------------------------- | ----------------------------------------------- |
| **Mock**              | sem                     | 1.000+ ev/min                  | teórico  | n/a                          | < 60s                      | lock SQLite WAL                    | Apenas dev/teste                                |
| **Bling**             | 3 req/s + 120k/dia      | **180 ev/min**                 | estimado | 4.000                        | ~6 min                     | rate-limit ERP                     | Cota diária 120k pode estourar em pico de safra |
| **Omie**              | 60 req/min por endpoint | **40–55 ev/min**               | estimado | 2.000                        | ~20 min                    | rate-limit ERP                     | Limite por endpoint, não global                 |
| **ContaAzul**         | ~100 req/min variável   | **70 ev/min**                  | estimado | 3.000                        | ~15 min                    | rate-limit ERP                     | Varia com plano CA do cliente                   |
| **Tiny**              | sem documentado oficial | **~120 ev/min**                | estimado | 5.000                        | ~9 min                     | rate-limit ERP (não documentado)   | Bloqueio temporário se abusar                   |
| **Sankhya**           | cluster — sem doc       | **150–300 ev/min**             | estimado | 8.000                        | ~5 min                     | I/O HTTP + dimensionamento cliente | Depende do dimensionamento do cliente           |
| **Senior**            | depende da licença      | **100 ev/min**                 | estimado | 5.000                        | ~10 min                    | rate-limit ERP (licença)           | Validar por cliente em Discovery                |
| **TOTVS Protheus**    | depende do servidor     | **30–200 ev/min**              | estimado | 5.000                        | ~20 min                    | I/O HTTP + lock SD1/SD2 no ERP     | Lock SD1/SD2 em pico afeta MUITO                |
| **TOTVS RM**          | depende do servidor     | **50–150 ev/min**              | estimado | 4.000                        | ~15 min                    | I/O HTTP                           | TBC mensageria pode ajudar                      |
| **TOTVS Datasul**     | EAI mensageria          | **200+ ev/min**                | estimado | 8.000                        | ~5 min                     | mapping JSONata + I/O EAI          | Mensageria nativa escala melhor                 |
| **SAP S/4HANA Cloud** | configurável            | **300+ ev/min** com Event Mesh | estimado | 15.000                       | ~3 min                     | mapping JSONata (worker local)     | OData REST tem cota; Event Mesh é melhor        |
| **SAP ECC** (BAPI)    | depende do servidor     | **80–150 ev/min**              | estimado | 5.000                        | ~10 min                    | I/O HTTP + JCo overhead            | JCo tem overhead                                |
| **Dynamics 365 F&O**  | depende API             | **120 ev/min**                 | estimado | 5.000                        | ~9 min                     | rate-limit ERP                     | DMF para massa, OData para tempo real           |
| **NetSuite**          | governance limits       | **60 ev/min**                  | estimado | 3.000                        | ~17 min                    | rate-limit ERP (governance units)  | Limite de 1000 unidades/script                  |
| **Oracle Fusion**     | configurável            | **100 ev/min**                 | estimado | 4.000                        | ~10 min                    | rate-limit ERP                     | FBDI para massa                                 |

<sup>(1)</sup> Backlog seguro = quantidade de eventos pendentes acima da qual alerta dispara (recomendado). Alinhado com watermarks de `SLO-INTEGRACAO.md` §6.

---

## Implicações comerciais

### Cliente que precisa > capacidade do conector

Se cliente tem **15.000 pesagens/mês** e ERP é Bling (180 ev/min):

- Volume médio por minuto: ~5 ev/min em 24h × 21 dias = factível
- **Em pico de safra de 1h**: pode chegar a 100 pesagens em 1h = 1.7 ev/min — OK
- **Pico extremo (todos pesam ao mesmo tempo)**: 50 ev/min — OK
- **Limite real**: cliente com pico > 180 ev/min sustentado precisa Sankhya/Senior, não Bling

### Categorização por porte de cliente

| Porte (pesagens/mês) | Conectores recomendados                      |
| -------------------- | -------------------------------------------- |
| < 1.000              | Qualquer                                     |
| 1.000–5.000          | Bling, Omie, ContaAzul, Tiny                 |
| 5.000–20.000         | Sankhya, Senior, ContaAzul, Tiny             |
| 20.000–50.000        | Senior, TOTVS Datasul, SAP S/4HANA Cloud     |
| > 50.000             | SAP S/4HANA Cloud (Event Mesh), Dynamics 365 |

---

## Configuração do worker por conector

```yaml
# backend/src/integracao/connectors/<erp>/runtime.yaml

bling:
  worker:
    pollIntervalMs: 5000
    batchSize: 5 # respeita 3 req/s
  rateLimit:
    requestsPerSecond: 2.5 # margem
    burstSize: 10
  retry:
    maxAttempts: 5
    baseDelayMs: 30000

omie:
  worker:
    batchSize: 3
  rateLimit:
    requestsPerMinute: 50 # margem do limite 60
    burstSize: 5

sankhya:
  worker:
    batchSize: 20
  rateLimit:
    requestsPerSecond: 5
    burstSize: 30

sap-s4hana:
  worker:
    batchSize: 50 # Event Mesh aguenta
  rateLimit:
    requestsPerSecond: 10
    burstSize: 100
```

---

## Worker concurrency

| Conector       | `WORKER_CONCURRENCY` testado | Recomendado prod  |
| -------------- | ---------------------------- | ----------------- |
| Mock           | 8                            | 4                 |
| Bling          | 1 (limitado pelo rate)       | 1                 |
| Omie           | 1                            | 1                 |
| Sankhya        | 4                            | 2                 |
| TOTVS Protheus | 2                            | 2 (lock-friendly) |
| SAP S/4HANA    | 8                            | 4                 |

> ⚠️ Aumentar concurrency exige re-teste de SQLite WAL lock + spike S0-02 atualizado.

---

## Cenários de degradação

### Cliente excede 80% do throughput sustentado por > 5 min

1. Alerta dispara
2. Worker prioriza tickets fiscais (NF-e vinculada) sobre ticket avulso
3. Notificação ao cliente: "fila acima de X — talvez plano superior do ERP"

### Cliente excede 100% sustentado por > 30 min

1. Alerta P1 dispara
2. Backlog cresce — mostrado em UI
3. Eventos não-críticos podem ser deferidos (configurável)
4. Comunicação proativa ao cliente

### ERP indisponível (0 ev/min)

1. Outbox preserva tudo
2. Após 24h: alerta cliente para verificar ERP
3. Após 7 dias: alerta P1 (DLQ vai inflar quando voltar)

---

## Validação de capacidade em homologação (H3)

Ver `PLANO-HOMOLOGACAO-CONECTOR.md` Fase H3.

### Fórmula padrão H3

```
volume = throughput sustentado × duração
```

Substitui números soltos: cada cenário H3 deriva da tabela "Throughput sustentável real" × janela escolhida (curta, média, longa). Exemplo: Bling 180 ev/min × 10 min = 1.800 eventos para teste base.

| Teste H3        | Fórmula                | Bling (180 ev/min) | Sankhya (200 ev/min médio) | SAP S/4 (300 ev/min) |
| --------------- | ---------------------- | ------------------ | -------------------------- | -------------------- |
| Volume base     | throughput × 10 min    | 1.800 em 10 min    | 2.000 em 10 min            | 3.000 em 10 min      |
| Sustentado      | throughput × 30 min    | 5.400 em 30 min    | 6.000 em 30 min            | 9.000 em 30 min      |
| Pico (2× burst) | 2 × throughput × 1 min | 360 em 1 min       | 400 em 1 min               | 600 em 1 min         |

> Pico ≠ infinito. Pico real é limitado por `burstSize` configurado no rate-limiter — ver `runtime.yaml` por conector.

---

## Load-test obrigatório pré-GA

Antes de promover qualquer conector novo a GA (ou marco de GA do módulo no Sprint 6), executar **load-test contínuo de 24 h** em ambiente staging com a seguinte spec:

| Item           | Valor                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Duração        | **24 h ininterruptas**                                                                                                       |
| Volume         | **10× volume médio do cliente piloto** (ex.: piloto Bling com 5k pesagens/mês → load-test em 50k pesagens equivalentes/24 h) |
| Critério p95   | **dentro do SLO do conector** (ver `SLO-INTEGRACAO.md` §3.2) durante toda a janela                                           |
| Critério DLQ   | **< 0,5 %** dos itens processados                                                                                            |
| Critério crash | **zero** crashes do backend NestJS, do worker e do app Electron                                                              |
| Watermarks     | nenhum watermark **crit** atingido em §6 do SLO                                                                              |
| Backup         | drill de backup/restore (`BACKUP-RESTORE-SQLITE.md`) executado durante a janela sem interromper o load-test                  |

Falha em qualquer critério **bloqueia o GA**. O time analisa, corrige e refaz o load-test integral (não parcial). Resultado documentado em `docs/runbooks/load-tests/<conector>-YYYY-MM.md` com gráficos do período.

> Esta é a baseline para promover `Fonte = estimado` → `Fonte = medido` na matriz acima.

---

## Capacity teste sintético no Sprint 5

Aguardar **pré-GA por conector** (load-test 24 h da seção anterior) deixa baseline empírica para muito tarde — Sprint 6 já é GA. Para descobrir limites antes de comprometer Bling/Sankhya, **Sprint 5 executa teste sintético** sem depender de ERP real.

### Spec do teste sintético — Sprint 5

| Item           | Valor                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Quando         | Semana 1 do Sprint 5 (antes de bater código de Bling/Sankhya em GA)                                                                     |
| Alvo           | **Mock Connector + REST adapter genérico** (sem ERP real ainda)                                                                         |
| Duração        | **24 h ininterruptas**                                                                                                                  |
| Volume         | **10× volume médio do cliente piloto** (ex.: piloto Bling com 5 k pesagens/mês → equivalente 50 k pesagens/24 h, ~35 ev/min sustentado) |
| Critério p95   | dentro do SLO global de `SLO-INTEGRACAO.md` §3                                                                                          |
| Critério DLQ   | < 0,5 %                                                                                                                                 |
| Critério crash | zero crashes do backend, worker, Electron                                                                                               |
| Watermarks     | nenhum **crit** atingido                                                                                                                |
| Backup         | drill mensal executado durante a janela (testa concorrência backup × worker)                                                            |

### Métricas baseline publicadas

Após o teste sintético, publicar em `docs/runbooks/load-tests/sintetico-sprint5-YYYY-MM.md`:

- p50, p95, p99 de `outbox_delivery_seconds` por hora.
- Pico de `outbox_pending_count` e `sqlite_wal_size_bytes`.
- `worker_busy_ratio` médio e p95.
- Throughput sustentável real **do hub local** (sem ERP) — confirma se 1 k ev/min do Mock é alcançável fora do laboratório.
- Memória do processo Electron ao longo das 24 h (detecta leak — relacionado ao chaos cenário 10).

### Gating de Bling/Sankhya GA

Conector real só vai a GA se:

1. Teste sintético do Sprint 5 **passou** (este documento).
2. Load-test 24 h por conector **passou** (seção "Load-test obrigatório pré-GA" acima).
3. Homologação H3 do `PLANO-HOMOLOGACAO-CONECTOR.md` **passou**.

Falha em (1) **bloqueia** (2) e (3) — não adianta testar conector se o hub local não aguenta a carga.

> Esta seção fecha a lacuna identificada na auditoria 5-especialistas R2 (SRE): "não esperar pré-GA por conector — descobrir limites do hub local antes."

---

## Próximos passos

- Validar números com benchmark real em sandbox de cada ERP
- Atualizar este doc após cada GA de conector
- Adicionar coluna "p95 latência por chamada" após primeiros clientes
- Conector que não estiver na tabela: **não anunciar capacity** — qualificar por Discovery

---

**Manutenção**: revisar trimestralmente ou após incidente de capacidade.
