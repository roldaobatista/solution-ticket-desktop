# Plano de Construção — Módulo de Integração ERP

> Owner operacional: `Agent-Orchestrator` | Última revisão: 2026-04-29 | Versão: 7

**Produto**: Solution Ticket — Hub de Integração ERP local-first
**Referência técnica**: `docs/GUIA-INTEGRACAO-ERP.md`
**Versão do plano**: 2.4 — 2026-04-29 (agent-first; gates humanos convertidos em evidência automatizada, subagentes especialistas ou dependências externas não bloqueantes para engenharia.)
**Horizonte**: 18 meses (Fase 0 a Fase 4)

> **Regra agentic canônica:** este plano deve ser executado por subagentes de IA conforme `docs/integracao/AGENTIC-EXECUTION-OPERATING-MODEL.md`, `docs/integracao/AGENT-GATES-MATRIX.md`, `docs/integracao/EVIDENCE-MANIFEST.md` e `docs/integracao/EXTERNAL-DEPENDENCIES.md`. Qualquer trecho legado que peça Steering, CISO, DPO, CFO, CEO, cliente, assinatura ou aprovação humana deve ser lido pela matriz agentic: evidência técnica fecha gate interno; ato externo vira dependência externa e não bloqueia o chassi técnico.

---

> 🔴 **Status pós-auditoria (2026-04-27 — Rodada 5 + auditoria 5-isolados convergente)**: ver `auditoria/AUDITORIA-10-AGENTES-2026-04-26.md`, `auditoria/CORRECOES-APLICADAS-2026-04-26.md` e correções aplicadas neste plano (v2.1). Pontos reconciliados:
>
> - **Story points re-baselined**: tetos S2–S5 = 21 pts (com buffer 15%); re-baseline obrigatório pós-S3 — ver `integracao/REPLANEJAMENTO-STORY-POINTS.md`
> - **Métricas comerciais bottom-up**: §16.3/§16.4 alinhadas com `comercial/PROJECAO-COMERCIAL-RECALIBRADA.md` (MRR mês 6 = R$ 12,5k; mês 18 = R$ 228k; ARR mês 18 = R$ 2,7M)
> - **Throughput**: Mock valida arquitetura sob carga; capacidade real por conector em `integracao/CAPACITY.md` (todos os números estimados até 1º cliente em produção)
> - **DoR**: vigente desde Sprint 0 (fonte canônica em `integracao/BACKLOG-SPRINT-0-1.md`)
> - **Premissas §2.1**: convertidas em riscos com owner, gate de verificação e plano B (§17)
> - **Gate Sprint 0 → Fase 1**: convertido para scorecard agentic em `integracao/AGENT-GATES-MATRIX.md`; LOI/contrato/buffer são sinais externos, não assinatura humana bloqueante
> - **Datas Fase 1**: provisórias até re-baseline pós-S3
> - 3 contratos ERP (Sankhya, Protheus, SAP) com erros factuais — disclaimers nos arquivos (CRITICAL C4)

---

## Sumário

