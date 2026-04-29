# One-Pager Técnico — Solution Ticket Integration Hub

**Audiência**: CTO, Tech Lead, Arquiteto, Diretor de TI
**Versão**: 1.0 — 2026-04-26

---

## Layout do PDF (descrição visual)

### Topo

- Logo + tagline técnica: **"Hub de integração ERP local-first com garantias de entrega at-least-once"**

---

### Bloco 1 — Stack & Arquitetura

**Stack**:

- Backend: NestJS + Prisma + SQLite local
- Frontend: Next.js + Electron (desktop)
- Cofre: Windows DPAPI
- Observabilidade: OpenTelemetry + Prometheus
- Relay cloud: Cloudflare Workers + KV

**Arquitetura** (diagrama compacto):

```
Módulos negócio (ticket, romaneio)
        ↓ events
Outbox transacional (SQLite)
        ↓
Worker + Mapping Engine (YAML)
        ↓
Conectores plugáveis (IErpConnector)
        ↓
ERP / iPaaS / SFTP
```

---

### Bloco 2 — Garantias técnicas

**Resiliência**:

- ✅ At-least-once delivery (outbox transacional)
- ✅ Idempotência por chave determinística
- ✅ Retry com backoff exponencial + jitter
- ✅ Dead-letter queue com classificação técnico/negócio
- ✅ Circuit breaker por endpoint
- ✅ Bulkhead — pool isolado por cliente

**Performance**:

- ✅ ≥ 1.000 ev/min com Mock; capacidade real por conector em `docs/integracao/CAPACITY.md` (Bling 180, Omie 40-55 ev/min)
- ✅ Latência p95 < 2s
- ✅ Cobertura de testes ≥ 85%

---

### Bloco 3 — Segurança

- 🔒 **Cofre DPAPI**: credenciais encriptadas pelo Windows
- 🔒 **TLS 1.3 obrigatório** em todas comunicações externas
- 🔒 **Backend só localhost** (`127.0.0.1:3001`)
- 🔒 **Webhook entrante via relay cloud** (nunca expõe backend)
- 🔒 **Mascaramento automático** de PII em logs (CPF, CNPJ, tokens)
- 🔒 **HMAC-SHA256** em webhooks emitidos
- 🔒 **OAuth 2.0 + Authorization Code + PKCE** suportado
- 🔒 **mTLS opcional** (Enterprise)
- 🔒 **LGPD compliant**: minimização, mascaramento, esquecimento

---

### Bloco 4 — Métodos de integração suportados

| Método     | Conectores que usam                                |
| ---------- | -------------------------------------------------- |
| REST/JSON  | Bling, Omie, ContaAzul, Tiny, Sankhya              |
| OData v4   | SAP S/4HANA, Dynamics 365 BC                       |
| OData v2   | Dynamics 365 F&O                                   |
| SOAP       | TOTVS Protheus, NetSuite legado, Sage X3           |
| BAPI/RFC   | SAP ECC (via JCo)                                  |
| GraphQL    | Odoo 17+                                           |
| XML-RPC    | Odoo (legado)                                      |
| SFTP       | Genérico                                           |
| CSV/XML    | Genérico                                           |
| Mensageria | SAP Event Mesh, Azure Service Bus, AWS EventBridge |
| Webhook    | Via relay cloud Cloudflare                         |

---

### Bloco 5 — Modelo canônico

8 entidades versionadas:

- `WeighingTicket`, `WeighingEvent`
- `Partner`, `Vehicle`, `Driver`
- `Product`, `Location`
- `OrderReference`, `FiscalDocumentReference`
- `QualityDiscount`, `InventoryMovement`, `Attachment`

Mapping declarativo em YAML — sem código por cliente.

---

### Bloco 6 — Auditoria fiscal

- ✅ Append-only storage (SQLite)
- ✅ Hash SHA-256 por documento
- ✅ Retenção 5 anos (Receita Federal)
- ✅ Export para auditoria em 1 clique
- ✅ Correlation ID rastreável end-to-end

---

### Bloco 7 — APIs públicas

- REST `/api/v1/integration` versionada
- OpenAPI/Swagger publicado
- Auth: API Key + OAuth 2.0
- Rate limit por tenant
- Idempotência via header `Idempotency-Key`
- Webhooks emitidos com HMAC

---

### Bloco 8 — SDK para parceiros (Fase 4)

Disponível em 2027:

- Interface `IErpConnector` documentada
- CLI scaffold de novo conector
- TCK (Test Conformance Kit)
- Marketplace 70/30 revenue share

---

### Rodapé

**Material técnico**:

- Documentação: solution-ticket.com/docs
- ADRs: solution-ticket.com/adrs
- API Reference: solution-ticket.com/api/v1
- GitHub (público — Fase 4): github.com/solution-ticket
- Status público: status.solution-ticket.com

**Avaliação técnica**:

- PoC 7 dias gratuita
- Acesso a sandbox completo
- Reunião com Tech Lead

---

## Especificação para designer

- Mesmo padrão visual do one-pager executivo
- Estilo "tech": fontes monospace para snippets de código
- Diagrama de arquitetura caprichado
- Espaço para QR codes (link para docs)
