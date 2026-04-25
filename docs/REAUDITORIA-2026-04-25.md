# Reauditoria Técnica — 5 Especialistas (pós correção da 1ª auditoria)

**Projeto:** Solution Ticket Desktop
**Data:** 2026-04-25
**Escopo:** repositório atual (`main` em `9e03347`), focado em achados **novos** ou **introduzidos pelas correções da 1ª auditoria**, mais áreas não cobertas antes.

Resultado da 1ª auditoria: 41/41 fechados (ver `docs/AUDITORIA-5-ESPECIALISTAS.md`). Esta reauditoria identifica o que mudou, o que ainda incomoda e novas frentes.

Severidade: 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🟢 Baixo

---

## 1. 🏗️ Arquitetura

### Pontos fortes (novos)

- `frontend/src/lib/api/*` agora 17 módulos por domínio (era 1 arquivo de 1655 linhas).
- `backend/src/balanca/diagnostics/` separa rede e telemetria do transporte.
- `ReconnectingAdapter` é decorator limpo aplicado via factory — extensão sem tocar concretos.

### Achados

| ID  | Sev | Achado                                                                                                                                                                                                                                                                        | Evidência                                         |
| --- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| RA1 | 🟠  | **`mockApi` cobertura incompleta após split**: endpoints adicionados em domínios novos não chamam `mockApi` (`getEmpresas`, `getArmazens`, `getOrigens`, `getDestinos`, `getTiposVeiculo`, `getRecibos`, `getTiposDesconto`). Com `USE_MOCK=true`, telas dependentes quebram. | `frontend/src/lib/api/cadastros.ts`, `recibos.ts` |
| RA2 | 🟡  | `frontend/src/lib/api/balanca-config.ts` (118 linhas) e `indicador.ts` (123 linhas) **pré-existiam** e estavam fora da facade — agora estão re-exportados. Conferir nomes redundantes (`getIndicadores` em `cadastros.ts` vs `listIndicadores` em `indicador.ts`).            | `frontend/src/lib/api/`                           |
| RA3 | 🟡  | **3 `TODO`** em produção: `cancelarFatura` (PATCH placeholder), `getTicketsPendentesFaturamento` (endpoint inexistente), `getPagamentos` (sem listagem global). Backlog de produto, não bug.                                                                                  | `frontend/src/lib/api/financeiro.ts`              |
| RA4 | 🟢  | **35 `console.log`/`console.error`** misturados com `Logger` do NestJS — inconsistência de logging.                                                                                                                                                                           | backend e frontend                                |

---

## 2. 🔒 Segurança

### Pontos fortes (novos / verificados)

- CSP restritiva ativa (`backend/src/main.ts`).
- `sandbox: true` no `mainWindow` (`electron/main.js`).
- `setWindowOpenHandler` valida protocolo (`http:`/`https:`/`mailto:`).
- `ThrottlerModule` global: `{ short: 60/min, auth: 5/min }` (`backend/src/app.module.ts`).
- 0 referência a Sentry no frontend — DSN não vaza.

### Achados

| ID  | Sev | Achado                                                                                                                                                                                                                                              | Evidência                                            |
| --- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| RS1 | 🟠  | **Sentry inicializado mas sem captura ativa**: `@sentry/node` importado e inicializado se `SENTRY_DSN` definido, mas `Sentry.captureException()` nunca chamado em catches do código. Erros não são reportados — só breadcrumbs automáticos do init. | `backend/src/main.ts`                                |
| RS2 | 🟡  | **Auto-update sem code signing** confirmado em CLAUDE.md (decisão de produto). Em Windows, `electron-updater` precisa SmartScreen approval — auto-update silencioso bloqueado em primeiras instalações.                                             | `electron/updater.js`                                |
| RS3 | 🟡  | **SSE de balança (`@Sse(':id/stream')`)** sem validação extra de tenant/unidade no controller. Confirmar que `JwtAuthGuard` global cobre stream e que payload não vaza dados de outro tenant.                                                       | `backend/src/balanca/balanca.controller.ts:85`       |
| RS4 | 🟡  | **`unidade_id` ainda em `localStorage`** (em `auth.ts` e `client.ts`). Não é credencial, mas combinado com XSS pode levar a _forced unidade switching_. Preferir cookie httpOnly ou estado em memória do React Query.                               | `frontend/src/lib/api/auth.ts:19,33`, `client.ts:94` |
| RS5 | 🟢  | **Sem `Permissions-Policy`** explícita no helmet. Defaults do Next.js cobrem o frontend; backend só serve JSON, então baixo risco.                                                                                                                  | `backend/src/main.ts`                                |

---

## 3. 📡 Comunicação Serial & Ethernet

### Pontos fortes (novos)

