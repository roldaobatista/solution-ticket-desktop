# Modelo de Fluxo de Caixa — Modulo Integracao ERP (18 meses)

> Owner: CFO. Revisao mensal. Premissas: ICP-DEFINITION.md, RICE-PRIORITIZATION.md.
> AVISO: numeros em R$ mil. Cenarios sao **referenciais** — confirmar com Steering antes de usar para captacao.

## 1. Premissas Macro

| Driver                     | Base                | Pessimista (-20%) | Muito-Pessimista (-30%, 2 drivers) |
| -------------------------- | ------------------- | ----------------- | ---------------------------------- |
| Win rate (SQL -> Closed)   | 25%                 | 20%               | 17%                                |
| Ciclo medio de venda       | 90 dias             | 110 dias          | 130 dias                           |
| Ticket medio (setup + 12m) | R$ 45k              | R$ 36k            | R$ 32k                             |
| Churn anual                | 8%                  | 10%               | 12%                                |
| MRR medio por cliente      | R$ 1,8k             | R$ 1,5k           | R$ 1,3k                            |
| Capacidade comercial       | 4 vendedores Fase 2 | 4                 | 3                                  |

## 2. Fluxo de Caixa — Cenario Base (R$ mil)

| Mes | Eng | Comercial | Cloud | Cert | Conting. | **Gasto** | Setup | MRR | **Receita** | Caixa Mes | **Acumulado** |
| --- | --- | --------- | ----- | ---- | -------- | --------- | ----- | --- | ----------- | --------- | ------------- |
| 1   | 180 | 40        | 5     | 0    | 20       | 245       | 0     | 0   | 0           | -245      | -245          |
| 2   | 180 | 40        | 5     | 0    | 20       | 245       | 0     | 0   | 0           | -245      | -490          |
| 3   | 180 | 50        | 8     | 30   | 25       | 293       | 15    | 2   | 17          | -276      | -766          |
| 4   | 180 | 50        | 8     | 0    | 20       | 258       | 30    | 5   | 35          | -223      | -989          |
| 5   | 180 | 60        | 10    | 0    | 22       | 272       | 45    | 9   | 54          | -218      | -1.207        |
| 6   | 180 | 60        | 10    | 30   | 25       | 305       | 60    | 14  | 74          | -231      | -1.438        |
| 7   | 220 | 90        | 15    | 0    | 30       | 355       | 90    | 22  | 112         | -243      | -1.681        |
| 8   | 220 | 90        | 15    | 0    | 30       | 355       | 110   | 32  | 142         | -213      | -1.894        |
| 9   | 220 | 100       | 18    | 30   | 32       | 400       | 130   | 44  | 174         | -226      | -2.120        |
| 10  | 220 | 100       | 20    | 0    | 30       | 370       | 150   | 58  | 208         | -162      | -2.282        |
| 11  | 220 | 110       | 22    | 0    | 32       | 384       | 170   | 74  | 244         | -140      | -2.422        |
| 12  | 220 | 110       | 25    | 30   | 35       | 420       | 180   | 92  | 272         | -148      | **-2.570**    |
| 13  | 220 | 110       | 28    | 0    | 32       | 390       | 200   | 112 | 312         | -78       | -2.648        |
| 14  | 220 | 110       | 30    | 0    | 32       | 392       | 210   | 132 | 342         | -50       | -2.698        |
| 15  | 220 | 110       | 32    | 30   | 35       | 427       | 220   | 152 | 372         | -55       | **-2.753**    |
| 16  | 220 | 110       | 35    | 0    | 33       | 398       | 230   | 174 | 404         | +6        | -2.747        |
| 17  | 220 | 110       | 38    | 0    | 33       | 401       | 240   | 198 | 438         | +37       | -2.710        |
| 18  | 220 | 110       | 40    | 30   | 35       | 435       | 250   | 222 | 472         | +37       | -2.673        |

**Pico de burn (Base): mes 15, ~R$ 2,75M acumulados.** Curva vira a partir do mes 16.

## 3. Cenarios

