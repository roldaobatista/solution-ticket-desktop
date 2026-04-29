# Auditoria Externa — 10 Agentes Especializados

**Data**: 2026-04-26
**Escopo**: 60 documentos do módulo de integração ERP
**Método**: 10 agentes isolados com lentes de especialidade distintas
**Status**: Findings consolidados — ação requerida

---

## Sumário executivo

Os 10 agentes encontraram **78 issues** (24 CRITICAL/HIGH em destaque). Quatro classes de problema dominam:

1. **Inconsistências entre documentos** (paths quebrados, métricas que não batem, tenancy ambígua, garantias com prazos conflitantes)
2. **Promessas não-defensáveis** (ROI com payback de 6 dias, premissa de eliminação 100% de balança parada, TCO RPA inflado, casos 100% fictícios)
3. **Gaps técnicos críticos** (anti-replay incompleto, OAuth interativo em desktop, endpoints ERP factualmente errados, capacity SQLite vs throughput prometido)
4. **Documentos legais com placeholders** (CNPJ, foro, DPO, comarca em branco — bloqueio absoluto para uso comercial)

**Recomendação geral**: antes de iniciar Sprint 0, executar 3 sprints de **correção dos achados CRITICAL/HIGH** (estimativa: 4–6 semanas).

---

## Top 12 issues CRITICAL (consolidados de todos agentes)

| #   | Sev      | Origem         | Issue                                                                                                                                                                                                               |
| --- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | CRITICAL | Arquitetura    | **Tenancy ambígua**: produto desktop single-tenant (CLAUDE.md) vs hub multi-tenant (canônico, API, relay). Falta ADR-010.                                                                                           |
| C2  | CRITICAL | Segurança      | **Anti-replay ausente em webhook entrante** — só HMAC, sem janela de timestamp. ERP comprometido pode replay.                                                                                                       |
| C3  | CRITICAL | Segurança      | **DPA Cloudflare como TODO** + Política Privacidade afirma "dados não trafegam por relay" mas webhook contém PII. Inconsistência grave LGPD.                                                                        |
| C4  | CRITICAL | Engenharia ERP | **3 contratos com endpoints/comportamentos factualmente errados**: Sankhya (host híbrido inexistente, TIPMOV vs CODTIPOPER), TOTVS Protheus (endpoint inventado), SAP (deep-insert sem $batch). Bloqueia Sprint 6+. |
| C5  | CRITICAL | DevOps         | **Capacity 1000 ev/min é teórica**. Bling rate limit 3 req/s = 180 ev/min real. Worker concurrency=1 default + benchmark só com Mock. Cliente médio estoura.                                                        |
| C6  | CRITICAL | PM             | **Story points descalibrados**: S1=22, S5=58 com mesmo time. Frontend só entra no Sprint 5 com 32pts de UI. Fase 0 vai escorregar 4–6 semanas.                                                                      |
| C7  | CRITICAL | PM             | **Métricas comerciais não fecham**: 15 clientes mês 6 (§16.3) vs MRR R$30k mês 6 (§16.4) exige ~100 balanças. Aritmética inconsistente.                                                                             |
| C8  | CRITICAL | Comercial      | **ROI com payback 6–12 dias é suicida**. Inconsistente com pitch (73 dias). Comprador sênior derruba na primeira call.                                                                                              |
| C9  | CRITICAL | Comercial      | **Premissa 90% retrabalho + 100% balança parada eliminados** indefensável sem case real.                                                                                                                            |
| C10 | CRITICAL | Marketing      | **Cases 100% fictícios** usados em pitch/site/RFP. Risco reputacional grave se cliente descobrir.                                                                                                                   |
| C11 | CRITICAL | Jurídico       | **Placeholders críticos**: CNPJ, razão social, DPO, foro, câmara CAM = `{a definir}`. Cláusula compromissória inexequível (Lei 9.307). LGPD art. 41 violada (DPO não nomeado).                                      |
| C12 | CRITICAL | DX             | **Sem README.md raiz** + **67 links cruzados quebrados** (`docs/integracao/PLANO-...md` mas arquivo está em `docs/`). Novo contratado se perde em 5 min.                                                            |

