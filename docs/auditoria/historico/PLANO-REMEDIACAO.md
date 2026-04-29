# Plano de Remediação — Solution Ticket Desktop

> ⚠️ **ARQUIVADO 2026-04-27** — substituído por `auditoria/SNAPSHOT-FINAL-2026-04-27.md` e auditorias 10-agentes (Rodadas 1-5). Mantido como referência histórica. Refs a `docs/SECRETS.md` e `docs/CODING-STYLE.md` aqui não foram criadas.

**Data:** 2026-04-24
**Base:** Auditoria consolidada (arquitetura, segurança, qualidade, testes/CI, domínio)
**Objetivo:** resolver 100% dos achados — crítico, alto, médio e menor — antes do go-live em produção.

---

## Visão geral — 5 Sprints (~10 semanas)

| Sprint | Foco                                        | Duração | Bloqueia produção? |
| ------ | ------------------------------------------- | ------- | ------------------ |
| S1     | Segurança crítica + secrets                 | 1 sem   | **SIM**            |
| S2     | CI/CD + quality gates + testes core         | 2 sem   | **SIM**            |
| S3     | Qualidade de código + refatorações          | 2 sem   | Não                |
| S4     | Hardware real + migrations + backup         | 2 sem   | **SIM**            |
| S5     | UX/domínio (gaps PesoLog) + observabilidade | 3 sem   | Não                |

---

## SPRINT 1 — Segurança Crítica (1 semana) 🔴 BLOQUEADOR

### S1.1 — Secrets e JWT

- [ ] Remover `.env` do repositório (`git rm --cached .env` + `.gitignore`).
- [ ] Rotacionar `JWT_SECRET`: gerar 256-bit aleatório (`openssl rand -base64 48`).
- [ ] Remover fallback hardcoded em `backend/src/auth/jwt.strategy.ts:11` — lançar erro se env ausente.
- [ ] Criar `.env.example` com placeholders documentados.
- [ ] Documentar processo de provisionamento de secrets em `docs/SECRETS.md`.

### S1.2 — Credenciais e tokens

- [x] Seed rejeita senhas fracas (`123456`, `changeme`) e exige `SEED_DEFAULT_PASSWORD` via env.
- [ ] Reset token: migrar para `crypto.randomBytes(32).toString('hex')`, TTL 15min, single-use, hash armazenado.
- [ ] Remover `console.log('[RESET] Token...')` em `auth.service.ts`.
- [ ] Enviar token via canal externo (email/SMS); em dev, logger.debug com flag explícita.

### S1.3 — Dependências com CVE

- [ ] `pnpm up axios@latest` (frontend) — validar breaking changes.
- [ ] `pnpm up multer@^2` (backend) — validar API de upload.
- [ ] Rodar `pnpm audit --prod` e tratar todos HIGH/CRITICAL.
- [ ] Adicionar `pnpm audit` ao pipeline (Sprint 2).

### S1.4 — Hardening HTTP

- [ ] Rate-limit no `/auth/login` e `/auth/login-direct` (`@nestjs/throttler`: 5 req/min por IP).
- [ ] Remover endpoint duplicado `/auth/login-direct` se não usado.
- [ ] Resposta genérica em `requestPasswordReset` (evitar enumeration): sempre 200 + mensagem neutra, tempo constante.
- [ ] CORS restrito: apenas origem do Electron (`app://./`) + localhost dev; remover wildcards.
- [ ] Desabilitar Swagger `/api/docs` em produção (`NODE_ENV === 'production'`).
- [ ] Headers: adicionar `helmet()` no `main.ts`.

**Critério de saída S1:** `pnpm audit` limpo, nenhum secret versionado, rate-limit ativo, testes de autenticação passando.

---

## SPRINT 2 — CI/CD + Quality Gates + Testes Core (2 semanas) 🔴 BLOQUEADOR

### S2.1 — Quality gates locais

