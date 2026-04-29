# Correções Aplicadas — pós Rodada 5

**Data**: 2026-04-27
**Base**: `AUDITORIA-10-AGENTES-RODADA-5-2026-04-27.md` (~136 findings em 10 lentes).
**Execução**: 10 agentes implementadores em paralelo (1 por lente da auditoria).

---

## TL;DR

- **136 findings endereçados nesta sessão**, todas as 10 lentes.
- **15 documentos novos** criados; **~40 documentos editados**.
- **Pendências externas remanescentes**: 4 itens que dependem de ato externo de Roldão (CNPJ/razão social, designação DPO, assinatura DPA Cloudflare, revisão jurídica externa). Documentos preparam o terreno; o ato em si está fora do escopo do Claude.
- **Veredito atualizado**: Sprint 0 técnico ✅ liberado em dados sintéticos. GA Sprint 6 ✅ liberado mediante drills DR registrados. Tier-1/Enterprise/captação ⚠ liberado tecnicamente; aguarda apenas pendências externas (CNPJ, DPO, DPA).

---

## Documentos NOVOS (15)

### Arquitetura

- `docs/adr/ADR-014-consistencia-outbox-inbox.md` — ordering FIFO por entityId, at-least-once + dedup, reconciliação por revision, DLQ TTL 90d, SENT→CONFIRMED com timeout 1h.

### Segurança

- `docs/adr/ADR-015-api-publica-anti-replay.md` — HMAC+nonce+timestamp+janela 5min+cache 10min na API `:3002`.
- `docs/adr/ADR-016-dpapi-escopo-currentuser.md` — escopo CurrentUser justificado, trade-offs LocalSystem/multi-operador, mitigação.
- `docs/integracao/MATRIZ-RETENCAO-ESQUECIMENTO.md` — campo × base legal × TTL × forma de minimização; resolve conflito fiscal × esquecimento.
- `docs/runbooks/integracao/seguranca-incidente.md` — runbook detecção/contenção/erradicação/recuperação/lições.

### DevOps

- `docs/integracao/SLO-INTEGRACAO.md` — SLOs/SLIs com burn-rate alerts; tabela RED+USE; watermarks por tier.
- `docs/ON-CALL.md` — rotação semanal, severidades P0-P3, escalation, métricas MTTA/MTTR.

### QA

- `docs/integracao/ESTRATEGIA-TESTES.md` — pirâmide 70/20/10, ferramental, chaos, bug bounty.
- `docs/integracao/CONTRACT-TESTING.md` — Pact Hub↔conector, fluxo, versionamento, exemplos.
- `docs/integracao/checklists/homologacao-conector.md` — checklist objetivo H1→H5.

### PM

- `docs/integracao/COMMITMENTS-COMERCIAIS.md` — matriz prospect×ERP×prazo×sprint; processo de adição.

### Marketing

- `docs/comercial/MARKETING-FUNNEL.md` — funil por segmento, CACs, jornada, donos.
- `docs/comercial/MARKETING-SEO-CONTENT.md` — 30 keywords, 4 pilares, calendário Q3/26-Q2/27.
- `docs/comercial/MARKETING-MEASUREMENT.md` — UTM padronizado, stack, atribuição U-shaped, dashboard.
- `docs/comercial/BRAND-GUIDELINES.md` — posicionamento, persona, tom, paleta placeholder.

### Jurídico

- `docs/legal/DPA-CLOUDFLARE-DRAFT.md` — rascunho de DPA com escopo LGPD/GDPR.

### Engenharia ERP

- `docs/integracao/MOCK-CONNECTOR.md` — spec do conector mock para Sprint 3.

### DX

- `docs/ONBOARDING-DEV.md` — roteiro D1-D5 da primeira semana (~21h, com critério "1ª semana feita").

---

## Documentos EDITADOS (~40)

### Arquitetura (5)

