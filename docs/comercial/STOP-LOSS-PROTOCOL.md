# Stop-Loss Protocol — Modulo Integracao ERP

> Owner agentico: `Finance-Agent` + `Agent-Orchestrator`. Atualizacao: a cada checkpoint. Insumos: CASH-FLOW-MODEL.md, RICE-PRIORITIZATION.md, ICP-DEFINITION.md.

## 1. Objetivo

Definir gatilhos numericos e qualitativos para decidir **continuar, pivotar ou descontinuar** o modulo a cada checkpoint de fase. Evita "afundar bom dinheiro atras de mau dinheiro".

Decisao em cada checkpoint e calculada por thresholds. O resultado e documentado em decision record publicado em `docs/comercial/evidence/` e `docs/auditoria/agentic/`.

## 2. Checkpoint Mes 6 — Fim da Fase 1

### Criterios de PASS (todos obrigatorios)

- [ ] **>=1 conector PME GA** (general availability), nao beta. Default: Bling.
- [ ] **>=10 clientes ativos** pagantes (>=30 dias de uso, >=1 fatura paga).
- [ ] **MRR >= R$ 8.000**.
- [ ] **Pipeline qualificado (SQLs) >= 1x a capacidade da Fase 2** (>=40 SQLs ativos).
- [ ] **NPS medio >= 30** entre clientes ativos.

### Criterios de FAIL (qualquer um aciona NO-GO)

- <5 clientes ativos.
- MRR < R$ 4.000.
- Pipeline < 0,5x capacidade Fase 2 (<20 SQLs).
- Churn nos primeiros 90 dias > 20%.

### Caminho intermediario (entre Pass e Fail)

- Atingiu >=50% mas <100% dos criterios de PASS: **HOLD** — extender Fase 1 por 2 meses, com plano de correcao especifico. Nao iniciar Fase 2 ate fechar PASS.

### Opcoes de pivot em FAIL

1. **Foco PME-only**: descontinuar Sankhya/Protheus/SAP do roadmap, focar Bling+Omie+Conta Azul.
2. **White-label**: licenciar conector para parceiros (TOTVS, integradoras) ao inves de venda direta.
3. **Descontinuar**: encerrar modulo, manter clientes existentes em modo manutencao por 12 meses, foco da empresa volta para core (Solution Ticket Desktop).

## 3. Checkpoint Mes 12 — Fim da Fase 2

### Criterios de PASS

- [ ] **4-5 conectores PME** em GA (Bling, Omie, Conta Azul + 1-2 mid-market).
- [ ] **>=40 clientes ativos** pagantes.
- [ ] **MRR >= R$ 60.000**.
- [ ] **LTV/CAC >= 3x** medido pelos cohorts de Fase 1.
- [ ] **Margem bruta >= 60%** ja considerando suporte e cloud.

### Criterios de FAIL

- <20 clientes ativos.
- MRR < R$ 30.000.
- LTV/CAC < 1,5x (insustentavel mesmo com escala).
- Churn anualizado > 15%.

### Acao em FAIL

- **Pivot ou reducao de squad em 30 dias**.
- Reducao de squad: cortar comercial em 50%, manter eng em modo manutencao + 1 PM.
- Pivot: reavaliar ICP (talvez foco em vertical unica), repricing agressivo (ver RE-PRICING-TIER1.md), ou modelo de canal (so via parceiro).

## 4. Checkpoint Mes 18 — Re-Baseline

Decisao binaria:

- **Continuar**: trajetoria de break-even confirmada para mes 22-24, caixa suficiente. Renovar plano para Fase 4-5 (mes 19-30).
- **Re-baseline**: ajustar drivers para realidade observada, atualizar CASH-FLOW-MODEL.md, novos gatilhos para mes 24.

Re-baseline nao e fracasso — e disciplina. Mas re-baseline pelo segundo ciclo consecutivo (mes 24) sem trajetoria positiva = NO-GO obrigatorio.

## 5. Governanca agentic

### Processo de decisao

1. `Finance-Agent` coleta numeros de CASH-FLOW-MODEL.md e KPIs do mes.
2. `Commercial-Agent` valida pipeline, churn, NPS e SQLs.
3. `Agent-Orchestrator` aplica PASS/HOLD/FAIL por thresholds, sem votacao.
4. Decision record publicado em <=72h em `docs/comercial/evidence/YYYY-MM-DD-stoploss-fase-X.md`.

### Comunicacao

- PASS: comunicado interno + atualizacao do roadmap publico.
- HOLD: comunicado interno apenas, plano de correcao em <=14d.
- FAIL: comunicado interno + plano de transicao em <=30d. Comunicacao externa apos definicao do pivot.

## 6. Gate Sprint 1 — Pre-condicao comercial dura

> Achado R2 PM/CFO: LOI (Letter of Intent) tem valor comercial baixissimo no contexto BR — assinada sem custo, abandonada sem custo. Iniciar Sprint 1 com base em LOIs e otimismo perigoso. Exigir compromisso financeiro real.

