# Runbook — Failover Cloudflare → AWS (Relay Cloud)

**Versão**: 1.0 — 2026-04-27
**Resolve**: HIGH N3 da auditoria
**Audiência**: SRE + Tech Lead
**RTO objetivo**: **15 min** (failover automático após detecção)
**RPO**: **≤ 5 min** — eventos confirmados (já gravados em outbox local) têm perda zero garantida via idempotência; eventos enfileirados em KV nas últimas 5 min, ainda não confirmados, podem ser reprocessados pelo ERP via outbox/retry, mas há janela teórica de perda se Cloudflare estiver inacessível durante o export.

> Reconciliação Auditoria Rodada 5 (Agente 3): a linha original "RPO=0" contradizia o aviso de risco em §3.3. RPO real é **≤ 5 min** com perda zero apenas para eventos confirmados.

---

## Cenários de ativação

### A) Cloudflare Workers degradado (errors > 5%)

- Status público: cloudflare.com/status mostra incidente
- Métrica interna: error rate worker > 5% por 10 min
- **Ação**: failover automático

### B) Cloudflare Workers down (>50% errors)

- Status: incidente confirmado
- **Ação**: failover imediato

### C) Decisão estratégica (custo, compliance regional)

- Cliente Enterprise pediu região BR exclusiva
- **Ação**: failover programado (não-emergência)

---

## Arquitetura de failover

```
ERP cloud → DNS (relay.solution-ticket.com)
                   │
                   ├─► [primário] Cloudflare Workers + KV
                   │
                   └─► [standby]  AWS Lambda + SQS (cold)
```

### Componentes standby

- **AWS Lambda**: function deployada em `us-east-1` + `sa-east-1` (multi-região)
- **AWS SQS**: filas por tenant (FIFO + DLQ)
- **AWS API Gateway**: endpoint `relay-aws.solution-ticket.com`
- **Route 53**: DNS com health check

### Custo standby

- Lambda: free tier cobre ~1M req/mês
- SQS: free tier cobre 1M req/mês
- API Gateway: ~$3.50/M requests
- **Custo cold standby**: ~$5/mês para reserva

---

## Failover automático (Route 53 health check)

### Configuração

- Health check em `https://relay.solution-ticket.com/health`
- Threshold: 3 falhas consecutivas em 30s
- Failover record: weighted DNS
  - Primário: peso 100, target Cloudflare
  - Standby: peso 0, target AWS
- Em failover: peso primário → 0, peso standby → 100
- TTL: 60s

### Ativação automática

1. Route 53 detecta falha do primário
2. Atualiza weighted DNS
3. Em ~60s (TTL), ERPs começam a chegar no AWS
4. Alerta dispara para SRE on-call

---

## Failover manual (procedimento)

### Pré-requisitos

- Acesso AWS console + CLI
- Acesso Cloudflare dashboard
- AWS CLI configurada com profile `solution-ticket-prod`

### Passos

#### 1. Confirmar problema (5 min)

```bash
# Verificar Cloudflare
curl -I https://relay.solution-ticket.com/health
# Verificar AWS standby está respondendo
curl -I https://relay-aws.solution-ticket.com/health
```

#### 2. Acordar AWS Lambda (warm-up)

```bash
# Disparar 100 invocações para sair do cold start
for i in {1..100}; do
  curl -s https://relay-aws.solution-ticket.com/health > /dev/null &
done
wait
```

#### 3. Migrar fila ativa (eventos pendentes em KV → SQS)

```bash
# Script de migração
aws sqs send-message-batch --queue-url <queue-url> \
  --entries file://kv-export.json \
  --profile solution-ticket-prod
```

⚠️ **Risco RPO**: eventos enfileirados em KV nas últimas ≤ 5 min, **ainda não confirmados pelo desktop**, podem ser perdidos se Cloudflare estiver inacessível durante export. Mitigação: ERPs reentregam via webhook após primeira falha (idempotência do outbox absorve duplicatas).

#### 4. Atualizar DNS (Route 53)

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://failover-to-aws.json
```

`failover-to-aws.json`:

```json
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "relay.solution-ticket.com",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{ "Value": "relay-aws.solution-ticket.com" }]
      }
    }
  ]
}
```

#### 5. Validar (15 min após DNS propagar)

```bash
# Múltiplos pontos
dig +short relay.solution-ticket.com @8.8.8.8
dig +short relay.solution-ticket.com @1.1.1.1

