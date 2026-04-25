# Plano de Remediação — 56 achados

Origem: 5 auditorias paralelas em 2026-04-25 (`00-INDICE.md`).
Distribuição: **11 Críticas · 20 Altas · 20 Médias · 5 Baixas**.

Convenções de ID: `B` backend · `F` frontend · `H` hardware · `S` segurança · `Q` qualidade.
Estimativas em horas-dev (1 dev sênior). Branch única `main`, commits atômicos por tarefa, gates verdes obrigatórios.

---

## Sprint 0 — Triagem & quick wins (2 dias · ~14h)

Antes de tocar código, fechar o ciclo curto. Sem dependências.

| ID   | Sev   | Tarefa                                                                                                                | Esf | Gate                           |
| ---- | ----- | --------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------ |
| S1.a | Crít  | Confirmar `keygen/private.key` em `.gitignore` + `git log --all -- keygen/private.key` (rotacionar par RSA se vazada) | 1h  | grep + git history limpo       |
| S1.b | Crít  | Documentar runbook de rotação RSA em `docs/runbooks/rsa-rotation.md`                                                  | 2h  | doc revisada                   |
| Q3   | Alta  | Remover `continue-on-error` dos jobs `test:unit` e `test:e2e` em `.github/workflows/ci.yml`                           | 1h  | CI vermelho expõe falhas reais |
| Q5.a | Alta  | Endurecer pre-push: rodar `pnpm typecheck:all && pnpm test` (já existe — validar e impedir bypass via doc)            | 1h  | husky hook ativo               |
| B10  | Baixa | Criar `backend/prisma/migrations/CHANGELOG.md` e gerar entradas retroativas                                           | 2h  | doc presente                   |
| Q6.a | Baixa | Adicionar `CHANGELOG.md` raiz com versão atual                                                                        | 1h  | arquivo presente               |
| H4.a | Baixa | Smoke script `scripts/smoke-balanca.ts` para 13 parsers (frames de exemplo)                                           | 4h  | script roda local              |
| Q7.a | Baixa | Marcar scripts `scripts/*.ts` como idempotentes ou prefixar `oneshot-`                                                | 2h  | rename + README                |

**Saída:** repo seguro para auditoria de git history; CI passa a falhar de verdade; baixa severidade liquidada.

---

## Sprint 1 — Bloqueadores de produção (5–7 dias · ~50h)

Travam release. Ordem importa: ativar `strict` antes de mexer em DTOs evita re-trabalho.

### Backend

| ID  | Sev  | Tarefa                                                                                                                                                       | Esf | Dep |
| --- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --- |
| Q1  | Crít | Ativar `"strict": true` em `backend/tsconfig.json` + corrigir compilação                                                                                     | 8h  | —   |
| B2  | Crít | Auditoria de DTOs: `@IsUUID`, `@Min`, `@IsEnum`, `@IsDateString`, `@Type` em todos `*.dto.ts`; ativar `forbidNonWhitelisted` no `ValidationPipe` global      | 8h  | Q1  |
| B1  | Crít | Paginação `skip/take` + `take` máximo (default 50, cap 500) em `findAll()` de Fatura, Relatórios, Auditoria, Ticket, Romaneio. Helper `PaginationDto` único. | 8h  | Q1  |
| B4  | Alta | Wrap `prisma.$transaction([...])` em fluxos multi-tabela (criar ticket+movimentação, fechar fatura, registrar pagamento)                                     | 4h  | B2  |

### Hardware

| ID  | Sev  | Tarefa                                                                                                                                        | Esf | Dep |
| --- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- |
| H1  | Crít | Validação CRC-16 (Modbus RTU) em `backend/src/balanca/parsers/modbus.parser.ts`; descartar frame inválido + métrica `modbus_crc_failed_total` | 4h  | —   |
| H2  | Crít | Idempotência em `ReconnectingAdapter.agendarReconexao()`: guard `reconnecting=true`, single timer, cancelamento em `close()`                  | 4h  | —   |
| H3  | Alta | Mutex (async-mutex ou queue interna) em `BalancaConnectionService.processarChunk()` — serializar leitura por instância                        | 3h  | H2  |