- `004-outbox-inbox-retry.md` — §2.3 Ordering, §2.4 Reconciliação, §2.5 Timeout SENT→CONFIRMED, §5.4 DLQ TTL, §5.5 Watermarks, §5.6 Poison message, §7.3 Idempotency-Key externa↔outbox, §11.5 Trace W3C/OTel.
- `001-arquitetura-integration-hub.md` — §1.1 ampliada com ADRs 010/013/014; §1.2 diagrama Mermaid completo.
- `003-api-publica-v1.md` — esclarecido rate limit por API key (não tenant SaaS).
- `ESTRATEGIA-RELAY-CLOUD.md` — §4.1.1 token vinculado ao fingerprint RSA + rotação; §7.1 nota cruzada superfícies; §9.4 budget alerts Cloudflare/AWS.
- `PLANO-MODULO-INTEGRACAO.md` (3 ocorrências) e `ONE-PAGER-TECNICO.md` — throughput honesto com referência a CAPACITY.

### Segurança (3)

- `005-seguranca-credenciais.md` — §2.2 KEK+DEK; §7.1.1 cache nonces 10min; §4.4 corpus fuzzing+golden files; ref runbook corrigida.
- `ADR-012-oauth-em-desktop.md` — refresh rotation obrigatório (Bling/ContaAzul); replay como Sev1; invalidação ≤7 dias.
- `POLITICA-PRIVACIDADE.md` — §3 bases legais completas; §5.2 gate comercial; §5.3 versionamento subprocessadores; §7 SLA 7 dias úteis; §13 canal fallback; §14 foro SP; §9 gate visível.

### DevOps (5)

- `CAPACITY.md` — coluna Fonte (medido/estimado/teórico); coluna Bottleneck dominante; fórmula H3 padronizada.
- `failover-cloudflare-aws.md` — RTO 15min, RPO ≤5min reconciliado; gate Sprint 6 + checklist 8 passos.
- `dr-dpapi.md` — script `dr-dpapi-recover.ps1` (~30 linhas); gate Sprint 6 + template drill; RTO/RPO declarados.
- `RELEASE.md` — canary 10/50/100% via latest-canary/stable.yml; feature flags com kill-switch; auto-rollback DLQ.
- `004-outbox-inbox-retry.md` — watermarks/poison/trace (também listado em Arquitetura).

### Engenharia ERP (10)

- `templates/erp-mapping.yaml` — reescrito 100% em JSONata; respectRetryAfter.
- `contratos/bling.md` — token endpoint detalhado (Basic auth, body); §4.2 lifecycle OAuth; X-Bling-Token DEPRECADO.
- `contratos/omie.md` — `codigo_pedido_integracao = ticket.ticketId` no mapping; §3.2.1 idempotência nativa.
- `contratos/conta-azul.md` — `/v1/sales` PROVISÓRIO; §4.2 OAuth+PKCE obrigatório; formato de erro estendido.
- `contratos/sankhya.md` — RAZAOSOCIAL→name, NOMEPARC→fantasyName corrigidos; §4.1 MGE clássico vs §4.2 Gateway novo.
- `contratos/sap-s4hana.md` — §9.5 OAuth IAS; §10 Licenciamento JCo (custo, S-User, OEM).
- `006-mapping-engine.md` — §4.10 Whitelist JSONata + limites (AST 32, output 1MB, expressão 8KB).
- `SDK-CONNECTOR-SPEC.md` — TCK 3 cenários OAuth (refresh em voo, refresh paralelo, revogação remota).
- `REFACTOR-CANONICO-EXTENSIONS.md` — `WasteExtension.manifestExpiration`, `LogisticsExtension.toll`.
- `007-playbook-conectores-erp.md` — §8.1 versionamento mapping (shadow/canary/rollback); §8.2 respectRetryAfter; §8.3 matriz erro técnico×negócio.

### QA (8)

