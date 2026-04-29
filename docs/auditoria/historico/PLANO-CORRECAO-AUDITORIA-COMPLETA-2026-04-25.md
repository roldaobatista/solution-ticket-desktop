# Plano de Correção Completo — Auditoria 5 Especialistas

**Data:** 2026-04-25  
**Base:** 42 achados · 8 🔴 · 12 🟠 · 17 🟡 · 5 🟢  
**Objetivo:** Fechar 100% dos achados com commits organizados e reversíveis.  
**Estimativa total:** 4–6 sprints (8–12 semanas) · ~120h de engenharia

---

## Princípios do Plano

1. **Fundação antes de feature:** Type safety e lint gates são pré-requisitos para confiar nos testes.
2. **Testes antes de refactor:** Reativar e2e antes de desacoplar TicketModule garante que o refactor não quebra comportamento.
3. **Segurança em paralelo:** Fixes de segurança (SEC-001, SEC-002, SEC-003) são pequenos e podem ser feitos em qualquer wave.
4. **CI como guardião:** Cada wave deve deixar o CI mais estrito, nunca mais permissivo.

---

## Wave 0 — Fundação (Semana 1) · ~12h

> **Meta:** `pnpm ci` passa 100% limpo. TypeScript é gate bloqueante. Testes são confiáveis.

| ID     | Área     | Severidade | Tarefa                                                                                             | Esforço | Commit sugerido                                                    |
| ------ | -------- | ---------- | -------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| FE-001 | Frontend | 🔴         | Remover `ignoreBuildErrors: true` do `next.config.js` e corrigir todos os erros de tipo existentes | 4h      | `fix(wave0): remove ignoreBuildErrors e corrige tipos do frontend` |
| QA-006 | QA       | 🟠         | Remover `'test/'` do `ignorePatterns` do ESLint backend e corrigir lint dos testes                 | 3h      | `lint(wave0): inclui pasta test/ no ESLint backend`                |
| QA-009 | QA       | 🟡         | Reduzir `--max-warnings` do frontend de 100 para 0 e resolver warnings                             | 3h      | `lint(wave0): zero warnings no frontend`                           |
| QA-007 | QA       | 🟡         | Configurar isolamento de DB no Playwright (`workers: 4`, `fullyParallel: true`)                    | 2h      | `test(wave0): paralelismo no Playwright com DB isolado por worker` |

### Critérios de Done Wave 0

- [ ] `pnpm typecheck:all` passa sem erros
- [ ] `pnpm lint:check` passa sem warnings em backend e frontend
- [ ] Playwright roda com `workers: 4` em CI
- [ ] Nenhum arquivo é excluído de `tsconfig.json` ou `jest-e2e.json` por bypass

---

## Wave 1 — Segurança Crítica + Mock API (Semana 1–2) · ~8h

> **Meta:** Zero vetores de ataque críticos. Mock API funciona para todos os endpoints.

| ID      | Área      | Severidade | Tarefa                                                                                                                                                          | Esforço | Commit sugerido                                                      |
| ------- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| SEC-001 | Segurança | 🔴         | Tornar `USE_MOCK` strict: `=== 'true'`. Remover fallback permissivo.                                                                                            | 30min   | `fix(wave1): strict USE_MOCK evita bypass acidental de auth`         |
| SEC-002 | Segurança | 🔴         | Extrair credenciais demo para variável de ambiente `NEXT_PUBLIC_DEMO_MODE`. Mostrar na UI só quando ativo.                                                      | 1h      | `fix(wave1): isola credenciais demo em variavel de ambiente`         |
| SEC-004 | Segurança | 🟠         | Auditar `electron-builder.yml` para garantir exclusão de `.env` do backend em `extraResources`                                                                  | 1h      | `fix(wave1): exclui .env de extraResources no electron-builder`      |
| FE-008  | Frontend  | 🟡         | Completar `mockApi` para 7 endpoints faltantes (`getEmpresas`, `getArmazens`, `getOrigens`, `getDestinos`, `getTiposVeiculo`, `getRecibos`, `getTiposDesconto`) | 3h      | `fix(wave1): completa mockApi para endpoints de cadastros e recibos` |
| SEC-007 | Segurança | 🟡         | Adicionar `Permissions-Policy` header no helmet do backend                                                                                                      | 30min   | `fix(wave1): adiciona Permissions-Policy header`                     |
| SEC-005 | Segurança | 🟡         | Documentar risco de `unidade_id` em `localStorage` e criar ADR para migração futura (deferido para Wave 5)                                                      | 1h      | `docs(wave1): ADR-003 unidade_id em localStorage risco e mitigacao`  |
| SEC-006 | Segurança | 🟡         | Adicionar `scope.setUser` e `scope.setTag('tenantId', ...)` no Sentry                                                                                           | 1h      | `fix(wave1): contexto de tenant e usuario no Sentry`                 |

