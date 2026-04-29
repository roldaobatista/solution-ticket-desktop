# Backlog Detalhado — Sprints 9, 10, 11 (Conclusão Fase 1)

**Sprints**: 9, 10, 11 — Fase 1 — semanas 19–24 (mês 5–6)
**Objetivo**: GA do Bling + 4 conectores PME paralelos + 5 conectores PME publicados ao fim da Fase 1

**Pré-requisitos**: Sprints 6-7-8 (Bling em modo sombra)

> **DoR e DoD por history**: ver `BACKLOG-SPRINT-0-1.md` (blocos no topo). Aplicam-se a todas as histórias destes 3 sprints.
> **Estratégia de testes**: ver `ESTRATEGIA-TESTES.md`.
> **Drill DR mensal** + **pentest DAST sem high** são DoD por sprint contínuo a partir do Sprint 8.

---

## Visão dos 3 sprints

| Sprint | Foco                                | Entrega                                             |
| ------ | ----------------------------------- | --------------------------------------------------- |
| **9**  | Modo Ativo Bling + GA + início Omie | Bling em produção definitiva; Omie em implementação |
| **10** | GA Omie + ContaAzul em paralelo     | 3 conectores publicados                             |
| **11** | GA ContaAzul + Tiny + Sankhya       | **5 conectores PME publicados**                     |

---

## Sprint 9 — GA Bling + início Omie (semanas 19–20)

### S9-01 — Modo Ativo Bling (H5 semana 2)

**Critérios de aceite**:

- [ ] Cliente piloto desliga processo antigo
- [ ] ST é única fonte de envio ao Bling produção
- [ ] Acompanhamento intensivo por telemetria/relatório diário
- [ ] 14 dias consecutivos sem P0/P1
- [ ] Relatório de aceite agentico final gerado
- [ ] Bling marcado como **PILOT_READY** ou **COMMERCIAL_GA_READY** conforme `EXTERNAL-DEPENDENCIES.md`

**Estimativa**: 5 pontos
**Responsável**: Dev + PM + Cliente

---

### S9-02 — Liberação Bling para venda

**Critérios de aceite**:

- [ ] Conector publicado no portal
- [ ] Página no site solution-ticket.com/conectores/bling
- [ ] Sales liberado para vender
- [ ] Inside sales treinado (1h)
- [ ] Material comercial pronto

**Estimativa**: 3 pontos
**Responsável**: PM + Marketing

---

### S9-03 — Discovery + Implementação Omie

**Critérios de aceite**:

- [ ] `docs/integracao/contratos/omie.md` Discovery completo
- [ ] `OmieConnector` implementando `IErpConnector`
- [ ] Auth: chave + segredo da app Omie
- [ ] Suporte JSON API + SOAP fallback
- [ ] Mapping `omie-default.yaml` versionado
- [ ] Cobertura ≥ 80%

**Estimativa**: 13 pontos
**Responsável**: Dev Sênior + Analista ERP

---

### S9-04 — Webhook Omie via relay

**Critérios de aceite**:

- [ ] Worker do relay aceita endpoint Omie
- [ ] Validação de assinatura Omie (app_secret)
- [ ] Eventos `cliente.alterado`, `produto.alterado`, `pedido.alterado` consumidos
- [ ] Testes e2e com webhook simulado

**Estimativa**: 5 pontos
**Responsável**: Dev Pleno + SRE

---

### S9-05 — H1 + H2 Omie em sandbox

**Critérios de aceite**:

- [ ] 16 cenários H1 passando
- [ ] 16 cenários H2 passando
- [ ] Relatórios atualizados

**Estimativa**: 5 pontos
**Responsável**: QA + Dev

---

### DoD Sprint 9

- [ ] DoD por history cumprida em todas as histórias
- [ ] Bling em GA, primeira venda fechada
- [ ] Omie em sandbox passando H1+H2 (TCK ≥ 90%)
- [ ] **Contract test verde** Hub↔Omie
- [ ] **Drill DR mensal registrado** (failover)
- [ ] **DAST sem high** em todo o módulo + relay
- [ ] 5 clientes Bling Pro ativos
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-9/`**

**Story points**: 31

---

## Sprint 10 — GA Omie + ContaAzul (semanas 21–22)

### S10-01 — Setup cliente piloto Omie + H4

**Critérios de aceite**:

- [ ] Cliente piloto Omie instalado em pré-produção
- [ ] H4 executado (10 cenários)
- [ ] 100 pesagens reais sem perda
- [ ] Evidence pack de H4 anexado; termo de aceite real, se existir, registrado como dependência externa

**Estimativa**: 8 pontos
**Responsável**: PM + QA + Cliente

---

### S10-02 — Modo Sombra + GA Omie

**Critérios de aceite**:

- [ ] 7 dias modo sombra estável
- [ ] 14 dias modo ativo sem P0/P1
- [ ] Conector marcado GA
- [ ] Sales liberado

**Estimativa**: 5 pontos
**Responsável**: Dev + PM

---

### S10-03 — Implementação ContaAzul

**Critérios de aceite**:

- [ ] Discovery + contrato técnico
- [ ] `ContaAzulConnector` (OAuth 2.0 + PKCE)
- [ ] Mapping default
- [ ] H1 + H2 sandbox passando
- [ ] Cobertura ≥ 80%

**Estimativa**: 10 pontos
**Responsável**: Dev Pleno (reusa muita coisa de Bling)

---

### S10-04 — Refinamento de Mock Connector

**Critérios de aceite**:

- [ ] Adicionar 4 cenários novos descobertos durante Bling/Omie
- [ ] Testes parametrizados
- [ ] Documentação atualizada

**Estimativa**: 3 pontos
**Responsável**: Dev Pleno

---

### S10-05 — Métricas comerciais Fase 1

**Critérios de aceite**:

- [ ] Dashboard com vendas + clientes ativos por conector
- [ ] Análise de pipeline da Fase 1
- [ ] `Agent-Orchestrator` publica decision record para Fase 2 (TOTVS)

**Estimativa**: 3 pontos
**Responsável**: `CommercialOpsAgent` + `Agent-Orchestrator`

---

### DoD Sprint 10

- [ ] DoD por history cumprida em todas as histórias
- [ ] Bling + Omie publicados (TCK 100% ambos, contract verde)
- [ ] ContaAzul em homologação (TCK ≥ 90%)
- [ ] **Drill DR mensal registrado**
- [ ] **DAST sem high**
- [ ] 10 clientes ativos
- [ ] Decisão Fase 2 confirmada
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-10/`**

