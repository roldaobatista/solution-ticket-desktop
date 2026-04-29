# Chaos Engineering — Plano e Cadência

**Versão**: 1.0 — 2026-04-27
**Audiência**: SRE, Tech Lead, Time Integração
**Cross-link**: `SLO-INTEGRACAO.md`, `ON-CALL.md`, `008-runbook-suporte.md`, `BACKUP-RESTORE-SQLITE.md`

---

## 1. Objetivo

Validar empiricamente que o módulo Integração ERP suporta condições adversas **antes** que o cliente experimente — descobrir o que quebra primeiro e em quanto tempo o time detecta/responde/recupera.

---

## 2. Cadência

A cadência cresce com a maturidade do produto — Tier-1 exige reflexos rápidos, então frequência sobe ao entrar em GA.

| Fase                                            | Cadência                                    | Justificativa                                                                              |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Fase 0–1** (pré-GA, sandbox e cliente piloto) | **trimestral** (4×/ano: Mar, Jun, Set, Dez) | volume baixo, mudanças arquiteturais frequentes; trimestral basta para validar invariantes |
| **Fase 2–3** (GA + Tier-1 contratado)           | **mensal** (12×/ano, 1ª terça do mês)       | SLA contratual em jogo; incidente custa crédito; reflexos do time precisam estar afiados   |

- **Duração**: 4 horas por sessão (mantida).
- **Participantes obrigatórios**: SRE plantonista + tech lead + 1 dev por conector ativo + 1 suporte L2.
- **Local**: ambiente de staging dedicado (espelho do cliente piloto).
- **Não em produção** até GA + 6 meses de operação estável.
- **Em mensal (Fase 2-3)**: rotacionar facilitador para distribuir conhecimento (não só SRE sênior).

---

## 3. Cenários obrigatórios

Cada game day cobre **mínimo 4 cenários**, escolhidos do catálogo abaixo. Os 8 abaixo formam o catálogo permanente — a cada game day rodar pelo menos 1 não testado nos últimos 2 trimestres.

| #   | Cenário                                                 | Mecanismo de injeção                                                                                        | Hipótese                                                                                                                                                    |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Outbox cheia (10k pendentes)**                        | seed massivo via script                                                                                     | Worker drena dentro do throughput de `CAPACITY.md`; SLO degrada graciosamente                                                                               |
| 2   | **DLQ explosão (>1k)**                                  | injetar payloads inválidos                                                                                  | Alerta P1 dispara em ≤ 5 min; runbook 008 §"DLQ" funciona                                                                                                   |
| 3   | **ERP responde 200 com payload corrompido**             | toxiproxy + mock que retorna JSON inválido                                                                  | Conector marca FAILED_TECHNICAL, não FAILED_BUSINESS; retry exponencial respeitado                                                                          |
| 4   | **Cert mTLS expirado**                                  | rotacionar para cert vencido                                                                                | Bloqueio em ≤ 1 h; alerta P1; runbook reemissão funciona                                                                                                    |
| 5   | **Refresh OAuth race entre 2 workers**                  | spawn 2 workers competindo pelo mesmo token                                                                 | Lock distribuído impede double-refresh; ADR-012 valida                                                                                                      |
| 6   | **Relay cloud down**                                    | toxiproxy bloqueia DNS do relay                                                                             | Buffer local 1 h funciona; após isso, descarte gracioso com log; failover Cloudflare→AWS testado em paralelo                                                |
| 7   | **SQLite SQLITE_BUSY sob carga**                        | spawn 8 workers concorrentes                                                                                | Watermark `outbox_lock_wait_ms` dispara warn; spike S0-02 valida limites                                                                                    |
| 8   | **Perda da chave HMAC do audit log**                    | renomear chave temporariamente                                                                              | `audit verify` detecta quebra; runbook recovery via sealed-time-witness do relay funciona                                                                   |
| 9   | **Ransomware com restauração desde off-machine backup** | simular criptografia em massa de `%APPDATA%\@solution-ticket\`; isolar máquina; restaurar do S3 Object Lock | playbook `BACKUP-RESTORE-SQLITE.md` §4.2 funciona em ≤ 60 min; hash chain íntegro detecta tamper; comunicação ANPD ≤ 72 h se PII                            |
| 10  | **Memory leak em worker Electron 24/7**                 | injetar fuga em listener serial/socket; rodar 24 h                                                          | watchdog reinicia worker em ≤ 5 min; alerta dispara antes de OOM; outbox não perde eventos no restart                                                       |
| 11  | **IPC Electron sob backpressure**                       | flood de IPC main↔renderer (10 k msgs/s); medir queue + latência UI                                         | UI permanece responsiva (60 fps mantém ou degrada graciosamente); main process não trava; backpressure aplicada (drop + log)                                |
| 12  | **Revogação massiva de tokens em incidente Sev1**       | revogar simultaneamente todos os tokens DPAPI + chaves HMAC + certs mTLS de N tenants                       | runbook executa em ≤ 30 min; clientes afetados recebem comunicação ≤ 1 h; reemissão automatizada funciona; nenhum vazamento residual de credencial revogada |

Targets adicionais para os 4 novos cenários:

| Cenário               | TTD alvo       | TTR alvo | TTRec alvo      |
| --------------------- | -------------- | -------- | --------------- |
| 9. Ransomware         | 5 min          | 15 min   | 60 min          |
| 10. Memory leak 24/7  | 30 min         | 30 min   | 5 min (restart) |
| 11. IPC backpressure  | 5 min          | 15 min   | 15 min          |
| 12. Revogação massiva | n/a (acionado) | 30 min   | 60 min          |

---

## 4. Ferramenta

- **toxiproxy** para injeção de latência, packet loss, blackhole TCP.
- **Scripts customizados** em `scripts/chaos/` para os cenários específicos (outbox seed, DLQ injection, OAuth race).
- **Prometheus + Grafana** para observação durante a injeção.

---

## 5. Métricas medidas

Cada cenário tem 3 timers:

| Métrica                          | Definição                      | Alvo                                                    |
| -------------------------------- | ------------------------------ | ------------------------------------------------------- |
| **Tempo de detecção** (TTD)      | injeção → alerta dispara       | < X min (X depende da severidade configurada do alerta) |
| **Tempo de reação** (TTR)        | alerta → runbook executado     | < Y min (Y = SLA da severidade em ON-CALL)              |
| **Tempo de recuperação** (TTRec) | runbook → sistema volta ao SLO | < Z min (definido por cenário)                          |

Targets por cenário (preencher no relatório):

| Cenário            | TTD alvo | TTR alvo | TTRec alvo        |
| ------------------ | -------- | -------- | ----------------- |
| Outbox cheia       | 5 min    | 15 min   | 60 min            |
| DLQ explosão       | 5 min    | 15 min   | depende do volume |
| Payload corrompido | 10 min   | 30 min   | 30 min            |
| Cert expirado      | 60 min   | 60 min   | 30 min            |
| OAuth race         | 5 min    | 15 min   | 15 min            |
| Relay down         | 5 min    | 15 min   | 60 min            |
| SQLITE_BUSY        | 5 min    | 15 min   | 30 min            |
| Perda HMAC         | 30 min   | 30 min   | 60 min            |

---

## 6. Template de relatório

Salvo em `docs/runbooks/chaos/YYYY-QN-game-day.md`.

```markdown
# Game Day chaos — YYYY-QN

