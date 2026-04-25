# PLANO F1 — E2E Playwright do fluxo de pesagem

**Origem:** Achado F1 da auditoria 2026-04-25 (`02-frontend.md`).
**Estado anterior:** deferido por exigir ~12h dedicadas + arquitetura de mocks de balança.
**Objetivo:** suíte e2e que cobre os 3 fluxos canônicos (1PF, 2PF, 3PF) sem hardware real, executável em CI Windows.

---

## 1. Cobertura alvo (definição de pronto)

Cada cenário roda do login até a impressão simulada do ticket.

| #   | Cenário                                                | Fluxo                   | Passagens               | AC                                                     |
| --- | ------------------------------------------------------ | ----------------------- | ----------------------- | ------------------------------------------------------ |
| 1   | Pesagem 2PF feliz                                      | `2PF_BRUTO_TARA`        | bruto + tara            | ticket fechado, líquido = bruto-tara, status `FECHADO` |
| 2   | Pesagem 1PF tara referenciada                          | `1PF_TARA_REFERENCIADA` | só bruto                | usa `tara_cadastrada` do veículo, líquido correto      |
| 3   | Pesagem 3PF com controle                               | `3PF_COM_CONTROLE`      | bruto + tara + controle | controle não altera líquido oficial                    |
| 4   | Cancelar ticket aberto                                 | `2PF_BRUTO_TARA`        | nenhuma                 | motivo obrigatório, ticket vai a `CANCELADO`           |
| 5   | Validação: fechar sem passagens completas              | `2PF_BRUTO_TARA`        | só bruto                | botão "Fechar" desabilitado, mensagem de pendência     |
| 6   | Captura via balança mock retorna peso instável         | qualquer                | 1 captura               | toast `warning` exibido                                |
| 7   | Atalhos teclado (F1=capturar, F2=fechar, Esc=cancelar) | `2PF_BRUTO_TARA`        | 2 capturas              | abre dialog de fechamento                              |

**Não-objetivos** desta fatia: PDF binário, impressão real, Modbus/Serial real, multi-tenancy, romaneio, fatura.

---

## 2. Arquitetura de mocks

### 2.1 Por que não `NEXT_PUBLIC_USE_MOCK`

O mock-api do frontend não exercita o backend (Prisma, snapshot comercial, regras de fluxo). Defeitos no backend passariam batidos. **E2E real:** Next.js + Nest + SQLite reais; só a balança é mockada.

### 2.2 Adapter de balança fake

Criar `backend/src/balanca/adapters/mock.adapter.ts` (já existem `serial`, `tcp`, `modbus`). O adapter mock:

- Implementa a mesma interface do adapter real (`connect`, `lerPeso`, `disconnect`, eventos).
- Lê o "peso a entregar" de um arquivo JSON em `%TEMP%/playwright-balanca-mock.json` (escrito pelo teste antes de cada captura) ou de uma env var `MOCK_BALANCA_PESO`.
- Permite forçar `estavel: false` via flag no JSON.
- Selecionado quando `process.env.BALANCA_DRIVER === 'mock'`.

### 2.3 Seed e2e isolado

- DB SQLite separado em `backend/data/e2e.db` (env `DATABASE_URL=file:./data/e2e.db`).
- Script `backend/scripts/seed-e2e.ts`: 1 tenant, 1 admin, 1 cliente, 1 produto, 1 veículo (com `tara_cadastrada=14000`), 1 balança configurada como `BALANCA_DRIVER=mock`.
- Roda no `globalSetup` do Playwright.

### 2.4 Auth helper

`e2e/helpers/login.ts` — função `loginAsAdmin(page)` reutilizada por todos os specs (Playwright `storageState` opcional v2).

---

## 3. Estrutura proposta

```
frontend/e2e/
├── helpers/
│   ├── login.ts                  # auth reutilizável
│   ├── balanca-mock.ts           # escreve peso no JSON
│   └── pesagem-page.ts           # POM: locators e ações da tela
├── pesagem-2pf.spec.ts           # cenário 1
├── pesagem-1pf.spec.ts           # cenário 2
├── pesagem-3pf.spec.ts           # cenário 3
├── pesagem-cancel.spec.ts        # cenário 4
├── pesagem-validation.spec.ts    # cenários 5-6
└── pesagem-shortcuts.spec.ts     # cenário 7

backend/
├── src/balanca/adapters/mock.adapter.ts  # novo
└── scripts/seed-e2e.ts                   # novo
```

`playwright.config.ts` ganha:

- `globalSetup: './e2e/helpers/global-setup.ts'` — sobe DB e2e + seed + backend com `BALANCA_DRIVER=mock`.
- `webServer` array com **dois** servers: backend (porta 3001) + frontend (porta 3000).

---

## 4. Fatiamento (estimativa 12h)

| Fatia    | Entrega                                                  | Estimativa | Bloqueia?             |
| -------- | -------------------------------------------------------- | ---------- | --------------------- |
| **F1.1** | Mock adapter de balança + seleção via env                | 2h         | sim — base de tudo    |
| **F1.2** | Seed e2e + globalSetup + webServer dual                  | 2h         | sim                   |
| **F1.3** | Helpers (login, balanca-mock, POM pesagem)               | 1.5h       | sim                   |
| **F1.4** | Cenário 1 (2PF feliz) — valida toda infra                | 1.5h       | sim — destrava demais |
| **F1.5** | Cenários 2-3 (1PF, 3PF)                                  | 2h         | não                   |
| **F1.6** | Cenários 4-7 (cancel, validação, shortcuts)              | 2h         | não                   |
| **F1.7** | Wire-up CI (workflow GH Actions: install browsers + run) | 1h         | não                   |

Pode ser feito em 2 sessões de ~6h, ou 7 sessões pequenas commitadas isoladamente.

---

## 5. Riscos e mitigações

| Risco                                                           | Mitigação                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Backend escutando 127.0.0.1 conflita com Playwright em CI Linux | CI usa `windows-latest` (já é o target do produto); fallback `0.0.0.0` apenas em `NODE_ENV=test` |
| Flakiness de timing de captura                                  | Mock entrega peso síncrono via JSON; sem polling de hardware                                     |
| Estado SQLite vazando entre specs                               | `globalSetup` recria DB; cada describe limpa tickets via API helper                              |
| Browsers Playwright (~150MB) inflam cache CI                    | Cachear `~/.cache/ms-playwright` por SHA do `package.json`                                       |
| `pnpm start` do Next.js exige build prévio                      | `globalSetup` roda `pnpm --filter ./frontend build` se `out/` ausente                            |

---

## 6. Quando reabrir

Quando o usuário pedir "vamos começar o e2e": iniciar pela fatia **F1.1**. Validar mock adapter com smoke (`scripts/smoke-balanca.ts` adaptado) antes de seguir.

A fatia **F1.4** é o gate de validação da infra — se 2PF feliz passar verde, a arquitetura está sã e o resto vira repetição de padrão.