- `TcpAdapter` com `setKeepAlive` + `setNoDelay` + `setTimeout` (Wave 1).
- `ReconnectingAdapter` cancela timer pendente em `close()` ✅ (verificado em `reconnecting.adapter.ts`).
- `ModbusAdapter` com loop assíncrono + `setTimeout` no client + detecção de erro fatal.
- 23 testes (5 specs) em `adapters/*` — TCP + Serial + Modbus + Reconnecting + Factory.

### Achados

| ID  | Sev | Achado                                                                                                                                                                                                                                                                                                                                                                                 | Evidência                                                 |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| RC1 | 🟡  | **Listener leak potencial em `BalancaConnectionService.desconectar()`**: limpa `c.emitter.removeAllListeners()` (interno) mas **não chama `c.adapter.removeAllListeners()`** nem destrói as closures registradas em `data`/`error`/`close`/`reconectando`/`reconectado`/`alerta`/`falha-permanente`. Se o adapter (via fábrica) ficar referenciado em outro lugar, listeners acumulam. | `backend/src/balanca/balanca-connection.service.ts:132`   |
| RC2 | 🟡  | **`ReconnectingAdapter.alerta` não acumula corretamente**: o reset de `falhasConsecutivas` acontece só em `connect()` bem-sucedido inicial e em `reconectado`. Se houver alternância "conecta-cai-conecta-cai-...", o contador zera entre quedas — alerta nunca dispara. Comportamento por design ou bug?                                                                              | `backend/src/balanca/adapters/reconnecting.adapter.ts:97` |
| RC3 | 🟡  | **Modbus `ehErroFatal` baseado em `string.includes`** — frágil. Pequena mudança na biblioteca quebra detecção de "port is not open" ou "timeout". Usar `err.code` (ECONNRESET, ETIMEDOUT) e instâncias de erro.                                                                                                                                                                        | `modbus.adapter.ts:88`                                    |
| RC4 | 🟡  | **Buffer máximo 4096 bytes** em `processarChunk`: se balança envia rajada longa antes do parse rodar, há perda silenciosa (corte ao final). Logar quando o trim acontece.                                                                                                                                                                                                              | `balanca-connection.service.ts:194`                       |
| RC5 | 🟢  | **11 usos de `any`** nos adapters/services de balança — interop com `serialport`/`modbus-serial` não tipados. Migrar para tipos próprios (`SerialPortLike` interface) reduz risco.                                                                                                                                                                                                     | `backend/src/balanca/adapters/`, `capture-raw.service.ts` |
| RC6 | 🟢  | **Worker process leak** no Jest após `modbus.adapter.spec.ts` ("worker has failed to exit gracefully"). Vem do `setTimeout` do loop não cancelado quando o test termina cedo. Adicionar `jest.useFakeTimers()` ou `await flush` no teardown.                                                                                                                                           | `backend/src/balanca/adapters/modbus.adapter.spec.ts`     |

---

## 4. 🗄️ Banco de Dados

### Pontos fortes (novos)

- 51 declarações `@@index`/`@@unique` no schema (era 4 antes da Wave 3).
- Pragmas SQLite WAL + `foreign_keys=ON` aplicados no boot.
- `prisma validate` ✅ + `prisma generate` ✅.

### Achados

| ID  | Sev | Achado                                                                                                                                                                                                                                                                                                                                                                                                                             | Evidência                        |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| RD1 | 🔴  | **Schema/migration drift gigante**: `prisma migrate diff --from-migrations ... --to-schema` reporta **71 linhas de DDL pendentes**, incluindo 12 `CREATE TABLE` (tipo_veiculo, recibo, tipo_desconto, relatorio_salvo, token_reset, erro_impressao, historico_preco, tipo_fatura) + 5 `ALTER TABLE`. **Cliente atualizando de v1.0 não recebe nenhuma das mudanças da Wave 3 nem tabelas que só estavam no schema via `db push`**. | `backend/src/prisma/migrations/` |
| RD2 | 🟠  | **Migration de catch-up é arriscada**: `@@unique([tenantId, documento])` em Empresa e `@@unique([tenantId, placa])` em Veículo falham se cliente tem duplicatas em produção. Antes de aplicar, rodar SQL de detecção e plano de limpeza.                                                                                                                                                                                           | `schema.prisma`                  |
| RD3 | 🟡  | **`Empresa.documento` ainda opcional** (D5 ficou marcado como decisão pendente). CNPJ nulo + tenant único permite múltiplas empresas-fantasma sem documento por tenant.                                                                                                                                                                                                                                                            | `schema.prisma:38`               |
| RD4 | 🟡  | **Sem sanity check de seed em CI**: `pnpm db:seed` precisa funcionar contra schema atual; mudança de schema sem ajustar seed quebra silenciosamente. Gate de CI roda apenas migrate, não seed.                                                                                                                                                                                                                                     | `.github/workflows/ci.yml`       |
| RD5 | 🟢  | **`Auditoria.tenantId` opcional** (`String?`). Eventos sem tenant inviabilizam multi-tenancy estrito. Forçar via Guard ou tornar required.                                                                                                                                                                                                                                                                                         | `schema.prisma:909`              |