### Segurança

| ID  | Sev  | Tarefa                                                                                                                         | Esf | Dep |
| --- | ---- | ------------------------------------------------------------------------------------------------------------------------------ | --- | --- |
| S2  | Crít | Validação rigorosa de `JWT_SECRET` (≥32 bytes, sem fallback `dev-secret`) no boot — falhar fast se ausente                     | 2h  | —   |
| Q2  | Crít | Configurar code signing Windows (electron-builder `win.certificateFile` + `signtoolOptions`); decisão sobre EV cert ou interno | 6h  | —   |

**Saída:** ✅ release Windows assinado, ✅ pesagem multi-leitura sem race, ✅ APIs paginadas e validadas, ✅ secrets fortes obrigatórios.

---

## Sprint 2 — Hardening & UX produtiva (5–7 dias · ~55h)

### Frontend (núcleo)

| ID  | Sev  | Tarefa                                                                                                                | Esf | Dep |
| --- | ---- | --------------------------------------------------------------------------------------------------------------------- | --- | --- |
| F1  | Crít | Suite e2e Playwright cobrindo: login → 1ª pesagem → 2ª pesagem → fechamento de ticket → impressão; mocks de balança   | 12h | —   |
| F2  | Crít | Eliminar prop drilling em fluxo de operação: introduzir `OperacaoContext` ou colocation com Zustand UI-only           | 4h  | —   |
| F3  | Crít | Namespacing de cache keys React Query: `[empresaId, 'armazens']` etc. — varredura completa em `src/app/**` e hooks    | 6h  | —   |
| F5  | Alta | Remover `any` (20+ ocorrências); gerar tipos compartilhados via OpenAPI ou pacote `@app/contracts`                    | 8h  | Q1  |
| F4  | Alta | Mover `authStore`/`ticketStore` para UI-only; server state apenas via React Query; adicionar interceptor 401 → logout | 4h  | F3  |
| F8  | Alta | Stale time pesagem → 0; `refetchOnWindowFocus` true; mutations otimistas com rollback                                 | 3h  | F3  |
| F6  | Alta | Lazy import de `recharts` e `lucide-react/icons` (named imports) — reduzir bundle inicial                             | 3h  | —   |
| F7  | Alta | Acessibilidade: `aria-label` em ícones-botão, `htmlFor`, foco visível, navegação por teclado em modais                | 4h  | —   |

### Segurança

| ID  | Sev | Tarefa                                                                                                          | Esf | Dep |
| --- | --- | --------------------------------------------------------------------------------------------------------------- | --- | --- |
| S3  | Méd | `@nestjs/throttler` global (10 req/s) + override por rota sensível (login, reset)                               | 2h  | —   |
| S4  | Méd | CSP estrita no Electron (`Content-Security-Policy` em `BrowserWindow.webPreferences` + meta tag no Next)        | 3h  | —   |
| S5  | Méd | Reduzir `RESET_TOKEN_TTL_MS` para 15min e documentar                                                            | 1h  | —   |
| S6  | Méd | Scrubbing de PII/segredos nos logs (interceptor + lista de campos: senha, token, cpf, placa quando configurado) | 3h  | —   |

**Saída:** Frontend testável e tipado, multi-tenant seguro, hardening web aplicado.

---

## Sprint 3 — Performance & qualidade contínua (5–7 dias · ~50h)

### Backend