### Critérios de Done Wave 1

- [ ] `USE_MOCK=true` ativa mock; qualquer outro valor usa API real
- [ ] Credenciais demo não aparecem na UI em build de produção
- [ ] `release/win-unpacked/resources/backend/.env` não existe após build
- [ ] `mockApi` cobre 100% dos endpoints usados pelo frontend

---

## Wave 2 — Testes E2E e Cobertura (Semana 2–3) · ~16h

> **Meta:** Todos os testes E2E ativos e passando. Cobertura backend ≥60%.

| ID     | Área | Severidade | Tarefa                                                                                                                                                                     | Esforço | Commit sugerido                                                               |
| ------ | ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| QA-002 | QA   | 🔴         | Reativar `cenarios-aceite.e2e-spec.ts`: refatorar em 4–6 arquivos menores por domínio (auth, pesagem, ticket, financeiro, cadastros)                                       | 6h      | `test(wave2): reativa cenarios-aceite refatorados em specs por dominio`       |
| QA-001 | QA   | 🔴         | Elevar `coverageThreshold` para `statements: 60, branches: 50, functions: 50, lines: 60`. Criar testes para controllers e services críticos (`auth`, `ticket`, `usuario`). | 8h      | `test(wave2): eleva coverage threshold para 60% e cobre controllers criticos` |
| T3     | QA   | 🟡         | Refatorar mocks de Prisma em testes: trocar `prisma.x.findUnique = jest.fn()` por `jest.spyOn` ou repository pattern                                                       | 2h      | `test(wave2): padroniza mocks de Prisma com spyOn`                            |

### Arquivos E2E sugeridos (substituindo cenarios-aceite monolito)

```
test/e2e/
├── auth.e2e-spec.ts          (login, logout, refresh, perfis)
├── pesagem.e2e-spec.ts       (1ª pesagem, 2ª pesagem, peso líquido)
├── ticket.e2e-spec.ts        (CRUD, impressão, status comercial)
├── financeiro.e2e-spec.ts    (fatura, romaneio, recibo)
├── cadastros.e2e-spec.ts     (empresa, veículo, produto, cliente)
└── licenca.e2e-spec.ts       (validação, trial, fingerprint)
```

### Critérios de Done Wave 2

- [ ] `pnpm test:e2e` passa com ≥20 testes ativos
- [ ] `pnpm test` passa com cobertura ≥60% statements
- [ ] Nenhum arquivo de teste é excluído de `tsconfig.json`

---

## Wave 3 — Performance DB + Backend (Semana 3–4) · ~14h

> **Meta:** Zero queries N+1 em hot paths. Índices otimizados. Romaneio batch funciona.

| ID     | Área    | Severidade | Tarefa                                                                                            | Esforço | Commit sugerido                                           |
| ------ | ------- | ---------- | ------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------- |
| DB-001 | DB      | 🔴         | Refatorar `RomaneioService.criar()` para 5 queries fixas (`findMany`, `createMany`, `updateMany`) | 3h      | `perf(wave3): elimina N+1 em criacao de romaneio`         |
| DB-002 | DB      | 🟠         | Adicionar índice composto `@@index([tenantId, clienteId, dataPesagem])` em `TicketPesagem`        | 1h      | `perf(wave3): indice dashboard pesagens-por-cliente`      |
| DB-003 | DB      | 🟠         | Adicionar `@@index([tenantId, statusComercial, dataPesagem])` em `TicketPesagem`                  | 1h      | `perf(wave3): indice listagem tickets por status`         |
| DB-004 | DB      | 🟡         | Tornar `Empresa.documento` required ou adicionar validação de negócio                             | 1h      | `schema(wave3): Empresa.documento obrigatorio`            |
| DB-005 | DB      | 🟡         | Tornar `Auditoria.tenantId` required e ajustar 4 call sites                                       | 2h      | `schema(wave3): Auditoria.tenantId obrigatorio`           |
| DB-006 | DB      | 🟡         | Rodar `prisma migrate diff` e gerar migration de catch-up se houver drift                         | 2h      | `schema(wave3): migration catch-up v1.2`                  |
| DB-007 | DB      | 🟢         | Auditar índices redundantes com `EXPLAIN QUERY PLAN` nas queries mais frequentes                  | 2h      | `perf(wave3): remove indices redundantes e ajusta SQLite` |
| BE-005 | Backend | 🟡         | Pré-compilar regexes em `BalancaConnectionService` e limitar processamento por intervalo          | 2h      | `perf(wave3): pre-compila regexes no balanca connection`  |

