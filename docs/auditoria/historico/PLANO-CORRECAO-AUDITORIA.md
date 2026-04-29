# Plano de Correção — 41 Achados da Auditoria

**Origem:** `docs/AUDITORIA-5-ESPECIALISTAS.md`
**Estratégia:** 7 ondas (waves), ordenadas por risco × esforço. Cada onda é um PR autocontido com gates verdes antes de abrir a próxima.
**Estimativa total:** ~11–15 dias-homem.

Legenda severidade: 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🟢 Baixo

---

## Wave 0 — Quick Wins (½ dia)

> 4 achados · esforço XS · abre caminho sem risco

| ID  | Sev | Ação                                                                                                        | Arquivo                |
| --- | --- | ----------------------------------------------------------------------------------------------------------- | ---------------------- |
| S3  | 🟠  | Allowlist `http:`/`https:` em `setWindowOpenHandler` antes de `shell.openExternal`                          | `electron/main.js:308` |
| S7  | 🟢  | Garantir `keygen/*.key` e `keygen/private.key` no `.gitignore` (rodar `git ls-files keygen/` para conferir) | `.gitignore`           |
| A3  | 🟡  | Adicionar `release/` ao `.gitignore` e `git rm -r --cached release/`                                        | `.gitignore`           |
| D6  | 🟢  | Remover `backend/fix_schema.py` (conferir histórico antes)                                                  | repo                   |
| A2  | 🟡  | Mover `test-flows.js`, `test-login.js`, `test-romaneio.js`, `fix-pagination.py` para `scripts/` ou apagar   | raiz                   |

**Gate:** `pnpm ci` verde · app abre · login funciona.

---

## Wave 1 — Resiliência de Comunicação (3–4 dias) 🔥 **prioridade máxima**

> 8 achados · inclui os 2 🔴 · impacto direto em operação

### 1.1 `TcpAdapter` robusto (C1, C2)

Arquivo: `backend/src/balanca/adapters/tcp.adapter.ts`

```ts
async connect(): Promise<void> {
  // ...validação...
  await new Promise<void>((resolve, reject) => {
    const sock = new net.Socket();
    const timeoutMs = this.config.connectTimeoutMs ?? 5000;
    const onErr = (err: Error) => { sock.destroy(); reject(err); };
    sock.setTimeout(timeoutMs);
    sock.once('timeout', () => onErr(new Error(`TCP timeout ${timeoutMs}ms`)));
    sock.once('error', onErr);
    sock.connect(this.config.portaTcp!, this.config.enderecoIp!, () => {
      sock.off('error', onErr);
      sock.setTimeout(0);            // desliga timeout após conectar
      sock.setKeepAlive(true, 10_000);
      sock.setNoDelay(true);
      this.socket = sock;
      this.conectado = true;
      sock.on('data', (b) => this.emit('data', b));
      sock.on('error', (e) => this.emit('error', e));
      sock.on('close', () => { this.conectado = false; this.emit('close'); });
      resolve();
    });
  });
}
```

### 1.2 Camada de reconexão (C1, C3)

Criar `backend/src/balanca/adapters/reconnecting-adapter.ts` — decorator que envelopa qualquer `IBalancaAdapter`:

- Backoff exponencial: 1s → 2s → 4s → … cap 30s.
- Máx. tentativas configurável (ou infinito com alerta na UI a cada N falhas).
- Emite `'reconecting'`, `'reconectado'`, `'falha-permanente'` para a UI mostrar status.
- Aplicado automaticamente em `adapter.factory.ts`.

### 1.3 Modbus resiliente (C4, C5, C13)

Arquivo: `backend/src/balanca/adapters/modbus.adapter.ts`

- Trocar `setInterval` por loop `while (this.conectado)` com `await read(); await sleep(intervalMs)`.
- `try/catch` em cada leitura; emitir `error` com contexto (slave address, register).
- `this.client.setTimeout(this.config.readTimeoutMs ?? 1000)`.

### 1.4 Serial — mensagens acionáveis (C6)

Arquivo: `backend/src/balanca/adapters/serial.adapter.ts`

```ts
let SerialPort: any;
try {
  ({ SerialPort } = require('serialport'));
} catch (e) {
  throw new Error(
    'Falha ao carregar driver serial. ' +
      'Rode "pnpm --filter ./electron rebuild-native" ou instale o driver CH340.',
  );
}
```