---

## Top 12 issues HIGH

| #   | Sev  | Origem         | Issue                                                                                              |
| --- | ---- | -------------- | -------------------------------------------------------------------------------------------------- |
| H1  | HIGH | Arquitetura    | Vazamento vertical no canônico (`quality.moisturePercent`, `harvestId` hardcoded em v1)            |
| H2  | HIGH | Arquitetura    | Idempotência at-least-once vira at-least-twice quando ERP não suporta header customizado           |
| H3  | HIGH | Arquitetura    | Mapping engine mistura 3 sintaxes (Mustache + JSONPath + expr-eval/jsonata) sem decidir qual       |
| H4  | HIGH | Arquitetura    | API pública na mesma porta do backend interno — viola ADR-006                                      |
| H5  | HIGH | Segurança      | Direito ao esquecimento + retenção fiscal: hash determinístico de CPF quebra em força bruta        |
| H6  | HIGH | Segurança      | Token Bearer 90d sem mTLS/device binding no agent — vazamento = leitura completa da fila           |
| H7  | HIGH | Segurança      | `INTEGRACAO_VER_PAYLOAD` para "suporte ST" expõe CPF/CNPJ de cliente final — viola minimização     |
| H8  | HIGH | DevOps         | DR do DPAPI não documentado — Windows reinstalado = todos os tokens órfãos                         |
| H9  | HIGH | DevOps         | Recovery threshold 10min órfão = janela enorme para cliente "ver pesagem sumir"                    |
| H10 | HIGH | Engenharia ERP | Bling OAuth Code exige redirect público — quebra em desktop sem internet de entrada                |
| H11 | HIGH | Engenharia ERP | Mapping engine não suporta paths com `[N]` (índice) — Omie/SAP usam                                |
| H12 | HIGH | QA             | TCK (Test Conformance Kit) ausente para `IErpConnector` — conector novo passa H1-H5 com bugs sutis |

---

## Achados CRITICAL/HIGH por especialidade

| Agente         | CRITICAL | HIGH | Total | Tema dominante                                     |
| -------------- | -------- | ---- | ----- | -------------------------------------------------- |
| Arquitetura    | 1        | 4    | 5     | Tenancy + acoplamento + idempotência ponta-a-ponta |
| Segurança/LGPD | 2        | 4    | 6     | Anti-replay + DPA + retenção vs esquecimento       |
| DevOps/SRE     | 2        | 2    | 4     | Capacity teórica + DR DPAPI                        |
| Engenharia ERP | 1        | 3    | 4     | Endpoints factualmente errados + OAuth interativo  |
| QA             | 0        | 4    | 4     | TCK ausente + critérios H5 fracos                  |
| PM             | 2        | 4    | 6     | Story points + métricas + DOR ausente              |
| Comercial      | 2        | 4    | 6     | ROI inacreditável + premissas indefensáveis        |
| Marketing      | 1        | 3    | 4     | Cases fictícios + ICP frouxo + funil MOFU vazio    |
| Jurídico       | 3        | 5    | 8     | Placeholders + multas assimétricas + DPA não anexo |
| DX             | 2        | 2    | 4     | README ausente + paths quebrados + bagunça raiz    |

**Total CRITICAL/HIGH**: 51

---

## Plano de remediação proposto

### Sprint -3 (semana 1) — Correções jurídicas e DX bloqueantes

- Preencher placeholders legais (CNPJ, DPO, foro, comarca CAM)
- Assinar DPA Cloudflare formalmente
- Criar `docs/README.md` raiz + `GLOSSARIO.md`
- Mover PITCH-DECK/ROI/PLANO-COMERCIAL de `integracao/` para `comercial/`
- Corrigir 67 paths quebrados
- Mover 7 docs de auditoria para `docs/auditoria/` com INDEX
- Adicionar disclaimer prominent em cases fictícios