| Cenario                                | Pico de burn | Mes do pico | Break-even (caixa positivo mensal) | Break-even (caixa acumulado zero) |
| -------------------------------------- | ------------ | ----------- | ---------------------------------- | --------------------------------- |
| **Base**                               | ~R$ 2,8M     | mes 14-15   | mes 16                             | mes 22-24                         |
| **Pessimista (-20%)**                  | ~R$ 3,5M     | mes 16-17   | mes 19-20                          | mes 26-28                         |
| **Muito-Pessimista (-30%, 2 drivers)** | ~R$ 4,2M     | mes 18+     | mes 24+                            | pode nao fechar em 36m            |

> **Aviso ao Steering**: o plano original projetava break-even em 18 meses. Modelo revisado mostra que **base realista e mes 22-24**. Plano original era otimista.

## 4. Pre-Requisito de Caixa (Bloqueante)

Antes de iniciar Fase 1, confirmar:

- [ ] Caixa disponivel + linha de credito >= **R$ 3,5M** (cobre cenario pessimista com 0% de folga).
- [ ] Idealmente **R$ 4,5M** (cobre muito-pessimista + buffer 7%).
- [ ] Linha de credito pre-aprovada com cost-of-capital <= 18% a.a.
- [ ] Politica de saque escalonado: primeiro 60% do caixa proprio, depois linha de credito.

**Se caixa+credito < R$ 3,5M: NO-GO Fase 1.** Captar antes ou reduzir escopo.

## 5. Sensibilidade — Drivers Principais (impacto no acumulado mes 18)

| Driver                               | -20%     | Base      | +20%     |
| ------------------------------------ | -------- | --------- | -------- |
| Win rate (SQL -> Closed)             | -R$ 580k | -R$ 2,67M | +R$ 510k |
| Ciclo de venda                       | -R$ 410k | -R$ 2,67M | +R$ 380k |
| Ticket medio                         | -R$ 530k | -R$ 2,67M | +R$ 530k |
| Churn anual                          | -R$ 180k | -R$ 2,67M | +R$ 170k |
| Custo eng (rebalanceamento de squad) | -R$ 720k | -R$ 2,67M | +R$ 720k |

Drivers mais sensiveis: **win rate** e **ticket medio**. Foco do PM/Comercial deve ser nestes dois.

## 6. Stop-Loss — Gatilhos Numericos NO-GO

Detalhamento completo em STOP-LOSS-PROTOCOL.md. Resumo numerico:

| Checkpoint              | Gatilho NO-GO (qualquer um basta)                                      |
| ----------------------- | ---------------------------------------------------------------------- |
| **Mes 6 (fim Fase 1)**  | <5 clientes ativos OU MRR < R$ 4k OU pipeline < 0,5x capacidade Fase 2 |
| **Mes 12 (fim Fase 2)** | <20 clientes ativos OU MRR < R$ 30k OU LTV/CAC < 1,5x                  |
| **Mes 18**              | Caixa acumulado < R$ -3,8M OU ainda sem trajetoria de break-even       |

NO-GO = pivot, reducao squad ou descontinuar — decisao do Steering.

## 7. Analise NPV / TIR

> Achado R2 CFO: o modelo anterior nao incluia desconto de fluxo. Sem NPV/TIR o Steering nao tem como comparar este modulo com alternativas (hardware, novos verticais, M&A).

### 7.1 Premissas de desconto

- **Taxa de desconto: 15% a.a.** (cost of capital de venture-funded SaaS BR — proxy: SELIC ~11% + premio de risco 4 p.p. para projeto early-stage com 5 dependencias externas).
- Equivalente mensal: ~1,17% a.m. (`(1+0,15)^(1/12) - 1`).
- Formula: `NPV = somatorio(FCt / (1+r)^t) - investimento_inicial`, com t em meses, r=1,17%/mes.
- TIR (IRR): taxa que zera NPV no horizonte avaliado.

### 7.2 NPV em 3 cenarios — horizonte 18m

