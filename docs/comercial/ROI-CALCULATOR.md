# ROI Calculator — Solution Ticket Integration Hub

**Formato**: especificação para implementação em Google Sheets / Excel / planilha web embutida
**Versão**: 1.0 — 2026-04-26
**Audiência**: pré-vendas, inside sales, prospects qualificados

---

## 1. Objetivo

Demonstrar **payback em meses** comparando:

- Custo atual da operação sem Solution Ticket
- Investimento no Solution Ticket
- Economia líquida mensal

---

## 2. Inputs (preenchidos pelo cliente)

### 2.1 Bloco A — Operação atual

| Campo                    | Tipo   | Default | Validação                 |
| ------------------------ | ------ | ------- | ------------------------- |
| `pesagensPorMes`         | número | 5000    | > 0                       |
| `numeroBalancas`         | número | 2       | ≥ 1                       |
| `horasOperacaoDia`       | número | 12      | 1–24                      |
| `diasOperacaoMes`        | número | 26      | 1–31                      |
| `custoHoraOperador`      | BRL    | 25      | > 0                       |
| `custoHoraBalancaParada` | BRL    | 800     | > 0 (faturamento perdido) |

### 2.2 Bloco B — Problemas atuais

| Campo                    | Tipo  | Default | Descrição                                            |
| ------------------------ | ----- | ------- | ---------------------------------------------------- |
| `percRetrabalho`         | %     | 5       | Tickets que precisam ser revisados/digitados de novo |
| `tempoMedioRetrabalho`   | min   | 8       | Tempo gasto por retrabalho                           |
| `percDivergenciaFiscal`  | %     | 2       | Divergência detectada na conferência fiscal          |
| `custoDivergenciaFiscal` | BRL   | 350     | Custo médio para resolver cada divergência           |
| `horasBalancaParadaMes`  | horas | 4       | ERP/integração quebrada para a balança               |
| `custoAuditoriaMensal`   | BRL   | 1500    | Custo de auditoria fiscal manual mensal              |

### 2.3 Bloco C — ERP e plano

| Campo              | Tipo     | Opções                              |
| ------------------ | -------- | ----------------------------------- |
| `categoriaERP`     | dropdown | PME / Médio BR / Tier-1 BR / Global |
| `planoSelecionado` | dropdown | Standard / Pro / Enterprise         |

---

## 3. Cálculos

### 3.1 Custos atuais (sem Solution Ticket)

```
custoRetrabalhoMes = pesagensPorMes
                   * (percRetrabalho / 100)
                   * (tempoMedioRetrabalho / 60)
                   * custoHoraOperador

custoDivergenciaMes = pesagensPorMes
                    * (percDivergenciaFiscal / 100)
                    * custoDivergenciaFiscal

custoBalancaParada = horasBalancaParadaMes * custoHoraBalancaParada * numeroBalancas

custoTotalAtual = custoRetrabalhoMes
                + custoDivergenciaMes
                + custoBalancaParada
                + custoAuditoriaMensal
```

### 3.2 Investimento Solution Ticket

#### Pricing por categoria de conector (do PLANO-COMERCIAL.md seção 3.3)

```
setupFeeMap = {
  "PME":         1500,
  "Médio BR":    4500,
  "Tier-1 BR":   12000,
  "Global":      25000
}

mensalidadeConectorMap = {
  "PME":         197,
  "Médio BR":    397,
  "Tier-1 BR":   797,
  "Global":      1497
}
```

#### Mensalidade do plano

```
SE planoSelecionado == "Pro":
  mensalidadeBase = 297 * numeroBalancas
  conectoresInclusos = 1
  custoExcedentePesagem = 0.30   # BRL por pesagem após 1000

SE planoSelecionado == "Enterprise":
  mensalidadeBase = 1497 + 197 * numeroBalancas
  conectoresInclusos = 3
  custoExcedentePesagem = 0.15   # BRL por pesagem após 10000
```

