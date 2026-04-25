# Auditoria Técnica — 5 Especialistas

**Projeto:** Solution Ticket Desktop (Plataforma de Pesagem Veicular)
**Data:** 2026-04-24
**Escopo:** `solution-ticket-desktop/` (monorepo pnpm: backend NestJS 10 + frontend Next.js 14 + electron 30 + keygen)

Classificação de severidade: 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🟢 Baixo/Informativo

---

## 1. 🏗️ Arquiteto de Software

**Cobertura:** estrutura de módulos, acoplamento, camadas, dívida técnica.

### Pontos fortes

- Monorepo pnpm bem segmentado (`backend`, `frontend`, `electron`, `keygen`).
- Módulo `balanca` com `adapters/` + `parsers/` em **Strategy + Factory** — extensão limpa para novos indicadores.
- Multi-tenant modelado no schema (`Tenant → Empresa → Unidade → Balanca`).

### Achados

| #   | Sev | Achado                                                                                                                                                                                                                                                                                               | Evidência                       |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| A1  | 🟠  | `frontend/api.ts` com **1382 linhas** concentra todas as chamadas HTTP — violação de SRP; quebrar por domínio (`api/pesagem.ts`, `api/balanca.ts`, …).                                                                                                                                               | `frontend/src/services/api.ts`  |
| A2  | 🟡  | Pastas `test-flows.js`, `test-login.js`, `test-romaneio.js`, `fix-pagination.py` soltas na raiz — poluem o repo, mover para `scripts/` ou apagar.                                                                                                                                                    | raiz `solution-ticket-desktop/` |
| A3  | 🟡  | `release/win-unpacked/resources/backend/...` dentro do repo — build artifact versionado. Adicionar ao `.gitignore`.                                                                                                                                                                                  | `release/`                      |
| A4  | 🟡  | `balanca.service.ts`, `balanca-connection.service.ts`, `balanca-realtime.service.ts`, `capture-raw.service.ts`, `network-discovery.service.ts`, `auto-detect.service.ts`, `telemetria.service.ts` — 7 services no mesmo módulo. Considerar sub-módulo `balanca/transport/` e `balanca/diagnostics/`. | `backend/src/balanca/`          |
| A5  | 🟢  | Falta um `README.md` executivo (só `CLAUDE.md`).                                                                                                                                                                                                                                                     | raiz                            |

**Recomendação prioritária:** A1 (quebrar `api.ts`) — maior ROI de manutenibilidade.

---

## 2. 🔒 Especialista em Segurança

**Cobertura:** Electron hardening, auth, segredos, headers, superfícies de ataque.

### Pontos fortes

- `nodeIntegration: false` + `contextIsolation: true` nas duas `BrowserWindow` (`electron/main.js:271, 290`).
- `requireJwtSecret()` falha se `JWT_SECRET` ausente (`backend/src/auth/jwt-secret.ts`).
- `bcrypt` para senhas; `helmet` no bootstrap.
- Backend em `127.0.0.1` apenas (loopback), reduz superfície.

### Achados

| #   | Sev | Achado                                                                                                                                                                                         | Evidência                                          |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| S1  | 🟠  | `helmet({ contentSecurityPolicy: false })` em `backend/src/main.ts` — CSP desabilitado. Mesmo rodando via Electron, habilitar CSP restritivo mitiga injeção via dados de balança/XML NFe.      | `backend/src/main.ts`                              |
| S2  | 🟠  | `preload.js` expõe apenas `version/platform`, mas **não há `sandbox: true`** nas `webPreferences` do `mainWindow`. Ativar `sandbox: true` como defesa em profundidade.                         | `electron/main.js:290`                             |
| S3  | 🟠  | `shell.openExternal(openUrl)` **sem allowlist de protocolo** (`electron/main.js:308`). Um `javascript:` / `file:` pode ser aberto. Validar: `new URL(openUrl).protocol in ['http:','https:']`. | `electron/main.js:308`                             |
| S4  | 🟡  | `access_token` em `localStorage` (`frontend/api.ts`) — vulnerável a XSS. Em app Electron, preferir `sessionStorage` + CSP ou cookie httpOnly emitido pelo backend local.                       | `frontend/src/services/api.ts`                     |
| S5  | 🟡  | `network-discovery.service.ts` faz scan `/24` de portas TCP — útil, mas se exposto em rota pública pode servir de pivô. Garantir Guard + rate-limit no controller correspondente.              | `backend/src/balanca/network-discovery.service.ts` |
| S6  | 🟡  | Sentry DSN lido de `process.env.SENTRY_DSN` — verificar que não vaza em build empacotado (`process.env` do renderer).                                                                          | `backend/src/main.ts`                              |
| S7  | 🟢  | `keygen/private.key` — confirmar em `.gitignore` e nunca versionar.                                                                                                                            | `keygen/`                                          |

