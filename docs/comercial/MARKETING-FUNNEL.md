# Marketing Funnel — Solution Ticket

**Versão**: 1.0 — 2026-04-27
**Resolve**: Auditoria Rodada 5 — Agente 8 — "Funil sem assets MOFU/BOFU mensuráveis"
**Audiência**: Marketing, Vendas, PM
**Relacionados**: `PROJECAO-COMERCIAL-RECALIBRADA.md`, `MARKETING-SEO-CONTENT.md`, `MARKETING-MEASUREMENT.md`

---

## Visão geral

Funil estruturado por **segmento** (PME, Médio, Tier-1/Enterprise) com estágios **TOFU (descoberta) → MOFU (consideração) → BOFU (decisão)**. Cada estágio tem asset, KPI próprio e CAC alvo. Volume foi derivado da meta de 110 clientes ativos no mês 18 (`PROJECAO-COMERCIAL-RECALIBRADA.md`).

---

## Funil por segmento

### PME (Pro — ticket médio R$ 944/mês)

| Estágio    | Asset                                                                                | KPI                                    | CAC alvo                 |
| ---------- | ------------------------------------------------------------------------------------ | -------------------------------------- | ------------------------ |
| TOFU       | Blog SEO (compliance fiscal, outbox, RPA quebra), redes sociais, anúncio Meta/Google | Visitas únicas/mês, CTR                | —                        |
| MOFU       | Whitepaper "Confiabilidade fiscal", comparativos vs RPA / vs custom, ROI calculator  | MQLs (download gated), tempo na página | R$ 200–400               |
| BOFU       | Demo self-service 15 min, PoC 7 dias, one-pager executivo                            | SQLs (demo agendada), POCs iniciados   | R$ 600–900               |
| Fechamento | Proposta + onboarding remoto                                                         | Clientes ativos, payback < 12 meses    | **CAC total ≤ R$ 1.200** |

### Médio BR (Pro — ticket médio R$ 2.488/mês)

| Estágio    | Asset                                                              | KPI                               | CAC alvo                 |
| ---------- | ------------------------------------------------------------------ | --------------------------------- | ------------------------ |
| TOFU       | Webinar mensal, blog técnico, evento setorial (agro/indústria)     | Visitas, registrados webinar      | —                        |
| MOFU       | Whitepaper, ROI calc, case sintético segmentado, comparativo iPaaS | MQLs, abertura de e-mail nutrição | R$ 800–1.500             |
| BOFU       | Demo customizada 45 min, PoC 14 dias, ROI report                   | SQLs, POCs em andamento           | R$ 2.500–4.000           |
| Fechamento | Proposta + workshop técnico                                        | Clientes ativos, NRR ≥ 110%       | **CAC total ≤ R$ 5.000** |

### Tier-1 BR / Enterprise (R$ 3.479–7.920/mês)

| Estágio    | Asset                                                                                   | KPI                             | CAC alvo                  |
| ---------- | --------------------------------------------------------------------------------------- | ------------------------------- | ------------------------- |
| TOFU       | Conteúdo executivo (CFO/CIO), participação em fóruns CIO, ABM                           | Contas-alvo engajadas           | —                         |
| MOFU       | Workshop técnico fechado, due diligence kit (segurança+LGPD), arquitetura de referência | MQLs nominais por conta-alvo    | R$ 5.000–12.000           |
| BOFU       | RFP responder, PoC 30–60 dias, prova de SLA, account manager                            | SQLs, POCs com sucesso técnico  | R$ 18.000–35.000          |
| Fechamento | Contrato master + SLA + DPA                                                             | Clientes ativos, churn < 5%/ano | **CAC total ≤ R$ 50.000** |

---

## Volumes-alvo mensais (derivado da meta 110 clientes mês 18)

Premissas de conversão observadas (benchmarks B2B SaaS BR):

- Visita → MQL: **2,5%**
- MQL → SQL: **20%**
- SQL → Demo: **70%**
- Demo → POC: **40%**
- POC → Fechado: **45%** (PME/Médio); **30%** (Tier-1/Enterprise)

### Volumes mensais médios para fechar 110 clientes em 18 meses

Distribuição alvo: 60 PME + 30 Médio + 14 Tier-1 BR + 6 Enterprise = 110.

| Funil                       | PME (60)  | Médio (30) | Tier-1+Ent (20) |
| --------------------------- | --------- | ---------- | --------------- |
| Fechamentos/mês (média 18m) | 3,3       | 1,7        | 1,1             |
| POCs necessários/mês        | 7,4       | 3,8        | 3,7             |
| Demos necessárias/mês       | 18,5      | 9,5        | 9,3             |
| SQLs necessários/mês        | 26        | 13,5       | 13              |
| MQLs necessários/mês        | 130       | 67,5       | 65              |
| **Visitas necessárias/mês** | **5.200** | **2.700**  | **2.600**       |

**Total visitas/mês alvo**: ~10.500 visitas únicas/mês (ramp-up: 1.500 mês 3 → 10.500 mês 12).

---

## Mapa de jornada — estados e donos

```
Prospect → Lead → MQL → SQL → Demo → POC → Cliente fechado
   │        │      │     │      │      │         │
   │ TOFU   │ TOFU │MOFU │ BOFU │ BOFU │ BOFU    │ Fechamento
   │        │      │     │      │      │         │
   Marketing       SDR/Inside  Sales       CS/Onboarding
```

### Pontos de conversão e dono responsável

| Transição       | Gatilho/critério                                        | Dono                 |
| --------------- | ------------------------------------------------------- | -------------------- |
| Prospect → Lead | Visitante deixa e-mail (newsletter, calc, blog)         | Marketing            |
| Lead → MQL      | Score ≥ 50 (download whitepaper + 2 visitas em 14 dias) | Marketing automation |
| MQL → SQL       | Qualificação BANT/MEDDIC: budget + autoridade + dor     | SDR / Inside Sales   |
| SQL → Demo      | Reunião agendada e realizada                            | Inside Sales         |
| Demo → POC      | Cliente aceita rodar PoC com critérios de sucesso       | Sales                |
| POC → Fechado   | Critérios atingidos, contrato assinado                  | Sales + CS           |

### SLAs internos

- Lead → contato SDR: **≤ 4h úteis** (PME), **≤ 1h útil** (Médio+)
- MQL → ligação qualificadora: **≤ 24h**
- SQL → demo agendada: **≤ 5 dias úteis**
- POC início → kick-off técnico: **≤ 7 dias** (PME), **≤ 14 dias** (Médio+)

---

## Premissas e revisão

- Conversões são **estimativas iniciais**; recalibrar trimestralmente com dados reais.
- CACs alvo são **tetos**; LTV/CAC mínimo aceitável = 3x.
- Volumes refletem mix-alvo do mês 18, **não** o mês 1. Plano de ramp-up em `MARKETING-MEASUREMENT.md`.
- Se conversões reais ficarem 30% abaixo, revisar verba de mídia + revisão de qualificação MQL.
