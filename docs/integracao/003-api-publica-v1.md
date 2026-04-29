# 003 — API Pública v1

**Versão**: 1.0 — 2026-04-26
**Base URL**: `http://127.0.0.1:3002/api/v1/integration` (local — porta separada do backend interno conforme ADR-013) ou `https://<host>/api/v1/integration` (LAN com TLS, opt-in)
**Documentação OpenAPI**: `/api/v1/integration/docs` (Swagger UI)
**ADR base**: ADR-009 (versionamento)

---

## 1. Princípios

- Versionamento na URL (`/v1`, `/v2`)
- Autenticação obrigatória (API Key ou OAuth)
- Idempotência via header `Idempotency-Key` (mapeada para `idempotencyKey` interna do outbox conforme `004-outbox-inbox-retry.md` §7.3)
- Rate limit **por API key** (NÃO por "tenant SaaS" — Solution Ticket é single-tenant por instalação conforme ADR-010; cada API key emitida pelo painel admin local tem sua própria cota)
- Resposta envelope: `{ success, data, timestamp, correlationId }`
- Erros padronizados RFC 7807 (Problem Details)
- TLS obrigatório fora de localhost
- Superfície separada do backend interno: porta `:3002` (ADR-013), nunca `:3001`

---

## 2. Autenticação

### 2.1 API Key (recomendado para integrações simples)

```
GET /api/v1/integration/health
Authorization: Bearer st_pro_a3f8b2c1...
```

API Key gerada no painel admin, escopos configuráveis.

### 2.2 OAuth 2.0 Client Credentials (Enterprise)

```
POST /api/v1/integration/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=...&client_secret=...&scope=integration.read+integration.write
```

Resposta:

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "integration.read integration.write"
}
```

### 2.3 Escopos

- `integration.read` — listagem e consulta
- `integration.write` — criar/editar/disparar
- `integration.admin` — configurar conectores e mapping

---

## 3. Headers padrão

| Header            | Obrigatório               | Descrição                   |
| ----------------- | ------------------------- | --------------------------- |
| `Authorization`   | Sim                       | Bearer token                |
| `Idempotency-Key` | Em POSTs                  | UUID v4 — evita duplicidade |
| `X-Tenant-Id`     | Em ambientes multi-tenant | UUID do tenant              |
| `Accept-Language` | Não                       | `pt-BR` (default)           |
| `X-Request-Id`    | Opcional                  | Correlation ID propagado    |

---

## 4. Resposta padrão

### 4.1 Sucesso

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-27T10:16:00-04:00",
  "correlationId": "uuid-v4"
}
```

### 4.2 Erro (RFC 7807)

```json
{
  "success": false,
  "error": {
    "type": "https://docs.solution-ticket.com/errors/business-rule-violation",
    "title": "Cliente bloqueado",
    "status": 422,
    "detail": "Cliente CNPJ 12.345.678/0001-90 está bloqueado no ERP",
    "instance": "/api/v1/integration/weighing-tickets/abc/export",
    "code": "PARTNER_BLOCKED",
    "category": "business",
    "fields": []
  },
  "timestamp": "2026-04-27T10:16:00-04:00",
  "correlationId": "uuid-v4"
}
```

---

## 5. Endpoints

### 5.1 Sistema

#### `GET /health`

Healthcheck do hub.

- 200: `{ status: "ok", uptime: 123, version: "1.0.0" }`
- 503: degradado

#### `GET /capabilities`

Capacidades do hub.

- 200: `{ canonicalVersions: ["v1"], connectors: [...], features: {...} }`

---

### 5.2 Cadastros (importação inbound)

#### `POST /partners/import`

Importa lista de parceiros (clientes/fornecedores).

Request:

```json
{
  "items": [
    { "taxId": "12345678000190", "name": "...", "type": "CUSTOMER", ... }
  ]
}
```

Response 200:

```json
{
  "success": true,
  "data": { "imported": 95, "skipped": 5, "errors": [...] }
}
```

#### `GET /partners?taxId=12345678000190`

Lista/busca parceiros.

#### `POST /products/import`

Idem para produtos. Mesmo schema.

#### `POST /vehicles/import`

Idem para veículos.

#### `POST /drivers/import`

Idem para motoristas.

#### `POST /order-references/import`

Importa referências de pedidos/contratos.

#### `GET /order-references/{id}`

Consulta referência.

---

### 5.3 Tickets de pesagem

#### `GET /weighing-tickets`

Lista tickets fechados, com filtros.

Query params: `from`, `to`, `status`, `partnerId`, `unitId`, `page`, `pageSize`

Response 200:

```json
{
  "success": true,
  "data": {
    "items": [ ... CanonicalWeighingTicket ... ],
    "pagination": {
      "page": 1, "pageSize": 50, "total": 1234,
      "hasNext": true, "nextCursor": "..."
    }
  }
}
```

#### `GET /weighing-tickets/{id}`

Consulta ticket específico no formato canônico.

#### `POST /weighing-tickets/{id}/export`

Força envio do ticket para os conectores configurados.

Body opcional:

```json
{ "connectorIds": ["bling-prod"] }
```

#### `POST /weighing-tickets/{id}/cancel`

