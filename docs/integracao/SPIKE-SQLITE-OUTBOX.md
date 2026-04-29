# SPIKE — SQLite WAL + Outbox sob Carga Real

> **Status:** Planejado para Sprint 0 (5 dias úteis)
> **Owner:** Tech Lead
> **Saída obrigatória:** relatório com gráficos + ADR-021 (caso haja mudança arquitetural)

---

## 1. Objetivo

Validar empiricamente que SQLite em modo WAL sustenta o cenário de concorrência real do módulo Integração ERP em uma estação de campo típica, sob carga sustentada por 24h contínuas.

A arquitetura atual (ADR-001/004) assume que SQLite é suficiente para outbox + ticket + log de auditoria no mesmo arquivo. Esta premissa **nunca foi medida** no contexto do módulo Integração — todos os números até agora vêm de benchmarks sintéticos do projeto-base, sem 3 produtores + 2 workers + 1 leitor competindo simultaneamente.

Sem este spike, qualquer compromisso de SLO de latência (`p95 < 5s end-to-end`, ADR §SLO) é especulativo.

## 2. Cenário a simular

| Ator       | Tipo de operação                                     | Frequência      | Tabela alvo                    |
| ---------- | ---------------------------------------------------- | --------------- | ------------------------------ |
| Balança 1  | INSERT ticket + INSERT outbox_event                  | 1 evento / 3,6s | `ticket`, `outbox_event`       |
| Balança 2  | INSERT ticket + INSERT outbox_event                  | 1 evento / 3,6s | `ticket`, `outbox_event`       |
| Balança 3  | INSERT ticket + INSERT outbox_event                  | 1 evento / 3,6s | `ticket`, `outbox_event`       |
| Worker A   | SELECT pending → UPDATE status + INSERT log_dispatch | poll 500ms      | `outbox_event`, `dispatch_log` |
| Worker B   | SELECT pending → UPDATE status + INSERT log_dispatch | poll 500ms      | `outbox_event`, `dispatch_log` |
| Telemetria | SELECT count/group por status, p95 latência          | 1x / 30s        | `outbox_event`, `dispatch_log` |

**Carga total:** 3.000 tickets criados, 3.000 dispatches em 3h × 8 ciclos = 24h ≈ 1.000 tickets/h sustentados.

## 3. Setup de hardware/SO

- Máquina similar à de campo: Windows 10 ou 11 Pro, SSD SATA ou NVMe consumer, 16GB RAM, CPU 4-8 cores tipo Intel i5/i7 geração 8+.
- Sem antivírus de terceiros ativo na pasta de teste (replicar guia de instalação).
- Banco isolado em pasta dedicada com volume mínimo de outras escritas concorrentes.
- Configurações Prisma/SQLite: `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`, `wal_autocheckpoint=1000`.

## 4. Script de carga

- Implementação em Node.js + better-sqlite3 (mesmo driver do produto).
- 6 processos separados (não threads) para refletir realidade Electron + worker process.
- Cada operação registra: timestamp, duração, sucesso/erro, código de erro se houver.
- Logs em CSV separado para não poluir o banco sob teste.

## 5. Métricas a coletar

1. **% `SQLITE_BUSY`** — percentual de operações que receberam `SQLITE_BUSY` antes de retry.
2. **p50 / p95 / p99 latência** por tipo de operação (INSERT ticket, UPDATE outbox, SELECT telemetria).
3. **Tamanho WAL ao longo do tempo** — amostragem a cada 5 min do `<db>-wal`.
4. **Freeze events** — qualquer operação que demore >1s, com timestamp e contexto.
5. **Checkpoint events** — duração e impacto em latência durante o checkpoint.
6. **Memória/CPU** dos processos worker e do processo "balança" simulado.

## 6. Critério de saída

### PASS — segue arquitetura atual

- `SQLITE_BUSY` total < 1% das operações.
- p95 INSERT ticket < 50ms.
- p95 UPDATE outbox < 50ms.
- Zero freeze events > 1s OU ≤ 3 eventos isolados explicáveis (ex: checkpoint).
- WAL nunca passa de 100MB em regime estacionário.

### FAIL — exige decisão arquitetural antes de Sprint 1

Disparado por qualquer um:

- `SQLITE_BUSY` > 1%.
- Freeze events > 3 ocorrências em 24h OU qualquer freeze > 5s.
- WAL crescendo sem limite (sinal de checkpoint não acompanhando).
- p95 acima do limite em qualquer operação.

**Opções de mitigação a serem avaliadas em ADR-021:**

1. **Postgres embarcado** (pglite ou Postgres-Lite portátil) — maior robustez de concorrência, custo: empacotamento.
2. **WAL com checkpoint mais agressivo** (`wal_autocheckpoint=200` + checkpoint manual em janelas idle) — barato, pode não resolver freeze.
3. **Split em `outbox.db` separado** do banco principal — isola contenção, custo: 2 conexões e backup duplicado.
4. **Filesystem queue (LMDB)** para outbox, mantendo SQLite só para dados de negócio — maior reescrita, melhor garantia de throughput.

## 7. Entregáveis

