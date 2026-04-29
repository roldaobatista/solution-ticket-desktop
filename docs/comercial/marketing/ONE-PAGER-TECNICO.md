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
- Observabilidade: logs estruturados, health/readiness e métricas agregadas por tenant
- Relay cloud: roadmap; backend desktop permanece em loopback

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
ERP via REST genérico / conectores dedicados homologados
```

---

### Bloco 2 — Garantias técnicas

**Resiliência**:

- ✅ At-least-once delivery (outbox transacional)
- ✅ Idempotência por chave determinística
- ✅ Retry com backoff exponencial + jitter
- ✅ Estados de reprocessamento e classificação técnico/negócio no outbox
- Planejado: circuit breaker e bulkhead por conector dedicado

**Performance**:

- Capacidade deve ser validada por conector/cliente em homologação
- Latência depende do ERP alvo e da rede local
- Cobertura de testes é medida no CI, sem claim comercial fixo

---

### Bloco 3 — Segurança

- 🔒 **Cofre DPAPI**: credenciais encriptadas pelo Windows
- 🔒 **TLS 1.3 obrigatório** em todas comunicações externas
- 🔒 **Backend só localhost** (`127.0.0.1:3001`)
- 🔒 **Backend local em loopback**; relay cloud é roadmap
- 🔒 **Mascaramento automático** de PII em logs (CPF, CNPJ, tokens)
- 🔒 **Webhook emitido com URL validada**; assinatura HMAC é roadmap
- 🔒 **OAuth 2.0/PKCE e mTLS** dependem do conector dedicado contratado
- 🔒 **LGPD compliant**: minimização, mascaramento, esquecimento

---

### Bloco 4 — Métodos de integração suportados

| Método          | Conectores que usam                   |
| --------------- | ------------------------------------- |
| REST/JSON       | Disponível hoje via conector genérico |
| Mock ERP        | Disponível hoje para demo/testes      |
| OData/SOAP/SFTP | Planejado por conector dedicado       |
| Fiscal direto   | Roadmap, fora do MVP atual            |

---

### Bloco 5 — Modelo canônico

8 entidades versionadas:

- `WeighingTicket`, `WeighingEvent`
- `Partner`, `Vehicle`, `Driver`
- `Product`, `Location`
- `OrderReference`, `FiscalDocumentReference`
- `QualityDiscount`, `InventoryMovement`, `Attachment`

Mapping declarativo é roadmap; hoje o conector REST genérico exige configuração assistida.

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
