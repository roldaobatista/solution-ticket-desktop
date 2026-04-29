# Matriz de Gates Agenticos — Modulo Integracao ERP

**Status:** canonica  
**Precedencia:** quando houver conflito, esta matriz e `AGENTIC-EXECUTION-OPERATING-MODEL.md` prevalecem sobre gates humanos nos demais documentos.

---

## 1. Estados padronizados

| Estado                | Uso                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------ |
| `READY_FOR_AGENT`     | tarefa tem contexto, criterio, arquivos e testes suficientes para subagente executar |
| `BLOCKED_EVIDENCE`    | falta evidencia tecnica verificavel                                                  |
| `BLOCKED_EXTERNAL`    | depende de parte externa; engenharia segue com mock/fallback                         |
| `TECH_READY`          | pronto tecnicamente, sem depender de contrato/assinatura/comercial                   |
| `PILOT_READY`         | pronto para piloto/sombra com evidencias operacionais                                |
| `COMMERCIAL_GA_READY` | pronto para venda conforme policy comercial automatica                               |
| `PIVOT`               | thresholds falharam, plano reduzido e executavel e escolhido automaticamente         |
| `NO_GO`               | criterio bloqueante tecnico falhou e nao ha fallback seguro                          |

---

## 2. Matriz de conversao

| Gate legado                                     | Fonte principal                                       | Gate agentico                                                                                                                                                             | Artefato exigido                                                           |
| ----------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Steering decide plano completo vs enxuto        | `PLANO-MODULO-INTEGRACAO.md`, `STOP-LOSS-PROTOCOL.md` | `Agent-Orchestrator` aplica scorecard: runway, sinais comerciais, capacidade tecnica, risco. Se faltar contrato/escrow ate Sprint 0, aplica automaticamente plano enxuto. | `docs/auditoria/agentic/<data>-phase-plan-decision.md`                     |
| Gate Sprint 0 -> Fase 1 com LOI/contrato/buffer | `PLANO-MODULO-INTEGRACAO.md`                          | Engenharia segue se `TECH_READY`; conector real so prioriza ERP com sinal comercial. Sem sinal, usar Mock + Generic REST.                                                 | `docs/comercial/evidence/<data>-demand-score.md`                           |
| Tech Lead contratado                            | `RUNWAY-DEPENDENCIES-EXTERNAL.md`                     | `Architecture-Agent` disponivel sob demanda. Ausencia de pessoa real reduz escopo, nao bloqueia Sprint 1.                                                                 | parecer de arquitetura + review de ADR                                     |
| ADRs aprovadas                                  | backlogs e plano                                      | ADR publicada + review `Architecture-Agent` + checagem de links                                                                                                           | `docs/auditoria/agentic/<data>-adr-review.md`                              |
| CISO assina threat model                        | `THREAT-MODEL-INTEGRACAO.md`                          | `Security-Agent` revisa STRIDE/LINDDUN + SAST/DAST/secret scan sem critical/high nao tratados                                                                             | `security-review.md`, `semgrep.sarif`, `gitleaks.sarif`, `zap-report.html` |
| DPO assina DPIA                                 | plano e legal                                         | `LGPD-Legal-Agent` gera DPIA, ROPA, matriz de retencao, transferencia internacional e riscos residuais                                                                    | pacote em `docs/legal/evidence/`                                           |
| CFO/CEO aprovam pricing                         | plano e comercial                                     | `PricingPolicyAgent` aplica policy-as-code: margem minima, LTV/CAC, desconto maximo e payback                                                                             | `docs/comercial/evidence/<data>-pricing-policy.md`                         |
| CEO sem limite de desconto                      | `PLANO-COMERCIAL.md`                                  | excecao proibida; desconto acima da policy vira `BLOCKED_EVIDENCE` ate nova regra numerica versionada                                                                     | policy atualizada                                                          |
| Cliente assina termo de aceite                  | homologacao/templates                                 | `TECH_READY` ou `PILOT_READY` por evidencias H1-H5; aceite comercial e dependencia externa separada                                                                       | relatorio de homologacao + telemetria                                      |
| 2 aprovadores em operacao fiscal                | permissoes/WebAuthn                                   | produto usa dual-control criptografico quando houver usuarios reais; em pre-producao, dois reviewers agenticos independentes                                              | audit trail ou dois reviews                                                |
| Code review humano                              | backlogs/ADR-022                                      | spec reviewer + quality reviewer agenticos, com diff e checklist                                                                                                          | `review-spec.md`, `review-quality.md`                                      |
| Reuniao de incidentes/tabletop                  | plano                                                 | `Incident-Agent` executa protocolo agentico e gera timeline                                                                                                               | `docs/integracao/incidentes/*`                                             |
| Revisao trimestral de RICE/roadmap              | `RICE-PRIORITIZATION.md`                              | `Commercial-Agent` recalcula RICE com fontes e pesos fixos; top 3 muda se diferenca passar limiar                                                                         | `docs/comercial/evidence/<data>-rice.md`                                   |
| Discovery por entrevistas PM                    | `DISCOVERY-CADENCE.md`                                | `DiscoveryResearchAgent` coleta formularios, transcricoes, CRM, suporte e telemetria; entrevistas sincronas sao opcionais                                                 | `DISCOVERY-LOG.md` atualizado                                              |
| Certificacao/parceria ERP                       | contratos/runway                                      | `PartnerOpsAgent` acompanha portal e sandbox; se ausente, conector fica `TECH_READY` com mock/sandbox e nao `COMMERCIAL_GA_READY`                                         | `EXTERNAL-DEPENDENCIES.md`                                                 |

---

## 3. Scorecard GO/PIVOT/NO-GO de fase

| Dimensao    | GO                                                                          | PIVOT                                            | NO-GO                                           |
| ----------- | --------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Tecnica     | CI verde, TCK/contract/cobertura conforme sprint, sem critical/high aberto  | ate 1 high com mitigacao e tarefa datada         | critical sem mitigacao ou perda fiscal possivel |
| Produto     | ICP/RICE atualizado, backlog executavel, discovery ou telemetria suficiente | discovery incompleto mas mock cobre validacao    | requisitos sem criterio testavel                |
| Comercial   | sinal comercial suficiente para priorizar ERP real                          | sem sinal; usar Generic REST/Mock e plano enxuto | promessa comercial incompatível com capacidade  |
| Financeira  | runway conforme policy ou escopo enxuto suficiente                          | runway parcial com corte automatico              | custo sem fonte/fallback                        |
| Operacional | runbook, SLO, rollback e evidencia de DR                                    | runbook com ressalvas e tarefa corretiva         | sem rollback/DR para dado fiscal                |

Regra: qualquer `NO-GO` tecnico ou operacional bloqueia release. `NO-GO` comercial/financeiro nao bloqueia chassi tecnico; troca automaticamente para plano enxuto ou mock.