**Recomendação prioritária:** S3 (allowlist de protocolo em `openExternal`) — correção de 3 linhas, fecha vetor clássico de RCE em Electron.

---

## 3. 📡 Especialista em Comunicação Serial & Ethernet _(foco solicitado)_

**Cobertura:** `serialport`, `net.Socket`, `modbus-serial`, parsers, reconexão, timeouts, integridade de trama.

### Arquitetura observada

- `IBalancaAdapter` (EventEmitter) com 3 implementações: `SerialAdapter`, `TcpAdapter`, `ModbusAdapter`.
- Factory por string: `serial|rs232|rs485 → SerialAdapter`, `tcp|tcpip|tcp/ip → TcpAdapter`, `modbus|modbus-rtu|modbus-tcp → ModbusAdapter`.
- Parsers por fabricante: Toledo (9091, C, 2090, 2180), Filizola (std, AT), Urano, Digitron, Saturno, SICS, AFTS, Modbus, Generic (estilo PesoLog) — **bem coberto por testes unitários**.
- `CaptureRawService` grava 200–5000 ms em hex para auto-detecção; `AutoDetectService` ranqueia candidatos por confiança.
- `NetworkDiscoveryService` varre `/24` em portas típicas de conversores (4001 MOXA/USR, 9999 Lantronix, 23, 8000, 10001).

### Achados

| #   | Sev | Achado                                                                                                                                                                                                                                                                          | Evidência                                        |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| C1  | 🔴  | **`TcpAdapter` sem timeout de conexão nem reconexão automática.** `sock.connect()` pode pendurar indefinidamente se o conversor estiver offline; se a conexão cair em produção (`close`), não há retry.                                                                         | `backend/src/balanca/adapters/tcp.adapter.ts`    |
| C2  | 🔴  | **`TcpAdapter` sem `socket.setKeepAlive(true, ...)` nem `setNoDelay(true)`.** Em NAT/firewall o socket "morre silencioso" sem keepalive — sintoma típico: peso trava e só volta após restart.                                                                                   | `tcp.adapter.ts`                                 |
| C3  | 🟠  | **`SerialAdapter` não trata `'close'` inesperado** (cabo desconectado). Há `on('close')` no código, mas sem estratégia de reconexão com backoff. Usuário fica com leitura congelada.                                                                                            | `serial.adapter.ts`                              |
| C4  | 🟠  | **`ModbusAdapter` com `setInterval` fixo sem back-pressure**: se uma leitura Modbus demora mais que `intervalMs`, há sobreposição e o barramento RS-485 fica saturado. Trocar por _loop assíncrono com `await` + delay_.                                                        | `modbus.adapter.ts`                              |
| C5  | 🟠  | **`ModbusAdapter` não trata exceção Modbus (slave error).** Falha em `readHoldingRegisters` derruba o timer silenciosamente (sem `emit('error')`).                                                                                                                              | `modbus.adapter.ts`                              |
| C6  | 🟠  | **`require('serialport')` dentro de `connect()`** — padrão bom para build, mas **sem try/catch**. Se o binding nativo não rebuildou para a versão do Electron, a exceção estoura sem mensagem acionável. Envelopar com erro traduzido ("driver CH340/serialport não carregou"). | `serial.adapter.ts:22`, `capture-raw.service.ts` |
| C7  | 🟡  | **Parsers assumem ASCII**: `buffer.toString('ascii')` no Toledo/Filizola. Balanças com caracteres estendidos (0x80+) podem corromper peso. Usar `binary` ou `latin1` onde o protocolo for 8 bits.                                                                               | `toledo.parser.ts`, outros                       |
| C8  | 🟡  | **`GenericParser` sem validação de CRC/checksum** — protocolos Toledo-C e AFTS têm BCC/checksum opcional que não é verificado. Aceita trama corrompida como válida.                                                                                                             | `generic.parser.ts`, `toledo-c.parser.ts`        |
| C9  | 🟡  | **`network-discovery` paralelismo fixo em 32–64** e timeout 800 ms. Em redes industriais ruidosas gera falso-negativo. Adicionar retry por IP (1x) antes de descartar.                                                                                                          | `network-discovery.service.ts`                   |
| C10 | 🟡  | **`CaptureRawService` não envia ENQ em TCP** (só serial). Alguns indicadores Toledo-C via conversor Ethernet também exigem ENQ (0x05).                                                                                                                                          | `capture-raw.service.ts`                         |
| C11 | 🟡  | **Falta flush de buffer residual no reconectar**: quando reabre porta, o próximo parse pode consumir meia-trama antiga. Limpar buffer interno em `onClose`/`onOpen`.                                                                                                            | `balanca-connection.service.ts`                  |
| C12 | 🟢  | `parityMap` só cobre `none/even/odd` — falta `mark/space` (raros, mas presentes em Filizola antigo).                                                                                                                                                                            | `serial.adapter.ts:24`                           |
| C13 | 🟢  | `modbus-serial` suporta `setTimeout(ms)` no client — não está sendo usado; default pode travar o polling.                                                                                                                                                                       | `modbus.adapter.ts`                              |

