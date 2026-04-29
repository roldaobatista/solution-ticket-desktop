# Projeção Comercial Recalibrada (Pós-Auditoria)

**Versão**: 1.0 — 2026-04-26
**Resolve**: CRITICAL C7 da auditoria 10-agentes
**Substitui**: `PLANO-COMERCIAL.md` §10 e `PLANO-MODULO-INTEGRACAO.md` §16.4

---

## Diagnóstico

Auditor identificou inconsistência: PLANO §16.3 prevê **15 clientes ativos no mês 6**, mas §16.4 prevê **MRR R$ 30k mês 6**. Para chegar a R$ 30k com Pro a R$ 297/balança + R$ 197 conector, precisa **~60 balanças ativas em 15 clientes** = 4 balanças/cliente em média.

PME tem em média 1–2 balanças, não 4. Math não fecha.

---

## Recálculo bottom-up

### Premissas defensáveis

- **PME (Pro)**: média 1.5 balanças/cliente, 1 conector incluso, 2.000 pesagens/mês (1k incluso + 1k excedente)
- **Médio (Pro)**: média 3 balanças, 1 conector, 5k pesagens/mês
- **Tier-1 BR (Enterprise)**: média 4 balanças, 2 conectores, 8k pesagens/mês
- **Enterprise global**: média 6 balanças, 3 conectores, 15k pesagens/mês

### Ticket médio mensal por categoria

| Categoria                  | Pricing detalhado                                         | Ticket médio/mês |
| -------------------------- | --------------------------------------------------------- | ---------------- |
| **PME (Pro)**              | (R$ 297 × 1,5) + R$ 197 + (1.000 × R$ 0,30)               | **R$ 944**       |
| **Médio (Pro)**            | (R$ 297 × 3) + R$ 397 + (4.000 × R$ 0,30)                 | **R$ 2.488**     |
| **Tier-1 BR (Enterprise)** | R$ 1.497 + (R$ 197 × 4) + (R$ 797 + R$ 397) + 0 excedente | **R$ 3.479**     |
| **Enterprise global**      | R$ 1.497 + (R$ 197 × 6) + (R$ 1.497 × 3) + (5k × R$ 0,15) | **R$ 7.920**     |

---

## Projeção de clientes ativos por mês (realista)

Bottom-up baseado em ciclo de vendas + capacidade comercial real:

| Mês | PME | Médio | Tier-1 BR | Enterprise | Total clientes |
| --- | --- | ----- | --------- | ---------- | -------------- |
| 6   | 8   | 2     | 0         | 0          | **10**         |
| 9   | 18  | 6     | 1         | 0          | **25**         |
| 12  | 30  | 12    | 4         | 1          | **47**         |
| 15  | 45  | 20    | 8         | 3          | **76**         |
| 18  | 60  | 30    | 14        | 6          | **110**        |

(Versão anterior do plano: 15→50→150 — superestimada)

---

## Funil de pipeline (mensal)

Para chegar a **110 clientes ativos no mês 18**, com mix dominante PME+Médio (Pro) e cauda Tier-1/Enterprise:

| Etapa                              | Conversão da etapa anterior | Volume mensal estável (steady state) |
| ---------------------------------- | --------------------------- | ------------------------------------ |
| Leads (topo de funil)              | —                           | **600 leads/mês**                    |
| MQL (Marketing Qualified)          | 40%                         | 240                                  |
| SQL (Sales Qualified)              | 50% (sobre MQL)             | 120                                  |
| Demo agendada                      | 60% (sobre SQL)             | 72                                   |
| Proposta enviada                   | 50% (sobre demo)            | 36                                   |
| Fechado-Pro (PME+Médio)            | 45%                         | ~12 novos clientes Pro/mês           |
| Fechado-Enterprise (Tier-1+global) | 30%                         | ~1–2 Enterprise/mês                  |

**Cálculo reverso**:

- Mês 18 alvo: 110 clientes ativos. Considerando churn coorte (4% mês 1–6, 2,5% mês 7–12, 1,5% após), aquisição bruta acumulada ≈ 130–140 clientes em 18 meses.
- Aquisição mensal média: ~8 clientes/mês no início, escalando a 14 clientes/mês perto do mês 18.
- Para sustentar 14 fechamentos/mês com win rate combinado ~42% sobre proposta e taxas acima: **leads necessários ≈ 600/mês** (steady state mês 12+); **300/mês** no início (mês 1–6), escalando.

### Headcount comercial necessário

| Marco  | SDRs | AEs (Account Executives) | Sales Sênior (Tier-1/Enterprise) | Capacidade aproximada |
| ------ | ---- | ------------------------ | -------------------------------- | --------------------- |
| Mês 6  | 2    | 2                        | 0 (CEO/founder vende top)        | 8–10 fechamentos/mês  |
| Mês 12 | 4    | 4                        | 1                                | 14–16 fechamentos/mês |
| Mês 18 | 5    | 5                        | 2                                | 18–20 fechamentos/mês |

