# Replanejamento de Story Points (Pós-Auditoria)

**Versão**: 1.1 — 2026-04-27
**Resolve**: CRITICAL C6 da auditoria 10-agentes; Auditoria R5 Agente 6 (buffer 0%, sprints provisórios)
**Aplicável a**: Sprints 1 a 8

---

## v1.1 — Buffer de imprevistos 15% e re-baseline

> Adicionado em resposta à Auditoria R5 Agente 6: "buffer de imprevistos = 0%, somas batem exatas no teto" + "velocity teto sem dado histórico (calibrado em 1 sprint)".

### Regras do buffer

1. **Teto efetivo de planejamento = teto velocity × 0,85** (15% buffer).
   - Sprint 1–5: 25 × 0,85 = **21 pts máximo planejado** (era 25)
   - Sprint 6+: 30 × 0,85 = **25 pts máximo planejado** (era 30)
2. **Buffer absorve**: bugs de produção, code review além do esperado, refactor decorrente de spike, retrabalho de QA, sprint-zero implícito de novo membro.
3. **Buffer não vira escopo extra** se o sprint andar bem — sobra vai para débito técnico, documentação, ou começa próximo sprint adiantado.

### Regra de corte automático Should/Could

> **Se velocity real S2–S3 < 20 pts (média rolling 2 sprints), S5+ corta Should/Could automaticamente até atingir 80% do teto efetivo (≤17 pts planejados em sprints de 21).**

Operacional:

- PM mede velocity real fim de cada sprint
- Após Sprint 3, calcula média S2+S3
- Se < 20 pts: backlog do Sprint 5 é automaticamente revisado pelo Tech Lead, removendo Should e Could até teto = 80% × 21 = ~17 pts
- Decisão **não vai a steering** — é gatilho automático para evitar planejamento aspiracional

### Re-baseline obrigatório após Sprint 3

- Sprints 2–4 marcados como **PROVISÓRIOS** (sujeitos a re-planejamento após dado real)
- Após Sprint 3 fechar, PM + Tech Lead recalculam velocity rolling 3 sprints (S1+S2+S3)
- Novo teto = média × 1,1 (10% acima da média real)
- Sprints 4–8 são **re-planejados** com teto novo + buffer 15%
- Re-baseline registrado em `docs/integracao/REBASELINE-S3.md` (a criar)

---

## Diagnóstico

Auditor PM identificou: capacity = 22 pts (validado em Sprint 1), mas sprints subsequentes foram planejados com 29 → 35 → 43 → **58** → 42 → 47 pts. Mesma equipe, mesma estrutura — story points triplicaram sem justificativa.

**Causa raiz**: planejamento aspiracional, não baseado em velocity real. PM lista todas as histórias "necessárias" e empurra para o sprint sem cortar.

---

## Princípios do replanejamento