### Critérios de Done Wave 3

- [ ] `EXPLAIN QUERY PLAN` nas 10 queries mais frequentes mostra uso de índice (SCAN → SEARCH)
- [ ] `RomaneioService` cria romaneio com 1000 tickets em <500ms
- [ ] `prisma migrate status` reporta `Database schema is up to date`

---

## Wave 4 — Arquitetura Backend (Semana 4–6) · ~20h

> **Meta:** TicketModule desacoplado. Relatórios não bloqueiam event loop.

| ID     | Área    | Severidade | Tarefa                                                                                                                                                                                      | Esforço | Commit sugerido                                            |
| ------ | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------- |
| BE-001 | Backend | 🔴         | Desacoplar `TicketModule` via Event-Driven: `TicketCriadoEvent`, `TicketFechadoEvent`, `StatusComercialAlteradoEvent`. `ImpressaoModule`, `RomaneioModule`, `FaturaModule` escutam eventos. | 8h      | `refactor(wave4): desacopla TicketModule via EventEmitter` |
| BE-002 | Backend | 🟠         | Mover geração de PDF de `RelatoriosModule` para `worker_threads` (pool de 2 workers)                                                                                                        | 5h      | `perf(wave4): geração de PDF em worker threads`            |
| BE-003 | Backend | 🟠         | Extrair `GenericCrudService` e `GenericCrudController` parametrizados para `CadastrosModule` (reduzir ~70% do boilerplate)                                                                  | 4h      | `refactor(wave4): generic CRUD para cadastros`             |
| BE-006 | Backend | 🟡         | Pré-compilar regex no constructor de `GenericParser`                                                                                                                                        | 1h      | `perf(wave4): pre-compila regex em GenericParser`          |
| BE-007 | Backend | 🟢         | Documentar decisão de lazy loading (deferido para pós-v1)                                                                                                                                   | 1h      | `docs(wave4): ADR-004 lazy loading de modulos NestJS`      |
| T1     | QA      | 🔴         | Atingir cobertura ≥60% nos novos módulos refatorados (Eventos, GenericCrud)                                                                                                                 | 1h      | `test(wave4): cobre GenericCrud e eventos do ticket`       |

### Diagrama de eventos sugerido

```
TicketService.emit('ticket.fechado')
    ├── ImpressaoModule → imprime ticket
    ├── RomaneioModule → atualiza romaneios pendentes
    ├── FaturaModule → atualiza faturas pendentes
    └── AuditoriaModule → registra mudança de status
```

### Critérios de Done Wave 4

- [ ] `TicketModule` não importa `ImpressaoModule`, `RomaneioModule`, `FaturaModule`
- [ ] Relatório com 5000 tickets gera em <3s sem bloquear API
- [ ] `CadastrosModule` reduzido para <30% das linhas originais

---

## Wave 5 — Frontend Profissional (Semana 6–8) · ~18h

> **Meta:** Frontend com testes, acessibilidade e componentes robustos.

| ID     | Área     | Severidade | Tarefa                                                                                                                      | Esforço | Commit sugerido                                         |
| ------ | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| FE-002 | Frontend | 🟠         | Bootstrap Jest + React Testing Library no frontend. Testar `useAuth`, `useTicket`, componentes `Input`, `Button`, `Dialog`. | 6h      | `test(wave5): setup Jest + RTL no frontend`             |
| FE-003 | Frontend | 🟠         | Refatorar `useAuth`: remover polling manual, usar React Query com `staleTime: 5 * 60 * 1000`                                | 2h      | `refactor(wave5): useAuth com React Query e staleTime`  |
| FE-004 | Frontend | 🟠         | Trocar `Tabs` custom por `@radix-ui/react-tabs` (já em package.json)                                                        | 2h      | `a11y(wave5): Tabs com Radix UI`                        |
| FE-005 | Frontend | 🟡         | Extrair tabs de `financeiro/page.tsx` para componentes isolados                                                             | 2h      | `refactor(wave5): extrai tabs do financeiro`            |
| FE-006 | Frontend | 🟡         | Associar label aos selects (copiar padrão do `Input`)                                                                       | 1h      | `a11y(wave5): labels associados aos Selects`            |
| FE-007 | Frontend | 🟡         | Criar hook `useMutationWithToast` e aplicar em todos os forms de POST/PUT/PATCH                                             | 3h      | `feat(wave5): useMutationWithToast com feedback visual` |
| FE-009 | Frontend | 🟢         | Migrar `<img>` para `next/image` onde aplicável                                                                             | 1h      | `perf(wave5): otimiza imagens com next/image`           |
| FE-010 | Frontend | 🟢         | Reduzir `'use client'` desnecessários: mover lógica para componentes filhos                                                 | 1h      | `refactor(wave5): reduz use client desnecessarios`      |

