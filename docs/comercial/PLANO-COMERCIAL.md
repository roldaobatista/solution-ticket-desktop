# Plano Comercial — Módulo de Integração ERP

**Produto**: Solution Ticket — Hub de Integração ERP
**Versão**: 1.0 — 2026-04-26
**Referências**: `docs/PLANO-MODULO-INTEGRACAO.md`, `docs/GUIA-INTEGRACAO-ERP.md`

---

## Sumário

1. [Estratégia comercial](#1-estratégia-comercial)
2. [Tiers de produto](#2-tiers-de-produto)
3. [Pricing](#3-pricing)
4. [Política de setup fee](#4-política-de-setup-fee)
5. [Modelo de marketplace e revenue share](#5-modelo-de-marketplace-e-revenue-share)
6. [Política de descontos e contratos](#6-política-de-descontos-e-contratos)
7. [Serviços profissionais](#7-serviços-profissionais)
8. [Política de SLA](#8-política-de-sla)
9. [Sales playbook](#9-sales-playbook)
10. [Métricas comerciais](#10-métricas-comerciais)

---

## 1. Estratégia comercial

### 1.1 Posicionamento

**"O único hub de integração ERP que garante que seu ticket de pesagem nunca se perde, mesmo se o ERP cair."**

Diferencial competitivo:

- **Confiabilidade fiscal absoluta** (zero perda, zero duplicidade, rastro 5 anos)
- **Time-to-integrate < 5 dias** para ERP suportado
- **Operação não para** com ERP fora — único no mercado de pesagem
- **Marketplace de conectores** (Fase 4) — efeito de rede

### 1.2 Segmentação

| Segmento                    | ERP típico                 | Pricing                    | Ciclo de venda |
| --------------------------- | -------------------------- | -------------------------- | -------------- |
| **PME** (1–3 balanças)      | Bling, Omie, ContaAzul     | Self-service               | Dias           |
| **Médias industriais/agro** | Sankhya, Senior, TOTVS     | Inside sales               | 30–60 dias     |
| **Tier-1 BR**               | TOTVS Protheus customizado | Sales + parceiro           | 90–180 dias    |
| **Enterprise global**       | SAP, Dynamics, NetSuite    | Sales sênior + consultoria | 180–365 dias   |

### 1.3 Estratégia de entrada

- **Fase 1 (mês 4–6)**: capturar PME via self-service, gerar referências
- **Fase 2 (mês 7–10)**: alavancar referências para fechar Tier-1 BR
- **Fase 3 (mês 11–14)**: usar logos PME+Tier-1 BR para abrir global
- **Fase 4 (mês 15+)**: marketplace e parceiros aceleram cobertura

### 1.4 TAM / SAM / SOM

> **Status**: estimativa, sujeita a validação em pesquisa Q3/26. Números abaixo são ordens de grandeza para suporte a discussão de captação, não compromisso comercial.

**TAM — Total Addressable Market (Brasil, mercado total de pesagem veicular)**

- Universo: empresas brasileiras com pelo menos uma balança rodoviária/industrial em operação. Estimativa baseada em diagnósticos setoriais de pesagem (agro, construção, logística, indústria, distribuição, recicláveis, cooperativas).
- Volume estimado: **~50.000 empresas no Brasil com ao menos 1 balança crítica**, considerando MEIs e empresas de pequeno porte com balança fiscal (referência: cruzamento entre dados Sebrae/Fenacon de empresas com operação fiscal de pesagem + base setorial agro/cooperativas/distribuição). **Citar fonte ao referenciar**: este número precisa de pesquisa formal Sebrae/Fenacon Q3/26 antes de uso em pitch a investidor.
- Receita teórica anual: 50k × ticket médio mensal R$ 1.500 × 12 = **~R$ 900M/ano** (cenário hipotético com 100% de penetração — não realista, apenas teto teórico).

**SAM — Serviceable Addressable Market**

- Recorte do TAM atendível pela proposta atual: empresas com **balança crítica para o negócio** + **ERP médio ou superior** (Sankhya, Senior, TOTVS RM/Datasul/Protheus, Bling, Omie maturado, SAP, Dynamics).
- Exclusões: empresas sem ERP formal, balanças apenas auxiliares, micro-operações sem demanda de auditoria fiscal.
- Estimativa: **3.000 a 5.000 empresas** (6–10% do TAM). Validar via pesquisa parceiros TOTVS/Sankhya/Senior + filtros Receita Federal + IBGE setorial.
- Receita teórica anual SAM: 4.000 × R$ 2.500 ticket médio × 12 = **~R$ 120M/ano**.

**SOM — Serviceable Obtainable Market (18 meses)**

- Captura realista considerando capacidade comercial (ver §10 e PROJECAO-COMERCIAL-RECALIBRADA.md): **1–3% do SAM em 18 meses** = **30–150 clientes**.
- Meta oficial alinhada à projeção: **110 clientes mês 18** (centro da banda — ver projeção bottom-up).
- Receita 18 meses correspondente: ARR ~R$ 2,7M (consistente com §10).

> Premissas a validar Q3/26: (a) número de empresas BR com balança crítica fiscal (Sebrao/Fenacon ou pesquisa primária); (b) penetração de ERP médio+ no segmento; (c) elasticidade de preço por categoria.

---

## 2. Tiers de produto

### 2.1 Standard (incluído na licença base do Solution Ticket)

- Exportação CSV/XML manual
- Importação manual de cadastros via planilha
- API local apenas para consulta (sem escrita)
- Sem conectores nativos

**Para quem**: clientes que não precisam de ERP automatizado

### 2.2 Pro (módulo de integração ativado)

- API REST aberta versionada (`/api/v1`)
- Conector genérico REST + CSV/XML + SFTP
- Webhooks emitidos (para iPaaS do cliente)
- Outbox + retry + DLQ
- Reprocessamento via UI
- Dashboard de integração
- **1 conector ERP nativo incluído** (escolha do cliente entre Bling, Omie, ContaAzul, Tiny)
- Suporte business hours

**Para quem**: PME com 1 ERP cloud moderno

### 2.3 Enterprise

- Tudo do Pro, mais:
- **Múltiplos conectores nativos** (até 3 incluídos)
- Multi-empresa / multi-unidade
- Suporte a iPaaS, SOAP, OData, banco staging
- Reconciliação avançada com diff visual
- Auditoria fiscal completa com export
- Suporte a homologação dedicada
- Templates customizados por cliente
- SLA contratual (ver seção 8)
- Suporte 24/7
- Account Manager dedicado

**Para quem**: Tier-1 BR, indústria, agro, enterprise global

### 2.4 Marketplace (a partir da Fase 4)

- Conectores adicionais desenvolvidos por parceiros
- Pricing definido por parceiro
- Solution Ticket retém 30% do valor (ver seção 5)

---

## 3. Pricing

### 3.1 Pro

| Item                 | Valor (BRL/mês)                  |
| -------------------- | -------------------------------- |
| Mensalidade base     | R$ 297/balança                   |
| Volume incluído      | 1.000 pesagens sincronizadas/mês |
| Excedente            | R$ 0,30 por pesagem adicional    |
| Conector adicional   | R$ 197/mês cada                  |
| Setup fee (one-time) | R$ 1.500 (ver seção 4)           |

### 3.2 Enterprise

| Item                     | Valor (BRL/mês)                   |
| ------------------------ | --------------------------------- |
| Mensalidade base         | R$ 1.497/empresa + R$ 197/balança |
| Volume incluído          | 10.000 pesagens/mês               |
| Excedente                | R$ 0,15 por pesagem adicional     |
| Conector adicional (4º+) | R$ 497/mês cada                   |
| Setup fee (one-time)     | R$ 8.000–R$ 25.000 (ver seção 4)  |

### 3.3 Pricing por categoria de conector

Setup e mensalidade variam pela complexidade do ERP:

| Categoria                    | Conectores                                       | Setup fee       | Mensalidade adicional |
| ---------------------------- | ------------------------------------------------ | --------------- | --------------------- |
| **PME cloud**                | Bling, Omie, ContaAzul, Tiny                     | R$ 1.500        | R$ 197                |
| **Médio BR**                 | Sankhya, Senior                                  | R$ 4.500        | R$ 397                |
| **Tier-1 BR**                | TOTVS (Protheus/RM/Datasul), Mega, CIGAM, Benner | R$ 12.000       | R$ 797                |
| **Global Tier-1**            | SAP, Dynamics 365, NetSuite, Oracle              | R$ 25.000       | R$ 1.497              |
| **Long tail**                | Infor, Epicor, IFS, Sage, Acumatica, Odoo        | Sob consulta    | Sob consulta          |
| **Genérico** (REST/CSV/SFTP) | —                                                | Incluído no Pro | Incluído              |

### 3.4 Anual com desconto

- 12 meses pré-pago: **2 meses grátis** (~17% desconto)
- 24 meses pré-pago: **5 meses grátis** (~21% desconto)
- 36 meses pré-pago: **9 meses grátis** (~25% desconto)

---

## 4. Política de setup fee

### 4.1 O que cobre

- Discovery + contrato técnico (etapas 1–2 do playbook)
- Mapping inicial customizado
- Configuração do perfil de integração
- Treinamento operacional (4h)
- Homologação assistida com cliente (até 4 semanas)
- Runbook customizado

### 4.2 Quando isenção é possível

- Cliente já tem mapping pronto (de outra ferramenta) → 30% de desconto
- Cliente é referência futura aceita por escrito → 50% de desconto na primeira venda
- Programa de parceria fechado → setup incluso para X primeiros clientes

### 4.3 Quando cobrar a mais

- Mapping muito customizado (Protheus com customização extensa) → +R$ 5.000–R$ 15.000
- Múltiplas filiais com mapping diferente → +R$ 2.000 por filial adicional
- Integração com iPaaS do cliente (MuleSoft, Boomi) → +R$ 8.000

### 4.4 Garantia

- Se em 60 dias o conector não estiver em **produção** por motivo técnico nosso → reembolso integral do setup
- Se cliente desistir antes de 60 dias → reembolso de 50%

> **Definição operacional de "produção"**: conector em produção significa **≥100 tickets sincronizados com sucesso (status `synced` no outbox) em janela de 7 dias consecutivos**, sem falha técnica recorrente atribuível ao hub. Falhas atribuíveis ao ERP do cliente (indisponibilidade, credencial inválida, configuração fiscal) não contam contra esse marco.

---

## 5. Modelo de marketplace e revenue share

**Disponível a partir da Fase 4 (mês 15+)**

### 5.1 Como funciona

1. Parceiro desenvolve conector usando SDK público (`@solution-ticket/connector-sdk`)
2. Conector passa por **certificação técnica** (suíte TCK + revisão de segurança)
3. Parceiro publica no marketplace com pricing próprio
4. Cliente compra via marketplace; cobrança intermediada pelo Solution Ticket
5. Solution Ticket repassa **70% ao parceiro**, retém **30%**

### 5.2 Categorias de parceiro

| Categoria     | Requisitos                                              | Revenue share |
| ------------- | ------------------------------------------------------- | ------------- |
| **Community** | SDK + certificação básica                               | 70/30         |
| **Verified**  | + suporte L1 ao cliente final + 5 deals fechados        | 75/25         |
| **Premium**   | + co-marketing + treinamento de equipe + SLA contratual | 80/20         |

### 5.3 Critérios de certificação

Conector parceiro só vai ao marketplace após:

- Passar 100% da TCK (Test Conformance Kit)
- Cobertura de testes ≥ 80%
- Code review pelo time Solution Ticket
- Documentação completa (configuração + runbook + vídeo)
- 1 cliente piloto operando por 30 dias sem P0
- Plano de suporte definido

### 5.4 O que parceiro NÃO pode fazer

- Acessar dados de outros conectores
- Modificar core do hub
- Coletar telemetria sem consentimento do cliente
- Usar marca Solution Ticket sem aprovação

### 5.5 Saída do programa

Parceiro pode sair com 60 dias de aviso. Conector continua funcionando para clientes existentes por 12 meses, com Solution Ticket assumindo suporte L1.

---

## 6. Política de descontos e contratos

### 6.1 Descontos autorizados

| Policy agentica                                               | Desconto máximo                                                   |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| `CommercialOpsAgent` padrão                                   | 10%                                                               |
| `PricingPolicyAgent` com margem bruta ≥60% e LTV/CAC ≥3x      | 20%                                                               |
| `PricingPolicyAgent` com contrato anual pré-pago e setup pago | 35%                                                               |
| Exceção acima de 35%                                          | proibida sem nova policy versionada em `docs/comercial/evidence/` |

Nenhum cargo humano possui desconto "sem limite". Proposta que viola a policy fica bloqueada automaticamente.

### 6.2 Contrato mínimo

- Pro: 12 meses
- Enterprise: 24 meses

### 6.3 Reajuste anual

- **IPCA + 3% (cap 8% a.a.)** no aniversário do contrato
- Cliente avisado 60 dias antes
- **Tier-1 BR / Enterprise** podem optar por **IGP-M** como índice alternativo no contrato master (escolha trava por todo o ciclo de 24 meses)
- **Renegociação obrigatória** quando o reajuste calculado **superar 7% a.a.**: partes têm 30 dias para acordar reajuste menor; sem acordo, cliente pode rescindir sem multa

### 6.4 Cancelamento

- Pro: 30 dias de aviso, sem multa após 12 meses
- Enterprise: 60 dias de aviso; multa de 30% do saldo se < 50% do contrato cumprido

---

## 7. Serviços profissionais

Receita adicional fora da assinatura recorrente.

| Serviço                                              | Valor                |
| ---------------------------------------------------- | -------------------- |
| Onboarding técnico (Tier-1 BR / Enterprise)          | R$ 15.000–R$ 50.000  |
| Mapping customizado por filial                       | R$ 2.000–R$ 8.000    |
| Treinamento avançado (8h)                            | R$ 4.500             |
| Suporte de implantação (sprint 2 semanas)            | R$ 18.000            |
| Migração de outra ferramenta                         | R$ 12.000–R$ 40.000  |
| Desenvolvimento de conector custom (não-marketplace) | R$ 80.000–R$ 250.000 |
| Auditoria fiscal externa (laudo)                     | R$ 6.500             |

**Margem alvo**: 60% em serviços profissionais.

---

## 8. Política de SLA

### 8.1 Pro

- **Disponibilidade**: 99% mensal
- **Resposta de suporte**: 4h (business hours)
- **Resolução**: best-effort comercial em ≤ 1 dia útil
- **Crédito por indisponibilidade**: 5% da mensalidade se < 99% mensal; 10% se < 98%

> Pro tem SLA mínimo formalizado (não mais "best-effort"). Para SLA mais robusto e crédito maior, ver Enterprise.

### 8.2 Enterprise

| Severidade                  | Resposta   | Resolução    | Crédito por descumprimento |
| --------------------------- | ---------- | ------------ | -------------------------- |
| **P0** (sistema parado)     | 30 min     | 4h           | 10% mensalidade/hora extra |
| **P1** (degradado crítico)  | 1h         | 8h           | 5% mensalidade/hora extra  |
| **P2** (funcional limitado) | 4h         | 24h          | —                          |
| **P3** (pergunta/melhoria)  | 1 dia útil | 5 dias úteis | —                          |

**Disponibilidade do hub**: 99.5% mensal. Crédito de 10% se < 99.5%, 25% se < 99.0%, 50% se < 98%.

**Exclusões**: indisponibilidade do ERP do cliente, indisponibilidade da internet do cliente, manutenção programada (avisada 7 dias antes).

---

## 9. Sales playbook

### 9.1 Discovery (qualificação)

Perguntas-chave:

1. Qual ERP o cliente usa? Versão? Cloud ou on-premise?
2. Quantas balanças? Quantas pesagens/mês?
3. Hoje, como o ticket vai para o ERP? (manual, planilha, integração antiga, RPA?)
4. Qual a dor principal? (retrabalho, divergência fiscal, atraso de faturamento?)
5. Quem é o decisor técnico? E o financeiro?
6. Quando precisa entrar em produção?
7. Tem TI interna? Tem consultoria do ERP?

### 9.2 Demo padrão (45 min)

1. (5 min) Contexto da operação de pesagem
2. (10 min) Demo do hub: criar perfil → testar conexão → enviar ticket → ver no ERP
3. (10 min) Cenário de falha: ERP fora → ticket fecha → reprocessa quando volta
4. (10 min) Reconciliação e auditoria fiscal
5. (10 min) Q&A + pricing

### 9.3 Objeções comuns

| Objeção                       | Resposta                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| "Já temos integração caseira" | "Quanto vocês perdem em retrabalho/mês? Conta de padaria: nosso payback típico é 3 meses."                                 |
| "É caro"                      | "Nosso setup fee custa o equivalente a 2 dias de balança parada por falha de integração. Quanto vocês faturam por dia?"    |
| "Vamos esperar"               | "Janela do mercado: quem integrar agora cria barreira competitiva. Posso oferecer setup com 30% off para fechar este mês." |
| "Nosso ERP não está na lista" | "Conector genérico REST/CSV cobre. Em paralelo, podemos avaliar custo de conector dedicado."                               |
| "Não confio em hub local"     | "100% da pesagem fica local; auditoria de 5 anos garantida; mostro relatório de incidentes (zero perda em produção)."      |

### 9.4 Materiais de venda

- Pitch deck (15 slides)
- ROI calculator (planilha)
- 3 cases de cliente (anonimizado se necessário)
- Comparativo vs RPA, vs integração custom
- Whitepaper "Confiabilidade fiscal em integrações de pesagem"

---

## 10. Métricas comerciais (recalibradas)

> Versão original superestimava. Recalibração bottom-up em `PROJECAO-COMERCIAL-RECALIBRADA.md`.

| Métrica                                         | Mês 6            | Mês 12      | Mês 18      |
| ----------------------------------------------- | ---------------- | ----------- | ----------- |
| Clientes PME (Pro)                              | 8                | 30          | 60          |
| Clientes Médio (Pro)                            | 2                | 12          | 30          |
| Clientes Tier-1 BR (Enterprise)                 | 0                | 4           | 14          |
| Clientes Enterprise global                      | 0                | 1           | 6           |
| **Total clientes**                              | **10**           | **47**      | **110**     |
| **MRR módulo**                                  | **R$ 12,5k**     | **R$ 80k**  | **R$ 228k** |
| **ARR módulo**                                  | **R$ 150k**      | **R$ 960k** | **R$ 2,7M** |
| % MRR vs total produto                          | 5%               | 15%         | 30%         |
| Setup fee acumulado                             | R$ 25k           | R$ 155k     | R$ 445k     |
| CAC PME                                         | R$ 1.500         | R$ 1.200    | R$ 1.000    |
| CAC Médio                                       | R$ 5.000         | R$ 4.000    | R$ 3.500    |
| CAC Tier-1 BR                                   | R$ 18.000        | R$ 15.000   | R$ 12.000   |
| CAC Enterprise                                  | R$ 35.000        | R$ 30.000   | R$ 25.000   |
| LTV/CAC PME (curva coorte)                      | 7x               | 9x          | 10x         |
| LTV/CAC Médio (curva coorte)                    | 6x               | 8x          | 9x          |
| LTV/CAC Tier-1 BR                               | 2,5x ⚠           | 3,5x        | 4x          |
| LTV/CAC Enterprise                              | 3x ⚠             | 4x          | 5x          |
| Churn mensal (mês 1–6 / 7–12 / 13–18 da coorte) | 4% / 2,5% / 1,5% | idem        | idem        |
| Conectores parceiros (ativos\*)                 | 0                | 1           | 5           |
| Receita marketplace (upside Fase 4+)            | —                | —           | —           |

> **Marketplace zerado na projeção principal**: receita de marketplace movida para **upside Fase 4+** (mês 15+), fora do plano base. Reabrir como linha quando primeiros 3 conectores parceiros estiverem certificados.
>
> **LTV recalculado por coorte** (curva de churn realista 4% → 2,5% → 1,5% nos blocos mês 1–6 / 7–12 / 13–18 da vida do cliente). Versão anterior (LTV/CAC 16x PME) usava churn flat 2,5% que superestimava retenção precoce.

> **\* Definição de "conector ativo"**: ≥1 evento sincronizado com sucesso na janela móvel de **30 dias**. Pause/resume programado pelo cliente é permitido com **7 dias de tolerância** sem reclassificação para inativo. Conector marcado como inativo perde direito a SLA até reativação validada.

⚠ Tier-1 BR e Enterprise têm LTV/CAC apertado (<5x). Considerar:

- Aumentar setup fee Tier-1 BR de R$ 12k para R$ 18k
- Aumentar setup fee Enterprise de R$ 25k para R$ 35k
- Co-vender com parceiros TOTVS/SAP para reduzir CAC

---

## Próximos passos

1. Validar pricing com 5 clientes potenciais (testes A/B na Fase 0)
2. Construir ROI calculator (Sprint 0)
3. Treinar inside sales no playbook (Sprint 6)
4. Definir programa de parceria TOTVS/Senior (mês 1–3)
5. Desenhar fluxo de marketplace técnico (Sprint 18+)
