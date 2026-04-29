# Modelo Operacional Agentic — Modulo Integracao ERP

**Status:** canonico para execucao por agentes de IA  
**Owner operacional:** `Agent-Orchestrator`  
**Atualizacao:** 2026-04-29  
**Aplica-se a:** `docs/PLANO-MODULO-INTEGRACAO.md`, `docs/GUIA-INTEGRACAO-ERP.md`, `docs/integracao/**`, `docs/comercial/**`, `docs/legal/**`, `docs/runbooks/integracao/**` e ADRs do modulo.

---

## 1. Regra de precedencia

Este documento substitui qualquer gate interno que dependa de pessoa, comite, assinatura, aprovacao verbal ou cargo nominal.

Quando outro documento disser `Tech Lead`, `PM`, `CISO`, `DPO`, `CFO`, `CEO`, `Comercial`, `Juridico`, `Steering Committee`, `cliente assina`, `aprovacao`, `sign-off` ou equivalente, ler como **subagente especialista executando uma funcao verificavel**.

Nenhum item do plano pode ficar bloqueado por assinatura humana. O bloqueio valido e sempre um destes:

- evidencia tecnica ausente;
- teste, lint, build, SAST, DAST, secret scanning, TCK, smoke ou carga falhando;
- artefato obrigatorio nao gerado;
- dependencia externa sem substituto agentico ou mock documentado.

Se uma exigencia externa real nao puder ser executada por agente, ela entra como **dependencia externa nao bloqueante para engenharia**, com plano B: mock, sandbox, adaptador generico, execucao em modo sombra ou retirada do escopo da fase.

---

## 2. Principios

1. **Evidencia substitui assinatura.** Gate so fecha com comando executado, relatorio versionado, hash de artefato, screenshot/log ou registro de telemetria.
2. **Especialidade vira subagente.** Quando o plano pedir profissional especializado, o orquestrador cria subagente daquela disciplina e exige relatorio com achados, severidade e recomendacao.
3. **Aprovacao vira revisao independente.** Toda aprovacao interna e substituida por pelo menos um reviewer agentico distinto do implementador.
4. **Cliente nao assina gate interno.** Aceite de cliente vira relatorio de homologacao baseado em cenarios executados, metricas, evidencias e feedback registrado.
5. **Decisao comercial vira regra numerica.** Go/no-go usa thresholds documentados; sem threshold, o subagente de Produto/Financas cria um antes da decisao.
6. **Legal/LGPD vira pacote de risco.** O subagente Juridico/LGPD produz matriz, DPIA, DPA draft e riscos residuais; nenhum documento exige assinatura humana para prosseguir tecnicamente.
7. **Operacao local-first permanece inviolavel.** A balanca nunca depende do ERP, do relay cloud, de cliente, de vendedor ou de agente externo para fechar pesagem.

---

## 3. Catalogo de subagentes

