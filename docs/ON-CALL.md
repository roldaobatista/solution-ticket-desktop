# On-Call — Política e Operação

**Versão**: 1.0 — 2026-04-27 (criado a partir da Auditoria Rodada 5 — Agente 3)
**Audiência**: SRE, Suporte L1/L2/L3, Tech Lead, CTO
**Aplicável a partir de**: 1º cliente Tier-1 / Enterprise pago em produção.

---

## 1. Por que existe este documento

Auditoria Rodada 5 marcou ausência de operação on-call formal. Sem ela:

- Cliente Enterprise não aceita SLA contratual.
- Alertas P1/P2 caem em horário comercial e somem na fila de e-mail.
- Não há rota clara de escalonamento.
- Time não tem expectativa clara sobre plantão.

---

## 2. Rotação

- **Cadência**: semanal (segunda 09h BRT → segunda 09h BRT).
- **Pool inicial**: time de SRE/backend (mínimo 3 pessoas para fazer o ciclo respirar).
- **Backup**: cada plantonista tem 1 substituto designado.
- **Compensação**: dia compensatório para cada chamada P0/P1 fora de horário comercial; bônus de plantão conforme política RH.
- **Calendário**: publicado em `docs/runbooks/oncall-schedule-YYYY.md`, atualizado mensalmente.

---

## 3. Ferramenta sugerida

Avaliar (ordem de preferência por custo/feature):

1. **Grafana OnCall** (free tier ilimitado p/ até 5 usuários; integra nativo com Grafana Cloud — ver ADR-017). **Recomendado para MVP** dada a stack OpenTelemetry → Grafana já adotada.
2. **Better Stack** (ex Better Uptime) — UX superior, barato; ~US$ 25/mês até 5 usuários. Boa segunda opção se Grafana OnCall faltar feature.
3. **OpsGenie** (Atlassian) — integração nativa com Jira; ~US$ 9/usuário/mês.
4. **PagerDuty** — referência de mercado; ~US$ 21/usuário/mês.
5. **Self-hosted alertmanager + Twilio** — mais barato mas exige operação.

Critérios obrigatórios:

- Push notification + ligação de voz (P0/P1 não podem depender só de e-mail).
- Escalation policy configurável (L1 → L2 → tech lead → CTO).
- Histórico de incidentes para post-mortem.
- Integração com Prometheus/Alertmanager.

---

## 4. Severidades

| Sev    | Definição                                                        | Ack máximo | Resolução alvo   | Quem é acordado                                |
| ------ | ---------------------------------------------------------------- | ---------- | ---------------- | ---------------------------------------------- |
| **P0** | Plataforma down para múltiplos clientes; perda de dados em curso | 5 min      | 1 h              | Plantonista + tech lead + CTO imediato         |
| **P1** | Cliente Enterprise impactado; SLO em risco; 1 cliente sem operar | 15 min     | 4 h              | Plantonista (e tech lead se não ack em 15 min) |
| **P2** | Degradação parcial; SLO consome budget; cliente Pro afetado      | 1 h        | próximo dia útil | Plantonista (horário comercial estendido)      |
| **P3** | Issue conhecida; sem impacto SLO; warn de saturação              | dia útil   | dentro do sprint | Suporte L1 → triage normal                     |

### 4.1 Matriz Sev × pager rules

| Sev           | Canal primário                                         | Canal escalation                                            | Tempo ack máximo | Observação                                                   |
| ------------- | ------------------------------------------------------ | ----------------------------------------------------------- | ---------------- | ------------------------------------------------------------ |
| **Sev1 (P0)** | SMS + ligação automática (3 tentativas, intervalo 90s) | Tech lead acionado em paralelo no minuto 3; CTO no minuto 5 | **5 min**        | Quem dorme com celular em modo silencioso configura override |
| **Sev2 (P1)** | Push (app) + SMS após 5 min                            | Tech lead em 15 min se sem ack                              | **15 min**       | Default para Tier-1 sem operar                               |
| **Sev3 (P2)** | Push (app) + e-mail                                    | Tech lead se sem ack em 1 h                                 | **1 h**          | Horário comercial estendido                                  |
| **Sev4 (P3)** | E-mail + dashboard                                     | —                                                           | **dia útil**     | Triage normal de suporte L1                                  |

