# Relatório de Homologação — Conector {ERP}

**Conector**: {ERP / código}
**Versão do conector**: {x.y.z}
**Cliente piloto**: {nome anonimizado se necessário}
**Período de homologação**: {YYYY-MM-DD} a {YYYY-MM-DD}
**Agente executor**: {Agent-Orchestrator / QA-Automation-Agent}
**Fonte externa opcional**: {cliente / sandbox / fixture}
**Status final**: ☐ TECH_READY / ☐ PILOT_READY / ☐ COMMERCIAL_GA_READY / ☐ BLOCKED_EVIDENCE / ☐ BLOCKED_EXTERNAL

---

## 1. Resumo executivo

{2–3 parágrafos descrevendo: o que foi homologado, principais resultados, estado agentico e rollback}

---

## 2. Escopo testado

| Categoria                | Itens                                         |
| ------------------------ | --------------------------------------------- |
| Cadastros consumidos     | {parceiros, produtos, veículos, etc.}         |
| Eventos enviados         | {ticket fechado, cancelamento, correção, ...} |
| Webhooks consumidos      | {eventos recebidos via relay}                 |
| Volume de pesagens reais | {N pesagens em M dias}                        |

---

## 3. Resultados por fase

### 3.1 Fase H1 — Validação técnica em sandbox

- **Cenários executados**: {16 / 16}
- **Aprovados**: {N}
- **Falhas detectadas**: {N — listadas em seção 5}
- **Tempo gasto**: {X dias}

### 3.2 Fase H2 — Cenários de erro

- **Erros técnicos validados**: {8 / 8}
- **Erros de negócio validados**: {8 / 8}
- **Classificação técnico/negócio**: {correta em todos / falhas)

### 3.3 Fase H3 — Carga e resiliência

| Métrica                  | Meta          | Medido  | Status |
| ------------------------ | ------------- | ------- | ------ |
| 1000 tickets em < 10 min | < 10 min      | {X min} | ✓/✗    |
| Latência p95             | < 2s          | {Xs}    | ✓/✗    |
| Throughput sustentado    | ≥ 1000 ev/min | {X}     | ✓/✗    |
| Memória estável em 24h   | < +200MB      | {+X MB} | ✓/✗    |
| CPU média                | < 30%         | {X%}    | ✓/✗    |

### 3.4 Fase H4 — Homologação assistida com cliente

- **Cenários executados pelo cliente**: {10 / 10}
- **Pesagens reais**: {N total}
- **Perda**: {0 esperado / 0 real}
- **Duplicidade**: {0 esperado / 0 real}
- **Relatório de aceite agentico emitido em**: {YYYY-MM-DD}

### 3.5 Fase H5 — Produção piloto

- **Modo Sombra (semana 1)**: {sucesso / falhas listadas}
- **Modo Ativo (semana 2)**: {sucesso / falhas listadas}
- **Incidentes P0/P1**: {N — descritos em seção 6}
- **Métricas finais**: {dentro das metas / fora}

---

## 4. Métricas operacionais (últimos 14 dias)

| Métrica                                       | Valor |
| --------------------------------------------- | ----- |
| Tickets fechados                              | {N}   |
| Tickets enviados ao ERP                       | {N}   |
| Tickets confirmados                           | {N}   |
| Eventos em DLQ                                | {N}   |
| Eventos duplicados                            | 0     |
| Tempo médio fechamento → ERP                  | {Xs}  |
| Disponibilidade do ERP no período             | {X%}  |
| Disponibilidade do Solution Ticket no período | {X%}  |

---

## 5. Falhas detectadas e tratativas

| #   | Fase | Severidade | Descrição                                         | Ação tomada               | Status    |
| --- | ---- | ---------- | ------------------------------------------------- | ------------------------- | --------- |
| 1   | H1   | Média      | {ex: campo X mapeado errado}                      | Mapping atualizado        | Resolvido |
| 2   | H3   | Baixa      | {ex: latência p95 acima da meta com batch grande} | Tamanho de batch reduzido | Resolvido |
| 3   | H4   | —          | —                                                 | —                         | —         |

---

## 6. Incidentes em produção (H5)

| #   | Data | Severidade | Descrição | Causa raiz | Mitigação | Permanente? |
| --- | ---- | ---------- | --------- | ---------- | --------- | ----------- |
| —   | —    | —          | —         | —          | —         | —           |

(Se nenhum P0/P1 → "Nenhum incidente registrado.")

---

## 7. Pontos fortes observados

- {bullet 1}
- {bullet 2}
- {bullet 3}

---

## 8. Ressalvas / oportunidades de melhoria

- {bullet 1}
- {bullet 2}

---

## 9. Documentação produzida

- [ ] `docs/integracao/contratos/{erp}.md` — atualizada
- [ ] `mapping/{erp}-default.yaml` — versionada
- [ ] `docs/runbooks/integracao/{erp}.md` — top 10 erros
- [ ] Vídeo de configuração (5 min) gravado
- [ ] Vídeo de troubleshooting (10 min) gravado

---

## 10. Decisão de estado

☐ **TECH_READY** — conector tecnicamente validado  
☐ **PILOT_READY** — pronto para piloto/sombra assistida  
☐ **COMMERCIAL_GA_READY** — dependências comerciais/legais externas resolvidas  
☐ **BLOCKED_EVIDENCE** — falta evidência técnica  
☐ **BLOCKED_EXTERNAL** — falta ato externo não delegável a agente

**Justificativa**: {parágrafo}

---

## 11. Evidências e revisões

| Subagente/Fonte        | Artefato                         | Data | Status |
| ---------------------- | -------------------------------- | ---- | ------ |
| Architecture-Agent     | review arquitetura               |      |        |
| ERP-Specialist-Agent   | contrato/mapping                 |      |        |
| QA-Automation-Agent    | H1-H5/TCK                        |      |        |
| SRE-Agent              | SLO/rollback                     |      |        |
| Security-Agent         | SAST/DAST/secrets                |      |        |
| LGPD-Legal-Agent       | DPIA/ROPA/riscos                 |      |        |
| Fonte externa opcional | termo/feedback/e-sign, se houver |      |        |

---

## 12. Próximos passos

- {ação 1 com responsável e prazo}
- {ação 2}
- {ação 3}

---

**Anexos**:

- A1. Logs de homologação (correlation IDs)
- A2. Métricas detalhadas por dia (CSV)
- A3. Evidence pack de aceite agentico
- A4. Capturas de tela das telas de Solution Ticket e ERP