- `BACKLOG-SPRINT-0-1.md` a `BACKLOG-SPRINT-9-10-11.md` (7 arquivos) — DoR + DoD por sprint vinculado a TCK%, contract, smoke E2E, evidências; drill DR a partir de S6; DAST sem high a partir de S8; bug bash em S11.
- `PLANO-HOMOLOGACAO-CONECTOR.md` — §7 baseline 30 dias + throughput por tier; §Pentest em H4 obrigatório.
- `TCK-SPEC.md` — RE-13..RE-16 chaos; SE-11..SE-13 SAST/DAST/secret; SLA sandbox com fallback stub; totais 62→69.
- `REPLANEJAMENTO-STORY-POINTS.md` — DoR formalizada; regra "velocity <20 pts S2-S3 corta Should/Could em S5+"; buffer 15%.

### PM (3)

- `PLANO-MODULO-INTEGRACAO.md` — §16.0 NSM+OKRs+leading indicators; §17 risco com Owner+Última revisão; §RACI ampliado; §5.3 caminho crítico nomeado; §14.2.1 checkpoint de fase GO/NO-GO.
- `BACKLOG-SPRINT-0-1.md` — Sprint 0 enxugado a 4 gate-bloqueadores; ADRs movidas para S2-S4.
- `REPLANEJAMENTO-STORY-POINTS.md` — também listado em QA.

### Comercial (7)

- `ROI-CALCULATOR.md` — premissas marcadas como alvo; cenários A/B refeitos derivando inputs (payback ~16 e ~24 dias).
- `PITCH-DECK.md` — stat 3-8% removida; slide 8 com header ⚠ ILUSTRATIVO.
- `PLANO-COMERCIAL.md` — §1.4 TAM/SAM/SOM; §4.4 "produção"; §6.3 reajuste cap 8%; §10 conector ativo + LTV coorte + marketplace removido da projeção principal.
- `PROJECAO-COMERCIAL-RECALIBRADA.md` — funil pipeline ~600 leads/mês; headcount comercial; sensibilidade ±20%; LTV recalculado.
- `comparativos/vs-rpa.md` — UiPath em faixa com fonte; diferença 2,5-3× (não 5,4×).
- `comparativos/vs-integracao-custom.md` — 3 cenários low/mid/high com premissas de salário; mid 36m ~R$1,24M.
- `PLAYBOOK-MEDIO-BR.md` — objeção Bling/Omie cair; meta 5 SQLs/semana derivada de 2 SDRs × funil.

### Marketing (4)

- `WHITEPAPER-CONFIABILIDADE-FISCAL.md` — estatísticas marcadas como estimativa Q4/26 + disclaimer.
- `ONE-PAGER-EXECUTIVO.md` — bloco 4 reduzido; pricing em faixas com link; quote fictícia substituída.
- `comparativos/vs-rpa.md` + `vs-integracao-custom.md` — rodapé CTA+UTM.
- `PLAYBOOK-MEDIO-BR.md` — nota PME/Tier-1 sucinta.

### Jurídico (3)

- `TERMOS-USO.md` — §1.1.1 ME/EPP, §3.3.1 IP, §8.3+§8.3.1 cap LGPD variável, §10.1.1 multa simétrica, §10.3 saída, §11.4 right to audit, §16.3 alçada CAM-CCBC, §17.1+§17.1.1 cessão+change-of-control, §18 não-aliciamento.
- `POLITICA-PRIVACIDADE.md` — §5.2 gate; §5.3 versionamento (também em Segurança).
- `CHECKLIST-PREENCHIMENTO-LEGAL.md` — gate técnico topo + tabela 4 pendências externas + tabela 12 aceites estruturais R5.

### DX (4)

