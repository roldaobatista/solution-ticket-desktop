# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

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