### Critérios de Done Wave 5

- [ ] ≥20 testes unitários no frontend passando
- [ ] `Tabs` navegáveis por teclado (Tab + Enter)
- [ ] Todos os forms de mutação mostram toast de sucesso/erro
- [ ] Lighthouse a11y score ≥90

---

## Wave 6 — CI/CD e Observabilidade (Semana 8–9) · ~12h

> **Meta:** CI paralelo, gates bloqueantes, métricas visíveis.

| ID     | Área | Severidade | Tarefa                                                                                     | Esforço | Commit sugerido                                       |
| ------ | ---- | ---------- | ------------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------- |
| QA-004 | QA   | 🟠         | Remover `continue-on-error: true` dos steps de `pnpm audit`, `test:e2e` e Playwright       | 1h      | `ci(wave6): gates bloqueantes em audit e e2e`         |
| QA-005 | QA   | 🟠         | Dividir CI em jobs paralelos: `lint`, `typecheck`, `test-unit`, `test-e2e`, `build`        | 3h      | `ci(wave6): pipeline paralela com jobs independentes` |
| QA-008 | QA   | 🟡         | Upload de artifacts: `backend/coverage/`, `frontend/playwright-report/`, `test-results/`   | 2h      | `ci(wave6): upload de artifacts de teste`             |
| QA-010 | QA   | 🟢         | Adicionar `knip` ao monorepo e executar em CI                                              | 2h      | `ci(wave6): detecta dead code com knip`               |
| O1     | QA   | 🟡         | Adicionar `@nestjs/terminus` com health checks de DB e memória                             | 2h      | `feat(wave6): health checks com Terminus`             |
| O3     | QA   | 🟢         | Configurar rotação de logs com `pino-roll` (30 dias retenção)                              | 2h      | `feat(wave6): rotacao de logs com retencao 30 dias`   |
| DOC1   | QA   | 🟢         | Criar pasta `docs/adr/` com ADRs formais (SQLite vs Postgres, RSA licensing, Event-Driven) | 1h      | `docs(wave6): ADRs formais em docs/adr/`              |
| DOC2   | QA   | 🟢         | Gerar `swagger.json` no build e anexar ao release                                          | 1h      | `ci(wave6): gera swagger.json no build`               |

### CI paralelo sugerido

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [checkout, pnpm, lint, format]
  typecheck:
    runs-on: ubuntu-latest
    steps: [checkout, pnpm, typecheck:all]
  test-unit:
    runs-on: ubuntu-latest
    steps: [checkout, pnpm, db:generate, test]
  test-e2e:
    runs-on: ubuntu-latest
    steps: [checkout, pnpm, db:migrate, test:e2e]
  build:
    needs: [lint, typecheck, test-unit]
    runs-on: windows-latest
    steps: [checkout, pnpm, build:all, dist:win]
