# Estratégia de Relay Cloud para Webhooks Entrantes

**Componente**: Solution Ticket Webhook Relay
**Versão**: 1.0 — 2026-04-26
**Decisão arquitetural base**: ADR-006 (backend local) + ADR-008 (relay cloud)
**Escopo de entrega**: Fase 1 (mês 4–6), junto com primeiro conector cloud

---

## Sumário

1. [Problema](#1-problema)
2. [Visão geral da solução](#2-visão-geral-da-solução)
3. [Arquitetura](#3-arquitetura)
4. [Fluxo end-to-end](#4-fluxo-end-to-end)
5. [Componentes](#5-componentes)
6. [Segurança](#6-segurança)
7. [Multi-tenancy](#7-multi-tenancy)
8. [Resiliência e SLA](#8-resiliência-e-sla)
9. [Custos](#9-custos)
10. [Stack técnico](#10-stack-técnico)
11. [Roadmap de entrega](#11-roadmap-de-entrega)
12. [Operação](#12-operação)
13. [Compliance e LGPD](#13-compliance-e-lgpd)
14. [Riscos](#14-riscos)

---

## 1. Problema

ERPs cloud modernos (Bling, Omie, ContaAzul, SAP S/4HANA Cloud, Dynamics 365) entregam eventos via **webhook HTTP**: `POST https://<seu-endpoint>/webhook` quando algo muda (cliente bloqueado, pedido liberado, NF emitida).

O Solution Ticket é desktop local-first, com backend em `127.0.0.1:3001` (ADR-006). **Não é possível** receber webhook diretamente:

- Cliente não tem IP público
- Cliente não quer abrir firewall
- Expor backend é breach de segurança

Alternativas:

1. **Polling** — funciona quando ERP tem API "delta desde X". Padrão preferencial.
2. **Relay cloud** — quando ERP só oferece webhook. **Escopo deste documento**.
3. **iPaaS do cliente** — quando cliente já tem MuleSoft/Boomi. Aceito mas opcional.

---

## 2. Visão geral da solução

```
┌──────────────┐    webhook HTTPS     ┌─────────────────┐
│   ERP Cloud  │ ───────────────────▶│  Relay Cloud    │
│  (Bling etc) │                      │  (Cloudflare)   │
└──────────────┘                      └────────┬────────┘
                                               │
                                       fila durável
                                       por tenant
                                               │
                       long-polling HTTPS      ▼
┌──────────────────┐                   ┌──────────────┐
│ Solution Ticket  │ ◀──────────────── │ Fila tenant  │
│   (desktop)      │  agent puxa       │  (KV/Redis)  │
│   127.0.0.1      │  eventos          └──────────────┘
└──────────────────┘
        │
        ▼
   integracao_inbox
   (SQLite local)
```

**Princípio**: o Solution Ticket **inicia toda conexão**. O relay nunca abre conexão para o cliente. Isso preserva o local-first.

---

## 3. Arquitetura

### 3.1 Componentes lógicos

| Componente           | Onde roda                                 | Função                                                              |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| **Webhook Receiver** | Cloudflare Workers                        | Recebe POST do ERP, valida assinatura HMAC do ERP, persiste em fila |
| **Tenant Queue**     | Cloudflare KV (ou Durable Object + Queue) | Fila durável por tenant, retenção 7d                                |
| **Auth Service**     | Cloudflare Workers                        | Autentica agent local via token rotativo                            |
| **Polling Endpoint** | Cloudflare Workers                        | Long-polling: agent local pede eventos                              |
| **Admin API**        | Cloudflare Workers                        | Gerenciar tenants, tokens, métricas                                 |
| **Inbound Agent**    | Solution Ticket local                     | Background worker que faz long-polling, grava em `integracao_inbox` |
| **Inbox Processor**  | Solution Ticket local                     | Lê inbox, dispara conector apropriado para processar evento         |

### 3.2 Diagrama detalhado

```
ERP envia POST /webhook/<erp>/<tenant-id>
    │
    ▼
┌─────────────────────────────────┐
│  Webhook Receiver (Worker)      │
│  - Valida HMAC do ERP            │
│  - Valida tenant ativo           │
│  - Idempotency check (eventId)   │
│  - Persiste em Tenant Queue      │
│  - Retorna 200 OK ao ERP         │
└──────────────┬──────────────────┘
               │
               ▼
       ┌───────────────┐
       │ Tenant Queue  │  (Cloudflare KV ou Durable Object)
       │ Tenant ABC    │
       │ - evt001      │
       │ - evt002      │  (TTL 7 dias)
       │ - evt003      │
       └───────┬───────┘
               │
               │ long-poll (timeout 30s)
               │
       ┌───────▼────────────────────┐
       │  Polling Endpoint (Worker) │
       │  GET /poll?since=evt002    │
       │  Auth: Bearer <tenant-tok> │
       └───────┬────────────────────┘
               │ retorna [evt003]
               ▼
       ┌────────────────────────────┐
       │  Inbound Agent (local)     │
       │  - Poll a cada 5–30s       │
       │  - Grava em integracao_    │
       │    inbox com idempotency   │
       │  - Confirma ack ao relay   │
       └───────┬────────────────────┘
               │
               ▼
       integracao_inbox (SQLite)
               │
               ▼
       Inbox Processor → conector ERP
```

---

## 4. Fluxo end-to-end

### 4.1 Onboarding de tenant

1. Cliente compra plano que inclui webhook entrante
2. Backend Solution Ticket gera token único do tenant via Admin API do relay; o token é **vinculado ao fingerprint RSA** da instalação (alinhado com ADR-010 — single-tenant — e com o esquema de licenciamento)
3. Token é armazenado no cofre local (DPAPI)
4. URL do webhook do tenant é exibida ao cliente: `https://relay.solution-ticket.com/webhook/bling/<tenant-id>`
5. Cliente cadastra essa URL no painel do ERP

#### 4.1.1 Rotação de token em re-fingerprint (reinstalação ou troca de hardware)

Reinstalar o Solution Ticket (formatação, troca de SSD, mudança do volume `C:`) muda o fingerprint RSA da máquina. Token antigo deixa de bater com o novo fingerprint — fluxo obrigatório:

1. **Detectar mismatch**: na primeira chamada ao relay após reinstalação, Worker do relay valida `tokenFingerprint != currentFingerprint` → resposta `401 fingerprint_mismatch`.
2. **Bloqueio defensivo**: relay marca subscription como `SUSPENDED` (não consome eventos da fila, mas preserva eventos pendentes por 7d/30d conforme tier).
3. **Gerar novo token**: agent local re-autentica via Admin API usando a chave mestra de licença + fingerprint novo. Admin API emite novo token.
4. **Invalidar antigo**: token antigo entra em blocklist (não pode ser reutilizado mesmo se reaparecer); auditoria registra `tokenRotationReason=fingerprint_changed`.
5. **Reativar subscription**: marca como `ACTIVE` com novo token.
6. **Aviso ao cliente**: UI local exibe banner "Token de webhook foi rotacionado por mudança de hardware — sem ação necessária".

Se o cliente NÃO completou licenciamento da nova instalação, o passo 3 falha → subscription continua `SUSPENDED` até regularizar.

### 4.2 Recebimento de evento

1. ERP dispara `POST` para a URL do tenant
2. Worker valida HMAC do ERP (usando segredo configurado no tenant)
3. Worker calcula idempotency key (`eventId` do ERP) e checa duplicidade na fila
4. Se novo, persiste em `Tenant Queue` com TTL 7 dias
5. Retorna 200 OK ao ERP imediatamente

### 4.3 Consumo pelo agent local

1. Inbound Agent faz `GET /poll?since=<lastSeenEventId>` com long-polling (timeout 30s)
2. Worker retorna eventos novos (até 100 por chamada) ou aguarda novo evento até timeout
3. Agent grava cada evento em `integracao_inbox` com idempotency key
4. Agent envia `ACK` com IDs processados → Worker remove da fila
5. Loop se reinicia

### 4.4 Processamento local

1. Inbox Processor lê eventos com status `PENDING`
2. Resolve qual conector deve processar (baseado no campo `source`)
3. Conector traduz payload do ERP → ação canônica (ex: cliente bloqueado → atualizar `tclientes.status`)
4. Marca evento como `CONFIRMED` ou `FAILED`

---

## 5. Componentes

### 5.1 Webhook Receiver

- Endpoint: `POST /webhook/<erp>/<tenant-id>`
- Tempo de resposta: < 200ms (validar e enfileirar)
- Tamanho máximo de payload: 10 MB
- Rate limit por tenant: 100 req/min (configurável)
- Logs: todos os requests com `eventId` e `tenantId`, sem payload completo

### 5.2 Polling Endpoint

- Endpoint: `GET /poll?since=<eventId>&limit=100`
- Long-polling com timeout 30s
- Retorna eventos em ordem de chegada
- Cliente envia `POST /ack` com IDs processados para limpar da fila

### 5.3 Admin API

- `POST /admin/tenants` — criar tenant
- `POST /admin/tenants/<id>/tokens/rotate` — rotacionar token
- `GET /admin/tenants/<id>/metrics` — métricas do tenant
- `DELETE /admin/tenants/<id>` — desativar
- Auth: chave mestra do Solution Ticket (única, no cofre central)

### 5.4 Inbound Agent (local)

- Implementado em `backend/src/integracao/relay/inbound-agent.service.ts`
- Inicializa no boot do backend
- Mantém conexão long-poll permanente quando tenant tem webhooks ativos
- Reconecta automaticamente em caso de falha
- Métricas: eventos recebidos, latência, erros

### 5.5 Configuração no Solution Ticket

Tabela `integracao_relay_subscription`:

| Campo                     | Descrição                 |
| ------------------------- | ------------------------- |
| `tenantId`                | UUID do tenant local      |
| `connectorCode`           | `bling`, `omie`, etc.     |
| `relayUrl`                | URL do relay              |
| `tenantToken`             | Token armazenado no cofre |
| `lastSeenEventId`         | Último evento processado  |
| `enabled`                 | Boolean                   |
| `createdAt` / `updatedAt` | Timestamps                |

---

## 6. Segurança

### 6.1 Autenticação ERP → Relay

- Cada ERP usa sua própria assinatura (HMAC SHA-256 padrão)
- Segredo configurado por tenant no Admin API
- Worker valida antes de enfileirar — assinatura inválida → 401 + log
- **Anti-replay obrigatório** (resolve achado CRITICAL C2 da auditoria):
  - Header de timestamp do ERP é **obrigatório** (varia por ERP: `x-bling-timestamp`, `sap-timestamp`, etc.)
  - Janela aceita: ±5 minutos do horário atual do Worker
  - Cache de `eventId` em Cloudflare KV com TTL 10 min — segundo POST com mesmo `eventId` é rejeitado com 409 mesmo que HMAC seja válido
  - ERP sem header de timestamp nativo: usar `Date` do request ou rejeitar com 400
  - Sem janela = sem aceite — evita replay de eventos antigos por ERP comprometido

### 6.2 Autenticação Relay → Agent

- Token Bearer rotativo (TTL 90 dias)
- Renovação automática 30 dias antes de expirar
- Em caso de comprometimento: rotação imediata via Admin API

### 6.3 Criptografia

- TLS 1.3 obrigatório em todas as conexões
- Payload criptografado em repouso (Cloudflare KV usa AES-256 nativo)
- Logs **não** contêm payload completo, apenas metadata

### 6.4 Isolamento entre tenants

- Token de tenant A **não** acessa fila de tenant B
- Worker checa ownership em toda chamada
- Quotas por tenant (rate limit, storage)

### 6.5 Mascaramento

- Payloads gravados localmente passam pelo mesmo mascaramento do `IntegrationLogService`
- CPF, CNPJ, dados bancários nunca aparecem em log central

---

## 7. Multi-tenancy

### 7.1 Modelo

- 1 tenant relay = 1 instância Solution Ticket (alinhado com ADR-010 — single-tenant por instalação)
- 1 tenant pode ter N subscriptions (1 para Bling, 1 para Omie, etc.)
- Quotas configuráveis por tier de assinatura:

> **Nota cruzada — superfícies de rate limit distintas**:
> O rate limit do **relay** (descrito aqui) controla **entrada** de webhooks vindos do ERP externo até a fila do tenant. É superfície distinta da **API pública do Solution Ticket** (`docs/integracao/003-api-publica-v1.md` §6, porta `:3002` por ADR-013), que controla **saída** ao integrador externo (iPaaS, scripts do cliente). As cotas e granularidades são independentes — relay limita por `tenantId+ERP origem`, a API pública limita por **API key** local. Mesmo cliente pode estourar uma sem afetar a outra.

| Tier       | Rate limit   | Storage fila | Retenção |
| ---------- | ------------ | ------------ | -------- |
| Pro        | 100 req/min  | 100 MB       | 7 dias   |
| Enterprise | 1000 req/min | 1 GB         | 30 dias  |

### 7.2 Provisionamento

- Automático via Admin API quando cliente compra plano
- Self-service: cliente vê URL do webhook no painel local
- Desativação suave: tenant marcado como inativo, fila preserva por 30 dias antes de deletar

---

## 8. Resiliência e SLA

### 8.1 SLA do relay

- **Disponibilidade**: 99.9% mensal
- **Latência**: webhook → fila < 200ms p99
- **Retenção**: 7 dias (Pro), 30 dias (Enterprise)
- **Throughput por tenant**: até 100 req/s (Pro), 1000 req/s (Enterprise)

### 8.2 Cenários de falha

| Cenário                           | Comportamento                                          |
| --------------------------------- | ------------------------------------------------------ |
| Cloudflare cai                    | Eventos perdidos por janela curta (raro, < 1min/ano)   |
| ERP envia mais que rate limit     | 429 + Retry-After; ERP normalmente retenta             |
| Cliente offline > 7 dias          | Eventos expiram; cliente faz **pull manual** ao voltar |
| Token comprometido                | Rotação via Admin API + auditoria                      |
| Cliente reinstala Solution Ticket | Token preserva-se via cofre; agent reconecta           |

### 8.3 Plano B

- **Cloudflare degradado** → DNS aponta para fallback AWS Lambda + SQS (cold standby)
- **Tenant precisa de garantia mais forte** → oferecer iPaaS dedicado (pago à parte)

---

## 9. Custos

### 9.1 Estimativa Cloudflare Workers (free tier + paid)

- **Free tier**: 100k requests/dia
- **Paid**: $5/mês inclui 10M requests
- Storage KV: $0.50/GB/mês

### 9.2 Modelo de custo por tenant

| Volume mensal | Custo cloud | Repassado ao cliente   |
| ------------- | ----------- | ---------------------- |
| < 10k eventos | ~$0         | Incluído no Pro        |
| 10k–100k      | ~$2         | Incluído no Pro        |
| 100k–1M       | ~$15        | Incluído no Enterprise |
| > 1M          | $50+        | Excedente cobrado      |

### 9.3 Custo total projetado

- **Mês 6** (15 clientes): ~$50/mês
- **Mês 12** (50 clientes): ~$200/mês
- **Mês 18** (150 clientes): ~$800/mês

Custo desprezível comparado ao MRR projetado.

### 9.4 Budget alerts (Auditoria Rodada 5)

> Auditoria Rodada 5 (Agente 3): custos sem budget alert. Esta seção fecha o gap.

Configurar alerta de orçamento mensal em **3 thresholds**, tanto no Cloudflare quanto na AWS (failover):

| Threshold | Ação                                                                                                                                       | Severidade    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| **50 %**  | E-mail informativo para tech lead + CTO                                                                                                    | P3 — registro |
| **80 %**  | E-mail + alerta P2 ao plantonista; revisar dashboard de uso por tenant                                                                     | P2            |
| **100 %** | Alerta P1; cobrar excedente em contratos Enterprise; avaliar kill-switch de feature em conector específico se for um único tenant abusando | P1            |

#### Configuração Cloudflare

- Account → Billing → Notifications → "Set spending threshold".
- Configurar 3 thresholds (50/80/100% do budget mensal acordado).
- Notificação por e-mail + webhook para Slack/OpsGenie.

#### Configuração AWS (failover ativo)

- AWS Budgets → "Create budget" tipo Cost.
- Período mensal; thresholds 50/80/100% do budget acordado.
- SNS topic → integrado com OpsGenie/PagerDuty, severidades P3/P2/P1.

#### Budget de referência por marco

| Marco                 | Budget mensal alvo (Cloudflare + AWS) |
| --------------------- | ------------------------------------- |
| Mês 6 (15 clientes)   | US$ 75 (50 % buffer sobre projeção)   |
| Mês 12 (50 clientes)  | US$ 300                               |
| Mês 18 (150 clientes) | US$ 1.200                             |

Revisão do budget acompanha cada milestone de captação. Ver `ON-CALL.md` para escalonamento.

---

## 10. Stack técnico

### 10.1 Cloud

- **Cloudflare Workers** — compute serverless, global, baixa latência BR
- **Cloudflare KV** — storage durável para fila pequena/média
- **Cloudflare Durable Objects** (Fase 2 do relay) — para garantia de ordem por tenant
- **Cloudflare Logpush** — logs para análise

### 10.2 Linguagem

- TypeScript (mesmo stack do produto)
- `wrangler` para deploy
- `vitest` para testes

### 10.3 Repositório

- Repo separado: `solution-ticket-relay`
- CI/CD próprio (GitHub Actions + wrangler deploy)
- Versionamento independente

---

## 11. Roadmap de entrega

### Sprint 6–7 (Fase 1, mês 4)

- Repo `solution-ticket-relay` criado
- Webhook Receiver básico (Bling apenas)
- Tenant Queue em KV
- Polling Endpoint com long-polling
- Admin API mínima
- Deploy em Cloudflare (ambiente staging)

### Sprint 8 (Fase 1, mês 5)

- Inbound Agent no Solution Ticket
- Tabela `integracao_relay_subscription`
- UI para mostrar URL do webhook ao cliente
- Testes e2e: ERP simulado → relay → agent → inbox local

### Sprint 9–10 (Fase 1, mês 5–6)

- Suporte a múltiplos ERPs (Omie, ContaAzul)
- Métricas e alertas
- Documentação de operação
- Production launch

### Fase 2+ (mês 7+)

- Durable Objects para garantia de ordem
- Suporte a payloads grandes (> 10 MB) via blob storage
- Replay de eventos para tenant offline > 7d (sob demanda)
- Dashboard público de status (status.solution-ticket.com)

---

## 12. Operação

### 12.1 Monitoramento

- Cloudflare Analytics nativo (requests, errors, latency)
- Logpush → BigQuery (ou similar) para análise histórica
- Alertas:
  - Erro 5xx > 1% por 5 min → on-call
  - Latência p99 > 500ms por 10 min → investigar
  - Storage de tenant > 80% da quota → notificar cliente

### 12.2 Runbook básico

- **Tenant não recebe eventos** → checar token válido, agent rodando, ERP cadastrou URL correta
- **Eventos atrasados** → checar fila do tenant, verificar se agent está conectado
- **Erro 401 do ERP** → segredo HMAC desatualizado; cliente deve regenerar
- **Rate limit excedido** → upgrade de tier ou pedir ERP para reduzir frequência

### 12.3 Capacidade

- Plano de escala: até 10k tenants no setup atual
- Ponto de revisão: 1k tenants ou $500/mês de custo cloud (o que vier primeiro)

---

## 13. Compliance e LGPD

### 13.1 Data Processing Agreement

- DPA assinada com Cloudflare antes de produção
- Solution Ticket = controlador; Cloudflare = operador

### 13.2 Região

- Workers rodam em edge global, mas KV pode ser configurado para preferência regional
- Default: edge global (latência mínima)
- Opção Enterprise: região dedicada (Brasil/EU/US)

### 13.3 Direito ao esquecimento

- Tenant deletado → fila purgada em 24h
- Logs anonimizados após 90 dias
- Auditoria de acesso preservada por 5 anos

### 13.4 Mínima coleta

- Relay armazena apenas o necessário para entregar evento
- Após `ACK` do agent, evento removido em até 1h
- Sem analytics de conteúdo de payload

---

## 14. Riscos

| #   | Risco                                   | Impacto            | Mitigação                                        |
| --- | --------------------------------------- | ------------------ | ------------------------------------------------ |
| RC1 | Cloudflare degrada/cai                  | Alto (sem webhook) | Plano B AWS; SLA Cloudflare 99.99%; falhas raras |
| RC2 | Custo cresce mais que projetado         | Médio              | Revisão mês 6; modelo de excedente claro         |
| RC3 | Vazamento de token                      | Crítico            | Rotação automática; auditoria; HMAC duplo        |
| RC4 | LGPD exige hospedagem BR                | Médio              | Cloudflare suporta região; migrar se necessário  |
| RC5 | Cliente offline > 7 dias perde eventos  | Médio              | Aviso na UI; opção Enterprise com retenção 30d   |
| RC6 | ERP envia volume muito além do esperado | Médio              | Rate limit por tenant; alerta proativo           |
| RC7 | Concorrente compromete imagem do relay  | Baixo              | Marca própria; SLA público; transparência        |

---

## Referências

- ADR-006 — Backend não exposto publicamente
- ADR-008 — Relay Cloud (esta decisão)
- `docs/PLANO-MODULO-INTEGRACAO.md` seção 17 (R14)
- `docs/GUIA-INTEGRACAO-ERP.md` seção 8.7
- Cloudflare Workers + KV documentation