- **SDR (Sales Development Rep)**: prospecção fria, qualificação inicial. Meta ~80 calls/dia, 12 MQLs/semana.
- **AE (Account Executive / Inside Sales)**: discovery + demo + fechamento PME/Médio.
- **Sales Sênior**: ciclos longos Tier-1 BR e Enterprise, co-venda com partners ERP.

### Sensibilidade aos drivers (cenários ±20%)

Driver base: win rate proposta→fechado **45% (Pro)**, ciclo médio **45 dias**, ticket médio mensal **R$ 2.000** (mix PME+Médio).

| Cenário                    | Win rate | Ciclo | Ticket médio | Clientes mês 18 | MRR mês 18  |
| -------------------------- | -------- | ----- | ------------ | --------------- | ----------- |
| Pessimista (-20% em todos) | 36%      | 54d   | R$ 1.600     | 75              | R$ 145k     |
| **Base**                   | 45%      | 45d   | R$ 2.000     | **110**         | **R$ 228k** |
| Otimista (+20% em todos)   | 54%      | 36d   | R$ 2.400     | 145             | R$ 320k     |
| Win rate -20% (isolado)    | 36%      | 45d   | R$ 2.000     | 90              | R$ 188k     |
| Ciclo +20% (isolado)       | 45%      | 54d   | R$ 2.000     | 95              | R$ 195k     |
| Ticket -20% (isolado)      | 45%      | 45d   | R$ 1.600     | 110             | R$ 182k     |

**Lições**:

- Win rate é o driver de maior alavancagem (impacto direto no número de clientes).
- Ciclo afeta principalmente cash flow precoce (mês 6–12).
- Ticket médio impacta MRR linearmente sem afetar contagem.

---

## Projeção de MRR recalibrada

| Mês | PME R$ | Médio R$ | Tier-1 BR R$ | Enterprise R$ | **MRR Total R$** |
| --- | ------ | -------- | ------------ | ------------- | ---------------- |
| 6   | 7,5k   | 5k       | 0            | 0             | **12,5k**        |
| 9   | 17k    | 15k      | 3,5k         | 0             | **35,5k**        |
| 12  | 28k    | 30k      | 14k          | 8k            | **80k**          |
| 15  | 42k    | 50k      | 28k          | 24k           | **144k**         |
| 18  | 57k    | 75k      | 49k          | 47k           | **228k**         |

**ARR mês 18**: R$ 2,7M (vs R$ 6M originalmente projetado — superestimado)

---

## Setup fee acumulado

| Mês                | Setups novos no período | Receita setup  |
| ------------------ | ----------------------- | -------------- |
| 0–6                | 10 (mix PME+médio)      | R$ 25.000      |
| 7–12               | 37                      | R$ 130.000     |
| 13–18              | 63                      | R$ 290.000     |
| **Total 18 meses** | **110 setups**          | **R$ 445.000** |

(Versão anterior: R$ 1,2M — superestimada)

---

## Receita total 18 meses

```
Receita recorrente acumulada (somatório MRR mês a mês): R$ ~1,7M
Receita setup one-time: R$ 0,45M
Serviços profissionais (10% receita Enterprise): R$ 0,15M

TOTAL RECEITA 18 MESES: R$ ~2,3M
```

vs custo (PLANO §18): R$ 2,1M
**Margem em 18 meses: R$ 200k (~10%)**

→ Operação **break-even no mês 16–18**, NÃO 14–16 como antes.

---

## Reconciliação com objetivos estratégicos

Objetivo O5 do PLANO: "30% do MRR do produto até mês 18".

Se módulo de integração tem MRR R$ 228k mês 18, e produto base tem MRR adicional, total ~R$ 760k.

**Realista? Sim** — mas exige produto base estar gerando R$ 530k MRR com clientes Standard que NÃO têm hub. Validar em projeção do produto base.

---

## Cenários de risco

### Cenário pessimista (-30%)

- 75 clientes mês 18, MRR R$ 160k → ARR R$ 1,9M
- Ainda paga custos, margem ~0
- **Sobrevivência sim, lucro não**

### Cenário otimista (+30%)

- 145 clientes, MRR R$ 295k → ARR R$ 3,5M
- Margem R$ 1M
- **Levantar Série A possível**

### Cenário catastrófico (-60%)

- 45 clientes, MRR R$ 90k
- Custo ainda R$ 2,1M → déficit R$ 1M
- **Necessário recapitalizar OU acelerar Tier-1**

---

## Comparativo antes vs depois (auditoria)