### 1.5 Flush de buffer no reconnect (C11)

Arquivo: `balanca-connection.service.ts` — zerar buffer interno em `onClose` e `onReopen`.

**Gate:** novo spec `tcp.adapter.reconnect.spec.ts` com mock server `net.createServer()` que aceita conexão, envia 3 tramas, derruba o socket, verifica reconexão + continuidade.

---

## Wave 2 — Segurança Aplicada (1 dia)

> 5 achados

| ID    | Ação                                                                                                                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 🟠 | `backend/src/main.ts`: habilitar CSP restritivo com `helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], connectSrc: ["'self'", 'http://127.0.0.1:3001'], imgSrc: ["'self'", 'data:'], scriptSrc: ["'self'"] } } })` |
| S2 🟠 | `electron/main.js`: adicionar `sandbox: true` nas `webPreferences` do `mainWindow` (e ajustar `preload.js` se necessário)                                                                                                                |
| S4 🟡 | `frontend/src/services/api.ts`: trocar `localStorage.getItem('access_token')` por `sessionStorage` OU cookie httpOnly emitido por `/api/auth/login` — preferir cookie no Electron (backend em 127.0.0.1)                                 |
| S5 🟡 | Criar `NetworkDiscoveryController` (se ainda não há) com `@UseGuards(JwtAuthGuard)` + `@Throttle()` (NestJS throttler) · 1 scan/min/usuário                                                                                              |
| S6 🟡 | Garantir `NEXT_PUBLIC_*` não inclui `SENTRY_DSN` e que o renderer não importa `@sentry/node`                                                                                                                                             |

**Gate:** Playwright e2e de login + navegação · audit de headers HTTP (nenhum `unsafe-inline`).

---

## Wave 3 — Banco de Dados (1 dia)

> 4 achados

Arquivo: `backend/src/prisma/schema.prisma`

```prisma
model TicketPesagem {
  // ...
  @@index([unidadeId])
  @@index([empresaId])
  @@index([criadoEm])
}

model Balanca {
  // ...
  @@index([empresaId, unidadeId])
}

model Empresa {
  documento String   // era String?
  // ...
  @@unique([tenantId, documento])
}

model Veiculo { @@unique([tenantId, placa]) }
model Motorista { @@unique([tenantId, documento]) }
model Usuario { @@unique([tenantId, email]) }
```

Bootstrap Prisma (`backend/src/prisma/prisma.service.ts`):

```ts
await this.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
await this.$executeRawUnsafe('PRAGMA foreign_keys=ON;');
await this.$executeRawUnsafe('PRAGMA synchronous=NORMAL;');
```

| ID    | Ação                                                    |
| ----- | ------------------------------------------------------- |
| D1 🟠 | Adicionar `@@index` em FKs de alto volume               |
| D2 🟠 | `@@unique([tenantId, ...])` nas entidades tenant-scoped |
| D3 🟡 | Pragmas WAL + foreign_keys no PrismaService             |
| D5 🟡 | `Empresa.documento` obrigatório + unique por tenant     |

**Gate:** `pnpm db:migrate` cria migration · seed funciona · testes de integração passam.

---

## Wave 4 — Qualidade de Tramas (1–2 dias)

> 5 achados · polimento funcional dos parsers

| ID     | Ação                                                                                        | Arquivo                                                         |
| ------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| C7 🟡  | Trocar `buffer.toString('ascii')` por `'latin1'` nos parsers que aceitam 8-bit              | `toledo*.parser.ts`, `filizola*.parser.ts`, `generic.parser.ts` |
| C8 🟡  | Implementar verificação de BCC/XOR em Toledo-C e checksum em AFTS; descartar trama inválida | `toledo-c.parser.ts`, `afts.parser.ts`                          |
| C9 🟡  | Retry 1x por IP em `network-discovery` antes de descartar                                   | `network-discovery.service.ts`                                  |
| C10 🟡 | Suporte a ENQ (0x05) em captura TCP                                                         | `capture-raw.service.ts`                                        |
| C12 🟢 | Adicionar `mark` e `space` ao `parityMap`                                                   | `serial.adapter.ts:24`                                          |

**Gate:** specs atualizados + 1 spec novo validando rejeição de trama com checksum inválido.

---

## Wave 5 — Testes e CI (2–3 dias)

