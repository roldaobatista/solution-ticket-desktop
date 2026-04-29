# Plano de Remediação — Auditoria 5 Agentes (2026-04-25)

Origem: `docs/AUDITORIA-5-ESPECIALISTAS.md`. Total: **56 achados** (3 segurança críticos/altos, 15 arquiteturais, 6 lacunas de testes, 10 performance, 20 UX/funcional).

Objetivo: zerar achados em **6 sprints (12 semanas)**, com gates verdes a cada onda.

---

## Sprint 0 — Hotfixes (3 dias) — BLOQUEIA RELEASE

| #    | Achado                                     | Arquivo                                | Ação                                                                                                  | Owner   | DoD                                             |
| ---- | ------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------- |
| S0.1 | Path traversal em `restore(filename)`      | `backend/src/backup/backup.service.ts` | Trocar `filename` string por UUID indexado; validar contra lista canônica antes de `copyFileSync`     | Backend | Teste e2e tenta `../../etc/passwd` e recebe 400 |
| S0.2 | Swagger exposto em prod                    | `backend/src/main.ts`                  | `if (process.env.NODE_ENV !== 'production') SwaggerModule.setup(...)`                                 | Backend | `GET /api/docs` retorna 404 em build de prod    |
| S0.3 | Reset token fraco (6 dígitos)              | `backend/src/auth/auth.service.ts`     | `crypto.randomBytes(32).toString('hex')` + rate limit `@Throttle('reset', { limit: 1, ttl: 60_000 })` | Backend | Unit test verifica entropia ≥ 256 bits          |
| S0.4 | Rate limit login global em vez de granular | `backend/src/auth/auth.controller.ts`  | `@Throttle({ auth: { limit: 5, ttl: 60_000 } })` no endpoint login                                    | Backend | Test e2e: 6ª tentativa retorna 429              |

**Gate:** `pnpm lint && pnpm typecheck && pnpm test` verdes; commit atômico por item.

---

## Sprint 1 — Performance Crítica (1 semana)

| #    | Achado                          | Arquivo                                                  | Ação                                                                                                                              |
| ---- | ------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| P1.1 | I/O síncrono no event loop      | `backend/src/ticket/documentos.service.ts:40,58`         | Migrar `unlinkSync/writeFileSync` → `fs.promises.*`; remover `existsSync` síncrono (l.56,70) usando `fs.stat` async com cache LRU |
| P1.2 | N+1 em relatórios               | `backend/src/relatorios/relatorios.service.ts:95-110`    | Trocar `include` por `select` explícito; SQL raw com JOINs para agregações; benchmark antes/depois com 1000 tickets               |
| P1.3 | `findMany` sem `select`         | `backend/src/ticket/ticket.service.ts:732`               | `.select({ id, peso, status })` apenas campos usados                                                                              |
| P1.4 | `setInterval` sem cleanup       | `frontend/src/app/(authenticated)/pesagem/page.tsx:~150` | `useEffect` retorna `clearInterval`; testar unmount em React DevTools                                                             |
| P1.5 | Modbus polling sem backpressure | `backend/src/balanca/adapters/modbus.adapter.ts:60-75`   | `maxInflightRequests=1`, queue + timeout enforcement (2s)                                                                         |

**Gate:** benchmark relatório 1000 tickets < 5s (era ~100s); profiling sem operações sync no main thread.

---

## Sprint 2 — Licenciamento & Segurança Profunda (1 semana)

| #    | Achado                           | Ação                                                                                                                                                                                |
| ---- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S2.1 | `public.key` no repositório      | Mover para build-time secret (env var `LICENSE_PUBLIC_KEY_B64`); CI injeta via GitHub Secrets; remover do git history com `git filter-repo` (coordenar rotação de chave com keygen) |
| S2.2 | JWT secret sem validação no boot | `@nestjs/config` com Joi schema; falha startup se `JWT_SECRET.length < 32`                                                                                                          |
| S2.3 | Bcrypt rounds em testes (4)      | Constante `MIN_BCRYPT_ROUNDS=10`; testes usam mock factory, não bcrypt real                                                                                                         |
| S2.4 | Sentry sem sanitização           | `beforeSend` hook removendo `password`, `token`, `cpf`, `cnpj`                                                                                                                      |
| S2.5 | Auditoria `pnpm audit` no CI     | Remover `continue-on-error` do step; bloqueia em HIGH/CRITICAL                                                                                                                      |