| Métrica         | Original  | Recalibrado | Diff      |
| --------------- | --------- | ----------- | --------- |
| Clientes mês 6  | 15        | 10          | -33%      |
| Clientes mês 12 | 50        | 47          | -6%       |
| Clientes mês 18 | 150       | 110         | -27%      |
| MRR mês 6       | R$ 30k    | R$ 12,5k    | -58%      |
| MRR mês 12      | R$ 150k   | R$ 80k      | -47%      |
| MRR mês 18      | R$ 500k   | R$ 228k     | -54%      |
| ARR mês 18      | R$ 6M     | R$ 2,7M     | -55%      |
| Break-even      | mês 14–16 | mês 16–18   | escorrega |

---

## CAC vs LTV recalibrado

### CAC realista (custo aquisição)

| Categoria  | CAC original | CAC realista                     |
| ---------- | ------------ | -------------------------------- |
| PME        | R$ 500       | R$ 1.500 (cold + nutring + demo) |
| Médio      | R$ 3.000     | R$ 5.000                         |
| Tier-1 BR  | R$ 6.500     | R$ 18.000                        |
| Enterprise | R$ 5.000     | R$ 35.000 (ciclo 12+ meses)      |

### LTV (24 meses, curva de churn por coorte realista)

> Versão anterior usava churn flat 2,5% mensal e gerava LTV inflado (PME R$ 16k). Recálculo usa **curva de churn por coorte**:
>
> - Mês 1–6 da coorte: **4% mensal** (onboarding/early-life churn alto)
> - Mês 7–12: **2,5% mensal** (clientes estáveis filtrando)
> - Mês 13–18: **1,5% mensal** (clientes sticky)
> - Pós-mês 18: **1,5%** (extrapolação conservadora)
>
> Aplicação: somatório de receita esperada × probabilidade de retenção mês a mês até cap de 24 meses, descontada a 0% (não trazemos a presente value para simplificar discussão comercial).

| Categoria  | Ticket médio/mês | LTV recalculado (curva coorte, 24 meses) |
| ---------- | ---------------- | ---------------------------------------- |
| PME        | R$ 944           | **R$ ~12.000** (vs R$ 16.000 anterior)   |
| Médio      | R$ 2.488         | **R$ ~31.000** (vs R$ 42.000)            |
| Tier-1 BR  | R$ 3.479         | **R$ ~44.000** (vs R$ 60.000)            |
| Enterprise | R$ 7.920         | **R$ ~100.000** (vs R$ 135.000)          |

### LTV/CAC

| Categoria  | Original | Anterior (flat) | Recalibrado (coorte) |
| ---------- | -------- | --------------- | -------------------- |
| PME        | 4x       | 10x             | **8x** ✅            |
| Médio      | 6x       | 8x              | **6x** ✅            |
| Tier-1 BR  | 6x       | 3x              | **2,5x** ⚠️          |
| Enterprise | 8x       | 4x              | **3x** ⚠️            |

→ **Tier-1 BR e Enterprise abaixo do mínimo saudável (3x)** com a curva realista. Reforça recomendação de aumentar setup fee + co-venda com partner para reduzir CAC.

---

## Recomendações comerciais decorrentes

### 1. Repensar o "doce-spot"

**Médio** (Sankhya/Senior, 3-5k pesagens) tem **LTV/CAC 8x** + ciclo 30-60 dias. **Maior alavanca de cash flow** no plano. Auditor já apontou. Construir playbook dedicado.

### 2. Aumentar setup fee Tier-1 BR e Enterprise

- Tier-1 BR: R$ 12k → **R$ 18k** + onboarding R$ 18k (já existe)
- Enterprise: R$ 25k → **R$ 35k** + onboarding R$ 100k (já existe)
- Compensa CAC alto.

### 3. Inside sales focado em PME + Médio

- Inside sales fecha PME e Médio
- Sales sênior dedicado a Tier-1 e Enterprise
- Comissão diferente (mais agressiva em Médio)

### 4. Co-vender com parceiros TOTVS/SAP

- Reduz CAC Tier-1/Enterprise
- Negociar revenue share (10-20% para parceiro que indica)

### 5. Marketplace pode salvar receita Tier-2

- Conectores parceiros entregam ERPs que não cabem no roadmap interno
- Revenue 70/30 ainda dá ~R$ 50-200/cliente/mês líquido

---

## Atualizar nos documentos

- [x] Substituir §16.4 do PLANO-MODULO-INTEGRACAO.md (manter referência aqui)
- [x] Substituir §10 do PLANO-COMERCIAL.md (manter referência aqui)
- [x] Atualizar PITCH-DECK slide 13 (roadmap) com números realistas
- [ ] Atualizar SALES-TRAINING §9 (métricas) — recalcular CAC

---

## Próximos passos

1. PM/Comercial valida premissas (média de balanças por categoria)
2. Roldão aprova projeção como meta oficial
3. Comunicar à equipe — não trabalhar com números antigos
4. Revisar trimestralmente conforme pipeline real

---

**Versão**: 1.0 (2026-04-26)
**Owner**: Product Manager + Diretoria Comercial
**Próxima revisão**: trimestral