Cancela ticket e dispara evento de cancelamento aos conectores.

Body:

```json
{ "reason": "Pesagem em duplicidade" }
```

#### `POST /weighing-tickets/{id}/reprocess`

Reenvia ticket com falha.

---

### 5.4 Eventos e fila

#### `GET /events`

Lista eventos da outbox/inbox.

Query: `direction` (`outbound`/`inbound`), `status`, `connectorId`, `from`, `to`

#### `GET /outbox`

Lista detalhada de outbox.

#### `POST /outbox/{id}/retry`

Força retry de evento.

#### `POST /outbox/{id}/cancel`

Cancela evento na outbox (não envia).

#### `POST /outbox/{id}/ignore`

Marca como ignorado (com justificativa obrigatória).

---

### 5.5 Reconciliação

#### `GET /reconciliation`

Lista runs de reconciliação.

#### `POST /reconciliation/run`

Dispara nova reconciliação.

Body:

```json
{ "from": "2026-04-01", "to": "2026-04-26", "connectorId": "bling-prod" }
```

Response 202:

```json
{ "success": true, "data": { "runId": "...", "status": "RUNNING" } }
```

#### `GET /reconciliation/{runId}`

Status e resultado da reconciliação.

---

### 5.6 Admin (escopo `integration.admin`)

#### `GET /profiles` `POST /profiles` `PATCH /profiles/{id}` `DELETE /profiles/{id}`

CRUD de perfis de integração.

#### `POST /profiles/{id}/test-connection`

Testa conexão com o ERP.

#### `GET /mapping?profileId=X` `POST /mapping` `PATCH /mapping/{id}`

CRUD de mapping.

#### `POST /mapping/validate`

Valida YAML de mapping antes de salvar.

#### `POST /mapping/preview`

Aplica mapping a um payload de teste e retorna o resultado.

---

## 6. Rate limit

**Granularidade**: por **API key** emitida no painel admin local. Solution Ticket é single-tenant por instalação (ADR-010) — não existe "rate limit por tenant SaaS"; existe rate limit por **credencial de acesso** à instalação.

| Plano da instalação | Requests/min por API key | Burst |
| ------------------- | ------------------------ | ----- |
| Pro                 | 600                      | 100   |
| Enterprise          | 6000                     | 1000  |

Cada instalação pode emitir N API keys (ex: 1 para iPaaS, 1 para script de exportação, 1 para dashboard externo). Cada uma é contada separadamente.

Headers de resposta:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

Excesso: 429 com `Retry-After`.

> Cross-link: ADR-010 (single-tenant) e ADR-013 (split de portas — esta API roda em `:3002`).

---

## 7. Idempotência

POSTs que mutam estado aceitam header `Idempotency-Key` (UUID v4).

- Mesma chave em < 24h → mesma resposta (cache)
- Chave nova ou expirada → nova execução

Implementação:

```
Idempotency-Key: 7f6e8a3b-9c2d-4e5f-1234-567890abcdef
```

---

## 8. Webhooks emitidos pelo Hub

Configuráveis por conector. Disparados quando evento muda de estado.

Eventos:

- `weighing.ticket.exported`
- `weighing.ticket.export_failed`
- `weighing.ticket.cancelled`
- `integration.connector.health_degraded`
- `integration.dlq.threshold_exceeded`

Payload assinado HMAC-SHA256:

```
X-SolutionTicket-Signature: sha256=...
X-SolutionTicket-Timestamp: 2026-04-27T10:16:00Z
X-SolutionTicket-Event-Id: uuid
```

---

## 9. Códigos de erro padronizados

| Code                   | HTTP | Categoria | Quando                            |
| ---------------------- | ---- | --------- | --------------------------------- |
| `AUTH_REQUIRED`        | 401  | technical | Sem token                         |
| `AUTH_INVALID`         | 401  | technical | Token inválido/expirado           |
| `INSUFFICIENT_SCOPE`   | 403  | technical | Escopo OAuth insuficiente         |
| `RATE_LIMIT_EXCEEDED`  | 429  | technical | Excesso de requests               |
| `RESOURCE_NOT_FOUND`   | 404  | business  | Entity ID não existe              |
| `VALIDATION_FAILED`    | 400  | business  | Payload inválido                  |
| `PARTNER_BLOCKED`      | 422  | business  | Cliente/fornecedor bloqueado      |
| `PRODUCT_NOT_MAPPED`   | 422  | business  | Lookup falhou                     |
| `IDEMPOTENCY_CONFLICT` | 409  | business  | Mesma chave com payload diferente |
| `INTERNAL_ERROR`       | 500  | technical | Erro interno                      |
| `ERP_UNAVAILABLE`      | 503  | technical | ERP fora do ar                    |

---

## 10. SDKs

Não há SDK oficial na v1 (TypeScript planejado para Fase 4 junto com SDK de conector). Cliente deve consumir REST direto.

Exemplos em curl/Postman publicados em `docs/integracao/exemplos/`.

---

## 11. Compatibilidade

- Adicionar campo opcional na resposta: OK em v1
- Adicionar parâmetro opcional na request: OK em v1
- Mudar tipo, tornar campo obrigatório, renomear endpoint: exige v2

Detalhes em ADR-009.
