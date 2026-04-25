# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Sprint 3 — Performance & qualidade contínua (2026-04-25)

- **Backend perf:** `RelatoriosService.movimento` agora usa `prisma.aggregate({_sum})` para totais (peso/descontos/bruto) em vez de carregar todos os tickets e somar em memória. Cap `MAX_TICKETS=5000` com flag `truncated:true` (B3).
- **Backend regras:** `TicketService.create` rejeita `PF1_TARA_REFERENCIADA` sem veículo com tara cadastrada nem `taraReferenciaTipo='MANUAL'` — evita pesagem com tara=0 silenciosa. 5 testes novos (B9).
- **Frontend resiliência:** error boundaries em `app/(authenticated)/error.tsx`, `app/error.tsx` e loading state em `app/(authenticated)/loading.tsx` (F9).
- **Frontend a11y:** `useKeyboardShortcuts` agora ignora atalhos quando há `[role="dialog"][aria-modal="true"]` aberto (F11).
- **Frontend stores:** `auth.store` ganha `version: 1` + `migrate` (descarta versões desconhecidas em vez de deserializar lixo). `frontend/src/stores/README.md` documenta a tabela canonical (F10).
- **Frontend qualidade:** `no-explicit-any` elevado para `error` no ESLint do frontend após F5 (39→0). Backend mantido em `warn` (206 ocorrências, escopo Sprint 4) (Q4).
- **Electron segurança:** `webPreferences.devTools = isDev` desabilita DevTools em build de produção (S7). S8 (Swagger fora de prod), S9 (ValidationPipe `transform:true`) e S10 (preload mínimo) já satisfeitos.

### Reclassificações Sprint 3

- **B5 (lazy modules backend):** NestJS não suporta lazy-load à la Angular; bootstrap atual ~2-3s aceitável para Electron.
- **B6 (nestjs-pino):** deferido — `LoggingInterceptor` (S6) já entrega correlação via `X-Request-Id` e PII scrubbing. Pino agrega JSON estruturado; reagendar quando integrar agregador externo.
- **B7 (soft-delete via middleware):** deferido — middleware global é alto risco. Implementar por módulo (Ticket primeiro) quando houver demanda real de undelete.
- **B8 (cobertura ≥70%):** trabalho contínuo. Cada PR de feature deve incluir testes do módulo afetado; gate de CI quando atingir baseline.
- **Q6.b (docs gaps):** sem gaps identificados nesta sessão; `CLAUDE.md` (190 linhas), `README.md` e `DECISOES-PENDENTES.md` cobrem o necessário.

### Sprint 2 — Hardening UX (2026-04-25)

- **Backend/Segurança:** CSP estrita no Electron renderer via `session.defaultSession.webRequest.onHeadersReceived` (S4); `LoggingInterceptor` global com `scrubPii()` recursivo cobrindo senha/token/JWT/CPF/CNPJ + spec 6/6 (S6). S3 (throttler) e S5 (RESET_TOKEN_TTL=15min) já estavam.
- **Frontend:** defaults react-query mais conservadores (stale 30s, refetchOnWindowFocus, retry:1 query / retry:false mutation) — F8. Helper `tenantKey()` para namespacing de queryKeys (F3 infra; migração das ~30 pages diferida). F4 (interceptor 401) já estava em `client.ts`.
- **Frontend tipos (F5):** 39 ocorrências de `any` eliminadas. Helper `lib/errors.ts` `extractMessage(e: unknown, fallback?)`. Patterns mecânicos: `catch (e: any)`→`unknown`, `(b: any)`→tipos mínimos, `payload: any`→`Record<string, unknown>`, `as any` em union literals→cast correto.
- **Frontend perf (F6):** recharts (~110 KB) lazy-loaded via `next/dynamic` em `components/dashboard/recharts-lazy.tsx`. Lucide já tree-shakable, sem ação.
- **Frontend a11y (F7):** `Input` agora gera id via `useId` e associa `htmlFor`+`aria-describedby`. 47 botões só-ícone receberam `aria-label` em 21 arquivos.