| Cenario                     | Caixa acumulado mes 18 (nao-descontado) | NPV 18m (descontado 15% a.a.) | TIR 18m                                              |
| --------------------------- | --------------------------------------- | ----------------------------- | ---------------------------------------------------- |
| **Base**                    | -R$ 2,67M                               | **~ -R$ 2,90M**               | negativa (n/a, projeto nao paga investimento em 18m) |
| **Pessimista**              | -R$ 3,5M                                | **~ -R$ 3,75M**               | negativa                                             |
| **Otimista (drivers +20%)** | -R$ 1,5M (estimado)                     | **~ -R$ 1,7M**                | negativa                                             |

> **Honestidade brutal**: NPV 18m e **negativo em todos os cenarios**. Plano de 18m nao e auto-justificavel em base puramente NPV — depende de extensao para 36m ou de valor terminal (retencao + up-sell + opcionalidade).

### 7.3 NPV em 36m (com cauda de retencao + up-sell)

Premissas adicionais 19-36m:

- Retencao bruta media 90% a.a. (NRR-bruta), churn 10% a.a.
- Up-sell de 15% a.a. sobre base instalada (modulo + tier-up).
- Capex marginal eng/comercial decrescente (40% do mes 18 a partir do mes 24).

| Cenario        | NPV 36m (15% a.a.)                         | TIR 36m      |
| -------------- | ------------------------------------------ | ------------ |
| **Base**       | **~ +R$ 1,5 a +R$ 2,5M**                   | **~ 22-28%** |
| **Pessimista** | **~ -R$ 0,5 a +R$ 0,5M** (faixa breakeven) | **~ 12-18%** |
| **Otimista**   | **~ +R$ 5 a R$ 7M**                        | **~ 35-45%** |

> Conclusao: o modulo **so atinge TIR target (>=30% risk-adjusted) em cenario otimista**. Base requer 36m e confirmacao de retencao/up-sell. Pessimista nao paga o custo de capital — gatilho automatico de re-baseline.

### 7.4 Implicacoes para o Steering

- Decisao de continuar pos-mes-18 deve ser **explicitamente vinculada a NRR realizada** (>=110% net) e a confirmacao de up-sell.
- Se NRR < 100% no mes 18, NPV 36m vira negativo — acionar STOP-LOSS-PROTOCOL.

## 8. Sensibilidade Monte Carlo

> Achado R2 CFO: sensibilidade univariada (secao 5) subestima risco combinado. Steering precisa de probabilidade de sucesso, nao so cenario base.

### 8.1 Metodologia

- **10.000 iteracoes** com sampling aleatorio.
- **4 drivers** com distribuicao **triangular** (min, modal, max):

| Driver                   | Min | Modal (base) | Max |
| ------------------------ | --- | ------------ | --- |
| Win rate (SQL -> Closed) | 15% | 25%          | 32% |
| Ciclo medio (dias)       | 70  | 90           | 140 |
| Ticket medio (R$ k)      | 28  | 45           | 60  |
| Churn anual              | 6%  | 8%           | 15% |

- Para cada iteracao: rodar fluxo de caixa 36m, calcular NPV @ 15% a.a.
- Agregacao: distribuicao de NPV, P(NPV>0), tornado chart.

### 8.2 Saida esperada (a calcular em FINANCIAL-MODEL-FULL.md)

- **P(NPV 36m > 0)**: target >= 60% para luz verde Steering. Estimativa preliminar: **45-55%** (proximo do limite de tolerancia).
- **P(NPV 36m > 0) em 18m**: estimativa **<10%** (confirma que 18m e insuficiente).
- **Tornado chart** (impacto em NPV de cada driver isoladamente, mantendo demais no modal):
  1. **Win rate** (~R$ 2,8M de range).
  2. **Ticket medio** (~R$ 2,1M).
  3. **Ciclo de venda** (~R$ 1,4M).
  4. **Churn** (~R$ 0,9M — menor por ser efeito de cauda).

### 8.3 Status e referencia