Configurar essas rules na ferramenta escolhida no §3 (Grafana OnCall: escalation chains; PagerDuty: escalation policies).

### 4.2 SLA de resposta a cliente Tier-1 (Enterprise)

Independente da Sev interna, **cliente Tier-1 que abre chamado pelo portal recebe ack humano em ≤ 30 min**, 24×7. Mecanismo:

- Portal envia notificação para canal `#tier1-incoming`.
- Plantonista de suporte L1 confirma recebimento + classifica severidade.
- Se classificar Sev1/Sev2 → flui para a matriz §4.1.
- SLA contratual mede **ack humano**, não resolução.
- Quebra de SLA de ack → crédito 5 % da mensalidade.

### Critérios de classificação automática

- `outbox_success_ratio` < 95 % por 5 min → **P1**
- `outbox_success_ratio` < 50 % por 5 min → **P0**
- DPAPI corrompido em cliente Enterprise → **P1**
- Failover Cloudflare → AWS executando → **P1**
- DLQ acima de watermark crit em Tier Enterprise → **P1**
- DLQ acima de watermark warn em Tier Pro → **P2**
- Saturação WAL/lock em Tier Pro → **P2**
- Alerta de saturação Pro com burn budget < 25 % → **P3**

---

## 5. Runbook por severidade

### P0

1. Ack imediato (5 min máximo).
2. Abrir war room (Slack/Discord canal `#incident-active`).
3. Tech lead + CTO acionados em paralelo.
4. Status page atualizada em ≤ 15 min.
5. Fix forward (kill-switch de feature flag se possível).
6. Post-mortem público em até 5 dias úteis.

### P1

1. Ack em 15 min.
2. Diagnóstico via runbook do componente afetado (`failover-cloudflare-aws.md`, `dr-dpapi.md`, `008-runbook-suporte.md`).
3. Comunicar cliente Enterprise impactado em ≤ 30 min.
4. Resolução em ≤ 4 h ou escalar para L2/Tech Lead.
5. Post-mortem interno em até 3 dias úteis.

### P2

1. Ack em 1 h.
2. Investigar, eventualmente esperar próximo dia útil.
3. Comunicar cliente Pro se afetar operação.
4. Resolução dentro do sprint corrente.

### P3

1. Triage no dia útil seguinte.
2. Tratar como debt operacional na cerimônia de planning.

---

## 6. Escalation

```
Alerta dispara
   │
   ▼
[L1 — Plantonista]   ack ≤ Sev (5/15/60 min)
   │
   │ não ack ou pede ajuda
   ▼
[L2 — Tech Lead]      ack ≤ 2× Sev
   │
   │ não ack ou problema arquitetural
   ▼
[CTO]                  ack ≤ 4× Sev (apenas P0/P1)
```

Critérios de escalonamento explícitos:

- L1 não ack em janela → escalar L2 automaticamente.
- L1 ack mas problema fora do escopo dele → escalar manual L2.
- P0 sempre acorda CTO em paralelo (não sequencial).
- Cliente Enterprise pediu escalonamento → atende, mesmo sem critério técnico.

---

## 6.1 SLI por componente — runbook diferenciado

`SLO-INTEGRACAO.md` §3.3 decompõe SLI/SLO em 5 componentes. Cada origem de alerta tem runbook próprio — saber **onde** falhou economiza minutos de triagem.