- [ ] Instalar `husky` + `lint-staged`.
- [ ] Pre-commit: `eslint --fix` + `prettier --write` + `tsc --noEmit` (arquivos staged).
- [ ] Pre-push: `pnpm test` (unit) + `pnpm build`.
- [ ] `.eslintrc.js` explícito (backend e frontend) com `@typescript-eslint/recommended` + `strict`.
- [ ] `.prettierrc` compartilhado na raiz.
- [ ] `tsconfig.json`: habilitar `"strict": true`, `"noUncheckedIndexedAccess": true`.

### S2.2 — GitHub Actions

- [ ] `.github/workflows/ci.yml`: lint + typecheck + test + build em PR e push na main.
- [ ] Matrix: Node 20 LTS, Windows + Linux (Electron é Win, backend roda em ambos).
- [ ] `.github/workflows/release.yml`: tag `v*` → build Electron + upload ao GitHub Releases.
- [ ] Cache pnpm store + Prisma generate.
- [ ] Status checks obrigatórios na branch `main`.

### S2.3 — Testes core (cobertura mínima 60% nos módulos críticos)

- [ ] `ticket.service.spec.ts` — expandir: criação, passagens, cálculo peso líquido, descontos, cancelamento, status machine.
- [ ] `balanca/parsers/*.spec.ts` — cobrir Toledo, Filizola, Modbus, Genérico (hoje só SICS + genérico).
- [ ] `balanca/adapters/*.spec.ts` — mockar serialport/net para Serial/TCP/Modbus adapters.
- [ ] `comercial.service.spec.ts` — precificação (geral → cliente), frete, umidade, snapshot.
- [ ] `fatura.service.spec.ts` + `romaneio.service.spec.ts` — ciclo financeiro.
- [ ] `auth.service.spec.ts` — expandir: rate-limit, reset flow, refresh token.
- [ ] `licenca.service.spec.ts` — validação RSA, fingerprint, expiração.
- [ ] E2E crítico (Jest + supertest): login → criar ticket → pesagem → fechar → imprimir.
- [ ] Meta: `pnpm test --coverage` ≥ 60% global, ≥ 80% em `ticket`, `balanca`, `auth`, `licenca`.

**Critério de saída S2:** CI verde em PR, pre-commit bloqueando código sujo, cobertura meta atingida.

---

## SPRINT 3 — Qualidade de Código (2 semanas)

### S3.0 — Limpar 38 erros TS pré-existentes no frontend (descoberto em S2)

- [ ] Resolver erros `pesagens_hoje`, `tickets_em_aberto` etc em `app/(authenticated)/page.tsx` — tipar retorno do dashboard.
- [ ] `mockApi.login` signature divergente em `lib/api.ts:162`.
- [ ] Componentes UI sem `children` obrigatório (TableHeaderProps, TableCellProps).
- [ ] Após zerar, remover `continue-on-error: true` do passo "Typecheck (frontend)" em `.github/workflows/ci.yml`.

### S3.1 — Centralizar enums e status

- [ ] Criar `backend/src/constants/ticket-status.ts` com `as const` + tipos derivados.
- [ ] Substituir todas magic strings `'RASCUNHO'`, `'ABERTO'`, `'CANCELADO'` em `ticket.service.ts:11-78` e callers.
- [ ] Mesmo para `StatusComercial`, `FluxoPesagem`, `PapelCalculo`.
- [ ] Exportar tipos compartilhados em `packages/shared-types/` (ou `frontend/src/types` re-exportando).

### S3.2 — Split do God Object

- [ ] `frontend/src/lib/api.ts` → separar em `api/tickets.ts`, `api/financeiro.ts`, `api/cadastros.ts`, `api/balanca.ts`, `api/relatorios.ts`, `api/auth.ts`.
- [ ] Manter `api/client.ts` com Axios instance + interceptors (auth, retry, error).
- [ ] `frontend/src/types/index.ts` (549 linhas) → dividir por domínio.
- [ ] `frontend/src/lib/mock-api.ts` → extrair fixtures para `__fixtures__/` + adapter sobre o mesmo contrato da `api/`.