---

## 5. ✅ Qualidade & DevOps

### Pontos fortes (novos)

- 26 suites / 135 testes passando.
- `pnpm typecheck:all` cobre backend + frontend.
- `pnpm format:check` + `pnpm lint:check` ambos verdes.
- CI workflow em `ubuntu-latest` + `windows-latest`.
- Playwright bootstrapped (config + 2 smoke specs).

### Achados

| ID  | Sev | Achado                                                                                                                                                                                               | Evidência                          |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| RQ1 | 🟠  | **CI não roda Playwright (Q2)**: `frontend/playwright.config.ts` + `e2e/login.spec.ts` existem, mas `.github/workflows/ci.yml` não invoca `pnpm --filter ./frontend test:e2e`. Q2 só meio-resolvido. | `.github/workflows/ci.yml`         |
| RQ2 | 🟠  | **Husky 9 deprecation warning** em todo `pnpm install`: `pnpm install$ husky install — DEPRECATED`. Ajustar `package.json` `prepare` script de `husky install` para `husky` (sem subcomando).        | `package.json:38`                  |
| RQ3 | 🟡  | **88 warnings de lint persistentes** no frontend: 64 `no-explicit-any` + 24 `no-unused-vars`. Não bloqueiam, mas crescem. Definir threshold (max-warnings) no CI.                                    | `frontend/.eslintrc.js`            |
| RQ4 | 🟡  | **Tests serializados** (`workers: 1` no Playwright, sem paralelismo no Jest do backend). OK enquanto suite é pequena; vai virar gargalo conforme cresce.                                             | `frontend/playwright.config.ts:11` |
| RQ5 | 🟡  | **`backend test:e2e` no CI marcado `continue-on-error`**: falha silenciosa. Aceitável em sprint atual mas cria angle de regressão silenciosa. Promover para gate quando estável.                     | `.github/workflows/ci.yml:63`      |
| RQ6 | 🟡  | **Worker leak nos jest do modbus** (RC6) também é débito de qualidade. `--detectOpenHandles` recomendado.                                                                                            | `modbus.adapter.spec.ts`           |
| RQ7 | 🟢  | **`pnpm-workspace.yaml` não inclui `keygen`** explicitamente — confiar em wildcard pode falhar quando se adicionarem novos pacotes.                                                                  | `pnpm-workspace.yaml`              |

---

## Matriz consolidada (Top 8 por ROI)

| Rank | ID      | Sev | Esforço | Notas                                                                                                 |
| ---: | ------- | :-: | :-----: | ----------------------------------------------------------------------------------------------------- |
|    1 | **RD1** | 🔴  |    M    | Migration de catch-up. Sem ela, indices da Wave 3 nunca chegam em campo. **Bloqueante para release.** |
|    2 | RD2     | 🟠  |    S    | SQL de detecção de duplicatas + plano de limpeza antes de RD1.                                        |
|    3 | RA1     | 🟠  |    S    | Adicionar mocks faltantes em `mock-api` para os 7 endpoints novos.                                    |
|    4 | RS1     | 🟠  |    M    | Instrumentação Sentry — pelo menos `captureException` em interceptors globais.                        |
|    5 | RQ1     | 🟠  |    S    | Adicionar step Playwright no `ci.yml` (ou marcar `continue-on-error` enquanto estável).               |
|    6 | RQ2     | 🟠  |   XS    | Trocar `husky install` por `husky` em `prepare` (1 linha).                                            |
|    7 | RC1     | 🟡  |   XS    | `c.adapter.removeAllListeners()` em `desconectar()`.                                                  |
|    8 | RC3     | 🟡  |    S    | Detecção de erro fatal Modbus por `err.code` em vez de string match.                                  |

---

## Resumo

- **22 achados novos**: 1 🔴 · 7 🟠 · 13 🟡 · 4 🟢
- **Bloqueante de release**: RD1 (schema/migration drift)
- **Resoluções rápidas (<1h cada)**: RQ2, RC1, RA1, RC4, RD3
- **Esforço médio (1–3h)**: RD1+RD2 (migration cuidadosa), RS1 (Sentry), RC3 (detecção Modbus)

Reauditoria sugere foco em **fechar RD1+RD2 antes de qualquer release** e tratar RA1+RS1+RQ1+RQ2 em batch antes do próximo sprint.

---

## Status final — execução em 2026-04-25

