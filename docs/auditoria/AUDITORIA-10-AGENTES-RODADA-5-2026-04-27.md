# Auditoria 10 Agentes — Rodada 5

**Data**: 2026-04-27
**Escopo**: 95 documentos pós Rodada 4 + SNAPSHOT-FINAL.
**Método**: 10 agentes especializados em paralelo, cada um sob lente própria, comparando com históricos das Rodadas 1–4 e marcando RESIDUAL/NOVO.

---

## TL;DR

- **Total de findings**: ~136
- **CRITICAL**: 9 (3 jurídicos residuais + 2 segurança + 2 DevOps + 4 ERP + 1 PM)
- **HIGH**: ~50
- **MEDIUM/LOW**: ~77

**Veredito agregado**: Sprint 0 técnico **continua liberado** sob as ressalvas da Rodada 4. Mas **não ir a campo Tier-1/Enterprise/captação** sem fechar bloqueadores comerciais e contratuais. **GA do 1º conector cloud (Sprint 6)** depende de gates novos de DevOps/Segurança.

---

## Vereditos por área

| Agente            | Veredito                             | Bloqueadores                                                                                                |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 1. Arquitetura    | ✅ com ressalvas                     | Throughput inconsistente, ordering FIFO, ADR-014 (consistência outbox)                                      |
| 2. Segurança/LGPD | ⚠️ Sprint 0 só com dados sintéticos  | DPA Cloudflare, matriz retenção×esquecimento, KEK/DEK, HMAC API pública                                     |
| 3. DevOps/SRE     | ❌ GA Sprint 6 bloqueado             | Capacity teórico vs medido, SLOs/SLIs, drill DR-DPAPI nunca executado, RTO/RPO contraditório                |
| 4. Engenharia ERP | ⚠️ hardening sprint antes de Etapa 4 | Template mapping ainda Mustache+JSONPath, OAuth refresh/revogação 4/6 ERPs, Omie idempotência               |
| 5. QA             | ✅ com ressalvas                     | Pirâmide ausente, contract test Hub↔Conector, DoR ausente, DoD fraco                                        |
| 6. PM             | ❌ não executável                    | Velocity sem histórico, buffer 0%, sem NSM/OKRs, S0 catch-all, RACI sem comercial                           |
| 7. Comercial      | ❌ não sustenta DD/VC                | ROI matematicamente inconsistente, TAM/SAM/SOM ausentes, pipeline funil ausente, comparativos cherry-picked |
| 8. Marketing      | ❌ não gera pipeline                 | Sem SEO, sem demand gen, sem UTM/atribuição, brand book inexistente                                         |
| 9. Jurídico       | ❌ não fecha sem ressalva            | Placeholders empresa, DPA Cloudflare, DPO não nomeado, multas assimétricas Enterprise                       |
| 10. DX            | ❌ navegação quebrada                | README desatualizado, CLAUDE.md raiz path stale, 14 refs em backtick quebradas                              |

---

## Top CRITICAL consolidados

| #   | Origem                      | Issue                                                                               | Ação                                                        |
| --- | --------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| C1  | Jurídico (L1)               | Placeholders empresa em Política/Termos                                             | Gate runtime — bloquear EULA com `{a preencher}`            |
| C2  | Jurídico (L2) / Sec (S5-C1) | DPA Cloudflare não assinada com PII em trânsito                                     | Bloquear go-live cloud até DPA OU forçar polling-only       |
| C3  | Jurídico (L3)               | DPO não nomeado                                                                     | Designação formal antes do 1º cliente pago                  |
| C4  | Sec (S5-C2)                 | Conflito retenção fiscal × esquecimento sem matriz                                  | Documentar matriz campo × base × TTL × pseudonimização      |
| C5  | DevOps (F1)                 | Capacity sem distinção teórico/medido + bottleneck não identificado                 | Marcar `[medido\|estimado\|teórico]` por célula             |
| C6  | DevOps (F2)                 | SLOs/SLIs ausentes em todos os docs                                                 | Criar `SLO-INTEGRACAO.md` com burn-rate alerts              |
| C7  | ERP (C5.1)                  | Template `erp-mapping.yaml` ainda Mustache+JSONPath, contradiz ADR-011              | Reescrever template em JSONata                              |
| C8  | ERP (C5.2/C5.4)             | Bling token endpoint sem detalhes + OAuth refresh/revogação incompletos em 4/6 ERPs | Detalhar headers/body + tornar refresh rotation obrigatório |
| C9  | ERP (C5.3)                  | Omie sem idempotência via `codigo_pedido_integracao`                                | Adicionar campo na chave                                    |
| C10 | PM (F4)                     | Sem NSM, OKRs, leading indicators                                                   | Adicionar §16.0 ao plano antes das métricas existentes      |
| C11 | Comercial (C7-R5-01)        | ROI hand-tuned, não deriva dos inputs declarados                                    | Refazer cenários derivando da fórmula                       |
| C12 | Comercial (C7-R5-02)        | Premissas 70/80/50% sem case real                                                   | Rotular como "alvo, sujeito a validação em piloto"          |