- `docs/integracao/spikes/spike-01-resultado.md` — relatório com:
  - Gráficos de latência ao longo de 24h.
  - Histograma de duração por tipo de operação.
  - Curva de tamanho do WAL.
  - Tabela de freeze events.
  - Conclusão PASS/FAIL e justificativa.
- Se FAIL: ADR-021 com decisão de mitigação escolhida + plano de retrabalho.
- Script de carga versionado em `tools/spikes/sqlite-load/`.

## 7.1. Cenários multi-usuário Windows

Além do cenário single-user padrão, o spike **deve rodar** em três configurações adicionais para validar comportamento sob multi-usuário Windows:

### a. Máquina com 2 usuários Windows ativos

- Operador A logado, Operador B logado em sessão paralela (Switch User), ambos com Solution Ticket aberto.
- Verificar isolamento do banco SQLite (cada usuário aponta para `%APPDATA%` próprio? ou compartilham? — documentar comportamento atual).
- Validar **DPAPI** — credenciais cifradas com `CurrentUser` por A devem ser ilegíveis por B (ADR-016).
- Esperado: cada sessão tem cofre isolado; nenhuma vaza para outra.

### b. Citrix XenApp / RDS simulado (se disponível)

- Cenário de cliente Tier-1 que entrega o desktop via RDS/Citrix com perfil roaming.
- Testar: 3 sessões simultâneas mesmo host, cada uma com seu hub Integração rodando.
- Verificar: contenção SQLite cresce? handles serialport conflitam (provável: sim — só 1 sessão pode ter porta COM)?
- Documentar limitações (likely: COM port é exclusiva por host, hub Integração não suporta multi-instância no mesmo host sem reescrita).

### c. Admin local + Operador (privilégios diferentes)

- Sessão Admin abre o app, configura conector com credencial X (DPAPI cifra com Admin).
- Sessão Operador abre o app na mesma máquina, mesmo banco.
- Operador **não deve** conseguir decifrar credencial X (DPAPI CurrentUser do Admin).
- Comportamento esperado e documentado: credenciais cifradas em escopo `LocalMachine` quando configurado para multi-usuário; ou avisar usuário que precisa reconfigurar por sessão.

Saída: tabela com comportamento DPAPI observado em cada cenário, alimenta `MULTI-USER-WINDOWS-SCENARIOS.md`.

## 7.2. Stack inédita — testes adicionais (Electron 24/7)

Esta é a primeira vez que a stack Electron + NestJS + Prisma + SQLite + better-sqlite3 + serialport roda **24/7 sob carga real** no produto. O spike deve cobrir, em paralelo às métricas de banco:

### a. Memory leak Node.js — worker 24/7

- Heap snapshot a cada 4h durante 7 dias contínuos no worker outbox.
- Verificar crescimento de RSS e heap; se RSS > 400MB ao final de 7 dias sem queda, alerta para `RUNTIME-RISKS-DESKTOP-HUB.md` §2.1.
- Identificar top retainers (closures, caches, Buffers).

### b. IPC Electron sob backpressure

- Cenário sintético: 10.000 mensagens/min entre main process e renderer (UI) durante 1h.
- Medir: `ipc_queue_depth`, latência de entrega, frame drops na UI.
- Falha aceitável: backpressure aplicado e UI degrada graciosamente; falha crítica: main trava ou crash.

### c. Long-running Prisma client

- Cliente Prisma único mantido aberto por 7 dias.
- Verificar a cada 24h: conexão SQLite responsiva (`SELECT 1` < 100ms), pool não esgotado, sem `P2024` (timeout).
- Incluir reconexão forçada (kill conexão por fora) e medir tempo de recovery automático.

### d. Handle serialport

- Abrir/fechar porta COM 1.000 vezes durante o spike (intercalado com carga normal).
- Verificar count de handles abertos no Windows (via `handle.exe`).
- Falha: contagem cresce monotonicamente.

## 7.3. Resultado dispara ADR-021

Os critérios numéricos do §6 (PASS / FAIL) alimentam a árvore de decisão de ADR-021:

| Resultado spike                                                | Decisão ADR-021                                             |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `SQLITE_BUSY` < 1% e zero freeze > 1s                          | **PASS** — manter SQLite                                    |
| `SQLITE_BUSY` 1% – 5%                                          | **Opção B** — WAL agressivo + BEGIN IMMEDIATE (~0,5 sprint) |
| `SQLITE_BUSY` 5% – 15% ou freeze 1-5s isolado                  | **Opção C** — split `outbox.db` / `domain.db` (~1 sprint)   |
| `SQLITE_BUSY` > 15% ou freeze > 5s ou WAL crescendo sem limite | **Opção A** — Postgres embarcado pglite (~2-3 sprints)      |
| Throughput ok mas worker outbox bloqueia tickets               | **Opção D** — LMDB para outbox (~2 sprints)                 |

O relatório do spike (`spike-01-resultado.md`) **deve** terminar com a linha "Recomendação ADR-021: PASS / Opção A / B / C / D" com justificativa numérica.

## 8. Riscos do próprio spike

- Máquina de teste muito mais potente que campo: usar VM com vCPU/RAM equivalente ao mínimo suportado.
- Antivírus do laboratório interferindo: rodar em VM limpa.
- 24h é mínimo; idealmente 72h se houver tempo.