```

### Critérios de Done Wave 6

- [ ] CI completo roda em <8 minutos (paralelismo)
- [ ] Falha em qualquer step bloqueia merge
- [ ] Artifacts de coverage e playwright disponíveis por 7 dias
- [ ] `/health` e `/ready` retornam status de DB e memória

---

## Wave 7 — Polish e Segurança SSE (Semana 9–10) · ~10h

> **Meta:** SSE seguro. Build otimizado. Documentação completa.

| ID      | Área      | Severidade | Tarefa                                                                                  | Esforço | Commit sugerido                                                    |
| ------- | --------- | ---------- | --------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| SEC-003 | Segurança | 🟠         | Implementar cookie-based SSE ou assinatura de URL temporária para `/balanca/:id/stream` | 4h      | `fix(wave7): SSE com cookie-based auth`                            |
| BE-004  | Backend   | 🟠         | Otimizar `BalancaConnectionService` — sleep cancelável, buffer trim logado              | 2h      | `perf(wave7): sleep cancelavel e log de buffer trim`               |
| B1      | QA        | 🟠         | Otimizar build do Electron: gerar backend standalone (webpack) e frontend static export | 4h      | `build(wave7): backend standalone e frontend static para Electron` |
| RC5     | QA        | 🟢         | Criar interface `SerialPortLike` para reduzir `any` nos adapters                        | 2h      | `types(wave7): interface SerialPortLike elimina anys`              |
| D2      | QA        | 🟢         | Documentar `pnpm overrides` (multer, lodash) em comentário no package.json              | 30min   | `docs(wave7): documenta pnpm overrides`                            |
| D3      | QA        | 🟢         | Adicionar `gitleaks` ou `truffleHog` ao CI para detectar secrets                        | 1h      | `ci(wave7): scan de secrets no historico git`                      |

### Critérios de Done Wave 7

- [ ] Token JWT não aparece em URL do SSE
- [ ] Instalador do Electron <80 MB (vs ~172 MB atual)
- [ ] `gitleaks` passa sem findings no PR

---

## Wave 8 — IDOR e Multi-Tenancy (Semana 10–12) · ~10h

> **Meta:** Zero IDOR. Queries sempre filtram por tenant.

| ID      | Área      | Severidade | Tarefa                                                                                                                                                  | Esforço | Commit sugerido                                              |
| ------- | --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------ |
| SEC-008 | Segurança | 🟡         | Adicionar `tenantId` do JWT em **todas** as queries de leitura/escrita. Criar `TenantGuard` ou middleware Prisma que injeta `tenantId` automaticamente. | 6h      | `fix(wave8): TenantGuard garante filtro em todas as queries` |
| FE-010  | Frontend  | 🟢         | Finalizar migração de `'use client'`: mover últimos 3 componentes para RSC                                                                              | 2h      | `refactor(wave8): ultimos componentes como RSC`              |
| RQ3     | QA        | 🟡         | Limpar 88 warnings de lint (64 `no-explicit-any` + 24 `no-unused-vars`) e zerar threshold                                                               | 2h      | `lint(wave8): elimina 88 warnings restantes`                 |
| O2      | QA        | 🟡         | Implementar `traceparent` header no frontend e propagar no backend                                                                                      | 2h      | `feat(wave8): distributed tracing com traceparent`           |

### Critérios de Done Wave 8

- [ ] Nenhum endpoint retorna dados de tenant diferente do JWT
- [ ] `prisma.$queryRaw` (se houver) sempre inclui `AND tenantId = ?`
- [ ] Frontend sem warnings de lint

---

## Resumo de Commits Esperados

```
Wave 0 (7 commits)
├── fix(wave0): remove ignoreBuildErrors e corrige tipos do frontend
├── lint(wave0): inclui pasta test/ no ESLint backend
├── lint(wave0): zero warnings no frontend
└── test(wave0): paralelismo no Playwright com DB isolado

Wave 1 (7 commits)
├── fix(wave1): strict USE_MOCK evita bypass acidental de auth
├── fix(wave1): isola credenciais demo em variavel de ambiente
├── fix(wave1): exclui .env de extraResources no electron-builder
├── fix(wave1): completa mockApi para endpoints de cadastros e recibos
├── fix(wave1): adiciona Permissions-Policy header
├── docs(wave1): ADR-003 unidade_id em localStorage risco e mitigacao
└── fix(wave1): contexto de tenant e usuario no Sentry

Wave 2 (3 commits)
├── test(wave2): reativa cenarios-aceite refatorados em specs por dominio
├── test(wave2): eleva coverage threshold para 60% e cobre controllers criticos
└── test(wave2): padroniza mocks de Prisma com spyOn

Wave 3 (8 commits)
├── perf(wave3): elimina N+1 em criacao de romaneio
├── perf(wave3): indice dashboard pesagens-por-cliente
├── perf(wave3): indice listagem tickets por status
├── schema(wave3): Empresa.documento obrigatorio
├── schema(wave3): Auditoria.tenantId obrigatorio
├── schema(wave3): migration catch-up v1.2
├── perf(wave3): remove indices redundantes e ajusta SQLite
└── perf(wave3): pre-compila regexes no balanca connection