---

## HIGH por agente (sumário)

### Agente 1 — Arquitetura

- Throughput "1000 ev/min" em comerciais contradiz CAPACITY (Bling 180, Omie 40-55).
- Rate-limit por tenant na API pública conflita com ADR-010 single-tenant.

### Agente 2 — Segurança/LGPD

- API pública `:3002` sem nonce/replay-window (ADR-013 omisso).
- Sem KEK/DEK (DPAPI cifra segredo direto, rotação inviável).
- Escopo DPAPI `CurrentUser` decisão silenciosa (sem ADR).
- Refresh token rotation não obrigatório (ADR-012:147).
- mTLS no relay pendente (residual H6).

### Agente 3 — DevOps/SRE

- Trace correlation sem padrão (W3C traceparent / OTel ausente).
- RTO/RPO contraditório entre `failover-cloudflare-aws.md:8` (RPO=0) e `:105` (perda em KV).
- Drill DR-DPAPI nunca executado (runbook narrativo, não script).
- Outbox sem watermarks/dimensionamento (DLQ alert ">10" arbitrário).
- Poison message não isolado (pode bloquear batch).
- Estratégia de release ambígua (sem canary/feature flag/kill-switch).
- Custos relay sem budget alert.

### Agente 4 — Engenharia ERP

- Conta Azul `/v1/sales` deprecado/incorreto (validar discovery oficial).
- SAP JCo licença comercial não documentada (risco jurídico/financeiro).
- TCK não cobre OAuth refresh rotation (paralelo, race, revogação).
- JSONata sem limites adicionais (AST depth, output size, regex catastrófico).
- Sankhya Gateway novo sem endpoints reais (não inferir por substituição de prefixo).
- Whitelist JSONata explícita ausente em `006-mapping-engine.md`.

### Agente 5 — QA

- Pirâmide de testes inexistente como artefato.
- Contract testing Hub↔Conector ausente (sem Pact ou equivalente).
- DoR não existe nos backlogs.
- DoD dos sprints fraco ("CI verde + 70% cobertura").

### Agente 6 — PM

- Velocity teto sem dado histórico (calibrado em 1 sprint).
- Buffer de imprevistos = 0% (somas batem exatas no teto).
- DOD por story ausente (apenas DOR + DOD por sprint).
- Registro de risco sem owner nem cadência.
- Sprint 0 virou catch-all (7 histórias mistas).
- RACI não cobre comercial/vendas (cliente piloto sem dono).

### Agente 7 — Comercial

- Stat "3-8% faturamento" fabricada (sem pesquisa interna).
- TAM/SAM/SOM ausentes (110 clientes em 18m sem denominador).
- Pipeline necessário não calculado (leads→MQL→SQL→demo).
- Comparativo RPA com UiPath inflado (5,4× exagerado).
- Custom em 5 anos R$1,12M cherry-picked (89% de economia exagerado).

### Agente 8 — Marketing

- Funil sem assets MOFU/BOFU mensuráveis.
- Sem plano SEO / palavras-chave / calendário editorial.
- Sem plano de demand gen / canais / CAC.
- Sem mensuração: UTMs, atribuição, dashboard.

### Agente 9 — Jurídico

- Assimetria multa rescisão Enterprise (§10.1.1 sem contrapartida numérica).
- Cap LGPD insuficiente vs piso ANPD (3× R$50k vs 2% faturamento).
- Bases legais incompletas (faltam fraude/processo/proteção crédito).
- Canal do titular sem SLA operador→controlador.
- §1.1 exclusão CDC frágil para ME/EPP (STJ tem mitigação).

### Agente 10 — DX