| Subagente                | Substitui nos docs                             | Responsabilidade                                                       | Evidencia minima                                |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------- |
| `Agent-Orchestrator`     | Steering Committee, PMO, CEO em gates internos | Sequenciar plano, abrir tarefas, decidir GO/PIVOT/NO-GO por thresholds | Decision record em `docs/auditoria/agentic/`    |
| `Architecture-Agent`     | Tech Lead, Arquiteto                           | ADRs, DAG, contratos internos, consistencia com NestJS/Prisma/Electron | ADR ou parecer + diff/links                     |
| `Backend-Agent`          | Dev backend                                    | Implementacao NestJS/Prisma/worker/conectores                          | testes unit/integration verdes                  |
| `Frontend-Agent`         | Dev frontend/UX                                | Telas de conectores, eventos, mapping, diagnostico                     | screenshots ou Playwright + testes              |
| `QA-Automation-Agent`    | QA Lead, cliente testando roteiro              | TCK, contract tests, e2e, smoke, carga                                 | relatorio de execucao + exit code               |
| `SRE-Agent`              | SRE/on-call                                    | SLO, observabilidade, DR, chaos, release, capacity                     | dashboards/specs + drills                       |
| `Security-Agent`         | CISO, pentester interno                        | STRIDE/LINDDUN, SAST/DAST, secrets, hardening                          | threat model + outputs SAST/DAST/gitleaks       |
| `LGPD-Legal-Agent`       | DPO, Juridico                                  | DPIA, ROPA, retencao, DPA, termos, risco regulatorio                   | pacote LGPD + matriz de risco residual          |
| `Finance-Agent`          | CFO                                            | runway, pricing, LTV/CAC, cash-flow, stop-loss                         | planilha/modelo markdown + thresholds           |
| `Commercial-Agent`       | CRO, Sales, AE/SDR                             | ICP, discovery, pipeline, provas de demanda                            | log de discovery + scoring RICE/ICP             |
| `PricingPolicyAgent`     | CEO/CFO aprovando descontos                    | faixas de preco, margem minima, LTV/CAC, descontos e bloqueios         | policy versionada em `docs/comercial/evidence/` |
| `ContractLegalAgent`     | juridico contratual, NDA, DPA, aceite          | templates, e-sign, escrow, clausulas minimas                           | minuta + status externo                         |
| `DiscoveryResearchAgent` | PM conduzindo entrevistas                      | formularios, bot de entrevista, transcricao, RICE/ICP                  | `DISCOVERY-LOG.md` atualizado                   |
| `PartnerOpsAgent`        | relacionamento SAP/TOTVS/Microsoft/ERP         | sandboxes, portais, certificacoes, status de parceiro                  | `EXTERNAL-DEPENDENCIES.md` atualizado           |
| `CommitmentsAgent`       | PM/Comercial revisando promessas               | validar proposta vs ERP x fase x capacidade                            | matriz de compromissos sem overcommit           |
| `CustomerSuccessAgent`   | CS/NPS/churn                                   | onboarding, sinais de risco, NPS e renovacao                           | evidence de health score                        |
| `ERP-Specialist-Agent`   | consultor Bling/Omie/Sankhya/SAP/TOTVS         | contrato ERP, mapping, limites, runbook                                | contrato revisado + testes de sandbox/mock      |
| `Support-Agent`          | Suporte L1/L2                                  | runbook, DLQ, reprocessamento, incidentes                              | diagnostico reproduzivel + playbook             |
| `Incident-Agent`         | comite executivo de incidente                  | tabletop, comunicacao, severidade, rollback                            | timeline + decisoes por criterio                |

---

## 4. Traducao obrigatoria de termos legados

| Termo legado encontrado                                | Interpretacao agentic obrigatoria                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `assinatura`, `assinado`, `termo assinado`, `sign-off` | artefato versionado com hash, status, data, agente executor e evidencias anexas                                 |
| `aprovado por`, `aprovacao formal`, `Steering aprova`  | decision record do `Agent-Orchestrator` baseado em thresholds                                                   |
| `CISO revisa`, `DPO assina`, `Juridico aprova`         | parecer do subagente especialista + checklist de evidencias                                                     |
| `CEO/CFO decide`                                       | regra financeira/comercial calculada pelo `Finance-Agent` ou `Commercial-Agent`                                 |
| `Tech Lead contratado`                                 | capacidade `Architecture-Agent` disponivel; se ausente, usar `Architecture-Agent` sob demanda e reduzir escopo  |
| `2 aprovadores`                                        | dois reviewers agenticos independentes ou dual-control criptografico no produto quando envolver operador real   |
| `cliente piloto assina`                                | relatorio de homologacao agentico com cenario, telemetria, feedback e decisao automatizada                      |
| `acao humana obrigatoria`                              | evento `OPERATIONAL_ACTION_REQUIRED` em UI/fila, com acao sugerida por agente; nunca retry infinito             |
| `reprocessamento manual`                               | comando operacional auditado via UI/API, disparado por operador ou `Support-Agent` conforme permissao           |
| `entrevista com cliente`                               | coleta agentica via formulario, CRM, suporte, telemetria ou transcricao; consentimento registrado como metadado |

---

## 5. Artefatos obrigatorios

Todo gate agentic grava ao menos um artefato em uma destas pastas:

