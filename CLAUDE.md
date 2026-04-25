# Solution Ticket Desktop — Guia para o Claude

Sistema de pesagem veicular Windows. Clone funcional do PesoLog (sistema concorrente) com licenciamento RSA próprio.

## Stack

- **Backend:** NestJS 10 + Prisma 5 + SQLite + JWT + bcrypt
- **Frontend:** Next.js 14 (App Router) + Tailwind + React Query + Zustand + shadcn-style components
- **Desktop:** Electron 30 + electron-builder (NSIS)
- **Hardware balança:** serialport 13 + modbus-serial (parsers Toledo, Filizola, SICS, Modbus, genérico)
- **PDF:** pdfkit (impressão de tickets, recibos, relatórios)
- **XML:** fast-xml-parser (consulta NFe/CTe)
- **Licença:** JWT RSA-2048 com fingerprint de hardware (MAC + hostname + serial volume C:)

## Estrutura do monorepo (pnpm workspaces)

```
solution-ticket-desktop/
├── backend/         NestJS — porta 3001 (127.0.0.1 only)
├── frontend/        Next.js — porta 3000 em dev
├── electron/        wrapper desktop (main.js, preload.js, splash.html)
├── keygen/          ferramenta CLI para você emitir chaves de licença
├── docs/            PLANO-DESKTOP.md, AUDITORIA-PESOLOG-vs-SOLUTION-TICKET.md
├── release/         saída do electron-builder (Setup.exe + win-unpacked/)
├── package.json     scripts agregados
└── pnpm-workspace.yaml
```

---

## Como rodar em desenvolvimento

### Pré-requisitos

- Node.js 20+
- pnpm 8+
- Windows 10/11 (testado)

### Setup inicial

```bash
cd "C:\PROJETOS\Plataforma de Pesagem Veicular\solution-ticket-desktop"
pnpm install
pnpm build:backend       # compila NestJS para dist/
pnpm db:generate         # gera Prisma client
pnpm db:migrate          # cria SQLite e aplica schema (desenvolvimento)
pnpm db:seed             # popula com dados iniciais (admin + tickets demo)
```

### Modos de execução

**Backend isolado** (porta 3001):

```bash
pnpm dev:backend
# ou
cd backend && node dist/main.js
```

**Frontend isolado** (porta 3000, fala com backend em 127.0.0.1:3001):

```bash
pnpm dev:frontend
```

Requer `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api
NEXT_PUBLIC_USE_MOCK=false
```

**App completo via Electron** (recomendado):

```bash
pnpm --filter ./electron dev
```

Electron sobe automaticamente o backend (child process) e o frontend dev server, abre janela.

**App empacotado (já compilado):**

```bash
"release/win-unpacked/Solution Ticket.exe"
```

### Como gerar instalador

```bash
pnpm dist:win
# saída: release/Solution-Ticket-Setup-1.0.0.exe (~172 MB)
```

---

## Credenciais

### Login do app (após seed)

| Usuário    | E-mail                     | Senha    | Perfil        |
| ---------- | -------------------------- | -------- | ------------- |
| admin      | `admin@solutionticket.com` | `123456` | Administrador |
| operador   | `joao@solutionticket.com`  | `123456` | Operador      |
| supervisor | `maria@solutionticket.com` | `123456` | Supervisor    |

### Banco de dados

**Em dev:**

- `backend/data/solution-ticket.db` (SQLite)
- DATABASE_URL no `backend/.env`

**Em produção (app empacotado):**

- `%APPDATA%\@solution-ticket\electron\solution-ticket.db`
- Logs: `%APPDATA%\@solution-ticket\electron\logs\electron.log`

### Licenciamento

- Par RSA gerado em `keygen/private.key` (NUNCA commitar) e `keygen/public.key`
- Chave pública embutida em `backend/src/licenca/public.key`
- Para gerar chave de cliente:

```bash
cd keygen
node gerar-chave.js --fingerprint <hash> --plano PRO --maquinas 3 --validade-dias 365
```

---

## Comandos úteis

| Ação                             | Comando                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Build backend                    | `pnpm build:backend`                                                                                 |
| Build frontend (prod)            | `cd frontend && NEXT_PUBLIC_USE_MOCK=false NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api pnpm build` |
| Build tudo                       | `pnpm build:all`                                                                                     |
| Gerar instalador Windows         | `pnpm dist:win`                                                                                      |
| Migrate banco dev                | `pnpm db:migrate`                                                                                    |
| Sincronizar schema sem migration | `cd backend && npx prisma db push --schema=src/prisma/schema.prisma --accept-data-loss`              |
| Seed banco                       | `pnpm db:seed`                                                                                       |
| Testes unit                      | `cd backend && pnpm test`                                                                            |
| Testes e2e                       | `cd backend && pnpm test:e2e`                                                                        |
| Swagger                          | `http://127.0.0.1:3001/api/docs` (com app rodando)                                                   |

### Truque: aplicar schema + seed no banco do app instalado

```bash
cd backend
DATABASE_URL="file:C:/Users/rolda/AppData/Roaming/@solution-ticket/electron/solution-ticket.db" \
  npx prisma db push --schema=src/prisma/schema.prisma --accept-data-loss
DATABASE_URL="file:C:/Users/rolda/AppData/Roaming/@solution-ticket/electron/solution-ticket.db" \
  pnpm db:seed
```