### S3.3 — Quebrar páginas monolíticas (parcial; concluir em S5 com validação visual)

- [x] Estrutura `components/financeiro/` criada com `TabHeader.tsx` extraído.
- [ ] `app/(authenticated)/financeiro/page.tsx` (892 linhas) → extrair `<FaturasTab>` (462 linhas), `<PagamentosTab>` (178 linhas), `<SaldosTab>` (195 linhas) — adiar para S5: requer teste visual no Electron por usar dialogs/queries acoplados.
- [ ] `app/(authenticated)/pesagem/page.tsx` (752 linhas, 12 useStates) → hook `usePesagemFilter()` + `<PesagemTable>` + `<PesagemFilters>` — adiar para S5 (state machine de pesagem é crítica, exige TDD/visual).
- [ ] Estado compartilhado: Zustand store por domínio (`stores/pesagem.ts`, `stores/financeiro.ts`).

### S3.4 — Logging e error handling

- [ ] Substituir `console.log` por `Logger` do NestJS em todo backend (grep lista ~10 ocorrências).
- [ ] Frontend: instalar `pino` ou custom logger; remover `console.*` fora de `logger.ts`.
- [ ] Tratar catch vazios em `relatorios.service.ts:30-45, 99-180` — `logger.warn(err)` + fallback explícito.
- [ ] Middleware global de exceção NestJS com formato padronizado.

### S3.5 — Seed e código duplicado

- [ ] `prisma/seed.ts` → extrair `createTenant()`, `createCompany()`, `createUnit()` reutilizáveis.
- [ ] Remover código comentado e TODOs antigos (grep `TODO|FIXME|XXX`).
- [ ] Normalizar naming: definir guia (domínio em PT, infra em EN) em `docs/CODING-STYLE.md`.

**Critério de saída S3:** ESLint sem warnings, nenhum `console.log` fora de `logger.ts`, nenhuma página > 300 linhas.

---

## SPRINT 4 — Produção-ready: Hardware, Migrations, Backup (2 semanas) 🔴 BLOQUEADOR

### S4.1 — Migrations formais Prisma

- [ ] Gerar migration inicial: `prisma migrate dev --name init` (baseline do schema atual).
- [ ] Substituir `db push` por `migrate deploy` no startup de produção.
- [ ] Script `pnpm db:migrate:prod` + documentar rollback.
- [ ] CI: validar que `prisma migrate diff` está vazio (schema ↔ migrations em sync).

### S4.2 — Backup automático SQLite

- [ ] Job cron interno (NestJS `@nestjs/schedule`): backup diário 23:00 em `%APPDATA%/solution-ticket/backups/`.
- [ ] Retenção: 30 diários + 12 mensais.
- [ ] Endpoint admin `/backup/create` e `/backup/restore` (protegido por role).
- [ ] Checksum SHA-256 em cada backup + teste de integridade (`PRAGMA integrity_check`).
- [ ] Documentar DR em `docs/DISASTER-RECOVERY.md`.

### S4.3 — Testes em hardware real

- [ ] Setup de lab: 1 balança Toledo 9091 (Serial), 1 WEIGHTECH (TCP), 1 Modbus (ALFA 3102).
- [ ] Smoke test documentado por modelo: conectar → capturar → estabilidade → desconectar.
- [ ] Corrigir parsers conforme bugs reais encontrados.
- [ ] Documentar matriz de compatibilidade em `docs/HARDWARE-COMPATIBILITY.md`.

### S4.4 — Distribuição Electron

- [ ] Code signing (certificado EV Windows) — resolver SmartScreen.
- [ ] Auto-update via `electron-updater` + GitHub Releases.
- [ ] Semver rigoroso + CHANGELOG automatizado (`changesets` ou similar).
- [ ] Instalador NSIS testado em Windows 10 e 11 limpos.

**Critério de saída S4:** deploy em 1 cliente piloto funcionando, backup restaurado com sucesso em ambiente separado.

---

## SPRINT 5 — Domínio, UX e Observabilidade (3 semanas)

