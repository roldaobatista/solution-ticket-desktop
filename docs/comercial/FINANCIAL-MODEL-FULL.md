# Financial Model Full — Modulo Integracao ERP

> Owner: **CFO + PM**. Status: **a executar pre-Sprint-1**. Entrega formal ao Steering antes de iniciar Sprint 1.
> Insumos: CASH-FLOW-MODEL.md, ICP-DEFINITION.md, RICE-PRIORITIZATION.md, RUNWAY-DEPENDENCIES-EXTERNAL.md.
> Saida: planilha rodavel (Excel/Google Sheets) + script Python/R para Monte Carlo + ata de aprovacao Steering.

## 1. Objetivo

Modelo financeiro completo, com componentes que CASH-FLOW-MODEL.md nao detalha:

- CAC por canal de aquisicao.
- LTV por segmento de cliente.
- Payback (meses).
- NPV em 3 cenarios.
- TIR.
- Monte Carlo (10k iteracoes, 4 drivers, distribuicao triangular).
- Tornado chart.
- Stress test "muito-pessimista" + plano de reducao de squad em 30d.

Sem este modelo aprovado, **nao iniciar Sprint 1**.

## 2. CAC por canal

| Canal                                                | CAC alvo (R$) | % do mix Fase 1-2 | Premissas                                                                                                               |
| ---------------------------------------------------- | ------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Outbound SDR**                                     | 15-25k        | 40%               | 1 SDR (R$ 10k/mes carregado) gera ~3 SQLs/mes; conversao 25% -> ~0,75 closed/mes -> ~R$ 13k/closed; +overhead comercial |
| **Inbound** (SEO, content, organico)                 | 8-15k         | 25%               | Content BR (1 redator + 1 SEO) ~R$ 8k/mes; conversao mais lenta (6-9m), gera 1-2 closed/mes apos T2                     |
| **Partner-led** (TOTVS, integradoras, parceiros ERP) | 20-30k        | 25%               | Comissao de 15-25% sobre setup + MRR ano 1 + tempo de pre-venda compartilhado                                           |
| **Evento** (feiras setoriais: Agrishow, Fenatran)    | 25-40k        | 10%               | Estande + viagens R$ 80-150k por evento; gera 5-10 SQLs, conversao 20%                                                  |

**CAC blended target Fase 1-2: R$ 18-22k.**

### Acoes de monitoramento

- Mensal: CAC realizado por canal vs target.
- Trimestral: re-baseline do mix se 1 canal vira >50% (concentracao de risco).
- Anti-padrao: contar CAC apenas o "marginal" (so comissao SDR) — incluir overhead de marketing + lideranca comercial.

## 3. LTV por segmento

| Segmento                            | Ticket setup (R$) | MRR (R$)  | Churn anual | **LTV bruto** | Margem bruta | **LTV liquido** |
| ----------------------------------- | ----------------- | --------- | ----------- | ------------- | ------------ | --------------- |
| **PME** (Bling, Omie, Conta Azul)   | 8-15k             | 800-1.500 | 12%         | ~R$ 18-30k    | 65%          | **R$ 12-20k**   |
| **Tier-1 BR** (Sankhya, mid-market) | 30-60k            | 3-6k      | 8%          | ~R$ 80-150k   | 60%          | **R$ 50-90k**   |
| **Enterprise** (Protheus, SAP B1)   | 80-200k           | 8-15k     | 6%          | ~R$ 200-500k  | 55%          | **R$ 110-275k** |

### Premissas LTV

- LTV bruto = setup + (MRR x 12 / churn).
- Margem bruta inclui: cloud, suporte L1/L2, custo de servico (CSM rateado).
- Curva de churn realista: pico de churn 90 dias (~6%), depois cai para anualizado.

### Indicadores derivados

- **LTV/CAC PME**: alvo 3-5x. R$ 12-20k / R$ 8-15k = **~1,5-2,0x** (margem apertada — exige eficiencia de canal).
- **LTV/CAC Tier-1**: alvo 5-8x. R$ 50-90k / R$ 18-25k = **~2,5-4x** (saudavel).
- **LTV/CAC Enterprise**: alvo >=8x. R$ 110-275k / R$ 25-40k = **~4-7x** (mais saudavel, mas Reach baixo).

> Conclusao: PME isolado nao paga CAC saudavel. Mix de segmentos e necessario; ou repricing PME (RE-PRICING-TIER1.md).

## 4. Payback

**Definicao**: meses para cliente recuperar CAC investido (em dinheiro, nao em margem).

| Segmento   | Payback (meses) | Target SaaS BR | Status                        |
| ---------- | --------------- | -------------- | ----------------------------- |
| PME        | 18-24m          | <=18m          | **Acima do target — atencao** |
| Tier-1 BR  | 8-12m           | <=18m          | OK                            |
| Enterprise | 6-10m           | <=18m          | OK                            |

### Implicacao

- PME requer **setup fee mais alto** ou **ciclo de venda mais barato** para fechar payback <=18m.
- Discutir em RE-PRICING-TIER1.md: subir setup PME para R$ 12-18k.

## 5. NPV — tabela de cenarios

> Vide CASH-FLOW-MODEL.md secao 7 para resumo. Aqui detalhar memoria de calculo.

### 5.1 Premissas de desconto

- Taxa anual: **15%**.
- Taxa mensal equivalente: 1,17%.
- Horizonte: 18m (curto), 36m (longo).

### 5.2 NPV por cenario (R$ mil)

| Cenario                 | NPV 18m | NPV 36m         | Comentario                     |
| ----------------------- | ------- | --------------- | ------------------------------ |
| Base                    | -2.900  | +1.500 a +2.500 | Pago em 30-32m                 |
| Pessimista              | -3.750  | -500 a +500     | Faixa de breakeven, risco alto |
| Otimista (drivers +20%) | -1.700  | +5.000 a +7.000 | TIR atrativa                   |

