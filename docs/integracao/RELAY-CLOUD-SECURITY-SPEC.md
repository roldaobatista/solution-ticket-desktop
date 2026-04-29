# Relay Cloud — Especificação de Segurança

**Versão**: 1.0 — 2026-04-27
**Audiência**: SRE, Segurança, Tech Lead, Pré-vendas Enterprise
**Cross-link**: ADR-008, ADR-015 (anti-replay), ADR-017, `docs/integracao/ESTRATEGIA-RELAY-CLOUD.md`, `docs/runbooks/integracao/failover-cloudflare-aws.md`

---

## 1. Objetivo

Documenta os controles de segurança do **relay cloud** que recebe webhooks de ERPs e encaminha para os desktops dos clientes (ADR-008). Serve de:

- Especificação para implementação.
- Material de pré-venda Enterprise (resumo executivo).
- Checklist de pentest.

---

## 2. Identidade e autenticação

### 2.1 mTLS por tenant

- Cada cliente recebe **certificado X.509** próprio (CN = `<tenant_id>.tenants.solution-ticket.cloud`).
- Cert emitido por CA interna; rotação **a cada 90 dias** automática (notificação 14 dias antes do vencimento).
- Desktop apresenta cert no handshake; relay valida cadeia + revogação (CRL atualizado a cada 1 h).
- Cert revogado → desktop bloqueado em ≤ 1 h.

### 2.2 API key adicional (defense-in-depth)

- Além do mTLS, header `X-API-Key: <key>` no request.
- Key gerada no provisionamento, gravada em DPAPI no desktop.
- Rotação manual via portal (cliente Enterprise) ou suporte L2.

### 2.3 IP allowlist (opcional Tier-1)

- Cliente Enterprise pode listar até 10 IPs/CIDR autorizados.
- Tráfego de IP fora da allowlist → 403, alerta P2 ao cliente.

---

## 3. Anti-replay e integridade de mensagem

Padrão herdado de ADR-015 (API pública); aplicado também no relay:

| Header        | Valor                  | Validação                       |
| ------------- | ---------------------- | ------------------------------- | ----- | --- | --------------------- | ----------------------- |
| `X-Tenant-Id` | UUID v4                | obrigatório; relay rota por ele |
| `X-Timestamp` | ISO 8601 UTC           | janela ±5 min relativo ao relay |
| `X-Nonce`     | UUID v4                | único por tenant; cache 10 min  |
| `X-Signature` | `HMAC-SHA256(timestamp |                                 | nonce |     | body, shared_secret)` | recalculado e comparado |

- Janela > 5 min → 401 + log.
- Nonce repetido em < 10 min → 409 + alerta P3 (possível replay).
- Cache de nonces: Redis cluster regional, TTL 10 min, eviction LRU.

---

## 4. Tenant isolation

- **Toda mensagem carrega `tenant_id`** desde o ingress (header obrigatório).
- Routing tables segregadas por tenant — **sem cross-tenant routing** mesmo em código de erro.
- Storage temporário (buffer de mensagens não entregues): chaveado por `tenant_id` + criptografia em repouso AES-256.
- Logs taggeados com `tenant_id`; queries de suporte filtram por tenant antes de exibir.

### Rate limit por tenant

- **1.000 req/min** por tenant (default).
- Tier Enterprise pode subir até **5.000 req/min** sob aprovação SRE + revisão de capacidade.
- Excesso → 429 com `Retry-After`. Sustentado > 5 min → alerta P3 ao cliente.

---

## 5. Capacity e disponibilidade

### 5.1 Multi-AZ Cloudflare

- Workers globais (anycast); falha de região individual transparente.
- KV/Durable Objects para nonce cache regional.

### 5.2 Failover Cloudflare → AWS

- Documentado em `docs/runbooks/integracao/failover-cloudflare-aws.md`.
- Trigger: degradação Cloudflare > 5 min ou error rate > 5 %.
- DNS Route 53 health-check + failover em ≤ 60 s.
- AWS standby: API Gateway + Lambda equivalente.

### 5.3 SLA contratual

- **99,9 % mensal** disponibilidade do relay.
- Crédito 10 % da mensalidade por 0,1 % abaixo do SLA (até 50 % crédito).
- Excluído: manutenção planejada (notificada 7 dias antes).

### 5.4 Capacity & multi-region

- **Multi-AZ Cloudflare** (§5.1): cobre falha intra-região via anycast.
- **AWS region secundária**: failover para AWS us-east-1 documentado em `docs/runbooks/integracao/failover-cloudflare-aws.md`. Stack standby: API Gateway + Lambda + DynamoDB (réplica do nonce cache).
- **Capacity baseline**: dimensionado para **10.000 req/min agregado** considerando 100 tenants Tier-1 simultâneos (média 100 req/min/tenant + headroom 4× para pico).
- **Auto-scaling rules**:
  - Cloudflare Workers: scale automático até quota da conta (paid plan: ~100M req/dia).
  - AWS standby: Lambda concurrent limit elevado para 1.000 (provisioned concurrency 100).
  - Alerta P3 quando agregado > 70 % da baseline; P2 quando > 90 %.