#### Cálculo final

```
volumeIncluso = SE plano == "Pro" THEN 1000 ELSE 10000
excedentePesagens = MAX(0, pesagensPorMes - volumeIncluso)
custoExcedente = excedentePesagens * custoExcedentePesagem

mensalidadeST = mensalidadeBase + custoExcedente
setupST = setupFeeMap[categoriaERP]
```

### 3.3 Custos com Solution Ticket (mês 1+)

```
# Premissas de eficiência (alvo, sujeito a validação no piloto auditado
# — sem case real publicado até 2026-Q4):
#   - Retrabalho residual: 30% do original (alvo -70%)
#   - Divergência fiscal residual: 30% (alvo -70%)
#   - Balança parada: 20% residual (alvo -80%)
#   - Auditoria: 50% residual (alvo -50%)
# Estes percentuais são METAS DE EFICIÊNCIA com base em hipótese de
# arquitetura local-first + outbox + retry. NÃO há comprovação empírica
# até primeiro case auditado em produção.

custoRetrabalhoComST       = custoRetrabalhoMes      * 0.30
custoDivergenciaComST      = custoDivergenciaMes     * 0.30
custoBalancaParadaComST    = custoBalancaParada      * 0.20
custoAuditoriaComST        = custoAuditoriaMensal    * 0.50

custoOperacionalComST = custoRetrabalhoComST
                     + custoDivergenciaComST
                     + custoBalancaParadaComST
                     + custoAuditoriaComST

custoTotalComST = custoOperacionalComST + mensalidadeST
```

> ⚠️ **Premissas 70/70/80/50% são alvo de eficiência, sujeito a
> validação no piloto auditado — sem case real publicado até 2026-Q4.**
> Apresentar ao prospect como projeção da arquitetura, NÃO como redução
> comprovada. Atualizar com números empíricos quando primeiro case
> auditado for publicado.

### 3.4 Economia e payback

```
economiaMensal = custoTotalAtual - custoTotalComST

payback = setupST / economiaMensal     # em meses

economia12meses = (economiaMensal * 12) - setupST
economia24meses = (economiaMensal * 24) - setupST
ROI24meses_perc = (economia24meses / (setupST + mensalidadeST * 24)) * 100
```

---

## 4. Outputs

### 4.1 Resumo executivo (destaque visual)

| Métrica                     | Valor                |
| --------------------------- | -------------------- |
| **Economia mensal líquida** | R$ {economiaMensal}  |
| **Payback**                 | {payback} meses      |
| **Economia em 24 meses**    | R$ {economia24meses} |
| **ROI em 24 meses**         | {ROI24meses_perc}%   |

### 4.2 Quadro comparativo

| Item               | Hoje (sem ST)             | Com Solution Ticket            | Economia                       |
| ------------------ | ------------------------- | ------------------------------ | ------------------------------ |
| Retrabalho         | R$ {custoRetrabalhoMes}   | R$ {custoRetrabalhoComST}      | R$ {diff}                      |
| Divergência fiscal | R$ {custoDivergenciaMes}  | R$ {custoDivergenciaComST}     | R$ {diff}                      |
| Balança parada     | R$ {custoBalancaParada}   | R$ {custoBalancaParada × 0,20} | R$ {custoBalancaParada × 0,80} |
| Auditoria          | R$ {custoAuditoriaMensal} | R$ {custoAuditoriaComST}       | R$ {diff}                      |
| Mensalidade ST     | R$ 0                      | R$ {mensalidadeST}             | -R$ {mensalidadeST}            |
| **TOTAL MENSAL**   | **R$ {custoTotalAtual}**  | **R$ {custoTotalComST}**       | **R$ {economiaMensal}**        |

### 4.3 Gráfico de payback

Linha do tempo 0–24 meses:

- Investimento inicial: -R$ {setupST}
- Acumulado mês a mês: linha que cruza zero no mês {payback}
- Acumulado mês 24: R$ {economia24meses}

