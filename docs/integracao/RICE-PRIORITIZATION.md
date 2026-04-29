# Priorizacao RICE — Modulo Integracao ERP

> Owner agentico: `Commercial-Agent` + `DiscoveryResearchAgent`. Revisao trimestral computavel. Insumos: DISCOVERY-LOG.md, dados CRM, telemetria de uso.

## 1. Framework

**RICE Score = (Reach x Impact x Confidence) / Effort**

| Dimensao       | Definicao                                                      | Escala                                                       |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| **Reach**      | Numero de clientes (ou pesagens/mes) impactados em 1 trimestre | numero absoluto                                              |
| **Impact**     | Quao forte o item move o KPI por cliente                       | 3 = massive, 2 = high, 1 = medium, 0,5 = low, 0,25 = minimal |
| **Confidence** | Grau de certeza nas estimativas (Reach + Impact + Effort)      | 100% = high, 80% = medium, 50% = low                         |
| **Effort**     | Pessoa-mes (eng + design + QA somados)                         | numero decimal                                               |

## 2. Tabela Exemplo — Conectores ERP

Cenario: 6 conectores em consideracao para Fases 1-3.

| Conector       | Reach (clientes/trim) | Impact      | Confidence | Effort (pm) | RICE | Rank |
| -------------- | --------------------- | ----------- | ---------- | ----------- | ---- | ---- |
| **Bling**      | 80                    | 2 (high)    | 100%       | 2,0         | 80,0 | 1    |
| **Omie**       | 70                    | 2 (high)    | 100%       | 2,5         | 56,0 | 2    |
| **Conta Azul** | 50                    | 1,5         | 80%        | 2,0         | 30,0 | 3    |
| **Sankhya**    | 30                    | 2 (high)    | 80%        | 4,0         | 12,0 | 4    |
| **Protheus**   | 25                    | 3 (massive) | 50%        | 8,0         | 4,7  | 5    |
| **SAP B1**     | 15                    | 3 (massive) | 50%        | 10,0        | 2,3  | 6    |

### Interpretacao

- **Bling/Omie** dominam Fase 1: alto Reach (PME e maior parcela do SAM), Effort baixo (APIs REST publicas e bem documentadas), Confidence 100% (ja temos clientes pedindo).
- **Sankhya/Protheus**: Reach menor mas Impact maior (ticket medio ~3x). Encaixe Fase 2-3.
- **SAP B1**: ROI baixo no curto prazo. Adiar para Fase 3 ou somente sob demanda enterprise paga (setup R$ 60-120k cobre Effort).

## 3. Regra de Atualizacao

- **Revisao trimestral obrigatoria** por `Commercial-Agent`, com pesos e fontes anexados em `docs/comercial/evidence/`.
- **Novo input requer >=3 fontes** independentes para entrar na tabela:
  1. Vendas (pipeline, pedidos perdidos por falta da feature)
  2. Suporte (tickets repetidos, churn declarado)
  3. Dados (telemetria de uso, DISCOVERY-LOG)
- Mudanca de rank no top 3 e automatica quando a diferenca de RICE for >=20% e houver >=3 fontes. Abaixo disso, vira `PIVOT` em decision record.

## 4. Anti-Padroes

| Erro                                        | Sintoma                                             | Correcao                                                             |
| ------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Reach por chute ("uns 200 clientes querem") | Numero redondo, sem fonte                           | Cruzar CRM + DISCOVERY-LOG; documentar fonte na celula               |
| Confidence sempre 100%                      | Toda linha com 100%                                 | Forcar justificativa: "100% so se >=3 fontes confirmam"              |
| Effort sem buffer                           | Eng estima 2pm, real e 4pm                          | Adicionar buffer 30% por padrao; revisar pos-mortem                  |
| Impact inflado                              | Tudo vira "massive"                                 | Limitar 3 itens "massive" por trimestre                              |
| Ignorar dependencias                        | Item A depende de B nao priorizado                  | Coluna "Bloqueios" + grafo de dependencias                           |
| Priorizar so RICE alto, ignorar risco       | Backlog viavel mas nao desbloqueia compliance/legal | Reservar 20% capacidade para itens regulatorios independente do RICE |

## 5. Itens Fora do RICE

Nao entram no ranking RICE (entram em swimlane separada):

- **Compliance/Regulatorio** (Receita, LGPD, INMETRO) — obrigatorios.
- **Tech Debt critico** (P0/P1 de seguranca) — obrigatorios.
- **Discovery/Spikes** — capacidade fixa de 10% por sprint.

## 6. Fase 4 reescopada — Marketplace de conectores

> Achado R2 PM: Marketplace/SDK publico era item top da Fase 4 sem evidencia de demanda. RICE preliminar tinha Reach inflado e Confidence baixo. Reescopar com gate explicito.

### 6.1 Gate de investimento em marketplace

- **Bloqueante**: investir em marketplace publico (catalogo, onboarding self-serve, billing de parceiros) **so apos** evidencia formal de:
  - **>=3 parceiros (nao-piloto) pediram SDK formalmente**, em escrito (e-mail, contrato, MoU).
  - Parceiros sao **integradores ou ISVs com base instalada propria** (nao freelancers).
  - Demanda documentada em DISCOVERY-LOG com nome da empresa, contato, caso de uso.

### 6.2 Default ate atingir o gate

- **SDK interno apenas** (uso pela equipe Solution Ticket para acelerar conectores proprios).
- **1 parceiro piloto** com NDA + contrato de co-desenvolvimento (sem royalty marketplace).
- **Sem investimento em portal publico, billing de parceiros, programa de certificacao**.

### 6.3 Justificativa

- Marketplace tem custo eng alto (~6-10 pm) e Reach incerto sem demanda confirmada.
- Risco de "build it and they will come" — cemiterio de marketplaces SaaS BR sem demand-side.
- 1 parceiro piloto valida hipotese sem investir em escala.

### 6.4 Re-priorizacao Fase 4

| Item original                         | Reescopo                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| Marketplace publico de conectores     | **Adiado**, gated por >=3 pedidos formais                                              |
| SDK self-serve com docs publicas      | **SDK interno**, docs minimas para 1 parceiro piloto                                   |
| Programa de certificacao de parceiros | **Adiado**, junto com marketplace                                                      |
| Billing/revenue share com parceiros   | **Adiado**                                                                             |
| Capacidade liberada por reescopo      | Realocar para **estabilidade dos 4-5 conectores GA + 1 enterprise (Sankhya/Protheus)** |

### 6.5 Revisao do gate

- Steering revisa trimestralmente. Se >=3 pedidos chegarem antes do fim da Fase 3, antecipar discussao.

## 7. Historico de Decisoes

Toda alteracao de rank que afete top 3 deve ter ata curta com:

- Data, participantes, mudanca aplicada, evidencia que justificou.
- Arquivar em `docs/integracao/decisoes/RICE-YYYY-QN.md`.
