# ADR-010: Modelo de Tenancy

**Status**: Aprovada (resolve achado CRITICAL C1 da auditoria 10-agentes)
**Data**: 2026-04-26

## Contexto

Auditoria 10-agentes apontou inconsistência entre:

- `CLAUDE.md`: produto é desktop **single-tenant** (1 instalação = 1 cliente, SQLite local)
- `002-modelo-canonico.md`: usa `tenantId/companyId/unitId` em todo `WeighingTicket`
- `003-api-publica-v1.md`: lista `X-Tenant-Id` header
- `ESTRATEGIA-RELAY-CLOUD.md`: modela "1 tenant relay = 1 instância"

Falta clareza: `tenantId` significa o quê?

## Decisão

**O Solution Ticket é desktop single-tenant SaaS-like**:

| Conceito                   | Significado                                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cliente (assinante)**    | 1 empresa que comprou licença = 1 instalação física do Solution Ticket                                                                       |
| **`tenantId` no canônico** | Identificador da **empresa fiscal local** (SA1/SA2 do Protheus, Business Code do SAP) — útil em multi-empresa **dentro da mesma instalação** |
| **`companyId`**            | Subdivisão organizacional dentro do tenant                                                                                                   |
| **`unitId`**               | Filial / unidade física (balança específica)                                                                                                 |
| **Relay cloud `tenantId`** | Mapeia 1:1 com **instalação física** — token é vinculado ao fingerprint RSA da máquina                                                       |

### Implicações

1. **API pública** (`/api/v1/integration/*`) **roda em `127.0.0.1`** — não há multi-tenancy lógica no backend; cada instalação tem sua porta
2. **Header `X-Tenant-Id`** é **opcional** — usado apenas quando cliente tem multi-empresa fiscal numa mesma instalação (ex: cooperativa com 3 CNPJs no mesmo Protheus)
3. **Relay cloud** não isola tenants logicamente — cada instalação tem token único + fingerprint
4. **Banco SQLite** não tem coluna `tenantId` global — `tenantId` aplica-se apenas a entidades que admitem multi-empresa fiscal

### Migração

- Documentos existentes mantêm `tenantId/companyId/unitId` na estrutura canônica
- Fica claro que `tenantId = empresa fiscal`, não "tenant SaaS"
- Atualizar `003-api-publica-v1.md` marcando `X-Tenant-Id` como opcional
- Atualizar `ESTRATEGIA-RELAY-CLOUD.md` esclarecendo que tenant relay = instalação

## Consequências

### Positivas

- Coerência entre CLAUDE.md, ADRs e código
- Multi-empresa real (cooperativas, holdings) suportada
- Sem complexidade SaaS desnecessária

### Negativas

- Migrar para SaaS multi-tenant cloud no futuro exigirá mudança estrutural
- Documentação histórica mistura "tenant" com 2 sentidos — atualizar gradualmente

## Alternativas consideradas

- **Multi-tenant SaaS cloud**: rejeitada — contraria local-first do produto
- **Sem `tenantId`**: rejeitada — quebra suporte a multi-empresa fiscal local

## Referências

- Auditoria 10-agentes findings C1 (`docs/auditoria/AUDITORIA-10-AGENTES-2026-04-26.md`)
- `CLAUDE.md` — princípios do produto