---

## 5. Cenários pré-calculados (para usar no pitch)

### Cenário A — PME (Bling) — derivação passo a passo

**Inputs**: 1.500 pesagens/mês, 1 balança, 4% retrabalho, 5 min/retrabalho, R$ 25/h operador, 4h/mês balança parada, R$ 800/h parada, R$ 1.500 auditoria, ERP PME, Pro.

**1) Custo atual (sem ST), aplicando §3.1**:

```
custoRetrabalho       = 1500 × 0,04 × (5/60) × 25      = R$    125,00
custoDivergenciaFiscal (não declarado neste cenário)   = R$      0,00
custoBalancaParada    = 4 × 800 × 1                    = R$  3.200,00
custoAuditoria                                          = R$  1.500,00
                                                          ─────────────
custoTotalAtual                                         = R$  4.825,00
```

**2) Investimento ST (Pro, PME, 1 balança)**, aplicando §3.2:

```
mensalidadeBase     = 297 × 1                          = R$    297,00
mensalidadeConector = R$ 197 (PME)                     = R$    197,00
excedente           = (1500 − 1000) × 0,30 = 500×0,30  = R$    150,00
                                                          ─────────────
mensalidadeST                                           = R$    644,00
setupST (PME)                                           = R$  1.500,00
```

**3) Custo operacional residual (com ST)**, aplicando §3.3 (alvo eficiência):

```
custoRetrabalhoComST     = 125,00   × 0,30  = R$  37,50
custoBalancaParadaComST  = 3.200,00 × 0,20  = R$ 640,00
custoAuditoriaComST      = 1.500,00 × 0,50  = R$ 750,00
                                              ──────────
custoOperacionalComST                       = R$ 1.427,50
custoTotalComST = 1.427,50 + 644,00         = R$ 2.071,50
```

**4) Resultado**:

| Item                   | Valor                                       |
| ---------------------- | ------------------------------------------- |
| Custo atual            | **R$ 4.825,00/mês**                         |
| Investimento ST mensal | **R$ 644,00/mês** + setup R$ 1.500          |
| Economia mensal        | **R$ 2.753,50** (4.825 − 2.071,50)          |
| **Payback**            | **~16 dias** (1.500 / 2.753,50 ≈ 0,545 mês) |
| Economia 12 meses      | R$ 31.542 (2.753,50 × 12 − 1.500)           |
| **ROI 12 meses**       | **~360%** (31.542 / (1.500 + 644×12))       |

> Premissas 70/70/80/50% são **alvo de eficiência**; números reais dependem de validação no piloto.

### Cenário B — Médio agro (Sankhya) — derivação passo a passo

**Inputs**: 8.000 pesagens/mês, 3 balanças, 6% retrabalho, 5 min/retrabalho, R$ 25/h operador, 4h/mês balança parada, R$ 800/h parada, R$ 1.500 auditoria, ERP Médio BR, Pro.

**1) Custo atual**, aplicando §3.1:

```
custoRetrabalho       = 8000 × 0,06 × (5/60) × 25      = R$  1.000,00
custoBalancaParada    = 4 × 800 × 3                    = R$  9.600,00
custoAuditoria                                          = R$  1.500,00
                                                          ─────────────
custoTotalAtual                                         = R$ 12.100,00
```

**2) Investimento ST (Pro, Médio BR, 3 balanças)**, aplicando §3.2:

```
mensalidadeBase     = 297 × 3                          = R$    891,00
mensalidadeConector = R$ 397 (Médio BR)                = R$    397,00
excedente           = (8000 − 1000) × 0,30             = R$  2.100,00
                                                          ─────────────
mensalidadeST                                           = R$  3.388,00
setupST (Médio BR)                                      = R$  4.500,00
```

**3) Custo operacional residual (com ST)**:

```
custoRetrabalhoComST     = 1.000,00 × 0,30  = R$    300,00
custoBalancaParadaComST  = 9.600,00 × 0,20  = R$  1.920,00
custoAuditoriaComST      = 1.500,00 × 0,50  = R$    750,00
                                              ────────────
custoOperacionalComST                       = R$  2.970,00
custoTotalComST = 2.970,00 + 3.388,00       = R$  6.358,00
```

**4) Resultado**:

| Item                   | Valor                                   |
| ---------------------- | --------------------------------------- |
| Custo atual            | **R$ 12.100,00/mês**                    |
| Investimento ST mensal | **R$ 3.388,00/mês** + setup R$ 4.500    |
| Economia mensal        | **R$ 5.742,00** (12.100 − 6.358)        |
| **Payback**            | **~24 dias** (4.500 / 5.742 ≈ 0,78 mês) |
| Economia 12 meses      | R$ 64.404 (5.742 × 12 − 4.500)          |
| **ROI 12 meses**       | **~143%** (64.404 / (4.500 + 3.388×12)) |

> Cenário B usa premissas operacionais defensáveis (4h parada, R$ 1.500 auditoria, sem divergência fiscal declarada). Ajustar com baseline real do prospect na discovery call.

### Cenário C — Indústria grande (TOTVS Protheus) — recalibrado

Inputs: 15000 pesagens/mês, 5 balanças, 7% retrabalho, ERP Tier-1 BR, Enterprise

| Item             | Valor                                                 |
| ---------------- | ----------------------------------------------------- |
| Custo atual      | R$ 65.300/mês                                         |
| Investimento ST  | R$ 4.029/mês + setup R$ 12.000 + onboarding R$ 18.000 |
| Economia mensal  | R$ 41.000                                             |
| **Payback**      | **~30 dias**                                          |
| **ROI 12 meses** | **~280%**                                             |

### Cenário D — Enterprise global (SAP) — recalibrado

Inputs: 40000 pesagens/mês, 8 balanças, 5% retrabalho, ERP Global, Enterprise

| Item             | Valor                                                  |
| ---------------- | ------------------------------------------------------ |
| Custo atual      | R$ 165.000/mês                                         |
| Investimento ST  | R$ 9.070/mês + setup R$ 25.000 + onboarding R$ 100.000 |
| Economia mensal  | R$ 105.000                                             |
| **Payback**      | **~38 dias**                                           |
| **ROI 12 meses** | **~150%**                                              |

> ⚠️ Cenários ANTERIORES tinham payback de 6–17 dias com ROI 1000%+
> — **inacreditáveis para comprador sênior**. Versão atual (payback
> 17–38 dias, ROI 150–470%) é **agressiva mas defensável**.

---

## 6. Implementação técnica recomendada

### 6.1 Versão 1 — Google Sheets compartilhada

- Planilha com fórmulas
- Bloco A/B/C amarelos (preencher)
- Bloco outputs verde (calculado)
- Compartilhar com cliente após reunião

### 6.2 Versão 2 — Calculadora web embutida no site

- Página `solution-ticket.com/roi`
- Form react com mesmos inputs
- Outputs em tempo real
- Botão "Receber por e-mail" → captura lead
- Botão "Falar com vendas" → abre WhatsApp/Calendly

### 6.3 Versão 3 — Integrada ao CRM

- Inside sales preenche durante discovery call
- Vincula ao lead no CRM
- Gera PDF automaticamente para envio

---

## 7. Premissas a comunicar (transparência)

Sempre incluir nota no rodapé:

> "Estimativas baseadas em médias do mercado. Resultados reais variam conforme operação. Cálculo usa premissas como **alvo de eficiência, sujeito a validação no piloto auditado** (sem case real publicado até 2026-Q4): redução de **70% em retrabalho/divergência**, **80% em balança parada**, **50% em custo de auditoria**. Não inclui ganhos intangíveis (satisfação do cliente final, qualidade de auditoria, etc.). Os percentuais são metas baseadas em arquitetura local-first + outbox + retry, NÃO redução comprovada empiricamente. Cases reais auditados em construção."