- README desatualizado vs realidade (cita Rodadas 1-2; existem 4+SNAPSHOT).
- Path quebrado CHECKLIST legal no README (sem prefixo `legal/`).
- CLAUDE.md raiz aponta para arquivo movido (`AUDITORIA-PESOLOG-vs-...` agora em `historico/`).
- ADR count inconsistente (10 vs 13).
- Glossário sem termos novos das Rodadas 1-4.
- 14 refs em backtick (`` `arquivo.md` ``) inválidas em docs ativos.
- Histórico sem header DEPRECATED.

---

## Links quebrados (Agente 10)

```
docs/README.md:5                                          → CHECKLIST-PREENCHIMENTO-LEGAL.md (falta legal/)
docs/integracao/005-seguranca-credenciais.md:287          → docs/runbooks/integracao/seguranca-incidente.md
docs/integracao/BACKLOG-SPRINT-3.md:86                    → docs/integracao/MOCK-CONNECTOR.md
docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md:317         → docs/integracao/checklists/homologacao-conector.md
docs/integracao/SDK-CONNECTOR-SPEC.md:340                 → docs/integracao/POLITICA-PRIVACIDADE.md (correto: legal/)
docs/runbooks/integracao/dr-dpapi.md:130, 184             → disaster-recovery.md
docs/legal/CHECKLIST-PREENCHIMENTO-LEGAL.md:7             → templates/termo-aceite-cliente.md
docs/legal/TERMOS-USO.md:98                               → PLANO-COMERCIAL.md (sem path)
docs/legal/TERMOS-USO.md:234                              → SDK-CONNECTOR-SPEC.md (sem path)
docs/comercial/marketing/WHITEPAPER-CONFIABILIDADE-FISCAL.md:81,84  → comparativos/vs-{rpa,integracao-custom}.md
docs/auditoria/historico/PLANO-REMEDIACAO.md:29,134       → docs/SECRETS.md, docs/CODING-STYLE.md (nunca criados)
CLAUDE.md (raiz)                                          → docs/AUDITORIA-PESOLOG-vs-SOLUTION-TICKET.md
```

---

## Plano para Rodada 6 (preparação)

**Bloco 1 — Quick wins (≤ 1 dia)**

- DX: corrigir README, CLAUDE.md raiz, links em backtick, ADR count.
- Glossário: adicionar termos das Rodadas 1-4.
- Histórico: header DEPRECATED.

**Bloco 2 — Hardening doc (1 sprint)**

- ERP: reescrever `erp-mapping.yaml` em JSONata; OAuth refresh/revogação completos; whitelist JSONata em 006; Sankhya Gateway endpoints reais; SAP JCo licença.
- DevOps: SLOs/SLIs; capacity `[medido|estimado|teórico]`; reconciliar RTO/RPO; canary/kill-switch; budget alerts; on-call formal.
- Segurança: KEK/DEK; HMAC+nonce na API pública; ADR escopo DPAPI; matriz retenção×esquecimento; refresh rotation obrigatório.
- QA: criar `ESTRATEGIA-TESTES.md`; DoR/DOD por story; contract testing Hub↔Conector.
- PM: NSM+OKRs+leading indicators; buffer 15% nos sprints; DOD por story; RACI comercial; caminho crítico nomeado.
- Arquitetura: ADR-014 (consistência outbox + ordering FIFO + DLQ TTL).

**Bloco 3 — Externos (não bloqueia código)**

- Jurídico: preencher empresa/DPO/foro; assinar DPA Cloudflare; multa simétrica Enterprise; cap LGPD ajustado.
- Comercial: refazer ROI derivando inputs; TAM/SAM/SOM; funil pipeline; faixas honestas em comparativos.
- Marketing: criar `MARKETING-{FUNNEL,SEO-CONTENT,MEASUREMENT}.md` + brand book.

---

## Veredito final Rodada 5

**Documentação técnica robusta no núcleo, mas com fragilidades fatais nas bordas comerciais/contratuais e na navegabilidade.**

Sprint 0 técnico segue liberado **se** desenvolvimento em dados sintéticos (sem PII real no relay cloud). **GA do Sprint 6 bloqueado** até gates DevOps/Segurança fechados (drills DR registrados, SLOs publicados, kill-switch). **Vendas Tier-1/Enterprise/captação não vão a campo** até bloco jurídico+comercial fechado.

> Sessão encerrada. Próxima sessão pega deste snapshot.
