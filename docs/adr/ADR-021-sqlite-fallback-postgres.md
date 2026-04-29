# ADR-021 — SQLite primário com plano de fallback (Postgres embarcado / WAL agressivo / split / LMDB)

- **Status:** Aceita
- **Data:** 2026-04-27
- **Autor:** Tech Lead
- **Cross-link:** `docs/integracao/SPIKE-SQLITE-OUTBOX.md`, ADR-019 (backup), `docs/integracao/004-outbox-inbox-retry.md`

---

## 1. Contexto

A arquitetura local-first do módulo Integração ERP usa SQLite em modo WAL como armazenamento primário do Outbox, do domínio e do log de auditoria, no mesmo arquivo. A premissa de que SQLite sustenta 1.000 tickets/h por 24h sob 3 produtores + 2 workers + 1 leitor foi formalizada como spike obrigatório no Sprint 0 (ver `SPIKE-SQLITE-OUTBOX.md`).

A auditoria 5-especialistas — rodada R2 (Engenharia) — exigiu que o **plano B esteja escrito**, não verbal, antes do início do Sprint 1. Motivos:

- O spike pode falhar parcialmente (SQLITE_BUSY moderado, freeze raro).
- Clientes Tier-1 podem trazer cargas reais ≥5.000 tickets/dia × N unidades, acima da banda testada.
- Sem plano B documentado, qualquer falha em produção vira decisão de arquitetura na pressa, com risco de retrabalho de 4-6 sprints.

Este ADR fixa **a árvore de decisão** que será aplicada conforme o resultado do spike e conforme a carga real medida.

## 2. Decisão

Aceitar SQLite WAL como primária e implementar conforme planejado. Em paralelo, manter este ADR como contrato escrito das opções de fallback, em ordem de preferência:

### Opção A (preferida em FAIL severo) — Postgres embarcado

- Implementação via [pglite](https://pglite.dev) (Postgres compilado para WebAssembly, ~3MB, embarcado em processo) ou [Embedded PostgreSQL](https://github.com/yandex-qatools/postgresql-embedded) (binário Postgres extraído por execução).
- Mantém local-first, transacional, multi-writer real.
- Custo: empacotamento maior (+30-80MB), revisão de Prisma (driver muda), mas Prisma já suporta nativamente.

### Opção B (paliativo leve) — WAL agressivo + BEGIN IMMEDIATE

- `PRAGMA wal_autocheckpoint=200` (em vez de 1000).
- `PRAGMA synchronous=NORMAL` mantido; checkpoint manual em janela idle (a cada 5min se ocioso).
- `BEGIN IMMEDIATE` em escritas críticas (outbox + ticket) para reduzir contenção otimista.
- Mantém SQLite, sem mudança arquitetural; resolve apenas BUSY moderado.

### Opção C (split de bancos) — `outbox.db` separado

- `outbox.db` em arquivo dedicado, com sua própria conexão WAL.
- `domain.db` mantém ticket, cliente, produto, pesagem.
- Reduz contenção entre escrita de tickets e workers de outbox.
- Custo: 2 conexões Prisma, 2 backups, 2 schemas, lógica de coordenação de transação cruzada (saga simples).

### Opção D (LMDB para outbox) — fila em filesystem

- LMDB como fila do outbox (key-value memory-mapped, multi-reader/single-writer).
- SQLite mantido para domínio.
- Custo: reescrita do worker outbox; integração de hash/audit muda; serialização extra.
- Considerar apenas se Opção C não bastar e Opção A for inviável (ex: restrição de tamanho do instalador).

## 3. Critérios de escolha (gatilhos objetivos)

Resultado do spike ou medição em primeiro cliente Tier-1:

| Sintoma                                                        | Ação                                           |
| -------------------------------------------------------------- | ---------------------------------------------- |
| `SQLITE_BUSY` < 1% e zero freeze > 1s                          | **PASS** — manter SQLite (decisão atual)       |
| `SQLITE_BUSY` 1% – 5%                                          | **Opção B** (paliativo, ~0,5 sprint)           |
| `SQLITE_BUSY` 5% – 15% ou freeze 1-5s isolado                  | **Opção C** (split, ~1 sprint)                 |
| `SQLITE_BUSY` > 15% ou freeze > 5s ou WAL crescendo sem limite | **Opção A** (Postgres embarcado, ~2-3 sprints) |
| Throughput ok mas worker outbox bloqueia tickets               | **Opção D** (LMDB outbox, ~2 sprints)          |

## 4. Custo de migração estimado

| Opção                               | Esforço     | Disrupção                                                  |
| ----------------------------------- | ----------- | ---------------------------------------------------------- |
| A (pglite/Postgres embarcado)       | 2-3 sprints | Alta — empacotamento, driver, migração de dados existentes |
| B (WAL agressivo + BEGIN IMMEDIATE) | 0,5 sprint  | Baixa — só configuração e flags                            |
| C (split outbox.db / domain.db)     | 1 sprint    | Média — duas conexões, reescrita de transações cruzadas    |
| D (LMDB para outbox)                | 2 sprints   | Média-alta — reescrita do worker, novo fluxo de hash/audit |

## 5. Trigger de execução

Disparar avaliação e início de migração se **um destes** ocorrer:

- Spike Sprint 0 retorna FAIL conforme critérios de §6 do `SPIKE-SQLITE-OUTBOX.md`.
- Primeiro cliente Tier-1 contratado com carga estimada > 2.000 tickets/dia OU > 1 unidade na mesma instância.
- Telemetria em produção ultrapassa qualquer linha da tabela §3 por mais de 7 dias consecutivos.

## 6. Implicações

- O Sprint 0 entrega o spike e, em caso de FAIL, este ADR é referenciado para decidir a opção; a opção escolhida vira ADR-021-A/B/C/D específico (delta).
- Todas as opções mantêm **a interface Prisma** estável; o Mapping Engine, Outbox API e Audit Trail não mudam contrato.
- Backup (ADR-019) deve cobrir o cenário escolhido — em Opções C/D existem múltiplos arquivos a sincronizar.
- Migrations (ver `PRISMA-MIGRATION-POLICY.md`) seguem políticas existentes; em Opção A (Postgres) o procedimento de migration muda do `prisma migrate` SQLite para Postgres mas continua via Prisma.

## 7. Riscos residuais

- **pglite ainda jovem** (ecosystem 2024-2025): validar maturidade no momento do gatilho; alternativa em Opção A é `postgres-portable` ou container Postgres embutido em serviço Windows.
- **Opção B pode não bastar**: se BUSY persiste após paliativo, escalar para C; medir 7 dias antes de declarar sucesso.
- **Opção C exige saga**: transação cruzada entre `outbox.db` e `domain.db` precisa de reconciliação; documentar em ADR-014 (consistência outbox-inbox).