> 6 achados · paga dívida técnica e blinda refatorações futuras

### 5.1 Adapters (Q1)

Criar:

- `serial.adapter.spec.ts` — mock do `serialport` via `jest.mock('serialport')`
- `tcp.adapter.spec.ts` — `net.createServer()` real em porta 0
- `modbus.adapter.spec.ts` — mock `modbus-serial`

### 5.2 Frontend (Q2)

- Instalar `@playwright/test` no workspace
- `frontend/e2e/login.spec.ts` · `pesagem-flow.spec.ts` · `romaneio.spec.ts`
- Migrar lógica dos `test-*.js` para Playwright (Q4)

### 5.3 CI (Q3, Q5)

Criar `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: windows-latest # serialport nativo precisa
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm lint:check
      - run: pnpm typecheck:all # <- era typecheck
      - run: pnpm test
      - run: pnpm test:e2e
      - run: pnpm build:all
```

### 5.4 Rebuild nativo (Q6)

`electron/rebuild-native.js`: logar `process.versions.electron`, `process.versions.modules`, e hash do `.node` gerado. Falhar ruidoso se ABI não bater.

**Gate:** pipeline verde · cobertura dos adapters > 70%.

---

## Wave 6 — Arquitetura e Docs (2 dias)

> 4 achados · polimento, fazer por último

### 6.1 Quebrar `frontend/src/services/api.ts` (A1)

1382 linhas → dividir por domínio:

```
api/
├── client.ts           # axios instance + interceptors
├── auth.ts
├── balanca.ts
├── pesagem.ts
├── ticket.ts
├── romaneio.ts
├── cadastros/
│   ├── empresa.ts, unidade.ts, veiculo.ts, motorista.ts, usuario.ts
├── financeiro.ts
├── relatorios.ts
└── index.ts            # re-export público
```

Mover por commit atômico por domínio para facilitar review.

### 6.2 Sub-modularizar `balanca/` (A4)

```
balanca/
├── transport/          # adapters, parsers, config-resolver, auto-detect, capture-raw
├── diagnostics/        # network-discovery, telemetria
├── balanca.service.ts  # CRUD
├── balanca.controller.ts
└── balanca.module.ts
```

### 6.3 README.md executivo (A5)

Seções: Sobre · Stack · Como rodar · Build · Estrutura · Como contribuir · Licença.

### 6.4 Estratégia de migrations em campo (D4)

Documentar em `docs/MIGRATIONS-FIELD.md`:

- No startup do backend (empacotado), rodar `prisma migrate deploy` com `DATABASE_URL=%APPDATA%/.../data.db`.
- Backup automático do `.db` antes de migrar.
- Fallback: se migration falhar, reverter para backup e exibir erro na UI.

**Gate:** build instalador · instalar em VM limpa · migrar de versão anterior.

---

## Sequência de execução

```
Wave 0 (½d) → Wave 1 (3-4d) 🔴 → Wave 2 (1d) → Wave 3 (1d) → Wave 4 (1-2d) → Wave 5 (2-3d) → Wave 6 (2d)
                   ↑
              BLOQUEANTE — nada em produção até aqui
```

### Total estimado

- **Mínimo:** 11 dias
- **Realista:** 13 dias
- **Com buffer:** 15 dias

### Critério "done" do plano

- [ ] 41 achados fechados (ou explicitamente `won't-fix` com justificativa)
- [ ] `.github/workflows/ci.yml` verde em `main`
- [ ] Cobertura dos adapters ≥ 70%
- [ ] Instalação limpa em VM Windows funciona de ponta a ponta
- [ ] Teste de resiliência: derrubar cabo/rede e verificar reconexão automática

---

## Riscos e decisões de produto pendentes

| Decisão                                       | Bloqueia wave | Recomendação                                                       |
| --------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| Política de reconexão (infinita vs. limite)   | Wave 1        | Infinita com alerta na UI a cada 5 tentativas falhas               |
| Persistir leituras brutas (auditoria INMETRO) | Wave 4        | Ativar flag opcional por balança — default off                     |
| Rotação de `JWT_SECRET` em updates            | Wave 2        | Gerar novo secret por instalação; invalidar tokens em update major |
| Token em cookie vs. sessionStorage (S4)       | Wave 2        | Cookie httpOnly (backend local já é 127.0.0.1)                     |

_Fim do plano._
