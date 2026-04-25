# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

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