1. **Velocity teto até Sprint 5**: 25 pts/sprint (10% acima do baseline de 22)
2. **Velocity teto a partir de Sprint 6**: 30 pts/sprint (com Dev Pleno #2 entrando)
3. **Frontend só entra com folga**: não jogar 32 pts de UI no último sprint da fase
4. **MoSCoW obrigatório**: cada história marcada Must/Should/Could
5. **Could = stretch**: sprint sem ele ainda fecha o DoD
6. **Não escorregar 4 sprints à frente** — mover histórias prontas para sprint imediatamente seguinte

---

## Replanejamento aplicado

### Sprint 1 — banco e módulo

**Original**: 22 pts (calibrado, manter)

**Sem mudança.**

---

### Sprint 2 — eventos e outbox **[PROVISÓRIO — re-baseline após S3]**

**Original**: 29 pts (acima do velocity) | **v1.0**: 23 pts | **v1.1 (buffer 15%)**: **21 pts**

| História                                      | Pts | Status                              |
| --------------------------------------------- | --- | ----------------------------------- |
| S2-01 IntegrationEventFactoryService          | 3   | Must                                |
| S2-02 DomainEventListenerService              | 3   | Must                                |
| S2-03 OutboxService.enqueue transacional      | 5   | Must                                |
| S2-04 QueueWorkerService com lock             | 8   | Must                                |
| S2-05 Cálculo idempotencyKey                  | 2   | Must                                |
| ~~S2-06 Testes concorrência (estavam 2 pts)~~ | —   | **Movido S3** (Should — buffer 15%) |
| ~~S2-07 Métricas Prometheus~~                 | —   | **Movido S3** (era Could)           |

**Total: 21 pts (Must apenas)**. Buffer 4 pts (de 25) absorve imprevistos.

---

### Sprint 3 — logs, retry e Mock **[PROVISÓRIO — re-baseline obrigatório no fim]**

**Original**: 35 pts | **v1.0**: 25 pts | **v1.1 (buffer 15%)**: **21 pts**

| História                                 | Pts | Status                           |
| ---------------------------------------- | --- | -------------------------------- |
| S3-01 RetryPolicyService                 | 3   | Must                             |
| S3-02 DeadLetterService                  | 5   | Must                             |
| S3-03 Mascaramento payload               | 5   | Must                             |
| S3-04 MockErpConnector                   | 8   | Must                             |
| ~~S3-05 Testes e2e~~                     | —   | **Movido S4** (Must, mas couber) |
| ~~S3-06 Recovery órfãos~~                | —   | **Movido S4**                    |
| ~~S3-07 Logs estruturados Pino~~         | —   | **Movido S5**                    |
| ~~S2-06 Testes concorrência (vindo S2)~~ | —   | **Movido S4**                    |
| ~~S2-07 Métricas (vindo S2)~~            | —   | **Backlog futuro** (Could)       |

**Total: 21 pts (Must apenas)**. Buffer 4 pts.

> **GATE PÓS-S3**: PM + Tech Lead executam re-baseline obrigatório. Sprints 4–8 abaixo são **provisórios até esse re-baseline**.

---

### Sprint 4 — modelo canônico + mapping **[PROVISÓRIO — re-baseline obrigatório após S3]**

**Original**: 43 pts | **v1.0**: 25 pts | **v1.1 (buffer 15%)**: **21 pts**

| História                          | Pts                              | Status                 |
| --------------------------------- | -------------------------------- | ---------------------- |
| S4-01 8 schemas canônicos v1      | 5 (5 schemas iniciais, resto S5) | Must                   |
| S4-02 MappingEngineService        | 8 (5 transformações iniciais)    | Must                   |
| S4-03 Parser/validador YAML       | 3                                | Must                   |
| S4-05 ValidationService pré-envio | 3                                | Must                   |
| S2-06 Testes concorrência (vindo) | 2                                | Must                   |
| ~~S4-07 Helper unit conversion~~  | —                                | **Movido S5** (Should) |
| ~~S3-05 Testes e2e (vindo)~~      | —                                | **Movido S5** (Must)   |
| ~~S3-06 Recovery órfãos (vindo)~~ | —                                | **Movido S5**          |
| ~~S4-04 EquivalenceTableService~~ | —                                | **S6**                 |
| ~~S4-06 Testes matriz~~           | —                                | **S6**                 |

**Total: 21 pts (Must apenas)**. Buffer 4 pts.

---

### Sprint 5 — conectores genéricos + API + UI

**Original**: 58 pts | **v1.0**: 28 pts | **v1.1 (buffer 15%)**: **21 pts**

> Aplicação da regra de corte automático: se velocity real S2–S3 < 20 pts, este teto cai automaticamente para 17 pts (corte de Should/Could pelo Tech Lead, sem ir a steering).

| História                                  | Pts                      | Status                                    |
| ----------------------------------------- | ------------------------ | ----------------------------------------- |
| S5-01 GenericRestConnector                | 8                        | Must                                      |
| S5-02 GenericCsvXmlConnector              | 3 (só CSV)               | Must                                      |
| S5-04 PublicIntegrationController v1      | 5 (endpoints essenciais) | Must                                      |
| S5-05 Tela Conectores básica              | 5 (listar + criar)       | Must                                      |
| ~~S5-06 Tela Eventos básica~~             | —                        | **Movido S6** (Should)                    |
| ~~S5-09 Demo cliente piloto (era 2 pts)~~ | —                        | **Reagendado mês 6** (não é story de dev) |
| ~~S4-04 EquivalenceTable (vindo)~~        | —                        | **S6**                                    |
| ~~S4-07 Helper unit conversion (vindo)~~  | —                        | **S6** (Should)                           |
| ~~S3-05 Testes e2e (vindo)~~              | —                        | **S6**                                    |
| ~~S3-06 Recovery órfãos (vindo)~~         | —                        | **S6**                                    |
| ~~S3-07 Logs Pino (vindo)~~               | —                        | **S6**                                    |

**Total: 21 pts (Must apenas)**. Buffer 4 pts.

> **Nota Fase 0**: ao trazer teto de 28 → 21, fechamento de Fase 0 escorrega ~1 sprint (mês 3 → mês 4 fim). Trade-off aceito: previsibilidade > velocidade aspiracional. Re-baseline pós-S3 pode reverter parcialmente.

---

## Impacto no plano

### Fase 0 termina em Sprint 5 (mês 3) com:

- ✅ Mock Connector + REST genérico + CSV genérico
- ✅ Outbox + retry + DLQ + recovery
- ✅ Mapping engine (5 transformações iniciais)
- ✅ API pública v1 (endpoints essenciais)
- ✅ UI básica (Conectores + Eventos)
- ✅ Demo cliente piloto técnico
- ❌ SFTP genérico (vai para Sprint 6)
- ❌ Tela de Mapeamento (vai para Sprint 6)
- ❌ Reconciliação (vai para Sprint 6)
- ❌ Mapping engine completo (4 transformações restantes — Sprint 6)

### Sprint 6 (Fase 1) absorve carry-over (~15 pts) + Discovery Bling

- Capacity de 30 pts (Dev Pleno #2 entra)
- Carry-over: 15 pts
- Discovery + implementação Bling: 13 pts (S6-01 + parte do S6-02)
- Total: 28 pts ✅ dentro do teto

### Aposta realista

- Fase 0 termina **mês 3** ✅ (vs anteriormente Aposta era escorregar para mês 4)
- Bling GA **mês 5** (mantido)
- Restante segue plano original

---

## Critério de "história Must vs Should vs Could"

**Must**: sem ela, DoD do sprint não fecha. Cliente piloto não consegue usar a feature.
**Should**: melhora MUITO mas não bloqueia. Pode escorregar 1 sprint sem dano.
**Could**: stretch goal. Se não couber, não vira "não-feito" — vira backlog futuro.

---

## DoR (Definition of Ready) — formal e versionada

> **Fonte canônica**: bloco "Definition of Ready (DoR)" no topo de [`BACKLOG-SPRINT-0-1.md`](./BACKLOG-SPRINT-0-1.md). Aplica-se a todos os sprints do módulo (S0 → S11+). Auditoria R5 (Agentes 5 e 6) marcou DoR como gate obrigatório, e movimentou-a do status "adicionar ao processo" para **vigente desde Sprint 0**.

Resumo dos 5 critérios obrigatórios (detalhe em `BACKLOG-SPRINT-0-1.md`):

- [ ] (a) **Critério de aceite testável** (mensurável, observável)
- [ ] (b) **Massa de teste identificada** (ver `ESTRATEGIA-TESTES.md` §6)
- [ ] (c) **Sandbox / mock disponível** (sandbox externo testado nos últimos 7 dias OU Mock Connector)
- [ ] (d) **Dependências mapeadas** (técnicas, squad, externas — ERP, jurídico, sec)
- [ ] (e) **Story points consensuados** por ≥ 2 devs (planning poker)

Critérios complementares (não bloqueiam DoR, preenchidos no grooming):

- User story escrita (Como/Quero/Para)
- Mockup (se UI)
- Endpoint contract (se API)
- MoSCoW marcado (Must/Should/Could)

PO (Tech Lead/PM) **recusa** história sem DoR. **DoD por history** + **DoD por sprint** estão em `BACKLOG-SPRINT-0-1.md` e nos backlogs de cada sprint, com gates progressivos: TCK%, contract test (Pact), drill DR (a partir de Sprint 6), pentest DAST sem high (a partir de Sprint 8).

---

## Próximos passos

1. PM revisa este replanejamento e aprova
2. Atualizar `BACKLOG-SPRINT-2.md` a `BACKLOG-SPRINT-5.md` com novos pontos
3. ✅ DoR formalizada (vigente desde S0; fonte canônica em `BACKLOG-SPRINT-0-1.md`)
4. Re-baseline velocity após Sprint 3 (3 sprints rolling)