**Gate:** chave RSA rotacionada; `pnpm audit --prod` zero HIGH; teste e2e verifica startup falha sem JWT_SECRET válido.

---

## Sprint 3 — Refactors Arquiteturais Críticos (2 semanas)

| #    | Achado                                         | Ação                                                                                                                                        |
| ---- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| A3.1 | God class `relatorios.service.ts` (699 linhas) | Split em `RelatorioPdfGenerator` (pdfkit), `RelatorioQueryBuilder` (Prisma), `RelatorioDtoTransformer`; eliminar 14× `any` com tipos Prisma |
| A3.2 | Sem transações em criação de ticket            | `prisma.$transaction([...])` envolvendo create + increment de número; teste de concorrência (50 requisições paralelas geram números únicos) |
| A3.3 | IPC frágil com `require()` dinâmico            | Criar `frontend/src/lib/ipc.ts` com `ipc.getUnidadeId()`, `ipc.resolveConfig()`; eliminar import circular via store                         |
| A3.4 | Página `pesagem/page.tsx` (650 linhas)         | Extrair `usePesagem()` hook, `<PesagemForm>`, `<BalancaStatus>` — página fica < 250 linhas                                                  |
| A3.5 | Página `financeiro/page.tsx` (895 linhas)      | Extrair `useFinanceiroFilters()`, `<FinanceiroTable>`, `financeiro.api.ts` — página < 300 linhas                                            |
| A3.6 | `ticket.service.ts` com 17 métodos públicos    | Split em `TicketCreationService`, `TicketStateService`, `TicketQueryService`                                                                |

**Gate:** sem arquivo > 400 linhas em `services/` e `pages/`; `any` count baseline reduzido em 80%.

---

## Sprint 4 — Tipos Compartilhados & Hygiene Arquitetural (1 semana)

| #    | Achado                                    | Ação                                                                                                                  |
| ---- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| A4.1 | Tipos duplicados frontend/backend         | Criar workspace `packages/shared-types/` no monorepo pnpm; backend exporta DTOs derivados de Prisma; frontend importa |
| A4.2 | `mock-api.ts` (2169 linhas)               | Substituir por factories `createMockCliente()`, deletar seed manual                                                   |
| A4.3 | Sem DTO ↔ Entity separation               | `@nestjs/mapped-types` com `*ResponseDto` por recurso                                                                 |
| A4.4 | Validação espalhada                       | `backend/src/common/validators.ts` com `Schemas.Ticket`, `Schemas.Cliente` (Zod)                                      |
| A4.5 | Healthcheck Electron→Backend ausente      | `electron/main.ts` aguarda `GET /api/health` com retry exponencial antes de mostrar UI                                |
| A4.6 | Sem RequestContext (logs não rastreáveis) | Middleware NestJS Cls com `request_id`, `user_id`, `tenant_id` propagados                                             |

**Gate:** ESLint regra `no-restricted-imports` impedindo frontend importar de backend; logs incluem `request_id` em 100% dos requests.

---

## Sprint 5 — Testes & Quality Gates (2 semanas)

| #    | Achado                        | Ação                                                                                                                                        |
| ---- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| T5.1 | 0% unit em `licenca/`         | 15+ unit tests: assinatura válida, expirada, revogada, fingerprint mismatch, replay attack — usar fixtures `test/fixtures/rsa-test-keys.ts` |
| T5.2 | 0% unit em `balanca/parsers/` | Unit test por parser (SICS, Toledo, Alfa, Weightech, Digitron, Muller, Modbus genérico) com fixtures de tramas reais                        |
| T5.3 | Frontend 1 só teste           | 20+ specs Playwright: login, criar ticket completo, fechar ticket, cancelar, reimprimir, listar histórico, filtros, exportar relatório      |
| T5.4 | Asserções fracas em e2e       | Refatorar `cenarios-aceite.e2e-spec.ts`: trocar `toBeDefined` por igualdades; remover do `tsconfig.exclude`                                 |
| T5.5 | CI sem hard fail              | Remover `continue-on-error` de Playwright; `coverageThreshold: { lines: 70, functions: 70, branches: 60 }` em `jest.config.ts`              |
| T5.6 | ESLint permissivo             | `@typescript-eslint/no-explicit-any: 'error'`, `explicit-function-return-type: 'error'` em `src/**`                                         |