1. [Visão e objetivos](#1-visão-e-objetivos)
2. [Premissas e restrições](#2-premissas-e-restrições)
3. [Princípios de execução não-negociáveis](#3-princípios-de-execução-não-negociáveis)
4. [Equipe e responsabilidades](#4-equipe-e-responsabilidades)
5. [Macroplano — fases temporais × ondas de conectores](#5-macroplano--fases-temporais--ondas-de-conectores)
6. [Fase 0 — Fundação (mês 1–3)](#6-fase-0--fundação-mês-13)
7. [Fase 1 — Piloto + PME Brasil (mês 4–6)](#7-fase-1--piloto--pme-brasil-mês-46)
8. [Fase 2 — Brasil Tier-1 (mês 7–10)](#8-fase-2--brasil-tier-1-mês-710)
9. [Fase 3 — Global Tier-1 (mês 11–14)](#9-fase-3--global-tier-1-mês-1114)
10. [Fase 4 — Long tail e SDK público (mês 15–18)](#10-fase-4--long-tail-e-sdk-público-mês-1518)
11. [Backlog por épicos](#11-backlog-por-épicos)
12. [Especificações operacionais](#12-especificações-operacionais)
13. [Playbook universal para criar conector](#13-playbook-universal-para-criar-conector)
14. [Marcos de governança e ADRs](#14-marcos-de-governança-e-adrs)
15. [Critérios de aceite](#15-critérios-de-aceite)
16. [Métricas de sucesso](#16-métricas-de-sucesso)
17. [Riscos críticos e contingência](#17-riscos-críticos-e-contingência)
18. [Orçamento estimado](#18-orçamento-estimado)
19. [Próximos passos imediatos](#19-próximos-passos-imediatos)
20. [Conclusão executiva](#20-conclusão-executiva)

---

## 1. Visão e objetivos

### 1.1 Visão de produto

Tornar o Solution Ticket o **hub de integração ERP de referência** no mercado brasileiro de pesagem veicular. Conectar a qualquer ERP relevante em **dias**, não meses, com **zero perda fiscal** mesmo com falhas externas.

O módulo deve ser tratado como **produto dentro do produto** — com arquitetura, ciclo de vida, monetização e roadmap próprios.

### 1.2 Objetivos estratégicos (18 meses)

| #   | Objetivo                      | Métrica                                                                                                                                                                          |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | Cobrir 90% do mercado-alvo BR | 7 conectores nativos publicados (5 PME + 2 Tier-1)                                                                                                                               |
| O2  | Entrar em contas globais      | 3 conectores Tier-1 globais certificados                                                                                                                                         |
| O3  | Confiabilidade fiscal         | SLO 99,9% disponibilidade fiscal por mês com error budget de 43min/mês; 0 perda fiscal não recuperável (counter-only, sem error budget)                                          |
| O4  | Time-to-integrate por cliente | < 5 dias úteis para ERP já suportado                                                                                                                                             |
| O5  | Receita recorrente do módulo  | 30% do MRR do produto até mês 18 (assume produto-base atinge ~R$ 530k MRR mês 18; se produto-base estagnar, **re-baseline O5 para meta absoluta R$ 228k MRR módulo**, não ratio) |
| O6  | Ecossistema de parceiros      | 5 conectores publicados via SDK                                                                                                                                                  |

### 1.3 Fora de escopo

- Reescrita do core de pesagem
- Integração com sistemas não-ERP (CRM, BI, e-commerce direto)
- Versão SaaS multi-tenant (segue desktop local-first)
- Substituição da arquitetura Electron/NestJS/SQLite atual
- RPA como padrão (apenas exceção documentada)
- Webhook público entrante direto na máquina da balança
- Escrita direta em tabelas transacionais de ERP

### 1.5 ICP definido (Ideal Customer Profile)

> **ICP é critério de qualificação MQL → SQL**. Lead que não bate ICP primário pode ser cultivado, mas não consome capacity de AE/Sales Sr.

**ICP primário** (descrição sucinta — spec completa em `docs/comercial/ICP-DEFINITION.md`):

- **Porte**: 50–500 funcionários
- **Vertical**: agro, mineração, construção, resíduos
- **Operação**: ≥3 balanças instaladas
- **ERP**: médio porte (Bling, Omie, Sankhya, Protheus)
- **Volume**: ≥1.000 pesagens/mês

Antes de campanha de pipeline qualquer SDR/AE precisa validar ICP no primeiro contato. Lead fora do ICP primário só entra em "nutrição" (não conta MQL).

**O3 reformulado (SLO + error budget)**: ver §16.0.1.

### 1.6 Plano enxuto opcional (alternativa de PMF)

> Caso o scorecard agentic do Sprint 0 conclua que runway e/ou sinais de PMF não suportam o plano de 18 meses (R$ 6,7–7,3M consolidado), a alternativa automática é o **Plano Enxuto 9 meses** descrito em `docs/integracao/PLANO-ENXUTO-9M-OPCAO.md`.

**Resumo**:

- **Horizonte**: 9 meses (vs 18m do plano principal)
- **Custo**: R$ 2,0–2,5M (vs R$ 6,7–7,3M consolidado)
- **Escopo Fase 0 + Fase 1 reduzida**: chassi + 1 conector PME (Bling **ou** Sankhya) em GA + 5 clientes pagantes
- **Fases 2-4 viram opcionais**: liberadas apenas após gate de PMF (≥10 clientes pagantes + NSM ≥95% + 5 LOIs Tier-1) atingido
- **Vantagem**: capital comprometido reduzido em 65%; opção de retomar plano completo após validação
- **Quando acionar**: se até fim do Sprint 0 não houver runway R$ 8M confirmado E/OU não houver 1 contrato pago não-reembolsável assinado

A escolha entre plano completo e `PLANO-ENXUTO-9M-OPCAO` é decisão do `Agent-Orchestrator` ao fim do Sprint 0, por thresholds de `AGENT-GATES-MATRIX.md`, com decision record em `docs/auditoria/agentic/`.

### 1.7 Política de branch/PR — exceção ao "main direto" do CLAUDE.md

> Resolve explicitamente o conflito entre `CLAUDE.md` global do produto-base ("sempre direto em main, sem PR, sem branch") e os requisitos de auditoria do módulo Integração ERP.

**Regra para o módulo Integração ERP** (chassi + conectores):

- **A partir do Sprint 1**, qualquer alteração no chassi (Outbox, Mapping Engine, Cofre/DPAPI, Audit Trail, API pública v1) e nos conectores ERP **exige PR + code review obrigatório** (≥1 revisor técnico distinto do autor).
- Justificativa: requisitos de auditoria Tier-1/Enterprise (SAP, TOTVS, Microsoft, Oracle) + caráter regulatório-fiscal (LGPD, livros fiscais, retenção 5 anos). Programas de certificação SAP/AppSource/Oracle MP exigem evidência de change management auditável.
- O **resto do produto-base Solution Ticket** (pesagem, balança, telas core, licenciamento, comercial) **continua seguindo o padrão "main direto" do CLAUDE.md**.

**Detalhes operacionais e exceções** em `docs/adr/ADR-022-branch-policy-modulo-integracao.md`.

---

## 2. Premissas e restrições

### 2.1 Premissas-trigger (verificadas via gates Sprint 0 — não cumprimento bloqueia início Fase 1)

> Cada premissa abaixo está duplicada como linha de risco em §17 com owner, gate de verificação e plano B.

- Capacidade agentic dedicada disponível desde o mês 1 (`Architecture-Agent`, `Backend-Agent`, `QA-Automation-Agent`, `SRE-Agent`). Contratação humana real é dependência externa, não gate técnico.
- Acesso a sandboxes dos ERPs prioritários tentado em paralelo; se não houver, usar Mock/fixtures e registrar em `EXTERNAL-DEPENDENCIES.md`.
- Sinal comercial para cada conector **antes** de priorizar ERP real. Sem LOI/contrato, seguir com Mock/Generic REST e marcar `BLOCKED_EXTERNAL` comercial.
- Decisões comerciais (planos, pricing) calculadas por `PricingPolicyAgent` até fim da Fase 0.
- Certificação TOTVS Partner iniciada (lead-time 90–120d, mês 1) e SAP iniciada (lead-time 4–6m, mês 3)

### 2.2 Restrições técnicas

- Backend continua restrito a `127.0.0.1` — webhooks entrantes via relay cloud
- SQLite local como banco do módulo — sem dependência de servidor externo
- Compatível com versões atuais de Electron/NestJS 10/Prisma 5
- Windows Desktop como plataforma primária

### 2.3 Restrições de negócio

- Conectores corporativos exigem **programa de parceria formal** — iniciar negociação na Fase 0
- Certificações (SAP, Microsoft AppSource, Oracle MP) têm prazo próprio (3–6 meses) — paralelizar
- LGPD e auditoria fiscal de 5 anos são **bloqueadores legais** — não negociáveis

---

## 3. Princípios de execução não-negociáveis

### 3.1 DAG de implementação (precedência forte vs. paralelizável)

Construir respeitando precedências fortes; trilhos paralelos podem rodar em paralelo dentro da capacity da squad.

```
1.  IntegracaoModule (esqueleto)
2.  Tabelas Prisma
3.  Eventos de domínio
4.  Outbox transacional
5.  Worker de fila
6.  Logs estruturados
7.  Mock Connector
8.  Conector Genérico REST
9.  API pública v1
10. Mapping Engine
11. Conector Genérico CSV/XML/SFTP (movido para Onda 1 da Fase 1; fora do MVP Fase 0)
12. UI de integração
13. Reconciliação
14. Primeiro conector ERP nativo (piloto)
15. Hardening e segurança
16. Produção piloto assistida
17. Connector Factory (templates, test harness)
18. Roadmap dos demais ERPs por ondas
```

#### DAG resumido (precedência forte vs. paralelo)

| Item                      | Precede (bloqueia)         | Bloqueado por | Pode rodar em paralelo com |
| ------------------------- | -------------------------- | ------------- | -------------------------- |
| 1. IntegracaoModule       | 2,3,4                      | —             | —                          |
| 2. Tabelas Prisma         | 4,5,12                     | 1             | 3                          |
| 3. Eventos de domínio     | 4                          | 1             | 2                          |
| 4. Outbox transacional    | 5,7,8                      | 2,3           | 6 (Logs)                   |
| 5. Worker de fila         | 7                          | 4             | 6                          |
| 6. Logs estruturados      | (cross-cutting)            | 1             | 4, 5, Permissões           |
| 7. Mock Connector         | 8, 14                      | 4,5           | 10 (Mapping)               |
| 8. Genérico REST          | 14                         | 7             | 9 (API), 10 (Mapping)      |
| 9. API pública v1         | 12                         | 1,2           | 8, 10, 11                  |
| 10. Mapping Engine        | 14 (E2E)                   | 2             | 7, 8, UI Mapping (parcial) |
| 11. Genérico CSV/XML/SFTP | — (não no caminho crítico) | 4,5           | 8, 9, 12                   |
| 12. UI de integração      | (UX gate piloto)           | 2, 9          | Permissões, Reconciliação  |
| 13. Reconciliação         | (DoD piloto)               | 4, 9          | 12, DLQ                    |
| 14. Primeiro conector ERP | 16                         | 7, 8, 10      | 15 parcial                 |
| Permissões                | 12                         | 1             | Outbox, Logs               |
| DLQ                       | 13                         | 4             | Reconciliação              |

**Precedência forte** (não inverter): Outbox antes de qualquer Conector; Mapping antes de E2E; Tabelas antes de Worker; Eventos de domínio antes de Outbox.

**Pode paralelizar**:

- UI Mapping ‖ Conector Mock (depois que Mapping Engine core entrega contrato)
- Permissões ‖ Outbox
- Reconciliação ‖ DLQ
- API pública v1 ‖ Conector Genérico REST (compartilham contratos canônicos)

**O erro a evitar**: começar por "conector TOTVS" ou "conector SAP" antes de existir outbox, idempotência, log e modelo canônico. Resultado: arquitetura acoplada, integrações frágeis.

### 3.2 Mock Connector antes de qualquer conector real

Nenhum conector ERP nativo começa antes que o `MockErpConnector` esteja funcional simulando: sucesso, timeout, erro 500, produto inexistente, pedido encerrado, resposta duplicada. Isso permite validar toda a fila/retry/DLQ sem depender de sandbox externo.

### 3.3 Operação nunca para

A balança **nunca** depende do ERP estar online para fechar pesagem. Toda comunicação é assíncrona via outbox. Se algum dev propuser "vamos chamar o ERP direto e esperar resposta", isso é veto arquitetural.

### 3.4 Eventos, nunca sobrescrita

Ticket enviado ao ERP **nunca é apagado** ou editado silenciosamente. Toda alteração gera evento novo (correção, cancelamento, reversão).

### 3.5 Idempotência em toda operação

Todo evento carrega chave determinística `tenant:empresa:unidade:ticket:revision`. Sem chave idempotente, evento não sai da outbox.

### 3.6 Erro técnico vs erro de negócio

Sempre classificar. Erro técnico (timeout, 5xx, rate limit) entra em retry automático. Erro de negócio (cliente bloqueado, produto inexistente) **não retenta** — gera `OPERATIONAL_ACTION_REQUIRED` com ação sugerida por `Support-Agent`, sem loop infinito.

### 3.7 Ondas de conectores, não big bang

Não tentar 20 conectores em paralelo. Cada onda valida arquitetura, gera receita, financia a próxima. A ordem de cada onda é guiada por **deal já fechado**, não por ranking genérico.

---

## 4. Subagentes e responsabilidades

> A tabela FTE abaixo fica como dimensionamento econômico/capacidade. Para execução deste plano, cada papel humano é interpretado como subagente especialista conforme `AGENTIC-EXECUTION-OPERATING-MODEL.md`.

### 4.1 Squad dedicada (FTE = full-time equivalent)

| Papel                                                                       | FTE                          | Fase 0–1 | Fase 2      | Fase 3      | Fase 4      |
| --------------------------------------------------------------------------- | ---------------------------- | -------- | ----------- | ----------- | ----------- |
| Tech Lead / Arquiteto                                                       | 1.0                          | ✓        | ✓           | ✓           | ✓           |
| Dev Backend Sênior (NestJS)                                                 | 1.0                          | ✓        | ✓           | ✓           | ✓           |
| Dev Backend Pleno                                                           | 1.0                          | ✓        | ✓           | ✓           | —           |
| Dev Backend Pleno #2                                                        | 1.0                          | —        | ✓           | ✓           | ✓           |
| Dev Frontend (telas integração)                                             | 0.5                          | ✓        | ✓           | ✓           | 0.3         |
| Analista Integração ERP                                                     | 0.5                          | —        | ✓           | ✓           | 0.3         |
| Product Manager                                                             | 0.5                          | ✓        | ✓           | ✓           | ✓           |
| SRE / DevOps                                                                | 0.6 (Fase 0) / 1.0 (Fase 2+) | ✓ (0.6)  | ✓ (1.0)     | ✓ (1.0)     | ✓ (1.0)     |
| QA Automação                                                                | 0.5                          | —        | ✓           | ✓           | ✓           |
| Consultor especialista ERP                                                  | 0.3                          | —        | sob demanda | sob demanda | sob demanda |
| Suporte / Customer Success                                                  | 0.3                          | —        | ✓           | ✓           | ✓           |
| **CRO / Head of Sales** (Rodada 2 — fechar gap "comercial sem dono sênior") | 0.3 (Fase 0) / 1.0 (Fase 2+) | ✓ (0.3)  | ✓ (1.0)     | ✓ (1.0)     | ✓ (1.0)     |

**Pico Fase 2–3**: ~7.0 FTE (com CRO 1.0 + SRE 1.0).

> **SRE Fase 0 sobe de 0,3 para 0,6 FTE** (Rodada 2): Sprint 0 inclui spike SQLite+Outbox + observability pipeline + DR/BCP + spec relay cloud. 0,3 FTE não absorve esse volume sem deslizar Sprint 1.

> **CRO/Head of Sales adicionado** (Rodada 2 — fechar gap "cliente piloto sem dono comercial sênior"): owner R por pricing, pipeline, fechamento de deals (especialmente 1º contrato pago não-reembolsável, gate Sprint 1). Accountable: CEO. Consultado: CFO (margem) + PM (roadmap). Em Fase 0 entra com 0,3 FTE (foco em pricing + 15 entrevistas de discovery + 1 contrato fechado); a partir de Fase 2 sobe para 1,0 FTE liderando aquisição Tier-1.

> **Nota — gap de headcount (2026-04-27)**: a squad listada é **alvo**, não estado atual. Estado atual:
>
> - **Tech Lead a contratar** (lead-time 30–60d) — dependência externa. Sem pessoa real, Sprint 1 segue com `Architecture-Agent` sob demanda e escopo reduzido quando o scorecard exigir.
> - **Headcount comercial (SDR/AE/Sales Sênior) NÃO está incluso neste módulo** — tracking separado em `comercial/PROJECAO-COMERCIAL-RECALIBRADA.md` §"Headcount comercial necessário": 2 SDR + 2 AE até mês 6, escalando 4 SDR + 4 AE + 1 Sales Sênior até mês 12.
> - Demais papéis (Dev Sênior, Pleno, Frontend, PM, SRE, QA, Analista ERP) entram conforme cronograma de fases acima.

### 4.2 RACI resumido

| Atividade                                 | Tech Lead | Dev   | Analista ERP | PM                                             | SRE     | QA  |
| ----------------------------------------- | --------- | ----- | ------------ | ---------------------------------------------- | ------- | --- |
| Arquitetura e ADRs                        | **R/A**   | C     | C            | C                                              | C       | I   |
| Implementação de conector                 | A         | **R** | C            | C                                              | I       | C   |
| Mapping declarativo                       | C         | **R** | A            | I                                              | I       | C   |
| Discovery/contrato com ERP                | C         | I     | **R/A**      | C                                              | I       | I   |
| Homologação cliente piloto                | C         | C     | **R**        | A                                              | I       | C   |
| Testes de contrato                        | C         | **R** | C            | I                                              | I       | A   |
| Pipeline CI/CD                            | C         | C     | I            | I                                              | **R/A** | C   |
| Sandbox ERP                               | I         | C     | C            | **R/A**                                        | C       | C   |
| Runbook operacional                       | C         | C     | C            | C                                              | **R/A** | C   |
| Pricing e planos                          | I         | I     | I            | **R/A**                                        | I       | I   |
| Aquisição cliente piloto                  | I         | I     | C            | **R** (A: CEO; C: Comercial)                   | I       | I   |
| Pricing comunicado a vendas               | I         | I     | I            | **R** (A: CEO; C: Comercial+CFO; I: Marketing) | I       | I   |
| Demos comerciais                          | I         | C     | I            | **R/A** (com Comercial)                        | I       | I   |
| **Pricing & pipeline (Rodada 2)**         | I         | I     | I            | C                                              | I       | I   |
| **Fechamento de deals Tier-1 (Rodada 2)** | I         | I     | C            | C                                              | I       | I   |

R=Responsável agentico, A=Accountable agentico por evidence record, C=Consultado, I=Informado. Nenhum `A` desta matriz exige assinatura humana.

> **Nota RACI Comercial**: linhas adicionadas para fechar o gap "cliente piloto sem dono" (Auditoria R5 Agente 6). Aquisição/Pricing/Demos passam por PM com aprovação final do CEO; CFO entra como consultado em Pricing por impacto em margem; Marketing apenas informado para alinhar messaging.

---

## 5. Macroplano — fases temporais × ondas de conectores

```
Mês:   1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16  17  18
       │────Fase 0────│
                     │────Fase 1────│
                                     │──────Fase 2──────│
                                                         │──────Fase 3──────│
                                                                             │──Fase 4──│
       Fundação      Piloto+PME    Tier-1 BR           Global Tier-1       Long tail+SDK
```

### 5.1 Fases (ritmo temporal)

| Fase | Meses | Foco                                                              |
| ---- | ----- | ----------------------------------------------------------------- |
| 0    | 1–3   | Fundação técnica + Mock + 2 conectores genéricos                  |
| 1    | 4–6   | 1 conector piloto sólido + 4 PME                                  |
| 2    | 7–10  | TOTVS Protheus, RM, Datasul + Senior                              |
| 3    | 11–14 | SAP S/4HANA, Dynamics 365, NetSuite, Oracle Fusion                |
| 4    | 15–18 | Long tail (Infor, Epicor, IFS, Mega, CIGAM, Benner) + SDK público |

### 5.2 Ondas (ordem de conectores, paralela às fases)

| Onda | Conectores                                                                                                      | Quando |
| ---- | --------------------------------------------------------------------------------------------------------------- | ------ |
| 0    | Mock + Genérico REST + Genérico CSV/XML + Genérico SFTP                                                         | Fase 0 |
| 1    | 1 piloto sólido (Bling **ou** Sankhya, decidido em Sprint 0) + Omie + ContaAzul + Tiny + Bling/Sankhya restante | Fase 1 |
| 2    | TOTVS Protheus → Senior → TOTVS RM → TOTVS Datasul                                                              | Fase 2 |
| 3    | SAP S/4HANA → Dynamics 365 F&O → NetSuite → Oracle Fusion                                                       | Fase 3 |
| 4    | Long tail sob demanda + SDK público + marketplace                                                               | Fase 4 |

**Decisão do piloto da Fase 1**: o Sprint 0 escolhe entre Bling (PME, OAuth simples, ciclo curto) e Sankhya (ponte para Tier-1 BR, EIP gateway). Critério: qual cliente piloto está pronto primeiro.

### 5.3 Caminho crítico (CPM) — incluindo dependências externas

Sequência **bloqueante** que define a duração total da Fase 0→1, com dependências externas explicitadas:

```
[EXT: Tech Lead contratado (mês 0, lead-time 30-60d)]
    ↓
[EXT: Sandbox Bling/Sankhya provisionado (Sprint 0)]    [EXT: Cliente piloto LOI (Sprint 0)]
    ↓                                                            ↓
Mock Connector → Genérico REST → Mapping (JSONata) → Cliente piloto homologado → Bling/Sankhya GA
   (Sprint 3)     (Sprint 5)      (Sprint 4-5)             (mês 5)                 (mês 5-6 alvo)

Trilhos paralelos (não bloqueiam Fase 1, mas bloqueiam fases posteriores):
[EXT: Cert TOTVS Partner iniciada (mês 1, lead-time 90-120d)]   →   Fase 2 (mês 7)
[EXT: Cert SAP iniciada (mês 3, lead-time 4-6m)]                →   Fase 3 (mês 11)
```

**Buffer explícito**: 1 sprint por fase (~2 semanas). Buffer de Fase 0 absorve até 1 atraso isolado; 2 atrasos = re-baseline.

**Datas Fase 1 (Bling/Sankhya GA)**: alvo **mês 5–6**, depende de cumprimento de gates externos (Tech Lead, sandbox, LOI cliente). Sem esses gates fechados em Sprint 0, Fase 1 não inicia — datas sujeitas a re-baseline pós-S3.

Atrasos em **qualquer** nó do caminho crítico deslocam a Fase 1 inteira (não há paralelo que compense). PM monitora semanalmente. Buffer não absorve atraso composto: 2 nós atrasados = re-baseline obrigatório.

Nós fora do caminho crítico (CSV/XML, SFTP, telas avançadas, métricas) podem escorregar 1 sprint sem bloquear GA.

---

## 6. Fase 0 — Fundação (mês 1–3)

### 6.1 Objetivo

Construir o **chassi** do Hub: tudo que será reusado por todos os conectores. Validar arquitetura com Mock Connector e dois conectores genéricos. **Sem ERP real ainda.**

### 6.2 MVP obrigatório vs fora do MVP

#### MVP obrigatório

| Área                     | Entrega                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Núcleo                   | `IntegracaoModule` isolado                                                                   |
| Dados                    | 13 tabelas Prisma (`integracao_*`)                                                           |
| Eventos                  | Geração a partir de ticket fechado/cancelado/alterado                                        |
| Fila                     | Outbox + retry + status + DLQ + idempotência                                                 |
| API                      | `/api/v1/integration` com OpenAPI                                                            |
| Conector 1               | **Mock Connector** (simula sucesso/erro/timeout)                                             |
| Conector 2               | **Genérico REST**                                                                            |
| ~~Conector 3 (CSV/XML)~~ | **Movido para Onda 1 da Fase 1** — escopo MVP Fase 0 mantém só caminho crítico (Mock + REST) |
| ~~Conector 4 (SFTP)~~    | **Movido para Onda 1 da Fase 1** — escopo MVP Fase 0 mantém só caminho crítico (Mock + REST) |
| UI                       | Conectores, eventos, erros, reprocessamento, mapping básico                                  |
| Auditoria                | Payload, status, usuário, erro, resposta — com mascaramento                                  |
| Segurança                | Cofre DPAPI + permissões + mascaramento de logs                                              |
| Reconciliação            | Relatório básico: fechados, enviados, pendentes, rejeitados                                  |

#### Fora do MVP

- Conectores nativos de ERP
- RPA
- Escrita direta em tabela transacional
- Webhook público na balança
- Integração fiscal complexa
- Sincronização bidirecional total
- Motor visual avançado tipo iPaaS

### 6.3 Sprints da Fase 0 (12 semanas, sprints de 2 semanas)

| Sprint | Semanas | Foco                                       | Entregas-chave                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | ------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0**  | 1–2     | Preparação                                 | ADR-001 a ADR-006 + ADR-017 (observability pipeline desktop) + **ADR-021 plano B SQLite→Postgres embarcado** (escrita independente do resultado do spike, não como contingência verbal) + **ADR-022 política de branch/PR do módulo** publicadas; **threat model STRIDE+LINDDUN revisado pelo `Security-Agent`** em `docs/integracao/THREAT-MODEL-INTEGRACAO.md` (sem evidence pack de segurança, Sprint 1 não inicia); backlog detalhado; ERP piloto da Fase 1 escolhido; **spike de capacity SQLite+Outbox de 1 sprint inteira (5 dias úteis)** com benchmark 1.000 tickets/h por 24h contínuas (critério de saída: <1% SQLITE_BUSY ou decisão de migrar para Postgres embarcado/alternativa — spec em `docs/integracao/SPIKE-SQLITE-OUTBOX.md`); **ADR-016 com decisão DPAPI vs keytar incluindo cenário multi-usuário Windows / Citrix-RDS / Admin local testado explicitamente** (link `docs/integracao/MULTI-USER-WINDOWS-SCENARIOS.md`); **decisão 1Password Business vs HashiCorp Vault + MFA hardware (YubiKey) obrigatório** para acesso a chaves partner; **discovery: 15 entrevistas registradas com clientes-alvo do ICP** (log público em `docs/integracao/DISCOVERY-LOG.md`) — se faltar sinal externo, registrar em `EXTERNAL-DEPENDENCIES.md` e seguir com Mock/fixtures |
| **1**  | 3–4     | Banco e módulo                             | `IntegracaoModule`, schema Prisma das 13 tabelas, **migrations Prisma formais** (não `db push`) com política de migração + rollback testado contra base de cliente real instalada — `docs/integracao/PRISMA-MIGRATION-POLICY.md`; permissões iniciais                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **2**  | 5–6     | Eventos e outbox                           | Eventos de ticket, outbox transacional, idempotency key, worker local com lock                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **3**  | 7–8     | Logs, retry e Mock                         | Retry policy + jitter, dead-letter, logs com correlation ID, mascaramento, **Mock Connector funcional**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **4**  | 9–10    | Modelo canônico + Mapping Engine (parte 1) | Schemas canônicos (ticket, parceiro, produto, veículo, NF), mapping engine core com transformações (direct, fixed, expression, lookup, unit-convert), validação. **Mapping Engine alocado em 2 sprints (4–5)** — JSONata + lookup + unit-convert + condicional é mini-iPaaS; 1 sprint só é otimista.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **5**  | 11–12   | Mapping Engine (parte 2) + API + UI        | UI básica do Mapping Engine, condicional avançado, testes; Conector REST genérico, API pública v1 com OpenAPI, telas de conectores/eventos/erros, reconciliação básica. **CSV/XML e SFTP foram movidos para Onda 1 da Fase 1** (não estão no MVP Fase 0).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### 6.4 Definition of Done da Fase 0

- Cliente piloto técnico consegue: configurar perfil → testar conexão → enviar ticket via REST genérico → ver no dashboard → reprocessar erro
- Mock Connector cobre 6 cenários (sucesso, timeout, 500, produto inexistente, pedido encerrado, duplicado)
- **DoD único de cobertura**: ≥80% nas linhas novas do chassi + módulos críticos (Outbox, Mapping, Idempotência, Cofre/DPAPI) ≥90% + mutation score ≥60% nesses críticos + TCK 100% + contract test versionado (Pact).
- ADRs aprovadas e publicadas
- Pipeline CI/CD configurado para `src/integracao/`
- Documentação operacional (runbook básico) escrita
- **Capacidade**: Mock valida arquitetura sob carga; capacidade real por conector medida e publicada em `docs/integracao/CAPACITY.md` após primeiro cliente em produção. **SLA comercial não fixa throughput absoluto até medição real (pós-S6 H3)**.
- **Gate GO Fase 1** (agentic): scorecard em `AGENT-GATES-MATRIX.md` com evidência técnica verde. LOIs, contrato comercial ou buffer financeiro são dependências externas para escopo comercial; sem eles, a Fase 1 técnica segue com Mock/fixtures e escopo enxuto.

### 6.5 Riscos da Fase 0

- **Cofre de credenciais — escolha entre DPAPI e `node-keytar`**: ambos são **primeira opção avaliada em paralelo** no Sprint 0. ADR-016 cobre escopo CurrentUser DPAPI; decisão final inclui benchmark contra keytar (Windows Credential Manager). Critério: ergonomia de IPC, robustez em multi-usuário, suporte a rotação. R4 reposicionado como Média/Alto.
- **Política de rotação obrigatória** (registrar em §15.4): tokens OAuth ≤90 dias; chaves API estáticas ≤180 dias; runbook `dr-dpapi.md` testado a cada release.
- **OAuth desktop**: PKCE obrigatório para todos os fluxos OAuth; binding token-fingerprint usando fingerprint **DISSOCIADO** do fingerprint de licenciamento RSA (ADR-013): **derivado mas não idêntico** — comprometimento de um não compromete o outro. UX explícita de re-binding documentada quando troca de HD/MAC dispara reconfiguração separada (cliente vê 2 fluxos: re-licenciamento e re-auth ERP). Detalhes em `docs/adr/ADR-016-credenciais-dpapi.md`. Revogação automática no logout.
- **Backup automático do SQLite local**: RPO ≤1h, RTO ≤30min, restore testado mensalmente. Spec em `docs/integracao/BACKUP-RESTORE-SQLITE.md` — entregável de DoD Fase 0.
- **Audit trail tamper-evident**: hash chain (cada log linka hash do anterior) + export periódico assinado para storage write-once externo (S3 Object Lock ou equivalente). Spec em `docs/adr/ADR-018-audit-trail-tamper-evident.md`. Cold storage de 5 anos é gate de homologação.
- **Cofre central de secrets do lado fornecedor** (chaves partner SAP/TOTVS/Microsoft, chave RSA de licenciamento, tokens AppSource): 1Password Business **ou** HashiCorp Vault. Rotação ≤90d para OAuth, ≤180d para API estática.
- **SQLite + outbox sob carga gera lock** → WAL mode + spike de capacity 5 dias (Sprint 0) com benchmark 1.000 tickets/h por 24h, critério <1% SQLITE_BUSY (`docs/integracao/SPIKE-SQLITE-OUTBOX.md`)
- **Decisão do ERP piloto atrasa** → Sprint 0 com prazo duro, PM bate o martelo
- **Code signing + auto-update + canary (bloqueador GA)**: Code signing do instalador NSIS (cert EV ou OV) + auto-update assinado ativo + canary 10/50/100% via `latest-canary.yml`/`latest-stable.yml`. Custo cert EV ~R$ 2k/ano (ver §18.2).

---

## 7. Fase 1 — Piloto + PME Brasil (mês 4–6)

### 7.1 Objetivo

Validar arquitetura com **1 conector ERP piloto sólido** + escalar para **4 conectores PME**. Primeira receita recorrente do módulo.

### 7.2 Estratégia: piloto primeiro, paralelo depois

Diferente da v1.0 deste plano, **não começamos 5 conectores em paralelo**. A sequência correta é:

1. **Sprints 6–8** (mês 4): Conector piloto único + homologação real com cliente piloto
2. **Sprints 9–11** (mês 5): Em paralelo, 2 conectores PME adicionais
3. **Sprints 12–14** (mês 6): Em paralelo, mais 2 conectores PME

Isso valida o playbook (seção 13) antes de escalar e evita retrabalho.

### 7.3 Conectores da Fase 1

| Ordem | Conector                                                | Quando       | Esforço     |
| ----- | ------------------------------------------------------- | ------------ | ----------- |
| 1     | **Piloto** (Bling **ou** Sankhya, decidido em Sprint 0) | Sprint 6–8   | 3 sprints   |
| 2     | Omie                                                    | Sprint 9–10  | 2 sprints   |
| 3     | ContaAzul                                               | Sprint 9–10  | 1.5 sprints |
| 4     | Tiny ERP                                                | Sprint 11–12 | 1.5 sprints |
| 5     | Bling ou Sankhya (o que não foi piloto)                 | Sprint 13–14 | 2 sprints   |

### 7.4 Entregáveis padrão por conector

Aplicar **playbook universal** (seção 13). Cada conector encerra com:

- Implementação da interface `IErpConnector`
- Mapping YAML padrão (template)
- Testes de contrato contra sandbox do ERP
- Documentação de configuração passo-a-passo
- Runbook operacional (top 10 erros + solução)
- Vídeo de onboarding (5min)
- Homologação com **1 cliente piloto** real
- Publicação no portal de conectores

### 7.5 Marcos comerciais (provisórios até re-baseline pós-S3)

> Datas alinhadas com `comercial/PROJECAO-COMERCIAL-RECALIBRADA.md` e `integracao/REPLANEJAMENTO-STORY-POINTS.md`. Sankhya pode mover para Fase 2 ou ser piloto único da Fase 1.

- **Mês 4 fim**: Piloto em produção com 1 cliente
- **Mês 5 fim**: 1–2 conectores PME GA, 5 clientes pagantes
- **Mês 6 fim**: **1–2 conectores PME GA (Bling/Sankhya), 10 clientes ativos**, primeiros R$ recorrentes
- **Fase 1 entrega 4 conectores PME** (Bling, Omie, Conta Azul, Tiny). Sankhya pode entrar como piloto único OU mover para Fase 2 conforme decisão Sprint 0.

---

## 8. Fase 2 — Brasil Tier-1 (mês 7–10)

### 8.1 Objetivo

Entrar em **contas industriais e agro grandes** com TOTVS e Senior. Ticket médio 5–10x maior que PME.

### 8.2 Ordem e estratégia

| Ordem | Conector                 | Estratégia                                                        | Esforço   |
| ----- | ------------------------ | ----------------------------------------------------------------- | --------- |
| 1     | **TOTVS Protheus**       | Programa parceria iniciado na Fase 0; REST Harpia + SOAP fallback | 4 sprints |
| 2     | **Senior G7 / Senior X** | Senior Partner + APIs públicas Senior X                           | 3 sprints |
| 3     | **TOTVS RM**             | Reusa estrutura Protheus + adapter TBC                            | 2 sprints |
| 4     | **TOTVS Datasul**        | EAI mensageria                                                    | 3 sprints |

> **Re-pricing obrigatório antes de campanha Tier-1/Enterprise (CFO-3)**: para corrigir LTV/CAC ≥3× em conta industrial/agro grande, antes de ir a campo Fase 2 é obrigatório:
>
> - **Setup fee maior**: R$ 30–80k (vs R$ 8–15k atual de PME)
> - **Co-venda com partner** (TOTVS, Senior, parceiro SAP BR) reduzindo CAC
> - Spec em `docs/comercial/RE-PRICING-TIER1.md`. Sem policy check do `PricingPolicyAgent` e decision record do `Agent-Orchestrator`, Fase 2 GA comercial não inicia; engenharia pode seguir em `TECH_READY`.

### 8.3 Particularidades

- **Mapping nunca é genérico** em Protheus: cada cliente customizou. Oferecer:
  - Templates pré-prontos por vertical (agro, indústria, distribuição)
  - Mapping customizável via UI
  - Serviço pago de "onboarding técnico" como receita adicional
- Sandbox TOTVS exige licença → negociar via parceria
- **Analista Integração ERP** entra com 0.5 FTE para liderar discovery

### 8.4 Marcos

- **Mês 7**: Protheus piloto em produção (cliente agro)
- **Mês 8**: Senior em produção (cliente indústria)
- **Mês 10**: 4 conectores Tier-1 BR publicados, 8 clientes Tier-1 ativos

---

## 9. Fase 3 — Global Tier-1 (mês 11–14)

### 9.1 Objetivo

Abrir mercado **global**. Ticket médio enterprise.

### 9.2 Ordem (revisada — Dynamics como plano A)

| Ordem | Conector                       | Quando    | Notas                                                                                                                                                                   | Esforço   |
| ----- | ------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1     | **Microsoft Dynamics 365 F&O** | mês 11–12 | OData + DMF + Entra ID; AppSource em paralelo. **Dynamics primeiro** garante portfólio enterprise sem depender da cert SAP entregar no prazo (R3 mantida Alta/Crítico). | 3 sprints |
| 2     | **SAP S/4HANA Cloud**          | mês 13–15 | OData v4 + Event Mesh; certificação SAP iniciada na Fase 2; segundo conector enterprise                                                                                 | 4 sprints |
| 3     | **Oracle NetSuite**            | mês 15+   | SuiteTalk REST + governance limits                                                                                                                                      | 3 sprints |
| 4     | **Oracle Fusion Cloud ERP**    | mês 16+   | REST + FBDI para massa                                                                                                                                                  | 3 sprints |

**Mitigação principal R3**: Dynamics como plano A; SAP como segundo conector enterprise. Se cert SAP estourar prazo, portfólio enterprise não fica vazio.

### 9.3 Bloqueadores externos (paralelizar com fases anteriores)

- **Certificação SAP**: 4–6 meses → iniciar mês 6
- **Microsoft AppSource**: 2–3 meses → iniciar mês 8
- **Oracle Cloud Marketplace**: 2 meses → iniciar mês 10

### 9.4 Marcos

- **Mês 12**: SAP piloto em conta enterprise
- **Mês 14**: 4 conectores globais publicados, primeira conta enterprise paga

---

## 10. Fase 4 — Long tail e SDK público (mês 15–18)

### 10.1 Objetivo

Cobrir **long tail** sob demanda comercial e abrir ecossistema de parceiros.

### 10.2 Frente A — Conectores long tail (sob demanda)

Implementar conforme **deal já fechado**:

- Infor CloudSuite (ION API Gateway)
- Epicor Kinetic (REST/OData)
- IFS Cloud (RESTful OData)
- Mega ERP, CIGAM, Benner, Alterdata Bimer
- SAP Business One, Sage Intacct/X3, Acumatica, Odoo

**Esforço**: 2–4 sprints por conector. GO/NO-GO baseado em deal fechado.

### 10.3 Frente B — Connector SDK público

- Documentação pública do contrato `IErpConnector`
- CLI para scaffold de novo conector (`@solution-ticket/create-connector`)
- Suíte de testes de conformidade (`@solution-ticket/connector-tck`)
- Programa de certificação de conector parceiro
- Marketplace de conectores (revenue share 70/30)
- 5 parceiros piloto identificados

> **Gate marketplace**: investimento em **marketplace** só inicia se ≥3 parceiros (não-piloto, fora do escopo de pilotos) pediram SDK formalmente. Sem isso, manter SDK como ferramenta interna (apoia conectores nativos) e re-avaliar marketplace no mês 18.

### 10.4 Frente C — Hardening operacional

- Reconciliação avançada (diff visual ticket × ERP)
- Relatório de SLA por conector
- Suporte 24/7 para Tier Enterprise

### 10.5 Marcos

- **Mês 16**: SDK público publicado, 1 parceiro com conector certificado
- **Mês 18**: 5 parceiros com conectores no marketplace, 15+ conectores totais

---

## 11. Backlog por épicos

Backlog inicial estruturado em **6 épicos**. Cada user story rastreada via PM tool.

### Épico 1 — Fundação do módulo

**Histórias**:

- Como administrador, quero cadastrar perfil de integração para uma unidade
- Como administrador, quero testar conexão com o ERP
- Como sistema, quero registrar eventos de ticket fechado
- Como sistema, quero enfileirar eventos para envio posterior
- Como suporte, quero ver eventos enviados/pendentes/com erro

**Entregáveis técnicos**: `integracao.module.ts`, `connector.interface.ts`, tabelas `integracao_profile`, `integracao_outbox`, `integracao_log`, `integracao_external_link`. **Política de migração Prisma documentada com rollback testado contra base de cliente real instalada** (`docs/integracao/PRISMA-MIGRATION-POLICY.md`); a partir do Sprint 1 o módulo usa `prisma migrate` formal (não `db push`).

### Épico 2 — Modelo canônico

**Histórias**:

- Como integrador, quero payload padrão de ticket independente do ERP
- Como integrador, quero importar produtos/clientes/veículos/motoristas em formato canônico
- Como suporte, quero comparar payload local vs payload enviado ao ERP

**Entidades**: `CanonicalWeighingTicket`, `CanonicalPartner`, `CanonicalProduct`, `CanonicalVehicle`, `CanonicalDriver`, `CanonicalFiscalDocument`, `CanonicalInventoryMovement`, `CanonicalAttachment`

### Épico 3 — Outbox, retry e idempotência

**Histórias**:

- Como operador, quero fechar pesagem mesmo com ERP fora do ar
- Como sistema, quero reenviar automaticamente eventos com falha técnica
- Como sistema, quero evitar duplicidade no ERP
- Como suporte, quero reprocessar evento manualmente

**Status do evento**: `PENDING`, `PROCESSING`, `SENT`, `CONFIRMED`, `FAILED_TECHNICAL`, `FAILED_BUSINESS`, `WAITING_RETRY`, `DEAD_LETTER`, `CANCELLED`, `IGNORED`

### Épico 4 — API pública

**Histórias**:

- Como ERP, quero consultar tickets fechados
- Como ERP, quero receber eventos de pesagem
- Como sistema externo, quero importar cadastros para o Solution Ticket
- Como integrador, quero documentação OpenAPI

A API **não** expõe controllers internos. Tem contratos próprios, versionamento e segurança própria.

### Épico 5 — Mapping engine

> **Alocação revisada (Rodada 2)**: **2 sprints como meta + buffer de 2 sprints** (Sprint 4–7 banda total). Histórico de Talend/Boomi mostra que mini-iPaaS leva 4–6 sprints; aceitar variabilidade é ser realista, não pessimista.
>
> - **Sprint 4–5 (meta)**: core JSONata + lookup + unit-convert + condicional + UI básica + testes.
> - **Sprint 6–7 (buffer, ativado se necessário)**: debug avançado (preview com payload real, breakpoints visuais), biblioteca de transformações reutilizáveis, biblioteca de templates por vertical.
>
> Escopo detalhado em `docs/integracao/MAPPING-ENGINE-SCOPE.md`.

**Histórias**:

- Como integrador, quero mapear campos locais para campos do ERP
- Como integrador, quero transformar unidade/data/decimal/texto
- Como integrador, quero valores fixos e tabelas de equivalência
- Como suporte, quero validar payload antes de enviar

**Transformações mínimas**:
| Tipo | Exemplo |
|---|---|
| Campo direto | `ticket.numero` → `documentNumber` |
| Valor fixo | `sourceSystem = "SOLUTION_TICKET"` |
| Conversão de unidade | kg → tonelada |
| Conversão de data | local timezone → UTC |
| Normalização | CNPJ somente dígitos |
| Uppercase | placa do veículo |
| Lookup | produto local → código externo ERP |
| Expressão | peso líquido após desconto |
| Condicional | operação compra/venda/transferência |

### Épico 6 — Conectores genéricos

Antes dos nativos, entregar 4 genéricos:

**6.1 Mock Connector** — simula sucesso, timeout, 500, produto inexistente, pedido encerrado, duplicado.

**6.2 Genérico REST** — URL base, headers, método HTTP, autenticação, template de payload, teste de conexão, healthcheck, mapeamento de resposta.

**6.3 Genérico CSV/XML** — layout por entidade, separador, encoding, pasta entrada/saída, nome de arquivo por template, arquivo de retorno, exportação manual e automática.

**6.4 Genérico SFTP** — host, porta, usuário, senha/chave, pasta remota, upload, download, processamento de retorno, retentativa.

**6.5 Genérico Banco Staging** — conexão controlada, escrita apenas em staging, leitura de views, **nunca** alterar tabela transacional, log de SQL sem expor credencial.

---

## 12. Especificações operacionais

### 12.1 Tabelas Prisma (todas com prefixo `integracao_`)

```
integracao_connector            -- catálogo de tipos de conector
integracao_profile              -- instância configurada por unidade
integracao_profile_secret       -- credenciais protegidas (DPAPI)
integracao_mapping              -- mapeamento de campos
integracao_equivalence_table    -- tabelas de lookup (produto local → ERP)
integracao_equivalence_item     -- itens das tabelas
integracao_external_link        -- vínculo entidade local ↔ externalId
integracao_outbox               -- eventos a enviar
integracao_inbox                -- eventos recebidos
integracao_checkpoint           -- cursor incremental por entidade
integracao_log                  -- logs técnicos com payload mascarado
integracao_reconciliation_run   -- execução de reconciliação
integracao_reconciliation_item  -- itens divergentes detectados
```

### 12.2 Permissões granulares

```
INTEGRACAO_VER
INTEGRACAO_CRIAR
INTEGRACAO_EDITAR
INTEGRACAO_ALTERAR_CREDENCIAL
INTEGRACAO_TESTAR_CONEXAO
INTEGRACAO_VER_PAYLOAD_MASCARADO   -- default operador (CISO-F7)
INTEGRACAO_VER_PAYLOAD_CRU         -- debug; log de acesso obrigatório (auditável)
INTEGRACAO_REPROCESSAR
INTEGRACAO_REPROCESSAR_FISCAL      -- exige dual control (2 aprovadores) p/ tickets já contabilizados
INTEGRACAO_IGNORAR_ERRO
INTEGRACAO_EXPORTAR_LOG
INTEGRACAO_RECONCILIAR
```

**Dual control fiscal (Rodada 2)**: `INTEGRACAO_REPROCESSAR_FISCAL` aplicado a tickets já lançados em livro fiscal exige aprovação de **2 usuários distintos com a permissão** + **WebAuthn/passkey do segundo aprovador** (não basta ID logado; biometria/passkey física previne ataques de sessão sequestrada e sócio coagido). Ação registrada com ambos os IDs + asserção WebAuthn no audit trail tamper-evident. Spec em `docs/integracao/WEBAUTHN-DUAL-CONTROL-SPEC.md`.

**Payload mascarado vs cru (Rodada 2)**: operador padrão vê apenas `INTEGRACAO_VER_PAYLOAD_MASCARADO`. `INTEGRACAO_VER_PAYLOAD_CRU` **NÃO é acesso permanente** — exige:

- **Justificativa textual obrigatória** (ticket ID + razão) registrada no audit trail
- **Aprovação de supervisor por janela 30 minutos** (após 30min, acesso expira e nova justificativa+aprovação são exigidas)
- Log de acesso completo (quem solicitou, quem aprovou, quando, qual ticket, quanto tempo)

**API pública — requisitos transversais (CISO-F8)** (também ADR-013):

- **Rate-limit por tenant**: 1000 req/min default; configurável por plano
- **Autorização granular por escopo OAuth**: `read` / `write` / `admin`
- **TLS 1.2+ obrigatório** (recusar 1.0/1.1)
- **Payload máximo 1MB** com resposta `413 Payload Too Large` explícita

Seguir padrão de permissões granulares já documentado em `docs/MATRIZ-PERMISSOES.md`.

### 12.3 Endpoints REST mínimos

```
GET    /api/v1/integration/health
GET    /api/v1/integration/capabilities

GET    /api/v1/partners
POST   /api/v1/partners/import

GET    /api/v1/products
POST   /api/v1/products/import

GET    /api/v1/vehicles
POST   /api/v1/vehicles/import

GET    /api/v1/drivers
POST   /api/v1/drivers/import

POST   /api/v1/order-references/import
GET    /api/v1/order-references/{id}

GET    /api/v1/weighing-tickets
GET    /api/v1/weighing-tickets/{id}
POST   /api/v1/weighing-tickets/{id}/export
POST   /api/v1/weighing-tickets/{id}/cancel
POST   /api/v1/weighing-tickets/{id}/reprocess

GET    /api/v1/integration/events
GET    /api/v1/integration/outbox
POST   /api/v1/integration/outbox/{id}/retry

GET    /api/v1/integration/reconciliation
POST   /api/v1/integration/reconciliation/run
```

### 12.4 Telas frontend (menu de Integrações)

```
Configurações
  Integrações
    Conectores              -- lista, criar, editar, testar
    Perfis de integração    -- por unidade
    Mapeamento de campos    -- editor visual com preview
    Fila de eventos         -- filtros + reprocessar
    Logs de integração      -- payload mascarado
    Reconciliação           -- pendências e divergências
    Diagnóstico             -- support bundle exportável
```

**Tela de Conectores** — campos: ERP, ambiente, URL base, autenticação, status, último teste, última sincronização, entidades habilitadas, unidade. Ações: criar, editar, testar conexão, ativar/desativar, clonar, exportar configuração sem credenciais.

**Tela de Eventos** — filtros: data, ERP, unidade, ticket, placa, status, tipo de erro, tipo de evento. Ações: reprocessar, cancelar envio, ver payload canônico, ver payload enviado, ver resposta do ERP, exportar diagnóstico.

**Tela de Mapeamento** — campo local, campo remoto, tipo de transformação, obrigatório, valor padrão, validação, **teste com payload real**, pré-visualização do payload final.

**Tela de Reconciliação** — indicadores: tickets fechados não enviados, enviados sem confirmação, rejeitados, divergentes, cancelamentos pendentes, erros por ERP, erros por unidade.

---

## 13. Playbook universal para criar conector

Todo conector novo (nativo) segue **6 etapas obrigatórias**. Essa repetibilidade é o que torna o módulo escalável.

### Etapa 1 — Discovery

> **Regra de priorização**: a escolha de **qual conector entra a seguir** usa scoring **RICE** (Reach × Impact × Confidence ÷ Effort) com ≥3 inputs (Eng Lead + PM + Comercial), registrado em `docs/integracao/RICE-PRIORITIZATION.md`. Sem RICE registrado, o conector não entra em planning.

Coletar com cliente piloto:

- Produto ERP exato + versão
- Cloud ou on-premise
- Métodos de integração disponíveis
- Ambiente de homologação
- Autenticação aceita
- Endpoints
- Limites de requisição (rate limit)
- Campos obrigatórios
- Regras de negócio
- Layout de erro
- Entidades necessárias
- Consultor ERP responsável (do lado do cliente)

### Etapa 2 — Contrato

Definir formalmente:

- Quais dados vêm do ERP
- Quais dados vão para o ERP
- Quem é dono de cada campo
- Como tratar conflito
- Como tratar cancelamento
- Como tratar divergência de quantidade
- Como tratar pedido inexistente
- Como tratar produto/cliente bloqueado

Saída: documento `docs/integracao/contratos/<erp>.md`.

### Etapa 3 — Mapeamento

Criar:

- Mapa de campos (YAML)
- Tabelas de equivalência
- Conversão de unidades
- Conversão de timezone
- Validação de payload
- Exemplo de payload aceito
- Exemplo de payload rejeitado

### Etapa 4 — Implementação

Estrutura padrão por conector:

```
backend/src/integracao/connectors/<erp>/
  <erp>.connector.ts        -- implementa IErpConnector
  <erp>.auth.ts             -- estratégia de autenticação
  <erp>.mapper.ts           -- canônico ↔ ERP
  <erp>.client.ts           -- HTTP client + retry específico
  <erp>.errors.ts           -- classificação técnico vs negócio
  <erp>.fixtures.ts         -- payloads de teste
  <erp>.connector.spec.ts   -- testes unitários
  <erp>.contract.spec.ts    -- testes de contrato (Pact)
  mapping/<erp>-default.yaml -- template de mapping
```

### Etapa 5 — Homologação

**Entregáveis legais/LGPD obrigatórios por conector** (gate de evidência — SRE-S1-9, CISO-F4):

- DPIA preenchida para o conector (template em `docs/legal/DPIA-TEMPLATE.md`)
- Matriz de transferência internacional revisada (se ERP cloud com região fora BR)
- DPA/sub-processadores classificados em `EXTERNAL-DEPENDENCIES.md` quando exigirem ato externo
- Parecer `LGPD-Legal-Agent` com risco residual e status `TECH_READY`, `PILOT_READY` ou `BLOCKED_EXTERNAL`

**Entregáveis legais transversais — Etapa 5 (Rodada 2)** (evidência única para o módulo, válida a partir do 1º conector em homologação):

- **Pacote LGPD formal** — DPO real, carta de designação e DPA são dependências externas para `COMMERCIAL_GA_READY`; para engenharia, o `LGPD-Legal-Agent` produz DPIA/ROPA/matriz e marca lacunas como `BLOCKED_EXTERNAL`.
- **RoPA do módulo** (Registro de Operações de Tratamento) único, mantido em `docs/integracao/ROPA-MODULO-INTEGRACAO.md`. Atualizado a cada novo conector ou mudança de finalidade.
- **Processo de direitos do titular** (acesso, retificação, exclusão, portabilidade, anonimização, revogação de consentimento) com **SLA 7 dias úteis ao controlador** (cliente do Solution Ticket). Spec do fluxo + templates em `docs/legal/PROCESSO-DIREITOS-TITULAR.md`.

Testar contra sandbox do ERP:

- Conexão
- Importação de produto
- Importação de parceiro
- Importação de pedido
- Envio de ticket
- Envio de cancelamento
- Erro de produto inexistente
- Erro de pedido encerrado
- Timeout
- Reprocessamento
- Duplicidade (idempotência)
- Reconciliação

> **Change management Tier-1/Enterprise (SRE-S3-16)**: Tier-1 (TOTVS Protheus, Senior, Datasul) e Enterprise (SAP, Oracle, Dynamics) **exigem** PR + code review + audit trail de change management para qualquer alteração no conector. O fluxo "direto em main" do CLAUDE.md aplica-se ao **produto-base** Solution Ticket; o módulo Integração ERP, **a partir de Fase 2**, usa branch + PR mandatório como requisito de auditoria.

### Etapa 6 — Produção assistida

Com cliente piloto real:

- Primeiros tickets enviados acompanhados ao vivo
- Erros reais classificados e corrigidos
- Tempo médio de processamento medido
- Divergências catalogadas
- Logs revisados
- Suporte treinado
- Plano de rollback documentado

**Conector só chega a `TECH_READY`/`PILOT_READY`/`COMMERCIAL_GA_READY`** conforme `AGENT-GATES-MATRIX.md`. Para `TECH_READY`, exigir 2 semanas em piloto/sombra sem P0/P1 técnico ou evidência equivalente em sandbox + os seguintes gates transversais (Rodada 2):

- **Threat model revisado pelo `Security-Agent`** com STRIDE/LINDDUN + SAST/DAST/secret scan
- **DPIA preenchida pelo `LGPD-Legal-Agent`**; assinatura externa, se existir, é dependência de `COMMERCIAL_GA_READY`
- **RoPA atualizada** com a operação do conector
- **SBOM no CI verde** (Software Bill of Materials gerado e sem vulnerabilidades CRITICAL não justificadas)
- **Scan de licenças sem incompatibilidade** (sem GPL viral em código distribuído, sem licenças bloqueantes para o modelo comercial)

**Critério adicional para conectores fiscais (NF-e, ICMS, CT-e)**: GA exige **≥1 mês fiscal fechado e reconciliado sem divergência** (não basta 2 semanas sem P0/P1). Conector fiscal sem ciclo fiscal fechado fica em "beta fiscal".

**Certificações ERP — obrigações contínuas (CISO-F11)**: certificações (SAP, TOTVS, Microsoft AppSource, Oracle MP) impõem obrigações contínuas após GA: pentest anual, SLA reporting, security patches em N dias, comunicação de incidentes. Listar obrigações por programa em `docs/integracao/CERT-OBLIGATIONS-MATRIX.md` (entrada por ERP, mínimo 1 linha por programa).

---

## 14. Marcos de governança e ADRs

### 14.1 Cerimônias

| Cerimônia                | Frequência         | Output                                                                 |
| ------------------------ | ------------------ | ---------------------------------------------------------------------- |
| Daily                    | Diária             | Bloqueios identificados                                                |
| **DOR Review**           | **Pré-planning**   | **Histórias sem DOR ❌ NÃO entram no Planning**                        |
| Sprint Planning          | Quinzenal          | Backlog do sprint                                                      |
| Sprint Review            | Quinzenal          | Demo                                                                   |
| Retrospectiva            | Quinzenal          | Plano de melhoria                                                      |
| Agentic Phase Checkpoint | Mensal             | `Agent-Orchestrator` calcula prioridade e GO/PIVOT/NO-GO por evidência |
| Architecture Review      | Mensal             | ADRs e mudanças estruturais                                            |
| Post-mortem              | Por incidente prod | Ações corretivas                                                       |

### 14.1.1 Definition of Ready (DOR) — gate obrigatório

História só entra no Planning se tiver TODOS:

- [ ] User story (Como/Quero/Para)
- [ ] Critérios de aceite mensuráveis
- [ ] Estimativa em pts validada por 2 subagentes independentes
- [ ] Dependências mapeadas e resolvidas
- [ ] Mockup (se UI) / Endpoint contract (se API) / Sandbox provisionado (se conector)
- [ ] **MoSCoW marcado** (Must / Should / Could)

`Agent-Orchestrator` recusa história sem DoR. Veto duro registrado em `docs/auditoria/agentic/`.

### 14.2 Quality gates por fase

> **DoD único de cobertura** (vale para todo o módulo): ≥80% nas linhas novas + módulos críticos (Outbox, Mapping, Idempotência, Cofre/DPAPI) ≥90% + mutation score ≥60% nesses críticos + TCK 100% + contract test (Pact) versionado.

Fase só "fecha" quando:

- Todos os entregáveis no DoD validados
- DoD único de cobertura atingido (acima)
- Sem bugs P0/P1 abertos
- Documentação atualizada
- Cliente piloto real ou ambiente sombra/sandbox equivalente operando há ≥ 2 semanas sem incidente (≥1 mês fiscal para conectores fiscais quando houver dado real)
- `Agent-Orchestrator` emite GO/PIVOT/NO-GO para próxima fase (ver 14.2.1)

#### 14.2.1 Checkpoint de fase formal — critérios numéricos GO/NO-GO/PIVOT

> Adicionado em resposta à Auditoria R5 — "steering sem critérios objetivos, decisão GO subjetiva".

Ao fim de cada fase, `Agent-Orchestrator` avalia 3 dimensões com **thresholds duros**:

| Dimensão                                                    | GO (verde)                                                             | NO-GO (vermelho) | PIVOT (amarelo) |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------- | --------------- |
| **NSM** (sincronização ≤5min)                               | ≥ alvo da fase (Fase 1: 95% / Fase 2: 96% / Fase 3: 97% / Fase 4: 98%) | < 80% do alvo    | 80–94% do alvo  |
| **Churn dos clientes integrados** (rolling 90d)             | ≤ 5%                                                                   | > 15%            | 5–15%           |
| **Pipeline qualificado próx. fase** (deals em estágio SQL+) | ≥ 3× capacidade da próxima fase                                        | < 1× capacidade  | 1–3× capacidade |

**Decisão**:

- **3 verdes** = GO. Próxima fase liberada com plano original.
- **Qualquer 1 vermelho** = NO-GO. Fase atual estendida 1 sprint para correção; re-checkpoint obrigatório.
- **Misto (≥1 amarelo, sem vermelhos)** = PIVOT. A matriz agentic escolhe automaticamente entre: (a) GO com escopo reduzido, (b) extensão de 1 sprint, (c) troca de prioridade na ordem de conectores.

Critérios documentados em decision record. `Agent-Orchestrator` anexa evidência numérica (não opinião) ao checkpoint.

### 14.3 ADRs iniciais

```
docs/adr/
  ADR-001-integration-module-isolado.md
  ADR-002-outbox-local-first.md
  ADR-003-modelo-canonico-versionado.md
  ADR-004-credenciais-dpapi.md
  ADR-005-conectores-plugaveis.md
  ADR-006-nao-expor-backend-publicamente.md
  ADR-007-mapping-declarativo-yaml.md
  ADR-008-relay-cloud-webhook-entrante.md
  ADR-009-versionamento-api-publica.md
  ADR-010-classificacao-erro-tecnico-vs-negocio.md
  ADR-017-observability-pipeline-desktop.md     -- SRE-S0-2 (Sprint 0)
  ADR-018-audit-trail-tamper-evident.md         -- SRE-S2-10/CISO-F5 (cold storage 5 anos + hash chain)
  ADR-019 a ADR-022                             -- ADRs adicionais da rodada de auditoria 5-especialistas
```

### 14.3.1 Continuous Discovery (PM-1)

**Cadência fixa**: `DiscoveryResearchAgent` coleta **4–6 sinais/mês** com clientes integrados (formulários, transcrições, tickets de suporte, CRM ou entrevistas opcionais). Log público em `docs/integracao/DISCOVERY-LOG.md`.

**Gate de fase**: assumption mapping obrigatório toda fase (Fase 0 antes de Fase 1, Fase 1 antes de Fase 2, etc.) — produzir lista de premissas com confidence ranking + plano de validação.

Spec completa de cadência em `docs/integracao/DISCOVERY-CADENCE.md`.

### 14.4 Documentação técnica formal

```
docs/integracao/
  001-arquitetura-integration-hub.md
  002-modelo-canonico.md
  003-api-publica-v1.md
  004-outbox-inbox-retry.md
  005-seguranca-credenciais.md
  006-mapping-engine.md
  007-playbook-conectores-erp.md
  008-runbook-suporte.md
  009-criterios-homologacao.md
  contratos/<erp>.md          -- 1 por conector
  templates/<erp>-mapping.yaml -- 1 por conector
```

---

## 15. Critérios de aceite

### 15.1 Técnicos (do módulo)

- [ ] Pesagem fecha mesmo sem ERP disponível
- [ ] Evento entra na fila
- [ ] Retry automático funciona
- [ ] Reprocessamento não duplica lançamento
- [ ] Payload tem idempotency key obrigatória
- [ ] Logs mostram causa do erro com classificação
- [ ] Payload sensível mascarado em log
- [ ] Conector pode ser ativado/desativado sem reiniciar
- [ ] API documentada em OpenAPI
- [ ] Testes passam no pipeline
- [ ] Migração Prisma não corrompe banco existente
- [ ] Dashboard mostra pendências em tempo real
- [ ] Reconciliação identifica divergências
- [ ] Cobertura conforme DoD único (§14.2): ≥80% linhas novas + ≥90% críticos (Outbox/Mapping/Idempotência/Cofre) + mutation ≥60% críticos + TCK 100% + contract test versionado

### 15.2 Funcionais (do módulo)

- [ ] Importa cliente, produto, veículo, motorista, pedido
- [ ] Envia ticket fechado
- [ ] Envia cancelamento
- [ ] Mostra status da integração
- [ ] Permite reprocessar evento
- [ ] Exporta log para suporte
- [ ] Configura mapping via UI sem código

### 15.3 Operacionais (suporte deve responder em < 10 min)

- Qual ticket falhou?
- Qual ERP recebeu?
- Qual payload foi enviado?
- Qual resposta voltou?
- Foi erro técnico ou erro de negócio?
- Quantas tentativas ocorreram?
- O evento foi duplicado?
- O cliente alterou alguma configuração?
- A falha é do Solution Ticket, do ERP, da rede ou do cadastro?

### 15.4 Por conector (Definition of Done)

> **Gates transversais antes de GA** (não específicos do conector, mas obrigatórios):
>
> - **SLO publicado + dashboard burn-rate ativo** (`docs/integracao/SLO-INTEGRACAO.md`) — sem isso, sem GA
> - **On-call ativo + paging tool configurado** (`docs/ON-CALL.md`) — gate de GA do 1º conector cloud; MTTR<2h só vale com on-call ativo
> - **Code signing instalador NSIS (cert EV ou OV) + auto-update assinado + canary 10/50/100%** (`latest-canary.yml`/`latest-stable.yml`) — bloqueador GA
> - **Load-test sintético 24h contínuas em 10× volume médio do cliente piloto antes de GA**. Pass = sem crash + p95 dentro do SLO + DLQ <0,5%
> - **Política de rotação de credenciais aplicada**: tokens OAuth ≤90d; chaves API estáticas ≤180d; runbook `dr-dpapi.md` testado a cada release
> - **DPIA preenchida + DPA/sub-processadores classificados + matriz transferência internacional** revisada pelo `LGPD-Legal-Agent` (assinaturas externas ficam em `BLOCKED_EXTERNAL`)
> - **Off-machine backup do SQLite (Rodada 2)**: replicação com integridade criptográfica via VPN/relay para storage externo permitido, retenção fiscal 5 anos, restore testado mensalmente — link `docs/integracao/BACKUP-RESTORE-SQLITE.md`. Sem isso, conector não chega a `COMMERCIAL_GA_READY`.
> - **Feature flags runtime por conector/tenant (Rodada 2)** com kill-switch operacional (não só canary de release): operador SRE pode desligar conector específico em tenant específico em <2min, sem deploy. Spec em `docs/integracao/FEATURE-FLAGS-RUNTIME-SPEC.md`.
> - **Capacity teste sintético no Sprint 5 (Rodada 2)**: 24h em **10× volume médio do cliente piloto identificado**, executado **antes do início do desenvolvimento do conector piloto**, não só pré-GA. Pass = sem crash + p95 dentro do SLO + DLQ <0,5%.
> - **Cobertura progressiva (Rodada 2)**: 60% Sprint 0–3 → 70% Sprint 4–5 → 80% Sprint 6+ nas linhas novas; ≥90% em módulos críticos (Outbox, Mapping, Idempotência, Cofre/DPAPI) **sempre**, desde Sprint 0 (não progressivo). Substitui o gate "≥80% desde o início" como mais realista.

Conector só vai para produção quando:

- [ ] Teste de conexão funcional
- [ ] Homologação e produção separados
- [ ] Credenciais protegidas em cofre
- [ ] Retry com backoff
- [ ] Idempotência validada (envio duplicado não duplica)
- [ ] Rate limit respeitado
- [ ] Logs com correlation ID
- [ ] Reprocessamento operacional auditado via UI/API
- [ ] DLQ funcional
- [ ] Checkpoint incremental
- [ ] Paginação de pull
- [ ] Tratamento de timezone (local + UTC)
- [ ] Tratamento de decimal/unidade (kg/ton/saca)
- [ ] Testes automatizados de transformação
- [ ] Teste de carga: 10x volume médio sem degradação
- [ ] Teste de resiliência: ERP offline/lento/5xx validado
- [ ] Auditoria fiscal: 100 documentos rastreáveis fim-a-fim
- [ ] Runbook escrito
- [ ] Vídeo de onboarding gravado
- [ ] Cliente piloto real ou ambiente sombra equivalente operando 2 semanas sem P0/P1
- [ ] **Para conectores fiscais (NF-e, ICMS, CT-e)**: ≥1 mês fiscal fechado e reconciliado sem divergência

### 15.5 Chaos engineering / game days (SRE-S2-11)

**Cadência (Rodada 2)**: **trimestral em Fase 0–1**; **mensal em Fase 2–3** (Tier-1 entrando exige reflexos rápidos — Protheus/SAP em produção não comportam descobrir gap operacional só no trimestre). Voltar a trimestral em Fase 4 se base estabilizar.

Game days simulam falhas reais para validar runbooks e on-call. Cenários mínimos:

- Outbox cheia (50k+ eventos pendentes)
- DLQ explodindo (taxa de erro técnico > 10%)
- ERP retornando 200 com payload corrompido
- Certificado expirado (DPAPI/keytar/TLS)
- OAuth refresh token race condition

Plano em `docs/integracao/CHAOS-ENGINEERING-PLAN.md`. Cada game day produz: lista de findings + ações corretivas + atualização de runbooks.

### 15.6 Resposta a incidente (CISO-F10)

**Matriz de severidade**:

| Sev      | Descrição                                    | SLA ack          | Escalação                |
| -------- | -------------------------------------------- | ---------------- | ------------------------ |
| **Sev1** | Sistema crítico down + dado fiscal em risco  | **Pager 5 min**  | On-call → Eng Lead → CTO |
| **Sev2** | Degradação significativa (NSM cai >20%)      | 15 min           | On-call → Eng Lead       |
| **Sev3** | Degradação parcial (1 conector intermitente) | 1h               | On-call                  |
| **Sev4** | Cosmético / UI / não bloqueante              | Próximo dia útil | Backlog normal           |

**Playbook de resposta** em `docs/SECURITY-INCIDENT-PLAYBOOK.md` cobrindo:

- Fluxo de contenção, erradicação e recuperação
- **Notificação ANPD em 72h** quando incidente afeta dados pessoais (LGPD art. 48)
- Processo de revogação massiva de tokens (kill-switch por tenant)
- Comunicação com cliente afetado (template + responsável)
- **Post-mortem público (Rodada 2)**: **7 dias úteis para Sev1**; **14 dias úteis para Sev2-Sev3** (squad enxuta não comporta 7d em todos os níveis sem comprometer entrega)

**Tabletop semestral agentico (Rodada 2)**: simulação de incidente com `Incident-Agent`, `LGPD-Legal-Agent`, `Security-Agent`, `SRE-Agent` e `Commercial-Agent` (não é game day técnico — é decision-making por critérios: comunicar ANPD? notificar imprensa? acionar seguro cyber? pausar conector? rebate cliente?). Cenários mínimos: vazamento de credenciais partner SAP, ransomware em SQLite cliente Tier-1, multa LGPD por sub-processador. Spec em `docs/integracao/TABLETOP-INCIDENT-PROTOCOL.md`.

**Seguro cyber (Rodada 2)**: `Finance-Agent` avalia contratação de **seguro cyber liability** ao entrar em Tier-1/Enterprise (Fase 2+). Cobertura mínima sugerida: R$ 2–5M (multa LGPD + custo de notificação + lucros cessantes do cliente). Cotação ao fim Fase 1; decisão go/no-go por scorecard ao fim Fase 1.

---

## 16. Métricas de sucesso

### 16.0 North Star Metric, OKRs e leading indicators

> Adicionado em resposta à Auditoria R5 Agente 6 — "métricas só lagging, sem NSM/OKRs/leading".

#### 16.0.1 North Star Metric (NSM) — Rodada 2

> **NSM**: **% de clientes integrados que renovam contrato após 12 meses de uso** (target ≥85%, medido em cohort rolling).

**Razão de escolha (Rodada 2)**: NSM precisa ser **outcome de negócio**, não SLI técnico. "% pesagens sincronizadas em ≤5min" é leading indicator técnico — hub que sincroniza rápido mas o cliente não renova é falha de produto, não sucesso. A métrica de renovação captura: produto resolve dor real (renova) + confiabilidade percebida (não troca) + valor entregue (paga ano 2).

**Targets**:

- **Cohort mês 6–12 medido em mês 18**: ≥ 75% (ramp inicial)
- **Cohort mês 12+ medido em mês 24**: **≥ 85% (alvo de regime)**

**Counter-metric**: **horas/mês economizadas em conciliação manual** (estimado pelo cliente em entrevistas trimestrais; **alvo ≥40h/mês** por cliente). Garante que NSM não é gameable por contrato preso a multa — captura valor real percebido.

**SLI técnico (não NSM, mas crítico)**: a antiga métrica "% pesagens sincronizadas em ≤5min" continua sendo monitorada como **SLI técnico** alinhado ao SLO 99,9% disponibilidade fiscal. Targets:

- GA 1º conector (mês 5–6): ≥ 95%
- Mês 12: ≥ 97%
- Mês 18: ≥ 98%

**O3 SLO formal**: SLO 99,9% disponibilidade fiscal por mês com **error budget de 43min/mês**; **0 perda fiscal não recuperável** é counter-only (sem error budget — perda fiscal é zero-tolerance).

**Counter-metric secundário**: **% clientes que desligaram a integração após ≥30 dias ativa** (target ≤5%) — mantido lado a lado para anti-gaming do SLI técnico.

#### 16.0.2 OKRs trimestrais

| Trimestre                | Objetivo                                               | KR1                                                                          | KR2                                                                                                                                                                                           | KR3                                                                                          |
| ------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Q3/26** (Sprint 0–5)   | Fundação técnica entregue e cliente piloto fechado     | Mock + REST em produção interna (demo) — CSV/SFTP movidos para Onda 1 Fase 1 | **≥1 contrato pago não-reembolsável assinado com setup fee depositado em escrow** (Rodada 2 — LOI tem valor comercial baixo demais para ser gate; só conta deal com dinheiro real depositado) | Velocity calibrada com 3 sprints rolling (≥ 22 pts)                                          |
| **Q4/26** (Sprint 6–10)  | Bling **ou** Sankhya em GA com 3 clientes pagantes     | 1º conector ERP em GA com ≥ 1 cliente em produção 2 semanas sem P0/P1        | NSM ≥ 90% nos clientes ativos                                                                                                                                                                 | MRR módulo R$ 3–5k (1 piloto pago + 1–2 PME early adopter) — meta R$ 12,5k movida para Q1/27 |
| **Q1/27** (Sprint 11–15) | 2º conector PME em GA + pipeline comercial qualificado | Bling **e** Sankhya em GA (ambos)                                            | 10 clientes integrados ativos                                                                                                                                                                 | MRR ≥ R$ 12,5k + 30 MQLs/mês sustentado por 3 meses                                          |
| **Q2/27** (Sprint 16–20) | 5 ERPs publicados (Onda 1 completa)                    | Omie + ContaAzul + Tiny em GA                                                | NSM ≥ 95% médio                                                                                                                                                                               | Time-to-integrate ≤ 10 dias mediana                                                          |
| **Q3/27** (Sprint 21–24) | Marketplace operacional + Tier-1 BR em homologação     | Marketplace público com ≥ 1 conector parceiro                                | TOTVS Protheus em homologação cliente piloto                                                                                                                                                  | ARR ≥ R$ 1,8M                                                                                |

OKRs revisados **mensalmente** por decision record do `Agent-Orchestrator`; reunião executiva, se existir, é dependência externa. KR não atingido = explicar causa + ação corretiva, não punição.

#### 16.0.3 Leading indicators (preditivos)

Métricas que antecipam o NSM e os OKRs em **2–8 semanas**:

| Indicador                           | Antecipa                     | Meta                                      | Frequência               |
| ----------------------------------- | ---------------------------- | ----------------------------------------- | ------------------------ |
| **Nº pilotos em homologação ativa** | GA do conector (mês +2)      | ≥ 1 piloto/conector na fase de validação  | Semanal                  |
| **Taxa de conversão demo → piloto** | Pipeline Q+1                 | ≥ 25% (1 em 4 demos vira piloto)          | Mensal                   |
| **Nº MQLs qualificados/semana**     | Pipeline Q+2                 | ≥ 8/semana sustentado (a partir de Q4/26) | Semanal                  |
| **% TCK passing por conector**      | Time-to-GA                   | ≥ 90% antes de homologação cliente        | Por sprint               |
| **Velocity rolling 3 sprints**      | Capacidade de entrega Q+1    | ≥ 22 pts (Fase 0), ≥ 28 pts (Fase 1+)     | Por sprint               |
| **NPS cliente piloto (interim)**    | NPS produto mês +3           | ≥ 30 antes de promover GA                 | Quinzenal durante piloto |
| **Idade média da DLQ**              | Risco churn técnico (mês +1) | < 4h                                      | Diária                   |

**Regra de decisão**: 2 leading indicators no vermelho **2 semanas seguidas** = decision record emergencial do `Agent-Orchestrator` antes do próximo Sprint Planning.

---

### 16.1 Métricas técnicas (mensais)

> **SLO + error budget formal (gate de GA)** — ver `docs/integracao/SLO-INTEGRACAO.md`. **Sem SLO publicado por conector + dashboard de burn-rate ativo, conector não vai GA.**

| Métrica                                                     | Meta                                                                                                                                                                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cobertura de testes do módulo                               | DoD único §14.2: ≥80% linhas novas; ≥90% críticos; mutation ≥60% críticos; TCK 100%; contract test versionado                                                                                                                   |
| Latência p95 push para ERP                                  | < 2s                                                                                                                                                                                                                            |
| Taxa de erro técnico                                        | < 1%                                                                                                                                                                                                                            |
| Idade máxima na DLQ                                         | < 24h                                                                                                                                                                                                                           |
| Throughput suportado                                        | Mock valida arquitetura sob carga; capacidade real por conector medida e publicada em `docs/integracao/CAPACITY.md` após primeiro cliente em produção. SLA comercial não fixa throughput absoluto até medição real (pós-S6 H3). |
| MTTR de incidente integração                                | < 2h (válido apenas com on-call ativo + paging tool configurado — ver §15.4)                                                                                                                                                    |
| Tempo para adicionar conector novo (Time-to-integrate)      | ≤ 5 dias mês 18                                                                                                                                                                                                                 |
| **Outcome — % pilotos que viram contrato pago em ≤30 dias** | ≥ 70%                                                                                                                                                                                                                           |

### 16.2 Métricas operacionais técnicas (sempre absolutas)

| Métrica                                   | Meta     |
| ----------------------------------------- | -------- |
| Tickets fechados com evento gerado        | 100%     |
| Eventos duplicados                        | 0        |
| Eventos sem idempotency key               | 0        |
| Erros sem classificação (técnico/negócio) | 0        |
| Reprocessamentos com duplicidade          | 0        |
| Conectores nativos com teste automatizado | 100%     |
| Payloads com segredo em log               | 0        |
| Operação bloqueada por ERP fora do ar     | 0 casos  |
| Tempo para diagnosticar falha (suporte)   | < 10 min |

### 16.3 Métricas de produto (recalibradas)

> Versão original superestimava — substituída por números bottom-up. Ver `comercial/PROJECAO-COMERCIAL-RECALIBRADA.md`.

| Métrica                          | Mês 6                           | Mês 12                     | Mês 18  |
| -------------------------------- | ------------------------------- | -------------------------- | ------- |
| Conectores publicados            | **1–2** (PME GA: Bling/Sankhya) | 5 (4 PME GA + 1 Tier-1 BR) | 11      |
| Clientes ativos com integração   | **10**                          | **47**                     | **110** |
| % pesagens sincronizadas com ERP | 60%                             | 80%                        | 95%     |
| NPS dos clientes integrados      | ≥ 30                            | ≥ 50                       | ≥ 60    |
| Time-to-integrate (cliente novo) | 30 dias                         | 10 dias                    | 5 dias  |

### 16.4 Métricas comerciais (recalibradas)

| Métrica                             | Mês 6        | Mês 12     | Mês 18      |
| ----------------------------------- | ------------ | ---------- | ----------- |
| MRR do módulo                       | **R$ 12,5k** | **R$ 80k** | **R$ 228k** |
| ARR projetado                       | R$ 150k      | R$ 960k    | **R$ 2,7M** |
| % MRR vs total produto              | 10%          | 20%        | 30%         |
| Conectores parceiros no marketplace | 0            | 1          | 5           |
| Setup fee acumulado                 | R$ 25k       | R$ 155k    | **R$ 445k** |

---

## 17. Riscos críticos e contingência

> **Cadência de revisão**: cada risco tem **Owner** formal e **última revisão** datada. Owner reporta status no decision record mensal; risco sem revisão > 60 dias é escalado automaticamente.

| #       | Risco                                                                                                                                                                                                         | Prob.    | Impacto                  | Mitigação                                                                                                                                                                                         | Contingência                                                                                                                                                   | Owner                             | Última revisão |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------- |
| R1      | **Começar por conector nativo antes do core**                                                                                                                                                                 | Média    | Crítico                  | Princípio 3.1: ordem rígida; Tech Lead veta                                                                                                                                                       | Refactor doloroso; perda de 2 sprints                                                                                                                          | Eng Lead                          | 2026-04-27     |
| R2      | Programa parceria TOTVS atrasa                                                                                                                                                                                | Alta     | Alto                     | Iniciar mês 1                                                                                                                                                                                     | Fase 2 começa por Senior; Protheus desliza                                                                                                                     | PM                                | 2026-04-27     |
| R3      | Certificação SAP — **lead-time real 9–18m no Brasil** (Rodada 2; antes "4–6m" era subestimado)                                                                                                                | **Alta** | **Crítico**              | **Dynamics primeiro como plano A** (já está na Fase 3 ordem 1); SAP **só com partner BR existente** já estabelecido; engajamento partner mês 3; cert SAP iniciada apenas após partner formalizado | SAP entra na Fase 4 ou após (não na Fase 3); Dynamics absorve portfólio enterprise; venda via parceiro SAP BR sem cert própria como alternativa de longo prazo | PM                                | 2026-04-27     |
| R4      | DPAPI tem limitação Electron                                                                                                                                                                                  | Baixa    | Médio                    | Spike Sprint 0                                                                                                                                                                                    | Fallback `node-keytar`                                                                                                                                         | Eng Lead                          | 2026-04-27     |
| R5      | SQLite gargalo alto volume                                                                                                                                                                                    | Média    | Médio                    | Benchmark Sprint 0 + WAL mode                                                                                                                                                                     | SQLite secundário ou LiteFS                                                                                                                                    | Eng Lead                          | 2026-04-27     |
| R6      | Cliente piloto desiste antes de homologar                                                                                                                                                                     | Média    | Médio                    | 2 pilotos por conector                                                                                                                                                                            | Conector vira "beta privado"                                                                                                                                   | PM                                | 2026-04-27     |
| R7      | Equipe perde dev sênior                                                                                                                                                                                       | Média    | **Crítico**              | Pair programming + bus factor ≥2 em outbox/mapping/cofre + retenção via vesting/bônus de permanência + ADRs documentadas                                                                          | Backfill em 60 dias; redistribuição imediata via bus-factor secundário                                                                                         | PM                                | 2026-04-27     |
| R8      | LGPD exige mudança estrutural                                                                                                                                                                                 | **Alta** | Alto                     | **DPIA por conector como gate de homologação** (§13 Etapa 5); compliance review Fase 0; matriz transferência internacional revisada                                                               | Sprint dedicada de remediação; possível pausa de conector que use região fora BR                                                                               | Jurídico/CISO                     | 2026-04-27     |
| R9      | Concorrente lança hub similar primeiro                                                                                                                                                                        | Média    | Médio                    | Acelerar Fase 1; **alocação de R$ 200k de aceleração reservada como war room budget** (linha em §18.2)                                                                                            | Diferenciar por confiabilidade fiscal; ativar war room                                                                                                         | CFO/CEO                           | 2026-04-27     |
| R10     | Conector quebra (mudança API ERP)                                                                                                                                                                             | Alta     | Médio                    | Testes de contrato em CI diário                                                                                                                                                                   | Hotfix em 24h                                                                                                                                                  | Eng Lead                          | 2026-04-27     |
| R11     | iPaaS do cliente conflita com hub                                                                                                                                                                             | Média    | Baixo                    | Documentar padrão "endpoint genérico"                                                                                                                                                             | Modo passive do hub                                                                                                                                            | Eng Lead                          | 2026-04-27     |
| R12     | **Dados mestres divergentes** geram rejeição                                                                                                                                                                  | Alta     | Médio                    | Tabelas de equivalência + validação pré-envio                                                                                                                                                     | UI de resolução de conflito                                                                                                                                    | Eng Lead                          | 2026-04-27     |
| R13     | Credenciais vazarem                                                                                                                                                                                           | Baixa    | Crítico                  | DPAPI + mascaramento + permissões                                                                                                                                                                 | Rotação imediata + auditoria                                                                                                                                   | Eng Lead                          | 2026-04-27     |
| R14     | Webhook público exposto na balança                                                                                                                                                                            | Baixa    | Crítico                  | Princípio: relay cloud obrigatório                                                                                                                                                                | Auditoria de segurança bloqueia release                                                                                                                        | Eng Lead                          | 2026-04-27     |
| R15     | Erro técnico tratado como negócio (retry errado)                                                                                                                                                              | Média    | Médio                    | Classificação obrigatória no conector                                                                                                                                                             | Code review específico para erros                                                                                                                              | Eng Lead                          | 2026-04-27     |
| R16     | Falta de suporte diagnóstico                                                                                                                                                                                  | Alta     | Alto                     | Support bundle desde Fase 0                                                                                                                                                                       | Treinamento extra do CS                                                                                                                                        | PM                                | 2026-04-27     |
| R17     | Tentar 20 ERPs no início                                                                                                                                                                                      | Média    | Crítico                  | Princípio 3.7: ondas                                                                                                                                                                              | Replanejamento Fase 1                                                                                                                                          | PM                                | 2026-04-27     |
| **P1**  | **Premissa-trigger externa**: Tech Lead humano contratado mês 1                                                                                                                                               | Alta     | Crítico                  | Lead-time alvo **45 dias via 2 canais paralelos**; backup agentic = `Architecture-Agent` com escopo reduzido e revisão adicional                                                                  | Se não cumprida, Sprint 1 técnico segue reduzido; expansão comercial fica `BLOCKED_EXTERNAL`                                                                   | HiringOpsAgent/Architecture-Agent | 2026-04-29     |
| **P2**  | **Premissa-trigger**: Sandboxes Bling/Sankhya provisionados                                                                                                                                                   | Média    | Alto                     | Negociação iniciada Sprint 0; verificação Sprint 0                                                                                                                                                | **NO-GO Fase 1** se não cumprida; plano B = adiar Fase 1 ou priorizar conector com sandbox disponível                                                          | Eng Lead                          | 2026-04-27     |
| **P3**  | **Premissa-trigger externa**: cliente piloto identificado (LOI/contrato/sinal)                                                                                                                                | Alta     | Crítico                  | `CommercialOpsAgent` inicia mês 0; scorecard Sprint 0 mede sinal externo                                                                                                                          | Sem sinal, Fase 1 técnica segue com Mock/Generic REST; ERP real fica `BLOCKED_EXTERNAL`                                                                        | CommercialOpsAgent                | 2026-04-29     |
| **P4**  | **Premissa-trigger**: policy comercial (planos, pricing) calculada até fim Fase 0                                                                                                                             | Média    | Alto                     | `PricingPolicyAgent` aplica margem, LTV/CAC e desconto máximo                                                                                                                                     | Sem policy, bloquear `COMMERCIAL_GA_READY`; manter `TECH_READY`/beta privado                                                                                   | PricingPolicyAgent                | 2026-04-29     |
| **P5**  | **Premissa-trigger**: Spec Relay Cloud security pronto antes de GA do 1º conector com webhook entrante                                                                                                        | Alta     | Crítico                  | Spec multi-AZ + mTLS + HMAC + anti-replay + capacity plan + retenção 5 anos em `docs/integracao/RELAY-CLOUD-SECURITY-SPEC.md` (entrega no fim Fase 0)                                             | Sem evidence pack `Security-Agent` + `SRE-Agent`, bloquear `COMMERCIAL_GA_READY` de conector entrante                                                          | Security-Agent/SRE-Agent          | 2026-04-29     |
| **R18** | **PRÉ-CONDIÇÃO externa**: expansão comercial condicionada a **captação ou linha de crédito formal cobrindo R$ 8M** (~24m de runway com buffer 20% sobre contingência atual).                                  | n/a      | **Bloqueante comercial** | `Finance-Agent` valida evidência (extrato/contrato linha). Sem evidência, aplicar automaticamente plano enxuto; não bloquear chassi técnico.                                                      | PIVOT para `PLANO-ENXUTO-9M-OPCAO.md` (R$ 2–2,5M, 9 meses)                                                                                                     | Finance-Agent                     | 2026-04-29     |
| **R19** | **Stack desktop+SQLite inédita para hub de integração — risco de runtime** (memory leak Electron, IPC backpressure, lock SQLite sob load real)                                                                | Média    | Alto                     | Spike Sprint 0 + telemetria precoce (heap, latência IPC, taxa SQLITE_BUSY) desde Sprint 2; ADR-021 plano B Postgres embarcado pronto                                                              | Migração para Postgres embarcado (SQLite descartado) ou para arquitetura cliente-servidor local (Postgres + serviço Windows)                                   | Tech Lead                         | 2026-04-27     |
| **R20** | **5 dependências externas paralelas** (Tech Lead 45d, LOI/contrato pago, sandbox Bling/Sankhya, cert TOTVS 90–120d, cert SAP 9–18m) — probabilidade composta baixa: 0,8⁵ ≈ **33%** de todas fecharem no prazo | **Alta** | Alto                     | Aceitar **slip Fase 1 de 4–8 semanas como cenário base**, não pessimista; PM reporta status semanal; buffer §5.3 absorve até 4 semanas                                                            | Re-baseline pós-S3 (já previsto §5.3); Fase 1 move para mês 7–8 sem alarme; gate financeiro R18 absorve custo de slip                                          | PM/CFO                            | 2026-04-27     |

**Custo de atraso (CFO-5)**: cada premissa-trigger acima (P1–P5) tem **custo de atraso ~R$ 185–230k/mês** correspondente ao burn da squad enquanto receita não vem. Atrasos compostos em 2+ premissas duplicam esse custo. `Finance-Agent` reporta custo acumulado de atraso no checkpoint agentic mensal junto com status do risco.

**Owners por categoria**:

- **PM** (geral, comerciais e cronograma): R2, R3, R6, R7, R16, R17, **R20**
- **Eng Lead / Tech Lead** (técnicos): R1, R4, R5, R10, R11, R12, R13, R14, R15, **R19**
- **Finance-Agent / Commercial-Agent** (comerciais/financeiros): R9, **R18 (pré-condição)**, R20
- **Jurídico/CISO** (contratuais/regulatórios): R8
- **CISO/SRE** (segurança/operação): P5

---

## 18. Orçamento estimado

### 18.1 Custo de equipe (18 meses) — ENG ONLY

> **Escopo desta seção**: somente engenharia + PM + SRE + QA + Suporte. Headcount comercial (SDR/AE/Sales Sr) está em §18.1.1 budget consolidado.

| Item                                                      | Custo médio mensal | Meses           | Total              |
| --------------------------------------------------------- | ------------------ | --------------- | ------------------ |
| Tech Lead (1 FTE)                                         | R$ 25.000          | 18              | R$ 450.000         |
| Dev Sênior (1 FTE)                                        | R$ 18.000          | 18              | R$ 324.000         |
| Dev Pleno (média 1.5 FTE)                                 | R$ 13.000 × 1.5    | 18              | R$ 351.000         |
| Frontend (0.5 FTE)                                        | R$ 13.000 × 0.5    | 18              | R$ 117.000         |
| Analista Integração ERP (0.5 FTE, mês 7+)                 | R$ 15.000 × 0.5    | 12              | R$ 90.000          |
| PM (0.5 FTE)                                              | R$ 18.000 × 0.5    | 18              | R$ 162.000         |
| SRE (0.3 FTE Fase 0–1, mês 1–6)                           | R$ 22.000 × 0.3    | 6               | R$ 39.600          |
| **SRE (1.0 FTE Fase 2+, mês 7+) — SRE-S3-15**             | R$ 22.000 × 1.0    | 12              | R$ 264.000         |
| QA (0.5 FTE, mês 4+)                                      | R$ 13.000 × 0.5    | 15              | R$ 97.500          |
| Consultor especialista ERP                                | R$ 15.000          | 6 (sob demanda) | R$ 90.000          |
| Suporte/CS (0.3 FTE, mês 6+)                              | R$ 10.000 × 0.3    | 13              | R$ 39.000          |
| **Subtotal equipe (folha bruta)**                         |                    |                 | **R$ 2.024.100**   |
| **Encargos CLT (multiplicador 2,0x sobre folha — CFO-6)** | —                  | 18              | **+ R$ 2.024.100** |
| **Subtotal equipe c/ encargos (2,0x)**                    |                    |                 | **R$ 4.048.200**   |

> **Nota encargos (CFO-6)**: multiplicador **2,0x** adotado (antes 1,8x estava no piso de mercado SP). Inclui 13º + férias + FGTS + INSS patronal + provisão rescisão (~1,5 sal/ano de casa). **Validar com contador antes de Sprint 0**; benchmark mercado 1,9–2,0x é mais conservador. Se contador confirmar 1,8x, sobra ~R$ 360k de buffer.

### 18.1.1 Budget consolidado (incluindo comercial — CFO-2)

| Componente                                                                                                        | Faixa 18 meses  |
| ----------------------------------------------------------------------------------------------------------------- | --------------- |
| Squad eng + encargos 2,0x (§18.1)                                                                                 | R$ 4,05M        |
| Contingência 20% sobre eng (§18.3)                                                                                | R$ 0,81M        |
| Comercial: 2 SDR + 2 AE até mês 6, 4+4 até mês 12, 1 Sales Sr (ver `comercial/PROJECAO-COMERCIAL-RECALIBRADA.md`) | R$ 1,2–1,8M     |
| Infra + sandboxes + certificações + licenças (§18.2)                                                              | R$ 0,4–0,5M     |
| **Total consolidado 18m**                                                                                         | **R$ 4,5–5,8M** |

§18.1 mantida separada como "Eng-only" para clareza interna (squad pode ser cortada sem mexer em comercial e vice-versa).

### 18.2 Custo de infraestrutura e licenças

| Item                                                                                                                   | Estimativa             |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Sandboxes ERP (SAP, NetSuite, Dynamics)                                                                                | R$ 60.000              |
| Certificações (SAP + Microsoft AppSource + Oracle MP)                                                                  | R$ 80.000              |
| Programas de parceria (TOTVS + Senior)                                                                                 | R$ 40.000              |
| **Relay cloud** (multi-AZ, mTLS, HMAC, anti-replay, capacity plan, retenção 5 anos) — Eng-11/SRE-S1-5/SRE-S1-8/CISO-F2 | **R$ 60.000–90.000**   |
| Cloud (OpenTelemetry, marketplace, demais)                                                                             | R$ 24.000              |
| **Code signing cert EV + token HSM + renovação 18m (Rodada 2 — antes R$ 3k subestimado)** — SRE-S1-6/CISO-F6           | R$ 8.000–12.000        |
| **Mutation testing (Stryker) + tempo CI extra** — Eng-8                                                                | R$ 8.000               |
| **War room budget (R9 — concorrente lança hub primeiro)** — CFO-12                                                     | R$ 200.000             |
| Ferramentas (CI, monitoring, segurança, cofre central 1Password Business/Vault)                                        | R$ 35.000              |
| **Subtotal infra**                                                                                                     | **R$ 510.000–540.000** |

### 18.3 Total estimado (reorçado pós-auditoria 5-especialistas)

| Componente                                                                                                                                                | Valor                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Equipe (folha bruta) — §18.1                                                                                                                              | R$ 2.024.100                                  |
| Encargos CLT (2,0x sobre folha — CFO-6)                                                                                                                   | R$ 2.024.100                                  |
| Infraestrutura, sandboxes, certificações, parcerias, relay, code signing, mutation, war room                                                              | R$ 510.000–540.000                            |
| Subtotal                                                                                                                                                  | R$ 4,56–4,59M                                 |
| **Contingência 25% (Rodada 2 — antes 20%; subiu por 5 dependências externas + horizonte 18m + módulo regulatório-fiscal + stack desktop+SQLite inédita)** | R$ ~1,14M                                     |
| **Total Eng-only reorçado v2.3**                                                                                                                          | **R$ ~5,7M em 18 meses** (~R$ 317k/mês médio) |
| Headcount comercial (ver §18.1.1 budget consolidado)                                                                                                      | + R$ 1,2–1,8M                                 |
| **Total consolidado (Eng + Comercial)**                                                                                                                   | **R$ 6,7–7,3M em 18 meses**                   |

> **Versões anteriores**: v2.0 R$ 2,085M (só folha+infra); v2.1 R$ 3,3–4,1M (folha+encargos 1,8x+contingência 15%, eng-only). v2.2 reorça com encargos 2,0x + contingência 20% + relay cloud separado + war room budget + budget consolidado eng+comercial.

### 18.4 Projeção de retorno (reconciliada com §16.4 e PROJECAO-COMERCIAL-RECALIBRADA)

> **Modelo financeiro detalhado (Rodada 2)**: NPV, TIR, simulação Monte Carlo (10k iterações sobre MRR/setup/churn/CAC), análise de sensibilidade tornado e cenários P10/P50/P90 em `docs/integracao/FINANCIAL-MODEL-FULL.md`. As linhas abaixo são a síntese; números completos no modelo.

- **Mês 6**: MRR **R$ 12,5k** (acumulado) — payback parcial mínimo
- **Mês 12**: MRR **R$ 80k** → ARR R$ 960k
- **Mês 18**: MRR **R$ 228k** → ARR **R$ 2,7M** (faixa Pess–Otim: R$ 1,7–3,8M)

**Receita recorrente vs setup fee one-shot (CFO-11)** — sempre separadas:

| Componente                                | 18m acumulado             | Tratamento                                    |
| ----------------------------------------- | ------------------------- | --------------------------------------------- |
| Receita recorrente (MRR×12 = ARR R$ 2,7M) | ~R$ 1,7M acumulado em 18m | Entra em break-even                           |
| Setup fee one-shot                        | R$ 445k acumulado         | **Capital de giro** (não entra em break-even) |
| Serviços profissionais                    | R$ 150k                   | Entra em break-even                           |

**Cálculo de break-even (recalibrado)**:

- Custo mensal médio: ~R$ 305k (Eng-only reorçado v2.2) ou ~R$ 380k (consolidado eng+comercial)
- Receita recorrente acumulada 18m: ~R$ 1,7M
- Custo acumulado 18m: ~R$ 5,5M (Eng) ou ~R$ 6,7–7,3M (consolidado)

**Break-even pós mês 24–26**. Investimento no módulo é **estratégico** (retenção, up-sell, defesa contra churn).

**Sensibilidade — cenário muito-pessimista (CFO-4)**: queda simultânea de **-30% em 2 drivers** (ex.: NPS piloto + conversão demo→piloto, ou MRR + setup fee). Plano de contingência: **redução de squad em 30 dias** se cenário ativado por 1 trimestre seguido. Trigger: caixa projetado <6m runway (R18).

### 18.5 Runway e cash-flow mês a mês (PM-7, CFO-8)

> Tabela **placeholder** de 18 meses para fechar o gap "runway/captação". Modelo financeiro detalhado em `docs/comercial/CASH-FLOW-MODEL.md`.

| Mês    | Gasto (R$k) | Receita (R$k) | Caixa acumulado (R$k) | Necessidade          |
| ------ | ----------- | ------------- | --------------------- | -------------------- |
| 1      | 200         | 0             | -200                  | Aporte/runway        |
| 3      | 250         | 0             | -700                  | Aporte/runway        |
| 6      | 320         | 12            | -1.700                | Aporte/runway        |
| 9      | 350         | 35            | -2.400                | Aporte/runway        |
| **12** | **380**     | **80**        | **-3.000 a -3.200**   | **PICO DE BURN**     |
| 15     | 380         | 150           | -3.100                | Curva começa a virar |
| 18     | 380         | 228           | -2.800                | Em recuperação       |

**Pico de burn estimado mês 12–15** (~R$ 2,5–3,2M acumulados antes da curva virar). Empresa precisa **confirmar runway/linha de crédito que cubra esse pico** antes de iniciar Sprint 1.

**Buffer alvo de runway (Rodada 2): R$ 8M** (custo total ~R$ 6,7–7,3M consolidado + 20% extra de buffer sobre contingência). **Pré-condição Sprint 1** — sem R$ 8M em caixa/crédito confirmado, NO-GO Sprint 1 (R18 reposicionado como pré-condição, não risco).

### 18.X Custo de oportunidade (Rodada 2)

> R$ 7–8M aplicados aqui é capital que **não vai** para outras frentes do produto: hardware (linha própria de balança/indicador), novos verticais (logística, autoatendimento), M&A (aquisição de concorrente regional), expansão geográfica (LATAM).

**`Agent-Orchestrator` revisa trimestralmente** alocação vs alternativas:

- A cada revisão trimestral, `Finance-Agent` apresenta **comparativo** módulo Integração vs próximas 2 alternativas mais ranqueadas no roadmap macro.
- Gatilho de revisão profunda: se módulo Integração ficar 2 trimestres seguidos abaixo de target NSM (renovação 12m <85%) ou OKR de receita, alternativas são reabertas.

**Comparáveis de valuation (corrigidos — Rodada 2)**:

- **Desktop on-prem fiscal local-first (nosso caso)**: 3–6× ARR em rodada/M&A.
- **Descartar referência Celigo/Workato** (10–15× ARR): são SaaS cloud-native multi-tenant, modelo diferente. Comparar com eles infla expectativa de valuation e distorce decisão de investimento.

---

## 19. Próximos passos imediatos

### Semana 1

1. [ ] Gerar decision record deste plano em `docs/auditoria/agentic/`
2. [ ] Alocar subagentes e registrar dependências externas de contratação em `EXTERNAL-DEPENDENCIES.md`
3. [ ] Iniciar contato com TOTVS Partner Program (lead time longo)
4. [ ] Spike DPAPI no Electron (3 dias)
5. [ ] Spike SQLite WAL + outbox throughput (2 dias)

### Semana 2

6. [ ] ADR-001 a ADR-006 publicadas em `docs/adr/`
7. [ ] Cliente piloto técnico identificado para Fase 0
8. [ ] Cliente piloto comercial identificado para Fase 1 (decide Bling vs Sankhya)
9. [ ] Backlog detalhado do Sprint 1
10. [ ] Pipeline CI/CD configurado para `src/integracao/`
11. [ ] Decisão sobre planos comerciais (Standard/Pro/Enterprise) com PM

### Mês 1 fim

12. [ ] Sprint 1 concluído (módulo + tabelas + ADRs + estrutura)
13. [ ] Iniciar negociação Senior Partner Program
14. [ ] Primeira reunião com cliente piloto

### Mês 3 fim (encerramento Fase 0)

15. [ ] Mock Connector + REST Genérico + CSV Genérico + SFTP Genérico em demo
16. [ ] Outbox + retry + DLQ validados — Mock valida arquitetura sob carga; capacidade real por conector publicada em `docs/integracao/CAPACITY.md` após primeiro cliente em produção (SLA comercial não fixa throughput absoluto até medição real pós-S6 H3)
17. [ ] UI básica funcional
18. [ ] **Gate GO Fase 1 (agentic)**: scorecard de `AGENT-GATES-MATRIX.md` calculado; sem sinal comercial externo, Fase 1 técnica segue com Mock/Generic REST e plano enxuto automático.
19. [ ] `Agent-Orchestrator` publica decision record GO/PIVOT/NO-GO para Fase 1

---

## 20. Conclusão executiva

O módulo deve ser tratado como **produto dentro do produto**, com arquitetura, ciclo de vida, monetização e roadmap próprios.

A primeira entrega vendável **não é** "integração com 20 ERPs". É:

> **Solution Ticket Pro com Integration Hub**: API pública versionada, fila resiliente, logs estruturados, retry inteligente, conector REST, conector CSV/XML, dashboard de integração e base para conectores nativos.

Depois disso, conectores ERP entram **por ondas**, sempre guiados por deal fechado, nunca por ranking genérico.

A decisão arquitetural mais importante é não-negociável: **o ERP nunca pode ser dependência síncrona para fechar uma pesagem**. O ticket fecha localmente, o evento é auditado, a integração ocorre em fila, e o suporte rastreia tudo via correlation ID. Esse é o padrão correto para um software desktop, local-first e operacional como o Solution Ticket.

**Investimento (v2.3)**: R$ ~5,7M Eng-only / R$ 6,7–7,3M consolidado em 18 meses (encargos CLT 2,0x + contingência 25% — Rodada 2). **Break-even**: pós mês 24–26 com retenção projetada. **ARR projetado mês 18**: **R$ 2,7M** (faixa Pess–Otim: R$ 1,7–3,8M).

> **Nota**: ROI próprio do módulo é **híbrido** (Rodada 2): **defesa de churn** + **receita standalone fraca** nos 18 primeiros meses. Não é "ROI estratégico puro" — receita standalone existe (R$ 2,7M ARR mês 18), só não é suficiente para break-even. Recuperação plena ocorre ~24–26m.

**Tese de retenção quantificada (Rodada 2)**: módulo defende **~30% da base instalada de churn por integração** (**estimativa, validar em discovery e cohort analysis após mês 12** — não tratar como número final). Sem confirmação em discovery/cohort, tese de retenção é hipótese, não fato.

**Comparáveis de valuation (Rodada 2 — corrigido)**: para **desktop on-prem fiscal local-first**, comparáveis são **3–6× ARR** em rodada/M&A. **Referências Celigo/Workato (10–15× ARR) descartadas** — são SaaS cloud-native multi-tenant, modelo de negócio incompatível com o nosso. Valuation impact entra como **subproduto da retenção** (cliente integrado renova mais), não como receita standalone projetada.

### 20.1 Plano v2.3 — compromisso técnico-financeiro **condicional** (Rodada 2)

Plano v2.3 **não é compromisso unilateral de execução**. É compromisso **condicional** — pré-Sprint-1 requer **7 condições simultâneas**:

1. **Runway R$ 8M confirmado em caixa/crédito** (R18 pré-condição)
2. **Capacidade `Architecture-Agent` disponível**; contratação humana real marcada como dependência externa (P1)
3. **Sinal comercial externo validado**; contrato/escrow ausente aciona plano enxuto, não bloqueia chassi técnico
4. **Threat model revisado pelo `Security-Agent`** (Sprint 0 entregável)
5. **ADR-021 plano B SQLite→Postgres escrita** (Sprint 0 entregável)
6. **Discovery: 15 sinais registrados** com clientes-alvo do ICP (entrevistas, formulários, CRM, suporte ou telemetria)
7. **Decisão 1Password Business vs HashiCorp Vault + MFA hardware** (Sprint 0 entregável)

**Sem 7/7**: Sprint 1 técnico segue apenas se os itens técnicos estiverem verdes; escopo comercial vira `PIVOT` automático para `docs/integracao/PLANO-ENXUTO-9M-OPCAO.md` (R$ 2–2,5M, 9 meses, 1 conector PME `TECH_READY`/`PILOT_READY`; Fases 2–4 viram opcionais por gate de PMF).

A decisão é tomada pelo `Agent-Orchestrator` ao fim do Sprint 0, com decision record e evidência documental de cada uma das 7 condições.

---

## 21. Histórico de auditorias (Rodada 2)

> Tabela consolidada de todas as rodadas de auditoria executadas sobre o módulo Integração ERP, com somatório de findings endereçados.

| Rodada                        | Data       | Composição                                                                                 | Findings emitidos | Findings endereçados (acumulado) | Versão do plano |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------------ | ----------------- | -------------------------------- | --------------- |
| **Rodada 1**                  | 2026-04-26 | 10 agentes (full-stack, security, ops, data, product, finance, legal, qa, ux, sre)         | ~38               | ~38                              | v2.0            |
| **Rodada 2**                  | 2026-04-26 | 10 agentes (re-audit)                                                                      | ~42               | ~80                              | v2.0→v2.1       |
| **Rodada 3**                  | 2026-04-26 | 10 agentes (deep-dive arquitetura)                                                         | ~36               | ~116                             | v2.1            |
| **Rodada 4**                  | 2026-04-27 | 10 agentes (re-audit cross-doc)                                                            | ~30               | ~146                             | v2.1            |
| **Rodada 5**                  | 2026-04-27 | 10 agentes + 5 isolados + 5 especialistas + 5 reauditores (= 25 perspectivas convergentes) | ~48               | ~194                             | v2.1→v2.2       |
| **Rodada 5-Especialistas R1** | 2026-04-27 | 5 especialistas (PM/Eng/SRE/CFO/CISO) — Rodada 1                                           | ~50               | ~244                             | v2.2            |
| **Rodada 5-Especialistas R2** | 2026-04-27 | 5 especialistas (PM/Eng/SRE/CFO/CISO) — **Rodada 2 (atual)**                               | ~54               | **~298**                         | **v2.3**        |
| **Total acumulado**           |            |                                                                                            |                   | **~298 findings endereçados**    |                 |

> **Localização dos artefatos**: `docs/auditoria/` (auditorias 10-agentes), `docs/auditoria/historico/` (auditorias arquivadas), `docs/auditoria/SNAPSHOT-FINAL-2026-04-27.md` (overview consolidado).
>
> **Política de auditoria contínua**: a partir da v2.3, o módulo entra em **regime de auditoria periódica**: a cada release (canary → stable) executar mini-rodada de 5 especialistas focada no delta. Rodadas completas (10+ agentes) ao fim de cada fase ou trimestralmente, o que vier primeiro.

---

## Anexos

- **Referência técnica completa**: `docs/GUIA-INTEGRACAO-ERP.md`
- **ADRs**: `docs/adr/` (a criar a partir do Sprint 0)
- **Documentação técnica**: `docs/integracao/` (a criar a partir do Sprint 0)
- **Contratos por ERP**: `docs/integracao/contratos/<erp>.md` (1 por conector)
- **Templates de mapping**: `docs/integracao/templates/<erp>-mapping.yaml`

---

**Decision record agentic**:

- [ ] `Agent-Orchestrator`
- [ ] `Architecture-Agent`
- [ ] `Security-Agent`
- [ ] `Finance-Agent` quando houver impacto comercial/financeiro

---

**Histórico**:

- v2.4 — 2026-04-29 — Conversão agent-first: adicionado modelo operacional agentic, matriz de gates, manifest de evidências, dependências externas não bloqueantes, discovery blockers e separação `TECH_READY`/`PILOT_READY`/`COMMERCIAL_GA_READY`.
- v2.3 — 2026-04-27 — **Rodada 2 da auditoria 5-especialistas (PM/Eng/SRE/CFO/CISO)** — ~54 findings endereçados: NSM trocada para "% renovação 12m ≥85%" + counter-metric "horas/mês economizadas ≥40h" (latência ≤5min vira SLI técnico); §1.6 Plano Enxuto 9m como alternativa formal; §1.7 política branch/PR exceção ao CLAUDE.md (PR obrigatório a partir Sprint 1 no chassi); §4.1 SRE Fase 0 0,3→0,6 + CRO 0,3 (Fase 0) → 1,0 (Fase 2+); Sprint 0 com threat model revisado CISO + ADR-021/022 + multi-user Windows + 1Password vs Vault + 15 entrevistas discovery; §6.5 fingerprint OAuth dissociado do RSA; Mapping Engine 2 sprints meta + 2 sprints buffer (4–7 banda); §12.2 dual control com WebAuthn + payload cru com janela 30min; §13 Etapa 5 DPO + RoPA + processo direitos titular SLA 7d; Etapa 6 GA com SBOM + scan licenças + DPIA assinada DPO; §15.4 backup off-machine + feature flags runtime + capacity sintético Sprint 5 + cobertura progressiva; §15.5 chaos mensal Fase 2-3; §15.6 tabletop semestral executivo + seguro cyber + post-mortem 14d Sev2-3; OKR Q3/26 KR3 = 1 contrato pago não-reembolsável (LOI fora); §17 R18→pré-condição R$ 8M, R3 SAP 9-18m, +R19 stack inédita, +R20 dependências compostas 33%; §18.2 code signing R$ 8-12k EV+HSM; contingência 25%; runway R$ 8M; FINANCIAL-MODEL-FULL link; §18.X custo de oportunidade + comparáveis 3-6× ARR (descartar Celigo/Workato); §20 ROI híbrido + 7 pré-condições Sprint 1 ou pivot Plano Enxuto; §21 histórico de auditorias (~298 findings acumulados).
- v2.2 — 2026-04-27 — Rodada 1 da auditoria 5-especialistas — ~50 findings (ver entrada anterior abaixo).
- v1.0 — 2026-04-26 — versão inicial
- v2.0 — 2026-04-26 — consolidada com segunda análise: adicionado Mock Connector, playbook universal de 6 etapas, backlog por épicos, especificações operacionais detalhadas (tabelas/permissões/endpoints/telas), ordem rígida de implementação, métricas operacionais técnicas absolutas, ondas de conectores, piloto único antes de paralelizar PME
- v2.2 — 2026-04-27 — **Rodada de auditoria 5-especialistas (PM/Eng/SRE/CFO/CISO)** — ~50 findings endereçados: §1.5 ICP definido; O3 com SLO 99,9% + error budget; NSM counter-metric; OKR Q3/26 KR3 = 2 LOIs + 1 contrato pago; Tech Lead 45d via 2 canais; CSV/SFTP movidos para Onda 1 Fase 1; Mapping Engine 2 sprints (4–5); Sprint 0 spike SQLite 5 dias; keytar como opção 1 ao lado DPAPI; SAP/Dynamics ordem invertida; Stryker mutation testing; Prisma migrations formais a partir Sprint 1; relay cloud orçado separado R$ 60–90k; SLO+error budget gate de GA; on-call gate GA; backup SQLite RPO 1h/RTO 30min; code signing + auto-update + canary bloqueador GA; load-test 24h pré-GA; DPIA por conector gate homologação; hash chain + cold storage 5 anos; chaos engineering trimestral; cofre central secrets; matriz Sev1–Sev4 + ANPD 72h; SRE 0,3→1,0 FTE Fase 2+; change management Tier-1 com PR mandatório; budget consolidado eng+comercial R$ 4,5–5,8M; encargos 2,0x; contingência 20%; §18.5 runway/cash-flow + R18 caixa; re-pricing Tier-1 antes Fase 2; sensibilidade muito-pessimista; setup fee separado; war room budget R$ 200k; rotação DPAPI ≤90d/≤180d; PKCE + binding fingerprint; dual control fiscal + payload mascarado/cru; rate-limit/escopo OAuth/TLS/payload max API pública; threat model STRIDE+LINDDUN entregável Sprint 0; cert ERP obrigações contínuas matriz; ADRs 017–022; §14.3.1 Continuous Discovery 4–6 entrevistas/mês.
- v2.1 — 2026-04-27 — Reconciliação cross-doc após auditoria 5-isolados: §16.4/§18.4/§20 alinhados com PROJECAO-COMERCIAL-RECALIBRADA (MRR mês 6 R$ 12,5k, mês 18 R$ 228k, ARR mês 18 R$ 2,7M, break-even pós mês 18); §16.3+§7.5 com 1–2 conectores PME GA mês 6 e 10 clientes; §5.3 CPM com dependências externas (Tech Lead, sandboxes, LOI, certs); §4.1 gaps de headcount explicitados; §2.1 premissas convertidas em riscos-trigger com plano B; Sprint 0 com gate formal de piloto (≥2 LOIs/1 contrato/60d buffer); DoD único de cobertura (≥80% linhas + ≥90% críticos + mutation ≥60% + TCK 100% + contract); CAPACITY disclaimer ("SLA não fixa throughput até medição real pós-S6 H3"); OKR Q4/26 MRR R$ 3–5k (R$ 12,5k movido Q1/27); §3.1 convertida em DAG; R3 Alta/Crítico, R7 Crítico c/ bus factor; GA fiscal ≥1 mês fiscal fechado; DPAPI fallback referenciando ADR-016; orçamento reorçado R$ 2,8–4,1M com encargos+contingência.