### Reclassificações Sprint 2

- **F2 (prop drilling operação):** o issue real é monólito (`pesagem/page.tsx` 768 linhas, 12 `useState`), não prop drilling. Refactor estrutural — diferido para Sprint 3.
- **F1 (e2e Playwright pesagem):** 12h dedicadas + dev server + mocks de balança/impressão — diferido para Sprint 3.

### Sprint 1 — Bloqueadores de produção (2026-04-25)

- **Backend:** TypeScript `strict: true` ativado (`feat: Q1`). 64 propriedades de DTO anotadas com `!:`; 8 outros gaps corrigidos (auth controller, serial adapter, brazilian-utils types).
- **API:** paginação universal em `Fatura.findAll` e `Romaneio.findAll` + helper `PaginationDto` (`feat: B1`). `Auditoria` e `Ticket` já paginavam. `Relatorios` deferido para Sprint 3 (decisão sobre export streaming).
- **API:** `prisma.$transaction` em fluxos multi-tabela: `FaturaService.registrarPagamento`, `RomaneioService.vincularTickets`, `TicketService.registrarPassagem` (`fix: B4`).
- **Hardware:** idempotência em `ReconnectingAdapter.agendarReconexao` — guard contra rajada de `'close'` que sobrescrevia o timer e gerava reconexões duplas (`fix: H2`).

### Reclassificações pós-análise

- **H1 (CRC-16 Modbus):** não-aplicável. CRC já validado pela lib `modbus-serial` antes do parser.
- **H3 (mutex `processarChunk`):** não-aplicável no estado atual. Função síncrona; JS single-thread serializa naturalmente.
- **S2, B2:** já implementados em `main` antes desta auditoria; varredura confirmou cobertura.

### Deferido

- **Q2 — code signing Windows:** adiado por decisão de produto (avaliar custo de certificado EV vs OV antes de aplicar). `electron-builder` continua produzindo `.exe` não assinado; usuários veem warning do SmartScreen na 1ª instalação.

### Added

- Runbook de rotação do par RSA de licenciamento (`docs/runbooks/rsa-rotation.md`).
- CHANGELOG raiz e CHANGELOG de migrations Prisma.
- Plano de remediação consolidado pós-auditoria (`docs/auditoria/2026-04-25/PLANO-REMEDIACAO.md`).
- Suíte de auditoria 2026-04-25 com 5 relatórios especialistas (`docs/auditoria/2026-04-25/`).

### Changed

- CI: removido `continue-on-error` dos gates `Seed sanity check` e `Test (e2e) backend` em `.github/workflows/ci.yml` — agora bloqueiam o pipeline em falha.
- Husky pre-push: passa a executar `pnpm typecheck:all` em vez de `pnpm typecheck` (cobre frontend).

### Security

- Verificação confirmou que `keygen/private.key` nunca foi commitada (`git log --all -- keygen/private.key` vazio) e segue listada em `.gitignore`.

## [1.0.0] — 2026-04-24

Versão inicial empacotada.

### Added

- Backend NestJS 10 com 30+ módulos (auth, ticket, balança, fatura, comercial, dashboard, licença, etc.).
- Frontend Next.js 14 (App Router) com React Query, Zustand e Tailwind.
- Wrapper Electron 30 + electron-builder NSIS.
- 13 parsers de balança: Toledo (B/C/2090/2180), Filizola (padrão e @), Digitron, Urano, AFTS, Saturno, SICS, Modbus, Generic.
- Adapters serial RS-232/485, TCP/IP e Modbus RTU/TCP com `ReconnectingAdapter`.
- Licenciamento RSA-2048 com fingerprint de hardware (MAC + hostname + serial volume).
- 6 templates de ticket portados do PesoLog (1PF A5, 2PF A4, 3PF, Cupom, Descontos, Generic Text).