### S5.1 — Gaps funcionais vs PesoLog

- [ ] **Câmera/OCR de placa:** módulo `camera/` (controller + service), integração com webcam via Electron + OCR (Tesseract ou cloud). UI em tela de pesagem.
- [ ] **Semáforo/cancela:** módulo `automacao/` com adapter GPIO/Modbus, state machine (verde/vermelho), logs de comando.
- [ ] **Assinatura digital:** campo `assinaturaBase64` em PassagemPesagem + componente canvas no frontend + impressão no ticket.
- [ ] **Templates de ticket faltantes:** portar 8 variantes restantes (TICKET002/004/005) — avaliar migrar pdfkit → pdfmake ou react-pdf para mais flexibilidade visual.
- [ ] **Romaneio completo:** agrupamento de tickets, totalizadores, integração fatura, exportação fiscal.
- [ ] **Exportação Excel:** `exceljs` nos relatórios (além de PDF).

### S5.2 — Observabilidade

- [ ] Logs estruturados JSON (pino no backend, com requestId correlacionado).
- [ ] Health check `/health` (DB, disco, balanças conectadas) + `/ready`.
- [ ] Error tracking: Sentry (backend + Electron) com source maps.
- [ ] Métricas básicas: pesagens/dia, tickets por status, tempo médio de pesagem (endpoint `/metrics` + dashboard simples).
- [ ] Auditoria: UI de consulta com filtros (usuário, entidade, data) — já existe schema, falta tela.

### S5.3 — UX operacional

- [ ] Revisão da tela de pesagem com operador real (usability test).
- [ ] Atalhos de teclado para fluxo sem mouse (F1=capturar, F2=fechar, F3=imprimir).
- [ ] Feedback visual de conexão da balança (verde/vermelho + última leitura).
- [ ] Modo "quiosque" (Electron fullscreen, sem menu) para balanças desacompanhadas.

**Critério de saída S5:** paridade funcional declarada vs PesoLog em `docs/AUDITORIA-PESOLOG-vs-SOLUTION-TICKET.md` atualizado, Sentry recebendo eventos, piloto validando UX.

---

## Resumo por severidade (rastreabilidade)

| Severidade          | Achados                                                                                                                                     | Sprint  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 🔴 Crítica (4)      | JWT hardcoded, fallback JWT, senha seed, reset token fraco                                                                                  | S1      |
| 🔴 Alta (4)         | PII em logs, Multer CVE, Axios CVE, validação fraca                                                                                         | S1 + S3 |
| 🟠 Média/CI (7)     | Zero CI, sem Docker, sem hooks, lint parcial, ESLint config, E2E, observabilidade                                                           | S2 + S5 |
| 🟠 Média/Sec (4)    | CORS, user enum, DATABASE_URL, no rate-limit                                                                                                | S1      |
| 🟡 Código (10)      | God object, páginas grandes, magic strings, catch vazio, mock duplicado, tipos mono, naming, seed duplicado, console.log, status as strings | S3      |
| 🟡 Arquitetura (10) | Migrations, backup, hardware real, 8 templates, code signing, auto-update, câmera, cobertura, docs balança, ciclos de dep                   | S4 + S5 |
| 🟡 Baixa (2)        | NODE_ENV exposto, Swagger aberto                                                                                                            | S1      |

**Total:** 41 achados endereçados.

---

## Governança

- **Branch strategy:** feature branches → PR → CI verde → merge main. Tags `v*` disparam release.
- **Definition of Done por item:** código + teste + doc + CI verde + revisão.
- **Reuniões:** checkpoint semanal de sprint, retro ao fim de cada sprint.
- **Riscos:** hardware real pode revelar bugs nos parsers (buffer S4 em +1 semana); code signing exige certificado EV (comprar com antecedência).

---

## Próximo passo imediato

Iniciar S1.1 — rotação de `JWT_SECRET` e remoção do `.env` do repositório. Confirmar antes de executar `git rm --cached .env` (ação irreversível no histórico sem rewrite).
