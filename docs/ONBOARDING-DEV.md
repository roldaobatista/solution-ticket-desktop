# Onboarding de Dev — Roteiro D1-D5

> Owner: Tech Lead | Última revisão: 2026-04-27 | Versão: 1.0
> Audiência: dev novo (backend/frontend/full-stack) entrando no Solution Ticket Desktop.
> Objetivo: na sexta-feira da 1ª semana o dev rodou o app local, leu ~30 documentos core e abriu seu 1º PR.

---

## Critério de "primeira semana feita"

- [ ] Subiu o app localmente (`pnpm dev` + Electron) e fez login com seed.
- [ ] Leu os 30 documentos listados abaixo (D1-D4).
- [ ] Abriu **1 PR** (mesmo que pequeno: typo em doc, teste extra, refactor pontual).
- [ ] Conseguiu explicar em 5 minutos: o que é Outbox, por que JSONata e como roda o licenciamento RSA.

---

## D1 — Contexto e vocabulário (≈ 3h)

| Doc                                                | Tempo  | Para quê                                                   |
| -------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `../CLAUDE.md` (raiz)                              | 30 min | Stack, comandos, convenções. **Leitura obrigatória nº1.**  |
| `docs/README.md`                                   | 20 min | Mapa da documentação por papel.                            |
| `docs/GLOSSARIO.md`                                | 40 min | Termos (outbox, DLQ, fingerprint, JSONata, KEK/DEK, etc.). |
| `docs/PLANO-MODULO-INTEGRACAO.md` (overview, §1-3) | 60 min | Por que o módulo existe; horizonte 18 meses.               |
| `docs/auditoria/SNAPSHOT-FINAL-2026-04-27.md`      | 30 min | Estado real (CRITICAL resolvidos, pendências).             |

**Marco D1**: dev sabe o vocabulário e a tese do produto.

---

## D2 — Arquitetura (≈ 4h)

| Doc                                                   | Tempo  |
| ----------------------------------------------------- | ------ |
| `docs/integracao/001-arquitetura-integration-hub.md`  | 60 min |
| `docs/adr/ADR-001-*` a `ADR-004-*` (4 ADRs originais) | 60 min |
| `docs/integracao/002-modelo-canonico.md`              | 45 min |
| `docs/integracao/003-api-publica-v1.md`               | 45 min |

**Marco D2**: consegue desenhar o diagrama Hub ↔ Outbox ↔ Conector ↔ ERP no quadro.

---

## D3 — Módulo de Integração a fundo (≈ 5h)

| Doc                                                                 | Tempo  |
| ------------------------------------------------------------------- | ------ |
| `docs/integracao/004-outbox-inbox-retry.md`                         | 60 min |
| `docs/integracao/005-seguranca-credenciais.md`                      | 45 min |
| `docs/integracao/006-mapping-engine.md` (JSONata)                   | 60 min |
| `docs/adr/ADR-010` a `ADR-013` (tenancy, JSONata, OAuth, API porta) | 60 min |
| `docs/integracao/SDK-CONNECTOR-SPEC.md` (skim)                      | 30 min |
| `docs/integracao/MOCK-CONNECTOR.md`                                 | 15 min |

**Marco D3**: dev consegue ler um conector existente (ex.: Bling) e explicar onde cada peça vive.

---

## D4 — Operação, qualidade e processo (≈ 3h)

| Doc                                                             | Tempo  |
| --------------------------------------------------------------- | ------ |
| `docs/integracao/BACKLOG-SPRINT-0-1.md` + `BACKLOG-SPRINT-2.md` | 45 min |
| `docs/integracao/REPLANEJAMENTO-STORY-POINTS.md`                | 20 min |
| `docs/integracao/ESTRATEGIA-TESTES.md`                          | 45 min |
| `docs/integracao/TCK-SPEC.md` (skim)                            | 30 min |
| `docs/integracao/SLO-INTEGRACAO.md`                             | 30 min |
| `docs/RELEASE.md` + `docs/OPERACAO.md`                          | 30 min |

**Marco D4**: dev sabe como histórias entram em sprint, como são testadas e como o app vira instalador.

---

## D5 — Mão na massa (≈ 6h)

1. **Subir o app local** (1h):
   - Seguir `../CLAUDE.md` seção "Setup inicial" + "Modos de execução".
   - Validar login com `admin@solutionticket.com` (senha em `SEED_DEFAULT_PASSWORD`).
2. **Ler runbook de suporte** (30 min): `docs/integracao/008-runbook-suporte.md`. Saber onde olhar quando der ruim.
3. **Escolher 1 issue "good-first"** com Tech Lead (1h discovery).
4. **Implementar + testar local** (3h): rodar só os testes do módulo afetado, nunca a suíte toda.
5. **Abrir 1º PR** (30 min):
   - Commit atômico, mensagem clara, descrição com "o que" e "porquê".
   - Aguardar CI; se quebrar, corrigir no próximo commit (sem `--amend`).

**Marco D5**: PR aberto + app rodando localmente.

---

## Checklist final da 1ª semana

- [ ] D1-D4 todos lidos
- [ ] App local rodando (Electron abre, faz login, mostra dashboard)
- [ ] 1 PR aberto
- [ ] 1 conversa de 30 min com o Tech Lead sobre dúvidas acumuladas
- [ ] Acesso configurado: repo, CI, slack/canal, banco de homologação (quando existir)

Se algum item não foi feito, escalar para o Tech Lead — não deixar correr para a 2ª semana.