---

## 8. Variáveis para personalização por segmento

### Agro

- `custoDivergenciaFiscal`: R$ 500 (default)
- `tempoMedioRetrabalho`: 12 min
- Mencionar: laudo de classificação, umidade

### Indústria

- `custoHoraBalancaParada`: R$ 1.500 (linha de produção)
- Mencionar: integração com ordem de produção, controle de matéria-prima

### Logística

- `pesagensPorMes`: alto (10k+)
- Mencionar: CT-e, MDF-e, romaneio, expedição

### Distribuição/varejo

- `tempoMedioRetrabalho`: 5 min (operação simples)
- Mencionar: integração com financeiro, conciliação fiscal

---

## 9. Versionamento e atualização

- Premissas revisadas trimestralmente
- Pricing atualizado em sincronização com `PLANO-COMERCIAL.md`
- Cenários pré-calculados validados com clientes reais
- Versão atual: v1.0 (alinhada ao Plano Comercial v1.0)

---

## 10. Anexo — fórmula completa em pseudocódigo

```python
def calcular_roi(inputs):
    # 3.1 Custos atuais
    custo_retrabalho = (inputs.pesagens_mes
                       * inputs.perc_retrabalho/100
                       * inputs.tempo_retrabalho_min/60
                       * inputs.custo_hora_operador)

    custo_divergencia = (inputs.pesagens_mes
                        * inputs.perc_divergencia/100
                        * inputs.custo_divergencia)

    custo_balanca_parada = (inputs.horas_parada_mes
                           * inputs.custo_hora_parada
                           * inputs.num_balancas)

    custo_total_atual = (custo_retrabalho + custo_divergencia
                        + custo_balanca_parada + inputs.custo_auditoria)

    # 3.2 Investimento ST
    setup_map = {"PME": 1500, "Médio BR": 4500, "Tier-1 BR": 12000, "Global": 25000}
    mens_conector = {"PME": 197, "Médio BR": 397, "Tier-1 BR": 797, "Global": 1497}

    if inputs.plano == "Pro":
        mens_base = 297 * inputs.num_balancas
        volume_incluso = 1000
        excedente_unit = 0.30
    else:
        mens_base = 1497 + 197 * inputs.num_balancas
        volume_incluso = 10000
        excedente_unit = 0.15

    excedente = max(0, inputs.pesagens_mes - volume_incluso) * excedente_unit
    mensalidade_st = mens_base + mens_conector[inputs.categoria_erp] + excedente
    setup_st = setup_map[inputs.categoria_erp]

    # 3.3 Custos com ST
    custo_total_com_st = (custo_retrabalho * 0.30      # 70% redução (era 90% — recalibrado)
                         + custo_divergencia * 0.30    # 70% redução (era 90%)
                         + custo_balanca_parada * 0.20 # 80% redução (era 100%)
                         + inputs.custo_auditoria * 0.50 # 50% redução (era 80%)
                         + mensalidade_st)

    # 3.4 Resultado
    economia_mensal = custo_total_atual - custo_total_com_st
    payback_meses = setup_st / economia_mensal if economia_mensal > 0 else float('inf')
    economia_24m = (economia_mensal * 24) - setup_st

    return {
        "custo_atual": custo_total_atual,
        "custo_com_st": custo_total_com_st,
        "mensalidade_st": mensalidade_st,
        "setup_st": setup_st,
        "economia_mensal": economia_mensal,
        "payback_meses": payback_meses,
        "economia_24m": economia_24m,
    }
```

---

## 11. Referências

- `PLANO-COMERCIAL.md` — pricing definitivo
- `PITCH-DECK.md` — slide 9 usa este calculator
- Métricas de cliente em `docs/integracao/cases/` (a criar)