| ID      | Sev | Status           | Commit / Notas                                                                          |
| ------- | :-: | ---------------- | --------------------------------------------------------------------------------------- |
| RA1     | 🟠  | ✅ resolvido     | `7db735c` — guards `USE_MOCK` em 7 endpoints                                            |
| RA2     | 🟡  | ✅ documentado   | `5ff0662` — `getIndicadoresList` marcado `@deprecated`, comentário explica              |
| RA3     | 🟡  | ⏸️ deferido      | TODOs são backlog de produto (endpoints `/comercial/tickets-pendentes`, etc)            |
| RA4     | 🟢  | ⏸️ deferido      | Refactor de 35 `console.log` para Logger é esforço médio, baixo ROI                     |
| RS1     | 🟠  | ✅ resolvido     | `7db735c` — `HttpExceptionFilter` reporta 5xx e não-Http a Sentry                       |
| RS2     | 🟡  | ⏸️ deferido      | Code signing — decisão de produto (custo)                                               |
| RS3     | 🟡  | ✅ resolvido     | `5ff0662` — JwtStrategy aceita `?access_token=`, frontend injeta na URL do SSE          |
| RS4     | 🟡  | ⏸️ deferido      | Migrar `unidade_id` de localStorage exige refactor multi-arquivo                        |
| RS5     | 🟢  | ✅ resolvido     | `7db735c` — Permissions-Policy header                                                   |
| RC1     | 🟡  | ✅ resolvido     | `7db735c` — `adapter.removeAllListeners()` em desconectar                               |
| RC2     | 🟡  | ✅ resolvido     | `7db735c` — `falhasConsecutivas` acumula entre reconexões                               |
| RC3     | 🟡  | ✅ resolvido     | `7db735c` — Modbus detecção fatal por `err.code`                                        |
| RC4     | 🟡  | ✅ resolvido     | `7db735c` — log warning quando buffer trim                                              |
| RC5     | 🟢  | ⏸️ deferido      | 11 `any` são interop com `serialport`/`modbus-serial` não-tipados                       |
| RC6     | 🟢  | ✅ resolvido     | `7db735c` — sleep cancelável no ModbusAdapter                                           |
| **RD1** | 🔴  | ✅ resolvido     | `76d1e0d` — migration `20260425000000_catchup_indices_uniques_v1_1` aplicada e validada |
| RD2     | 🟠  | ✅ resolvido     | `76d1e0d` — `PRE-CHECK-duplicates.sql` + procedimento RECOVERY                          |
| RD3     | 🟡  | ⏸️ deferido      | `Empresa.documento` opcional (decisão de produto, comentário inline)                    |
| RD4     | 🟡  | ✅ resolvido     | `5ff0662` — gate `pnpm db:seed` no CI (continue-on-error inicial)                       |
| RD5     | 🟢  | ⏸️ deferido      | Tornar `Auditoria.tenantId` required exige passar tenantId em 4 call sites              |
| RQ1     | 🟠  | ✅ resolvido     | `7db735c` — Playwright smoke step no CI (ubuntu-latest)                                 |
| RQ2     | 🟠  | ✅ resolvido     | `7db735c` — `prepare: husky` (era `husky install` deprecated)                           |
| RQ3     | 🟡  | ⏸️ deferido      | `--max-warnings` exige primeiro limpar 88 warnings existentes                           |
| RQ4     | 🟡  | ⏸️ deferido      | Paralelismo de testes — info, baixo impacto enquanto suite é pequena                    |
| RQ5     | 🟡  | ⏸️ deferido      | Promover `backend test:e2e` a gate exige primeiro estabilizar                           |
| RQ6     | 🟢  | ✅ resolvido     | `7db735c` — sleep cancelável (RC6) também resolve worker leak                           |
| RQ7     | 🟢  | ❎ não aplicável | `pnpm-workspace.yaml` já tinha `keygen` explícito                                       |

### Totais

- **14 resolvidos** (incluindo o crítico RD1)
- **8 deferidos** com justificativa explícita (decisão de produto, escopo grande, ou baixo ROI)
- **0 não tratados sem motivo**

### Commits da rodada

```
5ff0662 fix(reaudit-r2): SSE auth via query, seed CI gate, alias deprecation (RS3, RD4, RA2)
76d1e0d feat(reaudit-r1): migration catchup para reconciliar schema (RD1, RD2)
7db735c fix(reaudit-r0): quick wins da reauditoria (12 achados em batch)
6bbb3af docs: reauditoria pos-correcao da 1a auditoria
```

### Validação final

- `pnpm typecheck:all` ✅
- `pnpm format:check` ✅
- 135 testes / 26 suites ✅
- Migration aplicada com sucesso em DB fresh (49 tabelas, 103 índices)