- `docs/auditoria/agentic/<YYYY-MM-DD>-<gate>.md` — decisao, criterios, evidencias e resultado.
- `docs/integracao/evidence/<sprint>/<story-id>.json` — saida estruturada de testes, hashes e metricas.
- `docs/integracao/relatorios-homologacao/<erp>-<YYYY-MM-DD>.md` — homologacao de conector.
- `docs/integracao/incidentes/<YYYY-MM-DD>-<sev>.md` — incidentes e tabletop.
- `docs/comercial/evidence/<YYYY-MM-DD>-<tema>.md` — ICP, pricing, RICE, discovery e runway.

Formato minimo de decision record:

```md
# Decision Record — <gate>

**Data:** YYYY-MM-DD
**Agente executor:** <subagente>
**Agentes revisores:** <lista>
**Decisao:** GO | PIVOT | NO-GO
**Criterios avaliados:** <thresholds>
**Comandos/evidencias:** <links, hashes, exit codes>
**Riscos residuais:** <lista>
**Proxima acao:** <tarefa rastreavel>
```

---

## 6. Gates agenticos

| Gate                    | Fecha com                                                                                        | Nao fecha com            |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------ |
| DoR de historia         | criterios testaveis, massa de teste, dependencia mapeada, estimativa por 2 agentes               | opiniao de PM/Tech Lead  |
| DoD de historia         | testes verdes, review agentico, docs atualizadas, evidencia arquivada                            | code review verbal       |
| Merge/release           | CI verde, cobertura minima, SAST/secret scan, migration testada quando aplicavel                 | aprovacao de par sem log |
| GA de conector          | TCK >= meta, contract/e2e/carga/pentest, 14 dias sem P0/P1 ou modo sombra equivalente, relatorio | termo assinado           |
| Mudanca fiscal sensivel | dual-control criptografico no produto ou dois reviewers agenticos em pre-producao                | excecao verbal           |
| Fase GO/PIVOT/NO-GO     | scorecard numerico do plano + decision record                                                    | reuniao de Steering      |
| Incidente/tabletop      | timeline, classificacao, runbook executado, postmortem agentico                                  | ata assinada             |

---

## 7. Protocolo de execucao por agentes

1. `Agent-Orchestrator` le o plano e quebra o trabalho em tarefas com arquivos, testes e evidencias.
2. Para cada tarefa independente, cria subagente implementador com escopo de escrita definido.
3. Ao terminar, cria reviewer de especificacao e reviewer de qualidade/seguranca quando aplicavel.
4. O orquestrador verifica o diff e roda os comandos de validacao no workspace principal.
5. Se falhar, a tarefa volta ao implementador com erro concreto.
6. Se passar, o orquestrador arquiva o decision record e marca a tarefa como concluida.
7. Ao final de sprint/fase, o orquestrador gera scorecard GO/PIVOT/NO-GO sem depender de reuniao humana.

---

## 8. Descoberta, vendas e runway sem gate humano

Sinais comerciais nao bloqueiam engenharia de fundacao. Eles priorizam escopo.

| Sinal                    | Fonte agentica aceita                                               | Uso                                     |
| ------------------------ | ------------------------------------------------------------------- | --------------------------------------- |
| LOI/contrato             | CRM, e-mail, proposta, deposito, formulario, log comercial          | priorizar conector real                 |
| falta de sinal comercial | ausencia de evidencias no scorecard                                 | usar Mock/Generic REST e reduzir escopo |
| pricing                  | modelo `Finance-Agent` + comparaveis internos                       | definir tier e margem minima            |
| discovery                | transcricoes, tickets de suporte, entrevistas gravadas, formularios | ajustar backlog e RICE                  |

Quando nao houver cliente real, o plano continua com `MockErpConnector`, sandbox publico, contrato preliminar e criterio explicito de incerteza.

---

## 9. Limites

Agentes nao prometem que um ato externo regulatorio, contratual ou societario foi praticado por pessoa real. Para execucao do modulo, isso nao vira gate: vira risco externo registrado e plano B tecnico/comercial.

O objetivo deste modelo e retirar dependencia humana da **execucao interna do plano**. Obrigacoes legais externas, se existirem, devem ser tratadas como artefato de risco e nao como bloqueio silencioso de engenharia.