| ID  | Sev  | Tarefa                                                                                                        | Esf | Dep |
| --- | ---- | ------------------------------------------------------------------------------------------------------------- | --- | --- |
| B3  | Alta | `RelatoriosService.movimento()`: substituir N+1 por SQL raw com JOINs (ou dataloader); benchmark antes/depois | 6h  | B1  |
| B5  | Alta | Lazy-loading de módulos secundários (relatórios, auditoria, manutenção) via `forwardRef`/dynamic imports      | 4h  | —   |
| B6  | Méd  | `nestjs-pino` + `requestId` interceptor (correlação de requests + structured logs)                            | 4h  | S6  |
| B7  | Méd  | Soft-delete via Prisma middleware (`deletedAt`) nos models críticos: Ticket, Fatura, Empresa                  | 5h  | —   |
| B8  | Méd  | Cobertura mínima 70% em `ticket`, `fatura`, `auth` (jest --coverage gate)                                     | 12h | Q1  |
| B9  | Méd  | Validação explícita de tara em `TicketService.create()` + testes de contrato                                  | 3h  | B2  |

### Frontend

| ID  | Sev | Tarefa                                                                                     | Esf | Dep |
| --- | --- | ------------------------------------------------------------------------------------------ | --- | --- |
| F9  | Méd | `error.tsx` + `loading.tsx` em todos segmentos do App Router                               | 3h  | —   |
| F10 | Méd | Padronizar persistência Zustand (lista explícita de stores persistidos + versão de schema) | 2h  | F4  |
| F11 | Méd | `useKeyboardShortcuts` desabilitado dentro de `<input>`/`<textarea>` e durante modais      | 2h  | —   |
| F12 | Méd | Retry exponencial (max 2) em mutations idempotentes; `retry: false` em pesagem             | 2h  | F8  |

### Segurança / Qualidade

| ID      | Sev   | Tarefa                                                                                                                                       | Esf      | Dep |
| ------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --- |
| S7..S10 | Baixa | Desabilitar DevTools em prod; remover Swagger do bundle; ValidationPipe `transform:true` em todos controllers; revisão final do `preload.js` | 4h       | —   |
| Q4      | Méd   | Atenuar regras ESLint deliberadamente desativadas: revisar e re-ativar onde possível                                                         | 3h       | Q1  |
| Q5.b    | Méd   | Matriz Release: gerar `.exe` em Windows + smoke install em VM limpa                                                                          | 3h       | Q2  |
| Q6.b    | Alta  | Docs gaps: completar `CLAUDE.md`, `README` (fluxo de instalação, troubleshooting balança), `DECISOES-PENDENTES.md` resolver pendências       | 6h       | —   |
| S-CONT  | —     | Rotina contínua: `npm audit` semanal (job CI), rotação JWT 90 dias documentada, revisão quinzenal de logs auth/licença                       | 2h setup | —   |

---

## Resumo de esforço

| Sprint | Esforço                      | Foco                                        |
| ------ | ---------------------------- | ------------------------------------------- |
| 0      | ~14h                         | quick wins, baixa severidade, segurança git |
| 1      | ~50h                         | bloqueadores de release                     |
| 2      | ~55h                         | hardening segurança + UX produtiva frontend |
| 3      | ~50h                         | performance, cobertura, polish              |
| **Σ**  | **~170h (~4–5 semanas/dev)** | 56 achados endereçados                      |

## Definição de "pronto" por tarefa

1. Código + testes na mesma PR (ou commit atômico em `main`).
2. `pnpm ci` verde local antes do push.
3. Para findings com `file:line` no relatório original: marcar resolvido com hash do commit no relatório correspondente.
4. Para findings de segurança: incluir teste/comando de validação no `04-seguranca.md` apêndice.

## Ordem de execução recomendada

Sprint 0 → 1 (paralelizar trilhas Backend, Hardware, Segurança) → 2 (Frontend trilha pesada + Segurança hardening) → 3 (qualidade contínua).

Trilhas paralelas no Sprint 1 não bloqueiam entre si: Backend depende só de `Q1` (strict), Hardware é independente, Segurança/Build são independentes.

## Métricas de saída esperadas

- Conformidade CI: 72% → **≥ 95%**.
- Cobertura testes parsers: 47% → **≥ 80%**.
- Cobertura backend (módulos críticos): atual baixa → **≥ 70%**.
- `any`/`@ts-ignore`/`eslint-disable`: manter em **0**.
- Findings críticos/altos abertos: **0** ao fim do Sprint 2.