### 6.1 Pre-condicao bloqueante para iniciar Sprint 1

- [ ] **>=1 contrato pago nao-reembolsavel assinado** com cliente piloto.
- [ ] **Setup fee depositado em escrow** (conta vinculada, com release condicionado a entrega de marcos).
- [ ] Valor minimo: **R$ 30k** (proxy de seriedade — 2/3 do ticket medio).
- [ ] Cliente nao pode ter clausula de saida sem multa nos primeiros 6 meses.

### 6.2 LOI nao basta

- LOI = "intencao", nao compromisso. Custo de quebra = zero. Historico do mercado BR mostra ~70% das LOIs nao convertem em contrato pago dentro de 6m.
- LOI pode ser usada como **lead qualificador**, nunca como evidencia de PMF.

### 6.3 Acao em caso de falha

- Sem >=1 contrato pago nao-reembolsavel ate fim do Sprint 0: **NO-GO Sprint 1 plena** OU **pivot para PLANO-ENXUTO-9M-OPCAO.md** (escopo reduzido, squad menor, foco em validar PMF antes de escalar).
- Decisao: `Agent-Orchestrator` aplica plano enxuto automaticamente quando a pre-condicao externa falhar.

## 7. Gate trimestral de capital

> Achado R2 CFO: 18m e janela longa para checkpoints somente nos meses 6/12/18. Burn pode descarrilar entre checkpoints sem disparar acao corretiva.

### 7.1 Revisao trimestral

- **Cadencia**: a cada 90 dias (T1, T2, T3, T4, T5, T6 ao longo dos 18m).
- **Insumos**: realizado vs plano de CASH-FLOW-MODEL.md, leading indicators (pipeline qualificado, conversao SQL->Closed, churn 30/60/90, NPS).
- **Saida**: ata curta (1 pagina) com status verde/amarelo/vermelho de cada leading indicator.

### 7.2 Autoridade formal de reducao de squad

- Se **>=2 leading indicators ficam VERMELHOS por 1 trimestre completo**, o `Agent-Orchestrator` reduz escopo/capacidade planejada em 30 dias, sem aguardar checkpoint de fase.
- Reducao default: cortar 1 dev + 0,5 SDR; congelar contratacoes pendentes.
- Decisao: thresholds de `Finance-Agent` (nao exige reuniao).

### 7.3 Leading indicators monitorados

| Indicador                                 | Verde  | Amarelo  | Vermelho |
| ----------------------------------------- | ------ | -------- | -------- |
| Pipeline qualificado vs target trimestral | >=100% | 70-99%   | <70%     |
| Conversao SQL->Closed                     | >=20%  | 12-19%   | <12%     |
| Churn 90 dias                             | <=10%  | 11-18%   | >18%     |
| Burn vs plano                             | <=105% | 106-115% | >115%    |
| NPS clientes ativos                       | >=40   | 20-39    | <20      |

## 8. Custo de oportunidade

> Achado R2 CFO: alocar R$ 7-9M em integracao ERP por 18m e decisao de capital — precisa ser comparada com alternativas a cada trimestre, nao so no fim de fase.

### 8.1 Review trimestral de alocacao de capital

- A cada trimestre, `Finance-Agent` revisa: **R$ X (saldo do orcamento alocado) ainda em integracao ERP vs alternativas**.
- Alternativas a comparar (lista nao-exaustiva):
  1. **Hardware proprio** (linha de balancas badged Solution Ticket).
  2. **Novos verticais** (mineracao, terminais portuarios, agronegocio).
  3. **M&A** (aquisicao de concorrente regional ou complementar).
  4. **Devolucao parcial de capital** aos investidores (se PMF nao confirma).

### 8.2 Decisao para manter alocacao

- Decisao de **manter alocacao** integracao ERP requer NPV esperado maior que alternativas e indicadores sem FAIL.
- Se a regra falhar -> re-priorizacao em 30 dias ou re-baseline parcial do plano.

### 8.3 Anti-padrao explicito

- "Ja investimos muito, melhor terminar" -> **falacia do custo afundado**. Decisao deve ser forward-looking: NPV das alternativas vs NPV de continuar.
- Custo afundado nao entra no calculo. So fluxos futuros.

## 9. Anti-Padroes

| Erro                                             | Correcao                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Ajustar criterio de PASS para encaixar resultado | Criterios travados na ata da Fase anterior; mudanca exige re-aprovacao Steering |
| Adiar checkpoint "so mais 1 mes"                 | Data trava na ata anterior; adiamento conta como FAIL                           |
| Decisao por maioria                              | Exigencia e unanimidade — protege contra wishful thinking                       |
| Esconder churn em "pausa contratual"             | Toda saida de cliente conta como churn no checkpoint                            |
| Contar pipeline nao-qualificado                  | So SQL conta (definicao em ICP-DEFINITION.md secao 3)                           |