### Atualizar `node_modules` empacotado (após adicionar dep nova)

```bash
# regenerar standalone com flat node_modules
rm -rf /tmp/backend-standalone && mkdir /tmp/backend-standalone
cp backend/package.json /tmp/backend-standalone/
cp -r backend/src /tmp/backend-standalone/
cd /tmp/backend-standalone && npm install --omit=dev --ignore-scripts
npx prisma generate --schema=src/prisma/schema.prisma
# copiar para o instalado
rm -rf release/win-unpacked/resources/backend/node_modules
cp -r /tmp/backend-standalone/node_modules release/win-unpacked/resources/backend/node_modules
```

---

## Convenções importantes

### Camadas de paths

- **Backend escuta SÓ 127.0.0.1** (segurança — não aceita conexões externas).
- **Backend usa camelCase** em models Prisma, JSON de resposta, props. Snake_case só nos `@map` para nomear colunas.
- **Backend retorna envelope** `{success, data, timestamp}`. O **frontend desembrulha** automaticamente via interceptor axios.
- **Listas paginadas**: backend pode retornar array plano ou paginado; o helper `toPaginated()` em `frontend/src/lib/api.ts` adapta automaticamente.

### Prisma + SQLite

- SQLite NÃO suporta enum nem Json. Todos os enums foram convertidos para `String`. Json virou `String` com serialização manual via `JSON.stringify/parse`.
- Em dev preferir `prisma db push` (sem migration formal). Migrations só serão geradas quando estabilizar.

### Frontend

- API client único em `src/lib/api.ts`. Não criar mais `apiClient`.
- Componentes UI em `src/components/ui/` (estilo shadcn manual).
- Zod + React Hook Form para validação.
- React Query para cache de dados.

---

## Pendências

### Bloqueadores comerciais (precisam de hardware)

- **Validar 12 adapters de balança em campo** — adapters criados (Serial RS-232/485, TCP/IP, Modbus RTU/TCP) com 6 parsers (Toledo, Filizola, SICS, Modbus, Generic). Modelos pré-cadastrados: ALFA 3102, WEIGHTECH WT1000/WT3000, JUNDIAI BJ-850, MASTERTEC MASTERPRO, SATURNO, TOLEDO 9091, DIGITRON 5/6, MULLER CRM 80000. Nenhum testado em hardware real.
- **Captura de imagem por câmera/webcam** — UI não implementada, depende de câmera IP/webcam para validar.

### Funcionais (sem hardware)

- **Templates de ticket faltando** — 6 de 14 portados (1PF A5, 2PF A4, 3PF, Cupom, Descontos, Generic Text). Faltam variantes do TICKET002 (Dif. Nota, Inteiro, Sem Desconto), TICKET004 (Gertec, Resumido, Resumido Produtor, SemAssinatura), TICKET005A/B/C separados.
- **Endpoint `/dashboard/top-clientes` e `/dashboard/distribuicao-produto`** — implementados mas usando fallback para `pesagens-por-cliente` e `pesagens-por-produto`. Validar se a query agregada está correta.
- **`/comercial/extrato/:clienteId/pdf`** — endpoint criado mas geração PDF do extrato pode estar incompleta.
- **Code signing do instalador** — não implementado por decisão do usuário (custo).
- **Auto-update via GitHub Releases** — configurado no plano mas não ativado.

### Nice to have (não bloqueia venda)

- **Captura de imagem do veículo na pesagem** (UImagem do PesoLog) — webcam/IP cam.
- **Impressão de etiqueta de bilhetagem** — feature flag existe, lógica simples implementada, validar fluxo.
- **Migrations Prisma formais** — atualmente usa `db push`. Antes de produção, gerar migrations.

### Bugs conhecidos

- Quando o instalador é gerado, `node_modules` precisa ser regerado via `npm install --omit=dev` num temp folder porque o pnpm usa symlinks que o electron-builder não resolve. Veja seção "Atualizar `node_modules` empacotado" acima.
- Frontend Next.js dá erro de symlink em Windows ao usar `output: 'standalone'`. Não use essa opção; ficamos com Next.js server rodando como child process do Electron em produção.
- Build do frontend exibe warning EPERM em `_not-found/page.js.nft.json` (bug Next.js 14 Windows) — não afeta runtime, ignorável.

---

## Documentos de referência

- `docs/PLANO-DESKTOP.md` — plano completo de execução (etapas 1–8) e arquitetura
- `docs/AUDITORIA-PESOLOG-vs-SOLUTION-TICKET.md` — auditoria detalhada de paridade com PesoLog
- Skill global `pesolog-inspector` (em `~/.claude/skills/pesolog-inspector/SKILL.md`) — como ler dados do PesoLog (banco, telas, configs)

---

## Princípios de trabalho

- **Não rodar suite completa de testes durante task.** Escalar: teste específico → grupo → suite.
- **Verificar antes de afirmar.** Se falar "pronto", já rodou `pnpm build` e validou.
- **Backend escuta `127.0.0.1`**, nunca `0.0.0.0`. Mudança disso é breach de segurança.
- **Scripts de aux** ficam em `keygen/` (release) ou `/tmp/` (one-off). Não poluir a raiz.
- **Status do app** após mudança: rebuild → copy para `release/win-unpacked/` → restart.