Wave 4 (6 commits)
├── refactor(wave4): desacopla TicketModule via EventEmitter
├── perf(wave4): geracao de PDF em worker threads
├── refactor(wave4): generic CRUD para cadastros
├── perf(wave4): pre-compila regex em GenericParser
├── docs(wave4): ADR-004 lazy loading de modulos NestJS
└── test(wave4): cobre GenericCrud e eventos do ticket

Wave 5 (8 commits)
├── test(wave5): setup Jest + RTL no frontend
├── refactor(wave5): useAuth com React Query e staleTime
├── a11y(wave5): Tabs com Radix UI
├── refactor(wave5): extrai tabs do financeiro
├── a11y(wave5): labels associados aos Selects
├── feat(wave5): useMutationWithToast com feedback visual
├── perf(wave5): otimiza imagens com next/image
└── refactor(wave5): reduz use client desnecessarios

Wave 6 (8 commits)
├── ci(wave6): gates bloqueantes em audit e e2e
├── ci(wave6): pipeline paralela com jobs independentes
├── ci(wave6): upload de artifacts de teste
├── ci(wave6): detecta dead code com knip
├── feat(wave6): health checks com Terminus
├── feat(wave6): rotacao de logs com retencao 30 dias
├── docs(wave6): ADRs formais em docs/adr/
└── ci(wave6): gera swagger.json no build

Wave 7 (6 commits)
├── fix(wave7): SSE com cookie-based auth
├── perf(wave7): sleep cancelavel e log de buffer trim
├── build(wave7): backend standalone e frontend static para Electron
├── types(wave7): interface SerialPortLike elimina anys
├── docs(wave7): documenta pnpm overrides
└── ci(wave7): scan de secrets no historico git

Wave 8 (4 commits)
├── fix(wave8): TenantGuard garante filtro em todas as queries
├── refactor(wave8): ultimos componentes como RSC
├── lint(wave8): elimina 88 warnings restantes
└── feat(wave8): distributed tracing com traceparent
```

---

## Orquestração e Riscos

### Riscos

| Risco                                                         | Mitigação                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Wave 4 (refactor TicketModule) quebra e2e existentes          | Só iniciar após Wave 2 (e2e reativados e estáveis)                  |
| Schema changes (Wave 3) quebram seeds                         | Rodar `db:seed` em CI gate (Wave 0) antes de qualquer schema change |
| `ignoreBuildErrors` remoção (Wave 0) bloqueia desenvolvimento | Fazer em branch separada, corrigir todos os tipos antes de merge    |
| Electron build otimizado (Wave 7) pode quebrar runtime        | Testar `dist:win` e instalar em VM limpa antes de merge             |
| TenantGuard (Wave 8) pode causar regression em relatórios     | Adicionar testes de integração para queries agregadas antes         |

### Dependências entre Waves

```
Wave 0 ──→ Wave 1 ──→ Wave 2 ──→ Wave 4
 (lint)    (seg)      (testes)   (refactor)
   │         │          │
   ▼         ▼          ▼
Wave 3 ←── Wave 5 ←── Wave 6 ←── Wave 7 ←── Wave 8
  (DB)     (FE)       (CI)       (build)    (IDOR)
```

### Métricas de Sucesso (KPIs)

| Métrica                   | Atual   | Alvo Wave 8 |
| ------------------------- | ------- | ----------- |
| Cobertura de testes       | 22%     | ≥60%        |
| Testes E2E ativos         | 5       | ≥30         |
| Testes unitários frontend | 0       | ≥30         |
| Tempo de CI               | ~25 min | <8 min      |
| Tamanho do instalador     | ~172 MB | <80 MB      |
| Warnings de lint          | 88      | 0           |
| Achados de segurança 🔴   | 2       | 0           |
| Health Score              | 38      | ≥80         |

---

## Checklist Final de Aceitação

- [ ] `pnpm ci` passa 100% limpo em local e no CI
- [ ] `pnpm dist:win` gera instalador <80 MB que instala e roda em VM limpa
- [ ] Todos os 42 achados estão resolvidos ou documentados como "risco aceito" com ADR
- [ ] `swagger.json` é gerado e anexado ao release
- [ ] Cobertura de testes ≥60% (backend) e ≥30 testes no frontend
- [ ] Nenhum `continue-on-error: true` no CI (exceto se documentado em ADR)
- [ ] `gitleaks` passa sem findings
- [ ] Health Score ≥80

---

_Plano gerado a partir da Auditoria de 5 Especialistas — 2026-04-25_