**Story points**: 29

---

## Sprint 11 — ContaAzul GA + Tiny + Sankhya (semanas 23–24)

### S11-01 — H4 + H5 ContaAzul + GA

**Critérios de aceite**:

- [ ] Homologação assistida com cliente piloto
- [ ] Modo sombra + ativo
- [ ] GA atingido

**Estimativa**: 8 pontos
**Responsável**: QA + Dev + PM

---

### S11-02 — Implementação Tiny ERP

**Critérios de aceite**:

- [ ] `TinyConnector` (REST simples, base PME)
- [ ] Mapping default
- [ ] H1 + H2 + H4 + GA
- [ ] Cobertura ≥ 80%

**Estimativa**: 13 pontos
**Responsável**: Dev Sênior

---

### S11-03 — Sankhya — Discovery profundo

**Critérios de aceite**:

- [ ] Parceria Sankhya formalizada
- [ ] Sandbox Sankhya disponível
- [ ] Discovery completo (`docs/integracao/contratos/sankhya.md` v2)
- [ ] Cliente piloto Sankhya identificado

**Estimativa**: 8 pontos
**Responsável**: PM + Analista ERP

---

### S11-04 — Implementação Sankhya inicial

**Critérios de aceite**:

- [ ] `SankhyaConnector` esqueleto
- [ ] Auth JWT + relogin
- [ ] CRUDServiceProvider client
- [ ] H1 sandbox passando

**Estimativa**: 13 pontos
**Responsável**: Dev Sênior

---

### S11-05 — Retrospectiva Fase 1

**Critérios de aceite**:

- [ ] Retrospectiva de 6 meses documentada
- [ ] Análise quantitativa: features entregues, bugs, throughput, NPS
- [ ] Lições aprendidas atualizam playbook
- [ ] `Agent-Orchestrator` publica GO/PIVOT/NO-GO Fase 2

**Estimativa**: 3 pontos
**Responsável**: Tech Lead + PM

---

### DoD Sprint 11 (e da Fase 1 completa)

- [ ] DoD por history cumprida em todas as histórias
- [ ] **5 conectores PME publicados** (Bling, Omie, ContaAzul, Tiny, +1) — TCK 100% + contract verde em cada
- [ ] **Drill DR mensal registrado**
- [ ] **DAST sem high** consolidado da Fase 1
- [ ] **Bug bash interno** executado (preparação bug bounty Sprint 12+)
- [ ] 15 clientes ativos
- [ ] MRR R$ 30k+
- [ ] Sankhya em implementação ativa para Fase 2
- [ ] Retrospectiva publicada
- [ ] **Decision record GO/PIVOT/NO-GO Fase 2 publicado pelo `Agent-Orchestrator`**
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-11/`**

**Story points**: 45 (alto — Sprint final da fase)

---

## Capacity (média Sprints 9–11)

| Recurso      | Disponibilidade               |
| ------------ | ----------------------------- |
| Tech Lead    | 30%                           |
| Dev Sênior   | 100%                          |
| Dev Pleno    | 100%                          |
| Dev Pleno #2 | entra no Sprint 11            |
| SRE          | 30%                           |
| QA           | 100%                          |
| PM           | 70% (vendas + cliente piloto) |
| Analista ERP | 50% (Discovery Sankhya/TOTVS) |
| Suporte/CS   | entra Sprint 9 (30%)          |

---

## Riscos da Fase 1 final

| Risco                                     | Mitigação                   |
| ----------------------------------------- | --------------------------- |
| Sankhya parceria atrasa                   | Avançar Tiny primeiro       |
| Cliente piloto Bling/Omie cancela         | Backup identificado         |
| 3 conectores em paralelo geram retrabalho | Dev #2 entra Sprint 11      |
| GA escorrega para Sprint 12               | Aceitar — qualidade > prazo |

---

## Próximas fases (preview)

### Fase 2 — Brasil Tier-1 (mês 7–10)

- Sprint 12–14: TOTVS Protheus
- Sprint 15: Senior G7
- Sprint 16: TOTVS RM
- Sprint 17: TOTVS Datasul
- Início programa parceria TOTVS finalizado

### Fase 3 — Global Tier-1 (mês 11–14)

- SAP S/4HANA → Dynamics 365 → NetSuite → Oracle Fusion