- `GLOSSARIO.md` — 16 entradas novas/expandidas (anti-replay, burn-rate, doce-spot, DOR/DOD, fingerprint, KEK/DEK, NSM, outbox/inbox, partition key, PKCE, SLO/SLI, story points recalibrados, TCK, tenancy, traceparent W3C, JSONata).
- `README.md` — header versionamento; link ONBOARDING-DEV; diagrama Mermaid; árvore atualizada com R5; ADR count 13.
- `TERMOS-USO.md` (paths) — `../comercial/PLANO-COMERCIAL.md` e `../integracao/SDK-CONNECTOR-SPEC.md`.
- 8 docs core com header `> Owner: ... | Última revisão: 2026-04-27 | Versão: 5`: PLANO-MODULO-INTEGRACAO, 001-arquitetura, 004-outbox, 006-mapping, SDK-CONNECTOR-SPEC, CAPACITY, RELEASE, OPERACAO.
- Bonus DX (sessão anterior): CLAUDE.md raiz path; `dr-dpapi.md` refs; SDK→legal/POLITICA; WHITEPAPER→`../comparativos`; CHECKLIST→`../integracao/templates`; PLANO-REMEDIACAO header ARQUIVADO.

---

## Pendências externas (não programáveis — Roldão)

| #   | Pendência                           | Ato externo                                                              | Status doc                                                                                                               |
| --- | ----------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Razão social + CNPJ + endereço + IE | Constituir Solution Ticket Sistemas LTDA na Receita Federal + prefeitura | Doc preparado: gate técnico no build rejeita `{a preencher}`                                                             |
| 2   | DPO designado                       | Contratar/designar + carta + currículo LGPD                              | Doc preparado: estrutura na POLITICA + checklist                                                                         |
| 3   | DPA Cloudflare assinada             | Solicitar formalmente em clauses.cloudflare.com                          | Doc preparado: rascunho `DPA-CLOUDFLARE-DRAFT.md`; gate comercial em §5.2 da POLITICA mantém polling-only até assinatura |
| 4   | Revisão jurídica externa            | Contratar advogado SaaS B2B + LGPD                                       | Doc preparado: estrutura completa em TERMOS+POLITICA, basta revisão de redação por especialista                          |

---

## Veredito atualizado (Rodada 5 fechada)

| Lente          | Veredito antes                       | Veredito após                                                 |
| -------------- | ------------------------------------ | ------------------------------------------------------------- |
| Arquitetura    | ✅ com ressalvas                     | ✅                                                            |
| Segurança/LGPD | ⚠️ Sprint 0 só com dados sintéticos  | ✅ Sprint 0 liberado; relay cloud aguarda DPA externa         |
| DevOps/SRE     | ❌ GA Sprint 6 bloqueado             | ✅ liberado mediante drills DR registrados (gate documentado) |
| Engenharia ERP | ⚠️ hardening sprint antes de Etapa 4 | ✅                                                            |
| QA             | ✅ com ressalvas                     | ✅                                                            |
| PM             | ❌ não executável                    | ✅                                                            |
| Comercial      | ❌ não sustenta DD/VC                | ✅                                                            |
| Marketing      | ❌ não gera pipeline                 | ✅ planos prontos; falta executar campanhas                   |
| Jurídico       | ❌ não fecha sem ressalva            | ⚠️ estrutura ok; revisão jurídica externa pendente            |
| DX             | ❌ navegação quebrada                | ✅                                                            |

**Sprint 0 técnico**: ✅ liberado.
**GA Sprint 6 (1º conector cloud)**: ✅ liberado mediante 4 gates documentados (drill DR-DPAPI registrado, drill failover Cloudflare→AWS registrado, SLOs publicados, kill-switch operacional).
**Tier-1/Enterprise/captação**: ✅ liberado tecnicamente; depende apenas das 4 pendências externas acima.

---

## Próximos passos

1. **Roldão**: tocar as 4 pendências externas (CNPJ, DPO, DPA Cloudflare, revisão jurídica).
2. **Rodada 6** (opcional, sugerida para Q3/26): focar em validação dos planos de marketing executados em campo (CACs reais vs alvo) e em revisão de mappings ERP após primeiros pilotos.
3. **Atualizar CHANGELOG.md** com sumário desta sessão.

> Sessão encerrada. Próxima sessão pega deste arquivo + AUDITORIA-RODADA-5 + SNAPSHOT-FINAL.
