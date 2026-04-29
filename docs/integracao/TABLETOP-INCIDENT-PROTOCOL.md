# Protocolo de Tabletop Agentico — Incidentes Integração ERP

**Status:** vigente para simulacoes de incidente do modulo  
**Owner operacional:** `Incident-Agent`  
**Referencias:** `AGENTIC-EXECUTION-OPERATING-MODEL.md`, `THREAT-MODEL-INTEGRACAO.md`, `SLO-INTEGRACAO.md`, `docs/SECURITY-INCIDENT-PLAYBOOK.md`

---

## 1. Objetivo

Simular decisoes de incidente sem depender de comite humano, assinatura ou ata formal. O resultado esperado e um decision record com linha do tempo, severidade, comunicacoes, evidencias e gaps de runbook.

---

## 2. Subagentes convocados

| Subagente          | Foco                                                            |
| ------------------ | --------------------------------------------------------------- |
| `Incident-Agent`   | conduz a simulacao, cria timeline e decisao final               |
| `Security-Agent`   | avalia impacto de credenciais, explorabilidade e contencao      |
| `SRE-Agent`        | avalia SLO, rollback, failover, DR e burn-rate                  |
| `LGPD-Legal-Agent` | avalia dados pessoais, notificacao regulatoria e risco residual |
| `Commercial-Agent` | avalia comunicacao a cliente, rebate e impacto contratual       |
| `Support-Agent`    | valida runbook e mensagens para L1/L2                           |

---

## 3. Cenários mínimos

1. Vazamento de credenciais partner SAP ou TOTVS.
2. Ransomware afetando SQLite local de cliente Tier-1.
3. Sub-processador cloud indisponivel durante pico de safra.
4. Webhook fraudulento aceito pelo relay por falha de assinatura.
5. Payload com PII exportado indevidamente para suporte.

---

## 4. Roteiro

1. `Incident-Agent` escolhe cenario e define janela simulada.
2. `SRE-Agent` injeta ou descreve sinais: alertas, SLO burn-rate, DLQ, metricas.
3. `Security-Agent` classifica ataque, vetor, ativos afetados e contencao.
4. `LGPD-Legal-Agent` classifica PII, base legal, necessidade de comunicacao e risco.
5. `Support-Agent` executa runbook como texto: passos, gaps, tempo estimado.
6. `Commercial-Agent` gera mensagem externa e criterio de rebate/pausa.
7. `Incident-Agent` consolida GO/PIVOT/NO-GO do runbook.

---

## 5. Evidencia de conclusão

Salvar em `docs/integracao/incidentes/<YYYY-MM-DD>-tabletop-<cenario>.md`:

- cenario e premissas;
- subagentes participantes;
- timeline minuto a minuto;
- decisoes tomadas por criterio;
- comandos/queries/simulacoes executadas;
- gaps encontrados;
- tarefas corretivas com owner agentico;
- decisao final: runbook aprovado, aprovado com ressalvas ou reprovado.

---

## 6. Criterios de sucesso

- Sev definido em ate 10 minutos simulados.
- Contencao proposta em ate 30 minutos simulados.
- Impacto LGPD classificado com justificativa.
- Mensagem externa pronta em ate 60 minutos simulados.
- Runbook atualizado quando houver gap.

Sem esses criterios, o tabletop gera `PIVOT` ou `NO-GO` e abre tarefas corretivas.
