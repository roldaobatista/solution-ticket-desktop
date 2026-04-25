# Solution Ticket Desktop

Sistema de pesagem veicular para Windows. Clone funcional do PesoLog com licenciamento RSA próprio.

## Stack

- **Backend:** NestJS 10 + Prisma 5 + SQLite + JWT + bcrypt
- **Frontend:** Next.js 14 (App Router) + Tailwind + React Query + Zustand
- **Desktop:** Electron 30 + electron-builder (NSIS)
- **Hardware:** `serialport` 13 + `modbus-serial` — adapters RS-232/485, TCP/IP, Modbus RTU/TCP
- **Licença:** JWT RSA-2048 com fingerprint de hardware

## Pré-requisitos

- Node.js 20+
- pnpm 8+
- Windows 10/11

## Setup

```bash
pnpm install
pnpm build:backend
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Desenvolvimento

```bash
pnpm --filter ./electron dev   # app completo (backend + frontend + janela)
pnpm dev:backend               # só backend (porta 3001)
pnpm dev:frontend              # só frontend (porta 3000)
```

Credenciais padrão (após seed): `admin@solutionticket.com` / `123456`.

## Build do instalador

```bash
pnpm dist:win   # saída em release/
```

## Estrutura

```
solution-ticket-desktop/
├── backend/     NestJS — porta 3001 (127.0.0.1 only)
├── frontend/    Next.js — porta 3000 em dev
├── electron/    wrapper desktop
├── keygen/      CLI para emitir chaves de licença
├── scripts/     scripts manuais (smoke tests, fixes pontuais)
├── docs/        planos, auditorias, decisões arquiteturais
└── release/     saída do electron-builder (gitignored)
```

## Testes

```bash
pnpm test              # unitários backend (parsers, adapters, services)
pnpm --filter ./backend test:e2e   # e2e do backend
pnpm ci                # pipeline completo: format + lint + typecheck + test + build
```

## Licenciamento

Par RSA gerado em `keygen/private.key` (nunca commitar) e `keygen/public.key`. A pública é embutida em `backend/src/licenca/public.key`.

```bash
cd keygen
node gerar-chave.js --fingerprint <hash> --plano PRO --maquinas 3 --validade-dias 365
```

## Arquitetura de comunicação com balança

- `backend/src/balanca/adapters/` — transporte (serial, tcp, modbus)
- `backend/src/balanca/parsers/` — 13 parsers (Toledo, Filizola, SICS, Urano, Digitron, Saturno, AFTS, Modbus, Generic, etc.)
- `ReconnectingAdapter` envolve o adapter concreto e aplica backoff exponencial capped em 30 s.
- `BalancaConnectionService` orquestra e faz flush de buffer no reconnect.

## Documentos

- [`docs/PLANO-DESKTOP.md`](docs/PLANO-DESKTOP.md) — plano de execução e arquitetura
- [`docs/AUDITORIA-5-ESPECIALISTAS.md`](docs/AUDITORIA-5-ESPECIALISTAS.md) — auditoria técnica
- [`docs/PLANO-CORRECAO-AUDITORIA.md`](docs/PLANO-CORRECAO-AUDITORIA.md) — plano de correção por ondas
- [`docs/MIGRATIONS-FIELD.md`](docs/MIGRATIONS-FIELD.md) — estratégia de migrations em campo
- [`CLAUDE.md`](CLAUDE.md) — guia operacional para agentes AI

## Segurança

- Backend escuta apenas `127.0.0.1:3001`.
- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` no Electron.
- CSP restritiva no backend via `helmet`.
- Token JWT em `sessionStorage` (renovado por sessão).
- `setWindowOpenHandler` com allowlist de protocolos (`http:`/`https:`/`mailto:`).

## Licença

Proprietário.