# Enviar webhook teste do Bling sandbox
# Verificar chegada no SQS
aws sqs receive-message --queue-url <queue-url> --profile solution-ticket-prod
```

#### 6. Monitorar (próximas 2h)

- CloudWatch dashboard
- Métricas: throughput, latência, erros
- Alertas configurados

---

## Comunicação durante failover

### Status page

Atualizar `status.solution-ticket.com`:

- "Detectamos degradação no provedor primário (Cloudflare). Migrando para infra secundária. Operação local da balança não é afetada."

### Notificação clientes

```
Subject: Aviso operacional — relay cloud em failover

Detectamos indisponibilidade no provedor primário do relay cloud.
Estamos executando failover para infraestrutura secundária (AWS).

IMPORTANTE: a operação local da balança e do Solution Ticket
NÃO é afetada. Pesagens continuam sendo registradas
normalmente. Apenas a sincronização de webhooks entrantes
do ERP pode ter latência aumentada por 15-30 minutos.

Status atualizado em: status.solution-ticket.com
```

---

## Failback (Cloudflare voltou)

### Quando fazer

- Cloudflare estável por > 24h
- Custo AWS começa a subir (volume alto)
- Compliance regional não exige AWS

### Procedimento

1. Health check Cloudflare verde por 24h
2. Sincronizar fila SQS → KV (eventos não confirmados)
3. Atualizar DNS de volta para Cloudflare
4. Aguardar TTL (60s)
5. Monitorar 2h
6. Drenar SQS standby

⚠️ Failback pode reordenar eventos. Validar idempotência (deve absorver).

---

## Gate de Sprint 6 — Drill obrigatório

> **Bloqueador GA Sprint 6**: este runbook NÃO está validado em produção até execução do primeiro drill completo. Auditoria Rodada 5 (Agente 3) marcou ausência de drill como CRITICAL.

### Checklist de execução do drill (8 passos)

- [ ] **1. Janela**: agendar janela noturna (00h–04h BRT), comunicar clientes 7 dias antes.
- [ ] **2. Pré-condições**: AWS Lambda standby `relay-aws.solution-ticket.com` respondendo; Route 53 health check verde; Cloudflare KV com eventos sintéticos para validar export.
- [ ] **3. Simular falha**: bloquear Cloudflare via firewall rule no DNS de origem (não derrubar Cloudflare global).
- [ ] **4. Cronometrar detecção**: medir tempo até Route 53 disparar failover (alvo ≤ 30 s).
- [ ] **5. Cronometrar RTO**: medir tempo até primeiro webhook chegar no SQS (alvo ≤ 15 min).
- [ ] **6. Validar RPO**: contar eventos enviados durante a janela vs entregues no desktop (alvo ≤ 5 min de eventos não-confirmados perdidos; idempotência absorve reentrega).
- [ ] **7. Failback**: executar §"Failback" deste runbook; medir tempo total e validar reordenação absorvida.
- [ ] **8. Pós-drill**: registrar relatório em `docs/runbooks/integracao/drills/YYYY-MM-DD-failover.md` com métricas; atualizar este runbook se algo divergir.

> Sem o drill registrado, **GA do Sprint 6 fica bloqueado** (gate de DevOps/SRE).

---

## Testes de failover

### Drill trimestral

- 1× por trimestre, em ambiente de homologação
- Simular Cloudflare down (firewall block)
- Executar runbook completo
- Medir RTO real
- Atualizar runbook se necessário

### Drill anual

- 1× por ano, em produção (janela noturna)
- Comunicar clientes 7 dias antes
- Failover real por 1h
- Failback após validação

---

## Métricas de sucesso

| Métrica                       | Meta                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| RTO (failover automático)     | < 5 min                                                                                           |
| RTO (failover manual)         | < 15 min                                                                                          |
| RPO                           | ≤ 5 min — perda zero para eventos confirmados; reentrega via idempotência absorve não-confirmados |
| Sucesso de drills trimestrais | 100%                                                                                              |
| Tempo médio de detecção       | < 30s (Route 53)                                                                                  |

---

## Custos

| Item                                          | Custo       |
| --------------------------------------------- | ----------- |
| Cold standby AWS (Lambda + SQS + API Gateway) | ~$5/mês     |
| Failover ativo (volume médio)                 | ~$50/mês    |
| Drill trimestral                              | $20/quarter |
| **Total anual**                               | ~$200       |

ROI: Cloudflare cair 1 dia/ano sem failover = perda de credibilidade com clientes Enterprise > custo anual.

---

## Referências

- ADR-008 — Relay Cloud
- `integracao/ESTRATEGIA-RELAY-CLOUD.md` §8.3 — Plano B
- `integracao/008-runbook-suporte.md`