- **Load-test trimestral**:
  - Spec: 24 h em 2× a baseline (20 k req/min) contra ambos provedores (Cloudflare + AWS standby).
  - Critério: p95 ≤ 200 ms ingress→egress; error rate < 0,5 %.
  - Resultado registrado em `docs/runbooks/load-tests/relay-YYYY-QN.md`.
  - Falha bloqueia onboarding de novos tenants Tier-1 até correção.

---

## 6. Anti-DDoS e WAF

### 6.1 Controles base

- **Cloudflare WAF** com regras OWASP Core Ruleset 4.x.
- **Rate limit global** anti-volumetric: 50 k req/s por IP origem → challenge.
- **Bot management** automático (Cloudflare Bot Score).
- **Challenge** (CAPTCHA/JS) em padrões suspeitos.
- Alerta ao SRE em ataque detectado.

### 6.2 WAF / DDoS L7 (detalhamento)

- **OWASP Top 10 (2021/2023)**: regras gerenciadas Cloudflare cobrem A01-A10. Custom rules para SQLi/XSS específicos do payload de webhook.
- **Rate-limit por IP**: 100 req/min por IP por path (default); excedente → challenge.
- **Rate-limit por tenant**: já documentado (§4); aplicado **antes** do rate-limit por IP para evitar tenant inteiro tomar challenge por compartilhar NAT.
- **Challenge automático em pico anômalo**: Cloudflare Adaptive DDoS dispara JS challenge se RPS > 10× a média móvel de 1 h por path.
- **Bot management**: score < 30 (suspeito) → challenge; score < 10 (bot quase certo) → block. Tenants Enterprise podem allowlistar bots conhecidos (monitoring tools deles).
- **Geo-block opcional**: cliente Enterprise pode restringir origem (BR-only, BR+US, etc.).

---

## 7. Logs, auditoria e PII

### 7.1 O que é logado

- Metadata: `tenant_id`, `timestamp`, `endpoint`, `status`, `latency_ms`, `bytes`.
- IP origem (mascarado para `/24` após 24 h por LGPD).
- Headers de identificação (sem `Authorization`/`X-API-Key`).

### 7.2 O que NÃO é logado

- Body do request (pode conter PII: CPF, valores, placa).
- Tokens, API keys, mTLS material.
- Conteúdo de webhook do ERP.

### 7.3 Mascaramento defensivo

- Regex no pipeline: CPF (`\d{3}\.\d{3}\.\d{3}-\d{2}`), CNPJ, email, placa Mercosul.
- Substitui por `***`. Aplicado mesmo em mensagens de erro do desenvolvedor.

### 7.4 Retenção

- **90 dias** logs de acesso.
- **5 anos** audit log (export semanal S3 Object Lock — ADR-018).

### 7.5 Hash chain

- Audit log do relay também segue hash chain (mesmo padrão ADR-018).
- Witness reciproco com desktop (cliente pode auditar relay).

---

## 8. Pentest e governança

- **Pentest anual obrigatório** (escopo: relay + endpoints públicos), por empresa CREST/OSCP.
- Relatório resumido (sem detalhes exploráveis) disponível para cliente Enterprise sob NDA.
- Findings High/Critical: corrigir em 30 dias; Medium: 90 dias; Low: backlog.
- Re-test obrigatório para High/Critical.

### Compliance check anual

- Revisão LGPD com DPO.
- Revisão criptografia (cipher suites TLS 1.3, hash MIT-CRYPTO-2025).
- Atualização desta especificação.

---

## 9. Resposta a incidente

- Ver `docs/integracao/SECURITY-INCIDENT-PLAYBOOK.md` (criado por agente paralelo).
- Comunicação a cliente Enterprise: ≤ 4 h após confirmação.
- Notificação ANPD (se vazamento PII): ≤ 72 h conforme LGPD Art. 48.

---

## 10. Cipher suites e versões

- **TLS 1.3** somente.
- Cipher suites: `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`, `TLS_AES_128_GCM_SHA256`.
- HSTS: `max-age=31536000; includeSubDomains; preload`.
- HPKP descontinuado; CAA DNS configurado.

---

## 10.1 Rotação HMAC

A chave HMAC-SHA256 usada em §3 (`X-Signature`) é por tenant e tem ciclo de rotação obrigatório.

