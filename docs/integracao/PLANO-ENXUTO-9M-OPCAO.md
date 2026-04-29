# Plano Enxuto 9 Meses — Opcao de Contingencia

> Owner: PM + CFO. Status: **plano alternativo, nao default**. Acionado por gatilhos do STOP-LOSS-PROTOCOL.md.
> Insumos: CASH-FLOW-MODEL.md, RICE-PRIORITIZATION.md, ICP-DEFINITION.md.

## 1. Objetivo

Plano alternativo ao plano completo (18m, R$ 8-9M) caso runway/PMF nao confirmem ao fim do **Sprint 0**. Reduz risco financeiro, preserva opcionalidade e valida PMF antes de escalar.

**NAO substitui o plano completo** — e a saida de emergencia se o pre-requisito de Sprint 1 nao for atingido.

## 2. Quando acionar

Acionar se ao fim do Sprint 0 (pre-Sprint-1) ocorrer **qualquer um** dos itens abaixo:

- [ ] **Sem >=1 contrato pago nao-reembolsavel** assinado (vide STOP-LOSS-PROTOCOL.md secao 6).
- [ ] **Runway confirmado < R$ 8M** (caixa + linha de credito pre-aprovada).
- [ ] **Sem Tech Lead contratado** ou hire pendente >60 dias.
- [ ] **2+ dependencias externas** (RUNWAY-DEPENDENCIES-EXTERNAL.md) em status vermelho.

Decisao: Steering em sessao extraordinaria, **maioria simples** (diferente do checkpoint de fase, que exige unanimidade — aqui a opcao enxuta e protetiva, nao escalada).

## 3. Escopo (9 meses, ~R$ 2-2,5M)

### 3.1 Fase 0 — Fundacao (3 meses)

- Arquitetura Integration Hub + Outbox/Inbox basico.
- Modelo canonico v0 (so ticket pesagem + emissao fiscal).
- Threat model + secrets management (DPAPI ou keytar) — 1 spike, decisao rapida.
- API publica v0 (interna ou parceiro piloto).
- Owner: Tech Lead + 1 Dev Sr.

### 3.2 Fase 1 — 1 Conector PME GA (3 meses)

- **Bling apenas** (RICE rank 1, melhor relacao reach/effort).
- Mapping engine minimo viavel.
- Runbook de suporte basico.
- Homologacao com 2-3 clientes piloto.
- Owner: Tech Lead + 1 Dev Sr + 0,5 SRE.

### 3.3 Fase 2 — Escala primeiros 5 clientes pagantes (3 meses)

- Onboarding de 3-5 clientes adicionais (nao-piloto, pagantes).
- Coleta de metricas reais de PMF: NPS, retencao 6m, expansao por cliente.
- Decisao gate-fim-9m com base em dados reais, nao projecao.
- Owner: PM + 0,5 SDR + 0,5 CSM.

## 4. Squad reduzido

| Funcao                          | FTE | Custo mensal carregado (R$ k) | 9 meses (R$ k) |
| ------------------------------- | --- | ----------------------------- | -------------- |
| Tech Lead                       | 1,0 | 35                            | 315            |
| Dev Sr (full-stack)             | 1,0 | 25                            | 225            |
| SRE / DevOps                    | 0,5 | 15                            | 135            |
| PM                              | 1,0 | 22                            | 198            |
| SDR                             | 0,5 | 8                             | 72             |
| CSM (compartilhado com core)    | 0,5 | 10                            | 90             |
| **Subtotal pessoal**            |     | **115**                       | **1.035**      |
| Cloud + ferramentas             |     | 8                             | 72             |
| Cert + homologacao (1 conector) |     | --                            | 60             |
| Marketing + eventos minimos     |     | 12                            | 108            |
| Contingencia 25%                |     | 33                            | 296            |
| **Total**                       |     | **~168**                      | **~1.570**     |

> Total ~**R$ 1,6M**. Margem para overhead/buffer: subir para **R$ 2-2,5M** com headroom de 25-50%.