**Gate:** coverage backend ≥ 70%; CI bloqueia merge se Playwright falhar; `any` count ≤ 5 em todo o projeto.

---

## Sprint 6 — UX & Paridade PesoLog (Q2 certificação) (3 semanas)

### 6A — Bloqueadores funcionais (Q2)

| #     | Achado                             | Ação                                                                                                                        |
| ----- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| F6.1  | 8/14 templates FastReport faltando | Portar TICKET002 (Dif.Nota/Inteiro/SemDesconto), TICKET004 (Gertec/Resumido/SemAssinatura), TICKET005A/B/C                  |
| F6.2  | 12 adapters não validados em campo | Plano de validação por hardware; checklist em `docs/HARDWARE-COMPATIBILITY.md`; testes de integração com simuladores serial |
| F6.3  | Recibos ausentes                   | Model Prisma `Recibo`, service, tela, template impressão                                                                    |
| F6.4  | Sem tela de calibração             | `<UCalibracao>` com fluxo zero/span/curva; persistir histórico                                                              |
| F6.5  | Documentos fiscais sem UI          | Tela upload/lista por ticket usando `DocumentoPesagem` existente                                                            |
| F6.6  | Tipos de desconto livres           | Tabela `TipoDesconto` seed (UMIDADE, PESO_DIFERENCA, COMERCIAL); FK em `DescontoPesagem`                                    |
| F6.7  | Tela de erros/reimpressão          | `<UErrosTicket>` com fila de recuperação                                                                                    |
| F6.8  | Bilhetagem (1ª passagem)           | Implementar impressão intermediária quando flag `bilhetagem=true`                                                           |
| F6.9  | Captura de imagem                  | Service com `navigator.mediaDevices`; storage em `documentos/`; UI no fluxo de passagem                                     |
| F6.10 | Relatórios de movimentação         | 4 endpoints + telas: Movimentação 001/002, Alteradas, Excluídas                                                             |

### 6B — UX operacional

| #     | Ação                                                                     |
| ----- | ------------------------------------------------------------------------ |
| U6.1  | i18n com `next-intl`; extrair strings hardcoded para `pt-BR.json`        |
| U6.2  | `Dialog` com `returnFocus()` no elemento que abriu                       |
| U6.3  | Tooltips com atalhos F1/F2/Escape; legenda visível na tela de pesagem    |
| U6.4  | Toast crítico persiste até dismiss manual (variante `destructive`)       |
| U6.5  | Validação Zod client-side em `peso_nf`, `nota_fiscal`                    |
| U6.6  | Ícone Wifi/WifiOff no status da balança                                  |
| U6.7  | Spinner em `handleCapturarDaBalanca`                                     |
| U6.8  | Mapeamento de erros backend EN→PT em `lib/errors.ts`                     |
| U6.9  | Confirmação de cancelamento lista consequências (fatura, dados perdidos) |
| U6.10 | Placeholders descritivos em todos `<Input>`                              |

**Gate:** paridade PesoLog ≥ 95% em `docs/AUDITORIA-PESOLOG-vs-SOLUTION-TICKET.md`; teste de aceitação com operador real.

---

## Resumo — Cronograma

| Sprint    | Duração     | Foco                    | Achados |
| --------- | ----------- | ----------------------- | ------- |
| S0        | 3 dias      | Hotfixes segurança      | 4       |
| S1        | 1 sem       | Performance crítica     | 5       |
| S2        | 1 sem       | Segurança profunda      | 5       |
| S3        | 2 sem       | Refactors arquiteturais | 6       |
| S4        | 1 sem       | Tipos compartilhados    | 6       |
| S5        | 2 sem       | Testes & gates CI       | 6       |
| S6        | 3 sem       | UX & paridade PesoLog   | 20      |
| **Total** | **~12 sem** |                         | **52**  |

> 4 achados positivos da auditoria não exigem ação (Electron security, CSP, Prisma parametrizado, bcrypt prod).

---

## Princípios de execução

1. **Commits atômicos** por achado (`fix(audit-S0.1): ...`).
2. **Gates verdes** antes de cada push: `pnpm lint && pnpm typecheck && pnpm test`.
3. **Push direto em main** após cada onda de sprint validada.
4. **Reauditoria** do agente correspondente ao fim de cada sprint para confirmar zeragem.
5. **Atualizar** `CHANGELOG.md` e este plano (riscar `[x]` no item) a cada commit.