- Modelagem completa, planilha rodavel e codigo Monte Carlo em **`FINANCIAL-MODEL-FULL.md`** (a executar pre-Sprint-1, owner CFO+PM, entrega formal ao Steering).

## 9. Comparaveis de mercado revistos

> Achado R2 CFO: comparaveis anteriores (Celigo, Workato) sao **cloud-native multi-tenant**, ARR multiple 10-15x — apples-to-oranges para um modulo desktop on-prem fiscal/ERP brasileiro. Substituir.

### 9.1 Comparaveis adequados (desktop on-prem fiscal/ERP)

| Categoria                                                     | Multiplo ARR observado | Notas                                                                      |
| ------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| **TOTVS** modulos Desktop (Datasul, Logix, RM modulos)        | **3-4x ARR**           | Margem bruta ~55-65%, churn baixo (lock-in), crescimento single-digit      |
| **Modulos verticais SAP B1**                                  | **3-5x ARR**           | Vertical specialist tem premium leve; share-of-wallet conta                |
| **Integracao on-prem** (boutiques BR: Tek-System, IT2B, etc.) | **3-6x ARR**           | Pequenos mas rentaveis; multiplo depende de margem e contratos plurianuais |

### 9.2 O que isso muda no modelo

- Valuation do modulo Integracao ERP **nao deve ser modelada como SaaS cloud-native standalone**.
- Valuation entra como **subproduto da retencao** do core Solution Ticket Desktop: modulo aumenta NRR -> reduz churn do core -> levanta multiplo do conjunto.
- **Receita standalone do modulo** entra a 3-5x ARR. Em base mes 36 (~R$ 5M ARR estimado), valuation incremental do modulo ~ R$ 15-25M — coerente com investimento de R$ 7-9M se TIR >= 25%.

### 9.3 Implicacao para narrativa de captacao

- Pitch deck NAO deve usar Celigo/Workato como ancora. Ancorar em "modulo de integracao + retencao do core".
- Ressaltar que modulo nao e produto autonomo: e **moat de retencao** + opcao para up-sell mid-market.

## 10. Contingencia e Runway revisados

> Achado R2 CFO: contingencia 20% e baixa para 5 dependencias externas + 18m + modulo regulatorio (NFe/CTe/SPED). Runway alvo precisa subir.

### 10.1 Contingencia: 20% -> **25%**

- Linha "Conting." da tabela secao 2 sobe **+5 p.p.** sobre Eng+Comercial+Cloud+Cert.
- Em 18m: contingencia adicional ~ **R$ 1,1M** sobre o plano original.
- Justificativa:
  - 5 dependencias externas (SEFAZ, ICP-Brasil, ERPs alvo, Microsoft DPAPI, hardware balanca) — cada uma e um vetor de atraso.
  - Modulo regulatorio (fiscal) tem mudancas de norma fora do controle.
  - 18m e janela suficiente para 1-2 eventos macro (eleicao, mudanca tributaria) impactarem.

### 10.2 Runway alvo: R$ 6,7-7,3M -> **R$ 8-9M**

- Custo total revisado (18m, com contingencia 25%): ~R$ 7,2-8,0M.
- Buffer adicional 20% sobre custo + contingencia: R$ 1,4-1,6M.
- **Total runway alvo: R$ 8-9M** (vs R$ 6,7-7,3M anterior).
- Pre-requisito de caixa (secao 4) atualizado: caixa+credito **>= R$ 8M** para luz verde Sprint 1; idealmente **R$ 9M** com buffer muito-pessimista.

### 10.3 Implicacao

- Se captacao fechar < R$ 8M: nao iniciar Fase 1 plena. Acionar **PLANO-ENXUTO-9M-OPCAO.md** (escopo reduzido, R$ 2-2,5M, 9m).
- Steering deve aprovar a tabela atualizada na ata anterior ao Sprint 1.

## 11. Atualizacao deste Modelo

- Mensal: realizado vs plano (variancia + explicacao).
- Trimestral: re-baseline dos drivers se desvio >15% por 2 trimestres consecutivos.
- Anual: revisao completa de premissas com auditor externo.
