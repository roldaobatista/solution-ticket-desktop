# Re-Pricing Tier-1 BR e Enterprise — Modulo Integracao ERP

> Owner agentico: `Finance-Agent` + `PricingPolicyAgent`. Aprovacao humana substituida por policy-as-code. Insumos: CASH-FLOW-MODEL.md, ICP-DEFINITION.md.

## 1. Problema

O pricing atual de Tier-1 BR (Sankhya, Protheus mid-market) e Enterprise (SAP B1, TOTVS Datasul) **nao sustenta LTV/CAC >= 3x** nas premissas do CASH-FLOW-MODEL.md.

### Diagnostico

- **Ciclo de venda Tier-1**: 6-12 meses (vs 60-90 dias do PME).
- **CAC observado Tier-1**: R$ 50.000-R$ 100.000 (SE em pre-venda + RFP + POC).
- **Setup atual Tier-1**: R$ 8.000-R$ 15.000 (subsidiado, herdado do Tier PME).
- **MRR atual Tier-1**: R$ 1.500-R$ 2.500.
- **LTV (3 anos, churn 8%)**: ~R$ 65.000.
- **LTV/CAC atual**: 0,7x-1,3x — insustentavel.

Continuar com este pricing significa **subsidiar Tier-1 com receita do PME** e atrasar break-even em 6-9 meses.

## 2. Proposta — Tier-1 BR (Sankhya, Protheus mid-market)

| Item                              | Atual       | Proposto                              | Variacao |
| --------------------------------- | ----------- | ------------------------------------- | -------- |
| Setup                             | R$ 8-15k    | **R$ 30-60k**                         | +3-4x    |
| MRR                               | R$ 1,5-2,5k | **R$ 2,5-5k**                         | +1,7-2x  |
| Inclui SE dedicado onboarding     | nao         | **sim (60 dias)**                     | novo     |
| Co-venda com partner              | nao         | **sim (TOTVS, Sankhya, integradora)** | novo     |
| Reducao CAC esperada via co-venda | -           | **~40%**                              | -        |

**Justificativa do setup R$ 30-60k**: cobre 60 dias de SE dedicado (R$ 25k) + customizacao de campos especificos do ERP (R$ 10-20k) + treinamento (R$ 5k) + margem 30%.

## 3. Proposta — Enterprise (SAP B1, TOTVS Datasul, customizacoes >R$ 500M faturamento)

| Item                             | Atual     | Proposto                     | Variacao |
| -------------------------------- | --------- | ---------------------------- | -------- |
| Setup                            | R$ 15-25k | **R$ 60-120k**               | +4-5x    |
| MRR                              | R$ 2,5-4k | **R$ 5-12k**                 | +2-3x    |
| SE dedicado onboarding           | nao       | **sim (90 dias)**            | novo     |
| SLA dedicado                     | padrao    | **Premium (4h resposta P1)** | novo     |
| Customer Success Manager nomeado | nao       | **sim**                      | novo     |

**Justificativa**: Enterprise espera fornecedor com governanca; pricing baixo gera **desconfianca** ("e barato demais para ser bom?"). Pricing premium tambem **filtra** leads que nao tem orcamento de implantacao serio.

## 4. LTV/CAC — Atual vs Proposto

| Segmento             | LTV atual | CAC atual | LTV/CAC atual | LTV proposto  | CAC proposto  | LTV/CAC proposto |
| -------------------- | --------- | --------- | ------------- | ------------- | ------------- | ---------------- |
| **PME (Bling/Omie)** | R$ 35k    | R$ 8k     | 4,4x          | (sem mudanca) | (sem mudanca) | 4,4x             |
| **Tier-1 BR**        | R$ 65k    | R$ 70k    | 0,9x          | R$ 165k       | R$ 42k        | **3,9x**         |
| **Enterprise**       | R$ 110k   | R$ 95k    | 1,2x          | R$ 320k       | R$ 95k        | **3,4x**         |

> Todos os segmentos atingem **LTV/CAC >= 3x** com o novo pricing. Premissa: PME nao muda; Tier-1 e Enterprise sustentam o modelo.

## 5. Roll-Out

### Fase 2 (mes 7+) — aplicacao

- Novo pricing entra em vigor para **novas propostas a partir do mes 7**.
- Contratos vigentes mantem pricing antigo ate vencimento natural (12 meses).
- Renovacoes apos vencimento entram no novo pricing — comunicar com 90 dias de antecedencia.

### Comunicacao a clientes existentes

- Email + ligacao do CSM com 90 dias de antecedencia.
- Justificativa: "investindo em SE dedicado, SLA premium, novos conectores".
- Oferta de fidelidade: 12% desconto no primeiro ano novo se renovar 60 dias antes do vencimento.

### Treinamento de Vendas

- Workshop interno (2 dias) sobre defesa de pricing.
- Calculadora ROI atualizada (baseada em casos reais de Fase 1).
- Battle cards vs concorrentes (TOTVS Fluig, Senior, Linx).

## 6. Riscos e Mitigacoes

| Risco                                  | Probabilidade | Mitigacao                                                                      |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| Perda de leads Tier-1 por preco alto   | Media         | Co-venda com partner reduz friccao; pricing premium tambem filtra leads serios |
| Churn em renovacao por aumento         | Media-Alta    | Comunicacao 90d antes + desconto fidelidade; CSM dedicado                      |
| Concorrencia entrar com preco baixo    | Baixa-Media   | TOTVS/Senior nao querem subsidiar Tier-1; nosso diferencial e foco em pesagem  |
| Vendas internas reagirem negativamente | Alta          | Treinamento + comissao mantida em % (ganha mais por venda)                     |

## 7. Metricas de Acompanhamento (mensal)

- Win rate por tier (Tier-1 deve manter >=20%, mesmo com preco maior).
- Tempo medio de fechamento por tier.
- LTV/CAC realizado por cohort trimestral.
- NPS de clientes que renovaram com novo pricing.

Re-avaliar pricing no checkpoint **mes 12** (STOP-LOSS-PROTOCOL.md secao 3). Se LTV/CAC realizado < 2,5x em qualquer tier, ajustar.