### 5.3 Sensibilidade da taxa de desconto

- A 12% a.a.: NPV 36m base ~ +R$ 2,5-3,5M.
- A 18% a.a.: NPV 36m base ~ +R$ 0,5-1,5M.
- A 22% a.a.: NPV 36m base **negativo** — projeto nao paga custo de capital de fundos seed/series-A agressivos.

## 6. TIR

| Horizonte | Cenario base  | Pessimista | Otimista |
| --------- | ------------- | ---------- | -------- |
| 18m       | n/a (NPV neg) | n/a        | n/a      |
| 36m       | **22-28%**    | 12-18%     | 35-45%   |

**Target: TIR risk-adjusted >= 30%.** So cenario otimista atinge naturalmente. Base requer NRR forte (>=110%) para subir.

## 7. Monte Carlo

### 7.1 Setup

- **10.000 iteracoes**.
- **4 drivers** com distribuicao **triangular**:

| Driver                   | Min | Modal | Max | Justificativa                |
| ------------------------ | --- | ----- | --- | ---------------------------- |
| Win rate (SQL -> Closed) | 15% | 25%   | 32% | Faixa benchmark SaaS BR B2B  |
| Ciclo medio (dias)       | 70  | 90    | 140 | Pior caso: enterprise + cert |
| Ticket medio (R$ k)      | 28  | 45    | 60  | PME -> Tier-1 mix            |
| Churn anual              | 6%  | 8%    | 15% | Pior caso: ICP errado        |

- Cada iteracao: gera fluxo de caixa 36m, calcula NPV @ 15% a.a.
- Saida: distribuicao de NPV, P(NPV>0), VAR (value at risk) p5/p50/p95.

### 7.2 Resultados esperados (a executar)

- **P(NPV 36m > 0)**: target >= 60%. Estimativa preliminar: **45-55%**.
- **P(NPV 36m > +R$ 2M)**: estimativa **30-40%**.
- **VAR p5 (pior 5%)**: NPV ~ -R$ 4 a -R$ 5M.
- **VAR p95 (melhor 5%)**: NPV ~ +R$ 8 a +R$ 10M.

### 7.3 Implementacao tecnica

- Linguagem: Python (NumPy + SciPy + Pandas) ou R.
- Reproducibilidade: seed fixa, codigo versionado em `tools/financial-model/`.
- Output: CSV + grafico de distribuicao + tornado.

## 8. Tornado Chart

Ranking de drivers por impacto em NPV 36m base (mantendo demais no modal):

| Rank | Driver         | Range NPV (R$ M) | Impacto       |
| ---- | -------------- | ---------------- | ------------- |
| 1    | Win rate       | ~2,8             | Critico       |
| 2    | Ticket medio   | ~2,1             | Alto          |
| 3    | Ciclo de venda | ~1,4             | Medio         |
| 4    | Churn anual    | ~0,9             | Medio (cauda) |

### Acao do PM

- Top 2 drivers (win rate, ticket medio) -> foco do plano comercial.
- Discovery cadence (DISCOVERY-CADENCE.md) deve coletar evidencias para reduzir Confidence-gap nestes 2 drivers.

## 9. Stress test — cenario muito-pessimista

### 9.1 Setup

- 2 drivers em -30% simultaneamente (combinacao pior-de-2):
  - Win rate: 17,5%.
  - Ticket medio: R$ 31,5k.
  - Demais drivers no base.
- Ciclo: 36m.

### 9.2 Resultado esperado

- NPV 36m: **-R$ 2 a -R$ 3M** (nao paga investimento, queima caixa).
- Caixa acumulado pico: ~R$ 4,5M (excede runway alvo R$ 8-9M? Nao — runway cobre, mas paga zero retorno).
- Trajetoria de break-even: nao fecha em 36m.

### 9.3 Plano de reducao de squad em 30d

- Acionado se 2 trimestres consecutivos confirmarem trajetoria muito-pessimista.
- Acoes:
  1. Cortar comercial em 50% (4 -> 2 vendedores). Economia: ~R$ 60k/mes.
  2. Eng em modo manutencao: cortar 2 devs, reter 1 dev sr + tech lead. Economia: ~R$ 80k/mes.
  3. Congelar contratacoes pendentes. Economia: variavel.
  4. Suspender investimento marketing pago. Economia: ~R$ 30k/mes.
- **Reducao total: ~R$ 170k/mes**, estende runway em ~6m sem captacao adicional.
- Deliverable: durante esses 6m, validar pivot (PME-only, white-label, ou descontinuar — ver STOP-LOSS-PROTOCOL secao 2).

## 10. Entregaveis e governanca

### 10.1 Artefatos

- [ ] Planilha Excel/Google Sheets com todas as secoes acima, parametrizavel.
- [ ] Script Python/R de Monte Carlo (versionado em `tools/financial-model/`).
- [ ] Tornado chart (PNG/PDF) e distribuicao NPV (PNG/PDF).
- [ ] Sumario executivo de 2 paginas para Steering.

### 10.2 Aprovacao

- Owner: **CFO** (responsavel) + **PM** (suporte).
- Revisao: 1 advisor externo SaaS B2B BR (independente).
- Aprovacao formal: **unanimidade do Steering**, ata em `docs/comercial/atas/YYYY-MM-DD-financial-model-full.md`.

### 10.3 Cadencia de atualizacao

- **Trimestral**: re-rodar Monte Carlo com drivers realizados.
- **Anual**: revisao completa de premissas com auditor externo.
- **Ad-hoc**: re-rodar se algum driver desviar >20% por 2 meses consecutivos.