| Componente                          | Sintomas típicos                                                                                               | Runbook primário                                                                                                                           | Owner inicial                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| **(a) App local Electron + SQLite** | crash do app; tela branca; erro DPAPI; freeze do main process; corrupção SQLite                                | `docs/runbooks/integracao/dr-dpapi.md`; `BACKUP-RESTORE-SQLITE.md` Cenário B; logs `%APPDATA%\@solution-ticket\electron\logs\electron.log` | Plantonista L1 + dev frontend/electron |
| **(b) Outbox processor** (worker)   | `outbox_pending_count` cresce; `worker_busy_ratio` baixo (worker idle); recovery loop ativo; POISON aparecendo | `008-runbook-suporte.md` §"Outbox"; `004-outbox-inbox-retry.md` §6                                                                         | Plantonista L1 + dev backend           |
| **(c) Conector específico**         | erros 4xx/5xx em apenas 1 ERP; refresh OAuth falhando; rate-limit ERP estourando                               | `007-playbook-conectores-erp.md`; `runtime.yaml` por ERP                                                                                   | Dev do conector + suporte L2           |
| **(d) Relay cloud**                 | webhook entrante atrasado; freshness inbox quebrado; falha mTLS                                                | `runbooks/integracao/failover-cloudflare-aws.md`; `RELAY-CLOUD-SECURITY-SPEC.md` §10.3                                                     | SRE on-call + segurança                |
| **(e) API pública (`:3002`)**       | clientes externos recebem 5xx; latência alta no `:3002`; cliente não consegue abrir chamado via API            | `003-api-publica-v1.md` §"Operação"; logs do NestJS                                                                                        | Dev backend                            |

### Critério de roteamento automático

- Alerta deve carregar **label `component`** (`app-local | outbox | connector-<erp> | relay | api-public`).
- Ferramenta on-call (§3) usa label para escolher runbook na notificação.
- Se label ausente: classificação manual em ≤ 2 min pelo plantonista.

### Cross-component (mais difícil)

- Quando 2+ componentes alertam simultaneamente: provável causa comum (rede, certificado raiz, DNS).
- Plantonista chama tech lead em paralelo (não sequencial).

---

## 7. Pós-incidente

Para todo incidente P0/P1:

1. **Post-mortem** em até 3–5 dias úteis (P1: interno; P0: público resumido).
2. Template em `docs/runbooks/incident-template.md`.
3. Cada post-mortem gera ≥ 1 ação corretiva (item de backlog).
4. Revisão de runbooks que falharam.
5. Revisão de SLOs/watermarks se threshold não detectou a tempo.

### 7.1 Prazo de post-mortem (squad enxuta)

Squad pequena precisa equilibrar disciplina pós-incidente com capacidade real de entrega. Prazos diferenciados por severidade:

| Sev           | Prazo post-mortem      | Audiência                                        | Notas                                                                                         |
| ------------- | ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| **Sev1 (P0)** | **7 dias**             | público resumido + interno completo              | mantido — incidente de máxima gravidade exige resposta rápida; clientes esperam transparência |
| **Sev2 (P1)** | **14 dias** (default)  | interno; resumo opcional para Enterprise afetado | aumentado de 5 d para 14 d para refletir capacidade da squad                                  |
| **Sev3 (P2)** | **14 dias** (default)  | interno                                          | criado — antes não havia obrigação; agora há, mas com janela folgada                          |
| **Sev4 (P3)** | sem post-mortem formal | discussão na retrospectiva de sprint             | apenas item de backlog                                                                        |

### Critérios para encurtar prazo

- Cliente Tier-1 cobra explicitamente: prazo cai para 7 d.
- Incidente expõe vulnerabilidade ativa: prazo cai para 5 d (com mitigação imediata em paralelo).
- Recorrência da mesma causa em < 30 d: tratado como Sev acima da original e prazo reduz proporcionalmente.

### Critérios para estender prazo

- Investigação requer apoio de fornecedor externo (ERP, Cloudflare, AWS) lento: extensão de até +7 d com aprovação tech lead.
- Documentado no item do backlog do post-mortem.

---

## 8. Métricas do programa de on-call

- **MTTA** (mean time to ack) — alvo: < 50 % do SLA por severidade.
- **MTTR** (mean time to resolution) — alvo: dentro do SLA por severidade.
- **Pages por semana** — alvo: < 2 P0/P1 por plantonista (saúde do programa).
- **% de pages acionáveis** — alvo: > 80 % (resto = ruído de alerta, ajustar threshold).

Revisão trimestral em retrospectiva de SRE.

---

## 9. Referências

- `SLO-INTEGRACAO.md` — SLOs/SLIs e burn-rate alerts
- `runbooks/integracao/failover-cloudflare-aws.md`
- `runbooks/integracao/dr-dpapi.md`
- `integracao/008-runbook-suporte.md`
- Google SRE Workbook — _Being on-call_