## 5. Saidas / Entregaveis em 9m

- [ ] **1 conector Bling em GA**, com 1+ clientes pagantes em producao >60 dias.
- [ ] **3-5 clientes pagantes adicionais** (total 4-6 com piloto inicial).
- [ ] **Metricas reais de PMF**:
  - NPS >= 30.
  - Retencao 6m >= 80%.
  - Expansao por cliente (up-sell ou cross-sell) >= 10% MRR base.
  - Churn <= 15% anualizado.
- [ ] **Playbook de venda comercial** com CAC realizado vs target.

## 6. Decisao pos-9m

Tres caminhos possiveis:

### 6.1 Escalar para plano completo (Fases 2-4)

- **Pre-condicao**: PMF validado (NPS >=30, retencao 6m >=80%, LTV/CAC >=3x).
- Captacao adicional: R$ 6-7M para fechar runway 18-24m do plano completo.
- Resultado: retomar plano completo a partir do mes 10.

### 6.2 Pivot para foco PME-only

- **Pre-condicao**: PME funciona, Tier-1/Enterprise nao tracionou.
- Repricing agressivo (RE-PRICING-TIER1.md).
- Adicionar 1-2 conectores PME (Omie, Conta Azul). Sem Sankhya/Protheus/SAP.
- Squad permanece enxuto. Runway adicional R$ 1,5-2M para 9m.

### 6.3 Descontinuar / white-label

- **Pre-condicao**: PMF nao confirmado, churn alto, NPS baixo.
- Manter clientes existentes em modo manutencao 12m.
- Licenciar conector para parceiro (TOTVS, integradora) com royalty.
- Empresa volta foco para core (Solution Ticket Desktop).

## 7. Vantagens

- **Risco financeiro <40%** do plano completo (R$ 2-2,5M vs R$ 8-9M).
- **Valida PMF rapido** (9m vs 18m).
- **Aprende rapido** com clientes reais antes de escalar.
- **Preserva opcionalidade**: pode voltar ao plano completo, pivotar ou descontinuar.
- **Squad pequeno = menos overhead** de gestao e onboarding.

## 8. Desvantagens

- **Perde momento de mercado**: competidores podem lancar primeiro (TOTVS, integradoras grandes).
- **Receita baixa em 9m** (~R$ 200-400k cumulativo). NPV proximo de zero.
- **Brand nao ganha tracao** sem investimento em marketing.
- **Difícil retomar plano completo** se o squad reduzido perder pessoas-chave nesses 9m.
- **Sinaliza para mercado** que a empresa nao esta confiante (afeta captacao futura).

## 9. Comparativo plano completo vs enxuto

| Dimensao                   | Completo (18m)    | Enxuto (9m)                          |
| -------------------------- | ----------------- | ------------------------------------ |
| Investimento               | R$ 8-9M           | R$ 2-2,5M                            |
| Conectores                 | 4-5 GA            | 1 GA                                 |
| Clientes pagantes          | 40+               | 5-6                                  |
| Squad                      | 8-10 FTE          | 4-4,5 FTE                            |
| MRR alvo                   | R$ 60k+           | R$ 8-12k                             |
| NPV 36m (esperado)         | +R$ 1,5-2,5M base | -R$ 0,5 a +R$ 0,5M (faixa breakeven) |
| Risco de capital           | Alto              | Baixo                                |
| Risco de timing de mercado | Baixo             | Alto                                 |
| Aprendizado de PMF         | Lento (18m)       | Rapido (9m)                          |

## 10. Governanca

- Aprovacao do plano enxuto: **maioria simples** Steering.
- Ata em `docs/comercial/atas/YYYY-MM-DD-plano-enxuto-acionado.md`.
- Comunicacao interna: clara, sem dramatizar — e disciplina, nao fracasso.
- Comunicacao externa (clientes piloto, parceiros): comprometimento com o que foi assinado; transparencia sobre escopo reduzido.