### Correções prioritárias (ordem de ataque)

1. **C1 + C2** — TCP timeout + keepAlive + reconexão com backoff exponencial (capped 30 s). Patch aproximado:
   ```ts
   sock.setTimeout(this.config.timeoutMs ?? 5000);
   sock.setKeepAlive(true, 10_000);
   sock.setNoDelay(true);
   sock.once('timeout', () => sock.destroy(new Error('TCP timeout')));
   ```
2. **C3** — mesma política de reconexão para Serial (`on('close')` → tentativa com backoff).
3. **C5** — `try/catch` no polling Modbus + `emit('error')` estruturado.
4. **C4** — substituir `setInterval` por `while(conectado) { await read(); await delay(ms); }`.
5. **C8** — habilitar verificação de checksum quando o protocolo define (Toledo-C, AFTS).

### Sugestão de teste de resiliência

Criar `e2e` com mock TCP server (`net.createServer`) que:

- aceita conexão, envia 3 tramas válidas, **derruba o socket**,
- verifica que o consumidor recebe `close` → `reconectado` → novas leituras, sem perda de ordem.

---

## 4. 🗄️ Especialista em Banco de Dados

**Cobertura:** schema Prisma, índices, multi-tenancy, migrations.

### Achados

| #   | Sev | Achado                                                                                                                                                                                                                    | Evidência                          |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| D1  | 🟠  | **Sem índices declarados** em FKs de alto volume (`TicketPesagem.unidadeId`, `Balanca.empresaId`, etc.). SQLite cria índice automático apenas para PK; filtros por tenant/unidade farão _full scan_. Adicionar `@@index`. | `backend/src/prisma/schema.prisma` |
| D2  | 🟠  | **Multi-tenant sem enforcement no banco**: `tenantId` existe mas não há `@@unique([tenantId, …])` nas entidades que deveriam ser únicas _por tenant_. Risco de colisão entre tenants.                                     | `schema.prisma`                    |
| D3  | 🟡  | **`SQLite` + acesso concorrente**: Electron spawn backend em processo separado — ok. Mas se houver `foreign_keys=ON` + WAL, confirmar pragma ativo (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`).                  | —                                  |
| D4  | 🟡  | Migration única `20260424175219_init` — esperado em projeto novo, mas planejar estratégia de migrations em campo (SQLite do cliente).                                                                                     | `backend/src/prisma/migrations/`   |
| D5  | 🟡  | `Empresa.documento` opcional (`String?`) — para CNPJ brasileiro, normalmente deveria ser obrigatório + unique por tenant.                                                                                                 | `schema.prisma`                    |
| D6  | 🟢  | `fix_schema.py` versionado em `backend/` — script ad-hoc, mover para `scripts/` ou remover.                                                                                                                               | `backend/fix_schema.py`            |

**Prioridade:** D1 + D2 antes de vários clientes em produção.

---

## 5. ✅ Especialista em Qualidade & DevOps

**Cobertura:** testes, CI, lint/type/format, build, empacotamento.

### Pontos fortes

- Husky + lint-staged (prettier + eslint --fix) no commit.
- Script `ci`: `format:check && lint:check && typecheck && test && build:all` — gate completo.
- **20 specs unitários** com boa cobertura dos parsers (Toledo, Filizola, SICS, Digitron, Urano, Saturno, AFTS, Modbus, generic, factory).
- `config-resolver.spec.ts` e `auto-detect.service.spec.ts` presentes.

### Achados

| #   | Sev | Achado                                                                                                                                                                                                       | Evidência                       |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Q1  | 🟠  | **Zero testes nos adapters** (`serial.adapter.ts`, `tcp.adapter.ts`, `modbus.adapter.ts`) — camada de mais risco de produção. Mockar `net.Socket` / `serialport` com fakes.                                  | `backend/src/balanca/adapters/` |
| Q2  | 🟠  | **Zero testes no frontend** (Next.js). Sem `*.test.tsx` / Playwright configurado — só os scripts soltos `test-flows.js` na raiz.                                                                             | `frontend/`                     |
| Q3  | 🟠  | **Sem CI automatizado** (`.github/workflows/` não confirmado ter `ci.yml` ativo). `package.json` tem `"ci"` mas depende de acionamento manual.                                                               | `.github/`                      |
| Q4  | 🟡  | `test-flows.js`, `test-login.js`, `test-romaneio.js` na raiz — se é E2E, mover para `e2e/` e registrar em `test:e2e`.                                                                                        | raiz                            |
| Q5  | 🟡  | `typecheck` do script principal cobre **só o backend** (`pnpm --filter ./backend typecheck`); existe `typecheck:all` mas não no `ci`. Incluir `typecheck:all` no gate.                                       | `package.json`                  |
| Q6  | 🟡  | **Build nativo (`serialport`, `modbus-serial`) e Electron rebuild**: existe `rebuild-native.js` mas falhar em versão de Electron é silencioso para o usuário. Logar versão alvo + checksum na inicialização. | `electron/rebuild-native.js`    |
| Q7  | 🟢  | `pnpm.overrides` fixa `multer@^2.1.1` e `lodash@^4.17.21` — bom para segurança supply-chain.                                                                                                                 | `package.json`                  |

**Prioridade:** Q1 (adapters sem teste) + Q3 (CI).

---

## Matriz Consolidada (Top 10 por ROI)

| Rank | ID      | Sev | Esforço | Área                            |
| ---: | ------- | :-: | :-----: | ------------------------------- |
|    1 | C1 + C2 | 🔴  |    S    | TCP timeout/keepalive/reconnect |
|    2 | C3      | 🟠  |    S    | Serial reconnect                |
|    3 | S3      | 🟠  |   XS    | Allowlist em `openExternal`     |
|    4 | C5 + C4 | 🟠  |    M    | Modbus polling resiliente       |
|    5 | Q1      | 🟠  |    M    | Testes dos adapters             |
|    6 | D1      | 🟠  |    S    | Índices Prisma                  |
|    7 | S1      | 🟠  |    S    | Reativar CSP                    |
|    8 | A1      | 🟠  |    M    | Quebrar `api.ts`                |
|    9 | D2      | 🟠  |    S    | `@@unique` tenant-scoped        |
|   10 | C8      | 🟡  |    M    | Checksum em parsers             |

---

## Itens que precisam de decisão do produto antes de codar

- Política de reconexão (infinita vs. limite + alerta na UI).
- Persistir leituras brutas em disco para auditoria legal (INMETRO)?
- Rotação de `JWT_SECRET` em updates do instalador.

_Fim do laudo._