| Item               | Valor                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Periodicidade      | **a cada 90 dias**                                                                                     |
| Mecanismo          | rotação automática agendada por tenant; manual em incidente                                            |
| Janela de overlap  | **24 h** aceitando ambas as chaves (`current` + `previous`)                                            |
| Notificação        | desktop avisado via push do relay 7 dias antes da rotação                                              |
| Auditoria          | toda rotação gera evento assinado no audit log (ADR-018)                                               |
| Revogação imediata | em incidente Sev1: chave atual invalidada em ≤ 5 min, nova distribuída via canal seguro (mTLS + DPAPI) |

### Fluxo de rotação automática

1. Relay gera nova chave HMAC, marca como `next` no KV.
2. Notifica desktop via canal seguro (request autenticado por mTLS).
3. Desktop salva `next` em DPAPI.
4. Em data D (90 dias após emissão): relay promove `next → current`, mantém `current → previous` por 24 h.
5. Após 24 h: `previous` removida.
6. Métricas: `hmac_rotation_total{tenant,result}`, `hmac_overlap_requests_total{tenant}` (requests aceitos com chave antiga durante janela).

---

## 10.2 SIEM forwarding

Logs estruturados do relay são exportados para SIEM externo do cliente (ou da Solution Ticket) para correlação com outras fontes (firewall, EDR, IdP).

| Item                | Valor                                                        |
| ------------------- | ------------------------------------------------------------ |
| Formato             | JSON estruturado (ECS — Elastic Common Schema)               |
| Retenção SIEM       | **1 ano** mínimo (separado da retenção §7.4)                 |
| Backends suportados | Splunk, Datadog, Grafana Loki, Elastic, sumô SIEM via syslog |
| Transporte          | TLS 1.3; HEC token (Splunk) ou OTLP-logs                     |
| Latência alvo       | ≤ 60 s do evento ao SIEM (p95)                               |

### Eventos críticos com alerta tempo real

| Evento                                      | Severidade | Threshold                                    |
| ------------------------------------------- | ---------- | -------------------------------------------- |
| Falha de autenticação (mTLS, API key, HMAC) | Alta       | > 10 falhas/min do mesmo tenant ou IP        |
| Anti-replay hit (nonce repetido)            | Crítica    | qualquer ocorrência (possível replay attack) |
| Anomalia de tráfego                         | Média      | volume > 5× a média móvel de 24 h por tenant |
| Tentativa de bypass de WAF                  | Crítica    | regra OWASP disparou + status 403            |
| HMAC fora da janela de overlap              | Média      | possível desincronização                     |
| Cert mTLS revogado usado                    | Crítica    | qualquer ocorrência                          |

### Cliente Enterprise — SIEM próprio

- Cliente pode apontar relay para próprio SIEM via API token.
- Subset de eventos (com mascaramento de PII) é replicado.
- Configuração no portal Enterprise.

---

## 10.3 BCP do relay

Business Continuity Plan do componente relay cloud.

| Métrica                            | Alvo            | Mecanismo                                                                                                                           |
| ---------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **RTO** (recovery time objective)  | **15 min**      | failover Cloudflare → AWS automático (DNS Route 53 health-check 30 s × 3 falhas)                                                    |
| **RPO** (recovery point objective) | **≤ 5 min**     | perda zero apenas para eventos já confirmados no outbox local; mensagens em voo no relay podem exigir reprocessamento/reconciliação |
| **Teste mensal**                   | 1ª terça do mês | drill de failover real (não simulado): switch DNS, valida fluxo end-to-end por 30 min, switch back                                  |

### Cenário de catastrófico (Cloudflare e AWS simultaneamente indisponíveis — improvável)

- Desktop entra em modo **outbox-buffer** (já é a arquitetura padrão — relay é só atalho de baixa latência).
- Eventos acumulam localmente até relay voltar.
- Sem perda de dados; aumento de latência (freshness inbox).
- Comunicação proativa aos clientes Tier-1 em ≤ 30 min.

### Critério de retomada pós-failover

- Métricas Cloudflare estabilizadas por 30 min.
- Switch back DNS gradual (50 % tráfego por 30 min, depois 100 %).
- Post-mortem obrigatório se RTO > 15 min ou se houve fallback para outbox-buffer.

---

## 11. Referências

- ADR-008 — Relay cloud webhook entrante
- ADR-015 — API pública anti-replay
- ADR-017 — Pipeline observabilidade
- `docs/integracao/ESTRATEGIA-RELAY-CLOUD.md`
- `docs/runbooks/integracao/failover-cloudflare-aws.md`
- `docs/integracao/SECURITY-INCIDENT-PLAYBOOK.md` (paralelo)
- OWASP API Security Top 10 — 2023
- LGPD Art. 46–49 (segurança e incidentes)