### Sprint -2 (semanas 2–3) — Correções arquiteturais e técnicas

- Criar ADR-010 "Modelo de Tenancy" (resolve C1)
- Refatorar canônico: extensions verticais (resolve H1)
- Decidir engine de expressão única (resolve H3)
- Adicionar transformações faltantes ao mapping (split, secret-injection, paths com `[N]`)
- Reabrir Discovery: Sankhya, TOTVS Protheus, SAP (resolve C4)
- Capacity matrix realista por conector (resolve C5)
- Criar ADR "OAuth em desktop" (resolve H10)
- Fortalecer anti-replay no relay (resolve C2)
- Pseudonimização real para esquecimento fiscal (resolve H5)

### Sprint -1 (semana 4) — Correções comerciais e PM

- Recalibrar ROI calculator com premissas defensáveis (resolve C8, C9)
- Refazer math comercial bottom-up (resolve C7)
- Corrigir story points + adicionar DOR (resolve C6)
- Fechar 1 case real com cliente piloto (resolve C10)
- Pricing: subir volume incluso, baixar excedente
- Criar SLA "Pro Plus" intermediário
- Definir ICP afiado e buyer personas (resolve marketing)

### Sprint 0 — Iniciar conforme plano original

Apenas após CRITICAL/HIGH resolvidos.

---

## Observações finais por agente

### Arquiteto

> "Anti-Corruption Layer textbook, mas tenancy é o calcanhar de Aquiles. SDK promete sandbox que Worker thread Node não entrega."

### Segurança

> "Webhook entrante sem anti-replay é falha grave. DPA Cloudflare como TODO é amador para B2B."

### SRE

> "Vai dar plantão às 3am? Falta endpoint `/healthz` único + DR runbook DPAPI + observability OpenTelemetry real (só correlation ID em log não chega)."

### Engenharia ERP

> "Sankhya endpoint híbrido, Protheus endpoint inventado, SAP sem $batch são bloqueadores de implementação. Não é polimento — é factualmente errado."

### QA

> "Lacuna mais perigosa: race entre retry interno e webhook tardio causa duplicidade no Bling em update de mapping. Cliente vê pedido duplicado, suporte L1 não diagnostica."

### PM

> "Aposta: Fase 0 termina mês 4 (não 3), Bling GA mês 5 (não 4), MRR R$30k mês 8 (não 6). Replanejar."

### Comercial

> "ROI 6 dias + TCO RPA R$764k te derruba na call esta semana. Comprador inteligente faz conta de guardanapo, vê overstatement, perde confiança em todo material."

### Marketing

> "Sem cliente real e sem ICP afiado, todo material vira Potemkin village. Construir 1 case real antes de continuar."

### Jurídico

> "Documentos têm boa estrutura mas NÃO ESTÃO PRONTOS para uso comercial. Placeholders + DPA ausente + multa assimétrica + marketplace sem contrato-tipo são bloqueadores."

### DX

> "Hoje novo contratado se perde em 5 min. README + glossário + correção de paths + reorganização da raiz: meia hora de leitura guiada por papel."

---

## Próxima decisão

Steering Committee decide entre:

**Opção A** — Replanejar (recomendado): adicionar 3 sprints de remediação (Sprint -3, -2, -1) antes de iniciar Sprint 0 do plano. Prazo total: 21 meses (vs 18 originais).

**Opção B** — Risco aceito: iniciar Sprint 0 mantendo CRITICAL/HIGH como dívida técnica. Probabilidade alta de retrabalho na Fase 1.

**Opção C** — Híbrida: paralelizar Sprint 0 técnico com Sprint -3 jurídico+DX (não bloqueante para dev). Sprints -2 e -1 absorvidos no Sprint 0–1. Prazo: 19 meses.

Recomendação dos auditores: **Opção C** — paralelo, sem postergar tudo, mas tratando CRITICAL antes de Fase 1 começar.

---

**Anexos**: respostas completas dos 10 agentes preservadas em sessão de origem.