- Data: \_**\_ | Duração: ** h
- Facilitador: \_\_\_\_
- Participantes: \_\_\_\_

## Cenários executados

### Cenário N — <título>

- Injeção: <comando> @ <hora>
- TTD: ** min (alvo ** min) — PASS/FAIL
- TTR: ** min (alvo ** min) — PASS/FAIL
- TTRec: ** min (alvo ** min) — PASS/FAIL
- Runbook usado: <link>
- O que funcionou: \_\_\_\_
- O que falhou: \_\_\_\_
- Surpresas: \_\_\_\_

## Findings

| ID  | Severidade | Descrição | Owner | Prazo |
| --- | ---------- | --------- | ----- | ----- |
| F1  | High       | ...       | ...   | ...   |

## Ações corretivas no backlog

- [ ] ***
- [ ] ***

## Ajustes em SLO/watermarks

- ***

## Próximo game day: cenários a priorizar

- ***
```

---

## 7. Pré-requisitos antes do 1º game day

- Ambiente staging com dados realistas (~30 dias do cliente piloto, anonimizados).
- Toxiproxy provisionado em rede staging.
- Dashboard Grafana com SLOs visíveis ao vivo.
- ON-CALL configurado (alertas de teste já chegaram nos plantonistas).
- Runbooks 008, failover-cloudflare-aws, dr-dpapi atualizados.

---

## 8. Pós game day

- Relatório publicado em ≤ 5 dias úteis.
- Findings High/Critical viram itens P1 no backlog.
- Revisar SLO-INTEGRACAO se watermark falhou em detectar.
- Revisar runbook se TTR ficou acima do alvo.
- Comunicar ao cliente Enterprise (relatório resumido sem detalhes exploráveis) — bom marketing técnico.

---

## 9. Referências

- Netflix Chaos Engineering Principles — https://principlesofchaos.org/
- Google SRE Workbook — Chapter 16 "Disaster Role-playing"
- `SLO-INTEGRACAO.md` — alvos das métricas
- `ON-CALL.md` — severidades
- `008-runbook-suporte.md`
