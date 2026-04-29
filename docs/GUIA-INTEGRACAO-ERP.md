# Guia Profissional — Módulo de Integração ERP

**Produto**: Solution Ticket / Gerenciador de Pesagem Veicular
**Versão**: 1.0 — 2026-04-26
**Status**: Documento de referência consolidado (síntese de duas análises independentes)

> **Execução agentic:** este guia é referência técnica. Gates, aprovações, assinaturas, aceite e ações humanas citadas abaixo são traduzidos por `docs/integracao/AGENTIC-EXECUTION-OPERATING-MODEL.md` e `docs/integracao/AGENT-GATES-MATRIX.md`.

---

## Sumário

1. [Resumo executivo](#1-resumo-executivo)
2. [Contexto técnico do produto](#2-contexto-técnico-do-produto)
3. [Princípios fundamentais](#3-princípios-fundamentais)
4. [Capacidades obrigatórias do módulo](#4-capacidades-obrigatórias-do-módulo)
5. [Arquitetura de referência](#5-arquitetura-de-referência)
6. [Modelo canônico de dados](#6-modelo-canônico-de-dados)
7. [Schema de banco — Prisma/SQLite](#7-schema-de-banco--prismasqlite)
8. [Métodos de comunicação suportados](#8-métodos-de-comunicação-suportados)
9. [Segurança](#9-segurança)
10. [Observabilidade e suporte](#10-observabilidade-e-suporte)
11. [Regras de propriedade e conflito de dados](#11-regras-de-propriedade-e-conflito-de-dados)
12. [Fluxos essenciais de pesagem](#12-fluxos-essenciais-de-pesagem)
13. [API pública e webhooks](#13-api-pública-e-webhooks)
14. [Matriz dos 20 ERPs prioritários](#14-matriz-dos-20-erps-prioritários)
15. [Estratégia por grupo de ERP](#15-estratégia-por-grupo-de-erp)
16. [Riscos e mitigações](#16-riscos-e-mitigações)
17. [Critérios de aceite por conector](#17-critérios-de-aceite-por-conector)
18. [Faseamento de implementação](#18-faseamento-de-implementação)
19. [Empacotamento comercial e monetização](#19-empacotamento-comercial-e-monetização)
20. [Checklist final](#20-checklist-final)
21. [Conclusão executiva](#21-conclusão-executiva)

---

## 1. Resumo executivo

O módulo de integração do Solution Ticket **não deve ser "uma API aberta"**, mas sim um **Hub de Integração ERP local-first** com conectores plugáveis, fila assíncrona, mapeamento declarativo de campos, trilha de auditoria fiscal e reconciliação automática.

A decisão arquitetural central:

- **Solution Ticket** é a fonte oficial dos eventos de pesagem (peso bruto, tara, líquido, evidências, operador, balança).
- **ERP** é a fonte oficial de dados mestres, pedidos, documentos fiscais, estoque contábil e financeiro.
- **A balança nunca pode parar por causa do ERP** — toda comunicação é assíncrona, com outbox transacional.

Não existe ranking universal dos "20 ERPs mais usados" — adoção varia por país, segmento e porte. No Brasil, **SAP e TOTVS** dominam, com Oracle, Sankhya, Senior e nomes PME (Omie, Bling, ContaAzul) relevantes. Globalmente, soma-se Microsoft Dynamics, NetSuite, Infor, IFS, Epicor, Sage, Acumatica e Odoo.

A recomendação é construir o módulo em **4 fases** ao longo de 12–18 meses, com payback já na Fase 1 (PME brasileiro).

---

## 2. Contexto técnico do produto

O Solution Ticket tem características específicas que determinam o desenho do módulo:

| Aspecto                | Realidade atual                                                                         | Implicação para integração                                            |
| ---------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Topologia**          | Desktop Windows (Electron + Next.js + NestJS), backend restrito a `127.0.0.1:3001`      | Webhooks entrantes diretos não são viáveis — precisa de relay/polling |
| **Banco**              | SQLite local via Prisma                                                                 | Outbox/inbox vivem no mesmo banco; transação atômica é trivial        |
| **Hardware**           | Balanças via serial, TCP/IP, Modbus RTU/TCP                                             | Já usa pattern Strategy/Factory — replicar nos conectores ERP         |
| **Operação**           | Offline-first, portaria/balança                                                         | Pesagem deve continuar mesmo com ERP/internet fora                    |
| **Segurança**          | Backend só localhost, JWT, Helmet, allowlist                                            | Exposição em LAN/internet exige decisão explícita por cliente         |
| **Módulos existentes** | ticket, balança, cadastros, fatura, recibos, romaneio, auditoria, backup, licença, fila | Integração consome eventos desses módulos, não acopla a eles          |
| **Plano comercial**    | API REST aberta prevista no plano Pro                                                   | Tratar API como produto, com versionamento e contrato estável         |

**Consequência arquitetural**: o desenho padrão precisa ser **sincronização de saída por fila + polling de entrada**, com webhooks entrantes apenas via relay cloud/iPaaS. Nunca expor a máquina da balança diretamente na internet.

---

## 3. Princípios fundamentais

### 3.1 Anti-Corruption Layer (Eric Evans / DDD)

O core do produto **nunca** fala a linguagem de um ERP específico. Toda tradução acontece na camada de adaptação. Trocar de ERP, adicionar ERP novo ou customizar para um cliente **não pode** exigir alteração no módulo de pesagem.

### 3.2 Hexagonal Architecture (Cockburn)

Conectores ERP são _adapters_ externos sobre uma porta canônica (`IErpConnector`). O domínio (pesagem) não conhece os adapters — apenas emite eventos.

### 3.3 Outbox Pattern (transacional)

Toda escrita destinada ao ERP é gravada **na mesma transação** que o evento de domínio. Worker assíncrono lê o outbox e despacha. Garante _at-least-once_ sem perder eventos se a aplicação cair entre commit e envio.

### 3.4 Idempotência por chave determinística

Toda operação carrega uma chave do tipo `tenant:empresa:unidade:ticket:revision`. Reentregas (rede instável, retry, ERP que confirmou mas não respondeu) **não duplicam** lançamento.

### 3.5 Eventos, não sobrescritas

Alteração ou cancelamento de ticket já enviado **gera evento novo** (correção, estorno, reversão). Nunca apaga ou edita silenciosamente o registro original. Preserva rastro fiscal de 5 anos exigido pela Receita.

### 3.6 Separação de erro técnico vs. erro de negócio

Retry automático resolve erro técnico (timeout, 5xx, rate limit). Erro de negócio (cliente bloqueado, produto inexistente, período fechado) gera `OPERATIONAL_ACTION_REQUIRED` com ação sugerida por `Support-Agent` ou operador autorizado — nunca entra em loop infinito de retry.

### 3.7 Operação não para

Se o ERP cair, internet cair, token expirar: o ticket é gravado localmente, entra na fila, sincroniza quando voltar. A balança **nunca** depende de disponibilidade externa.

---

## 4. Capacidades obrigatórias do módulo

### 4.1 Núcleo funcional

| Capacidade                 | Descrição                                                                  |
| -------------------------- | -------------------------------------------------------------------------- |
| **Modelo Canônico**        | DTOs internos versionados, agnósticos de ERP                               |
| **Connector SDK**          | Interface `IErpConnector` que cada conector implementa                     |
| **Mapping Engine**         | Tradução canônico ↔ ERP, declarativa em YAML/JSON, com transformações      |
| **Orquestrador**           | Pull (cadastros), Push (pesagens/documentos), Bidirecional (status)        |
| **Outbox transacional**    | Garantia at-least-once mesmo com falha entre commit e envio                |
| **Inbox idempotente**      | Eventos recebidos do ERP processados sem duplicidade                       |
| **Idempotência**           | Chave determinística por operação                                          |
| **Saga / Compensação**     | Para fluxos multi-etapa (criar pedido → emitir NF → baixar estoque)        |
| **Reconciliação**          | Job periódico que compara estado local × ERP e gera divergências           |
| **Checkpoint incremental** | Cursor por entidade para pull eficiente (data, token, sequência)           |
| **Dead-Letter Queue**      | Itens insolúveis isolados, reprocessamento operacional auditado via UI/API |
| **Circuit Breaker**        | Por endpoint — não derruba conector inteiro se um endpoint cai             |
| **Bulkhead**               | Pool de conexão isolado por cliente — um lento não trava os outros         |

### 4.2 Capacidades declaradas por conector

Cada conector publica suas capacidades, permitindo que UI e orquestrador decidam comportamento:

```ts
type ConnectorCapabilities = {
  supportsPull: boolean;
  supportsPush: boolean;
  supportsWebhooks: boolean;
  supportsBatch: boolean;
  supportsAttachments: boolean;
  supportsCancellation: boolean;
  supportsReversal: boolean;
  supportsCustomFields: boolean;
  supportedEntities: CanonicalEntity[];
  authMethods: AuthMethod[];
  transportMethods: TransportMethod[];
  rateLimits: RateLimitProfile;
};
```

---

## 5. Arquitetura de referência

### 5.1 Visão de alto nível

```
┌─────────────────────────────────────────────────────────────┐
│  Balança / Operador / Tela de Ticket                        │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Solution Ticket Core (módulos de negócio)                  │
│  ticket │ romaneio │ fatura │ cadastros │ ...               │
│  Emite eventos de domínio                                   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼ (event bus interno)
┌─────────────────────────────────────────────────────────────┐
│  Módulo de Integração (Hub local-first)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Outbox transacional + dispatcher + DLQ              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Mapping Engine (canônico ↔ ERP, YAML declarativo)   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Conectores plugáveis (Strategy)                     │  │
│  │  SAP │ TOTVS │ Oracle │ Dynamics │ Sankhya │ ...     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cofre de credenciais │ Auth │ Rate limit │ Retry    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Observabilidade (logs, traces, métricas, audit)     │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
            ERPs / iPaaS / SFTP / DB / Webhooks
```

### 5.2 Estrutura de pastas (NestJS)

```
src/integracao/
  integracao.module.ts

  connectors/
    connector.interface.ts
    connector-registry.service.ts
    connector-factory.service.ts
    sap/
    totvs/
    oracle/
    dynamics/
    sankhya/
    senior/
    benner/
    cigam/
    omie/
    bling/
    conta-azul/
    netsuite/
    infor/
    epicor/
    ifs/
    sage/
    acumatica/
    odoo/
    mega/
    alterdata/
    generic-rest/
    generic-soap/
    generic-sftp/
    generic-csv/
    generic-db/

  canonical/
    weighing-ticket.schema.ts
    partner.schema.ts
    product.schema.ts
    vehicle.schema.ts
    driver.schema.ts
    document-reference.schema.ts
    inventory-movement.schema.ts
    invoice.schema.ts
    quality-discount.schema.ts
    attachment.schema.ts

  mapping/
    mapping-engine.service.ts
    transformation.service.ts
    validation.service.ts
    expression-evaluator.service.ts

  queue/
    outbox.service.ts
    inbox.service.ts
    retry-policy.service.ts
    dead-letter.service.ts
    circuit-breaker.service.ts

  sync/
    sync-orchestrator.service.ts
    checkpoint.service.ts
    reconciliation.service.ts
    saga.service.ts

  security/
    secret-manager.service.ts
    signature.service.ts
    auth-strategy.service.ts

  api/
    public-integration.controller.ts
    webhook.controller.ts
    connector-admin.controller.ts

  observability/
    integration-log.service.ts
    integration-health.service.ts
    support-bundle.service.ts
    metrics.service.ts
```

### 5.3 Interface do conector

```ts
export interface ErpConnector {
  readonly id: string;
  readonly name: string;
  readonly version: string;

  capabilities(): ConnectorCapabilities;

  testConnection(config: ConnectorConfig): Promise<HealthCheckResult>;

  pullChanges(context: IntegrationContext, checkpoint: SyncCheckpoint): Promise<PullResult>;

  pushEvent(context: IntegrationContext, event: CanonicalIntegrationEvent): Promise<PushResult>;

  getRemoteObject(
    context: IntegrationContext,
    objectType: CanonicalObjectType,
    externalId: string,
  ): Promise<RemoteObject | null>;

  cancelOperation?(
    context: IntegrationContext,
    externalId: string,
    reason: string,
  ): Promise<CancelResult>;
}
```

---

## 6. Modelo canônico de dados

### 6.1 Entidades mínimas

| Entidade                  | Direção principal        | Observação                                       |
| ------------------------- | ------------------------ | ------------------------------------------------ |
| `Partner`                 | ERP → ST                 | Cliente, fornecedor, transportadora              |
| `Vehicle`                 | ERP → ST ou bidirecional | Placa, tara conhecida, frota                     |
| `Driver`                  | ERP → ST ou local        | Pode ser cadastro local em portaria              |
| `Product`                 | ERP → ST                 | Produto/material/item com código fiscal          |
| `Location`                | ERP → ST                 | Unidade, depósito, armazém, centro de custo      |
| `OrderReference`          | ERP → ST                 | Pedido, contrato, ordem de carga                 |
| `FiscalDocumentReference` | ERP → ST                 | NF-e, CT-e, MDF-e, remessa, avulso               |
| `WeighingTicket`          | ST → ERP                 | Registro principal da pesagem                    |
| `WeighingEvent`           | ST → ERP                 | Entrada, saída, cancelamento, correção, reversão |
| `QualityDiscount`         | ST → ERP                 | Umidade, impureza, desconto técnico              |
| `InventoryMovement`       | ST → ERP                 | Movimento de estoque gerado pela pesagem         |
| `InvoiceRequest`          | ST → ERP, opcional       | Quando o ST origina fatura                       |
| `Attachment`              | ST → ERP, opcional       | Foto, assinatura, comprovante, PDF               |

### 6.2 `WeighingTicket` canônico

```json
{
  "ticketId": "uuid",
  "ticketNumber": "000123",
  "tenantId": "uuid",
  "companyId": "uuid",
  "unitId": "uuid",
  "scaleId": "uuid",
  "operationType": "PURCHASE|SALE|TRANSFER|SERVICE|OTHER",
  "status": "OPEN|FIRST_WEIGHT|CLOSED|CANCELLED|REVERSED",
  "direction": "INBOUND|OUTBOUND",
  "vehicle": {
    "plate": "ABC1D23",
    "type": "TRUCK|TRACTOR|TRAILER",
    "axles": 6,
    "knownTareKg": 15000.0,
    "externalId": "..."
  },
  "driver": {
    "document": "...",
    "name": "...",
    "cnh": "..."
  },
  "carrier": {
    "document": "...",
    "name": "...",
    "antt": "..."
  },
  "partner": {
    "type": "CUSTOMER|SUPPLIER|CARRIER",
    "externalId": "...",
    "taxId": "...",
    "stateRegistration": "...",
    "name": "..."
  },
  "product": {
    "externalId": "...",
    "code": "...",
    "description": "...",
    "unit": "KG|TON|SACA",
    "density": null
  },
  "references": {
    "purchaseOrder": "...",
    "salesOrder": "...",
    "invoiceNumber": "...",
    "invoiceKey": "...",
    "contractNumber": "...",
    "harvestId": "..."
  },
  "weights": {
    "grossKg": 42000.0,
    "tareKg": 15000.0,
    "netKg": 27000.0,
    "manualWeight": false,
    "stableWeight": true
  },
  "quality": {
    "moisturePercent": 13.5,
    "impurityPercent": 0.5,
    "discountKg": 200.0,
    "netAfterDiscountKg": 26800.0,
    "ruleApplied": "agro-soja-2026"
  },
  "timestamps": {
    "entryAt": "2026-04-27T08:25:00-04:00",
    "firstWeightAt": "2026-04-27T08:30:00-04:00",
    "secondWeightAt": "2026-04-27T10:15:00-04:00",
    "closedAt": "2026-04-27T10:16:00-04:00",
    "exitAt": "2026-04-27T10:17:00-04:00"
  },
  "audit": {
    "createdBy": "operator",
    "closedBy": "operator",
    "manualReason": null,
    "hash": "sha256:...",
    "signatures": []
  },
  "attachments": [{ "type": "PHOTO_PLATE", "uri": "...", "checksum": "..." }]
}
```

### 6.3 Versionamento

- Schemas canônicos versionados (`v1`, `v2`).
- Evolução compatível: campos novos são opcionais; remoção exige `vN+1`.
- Cada conector declara qual versão consome.

---

## 7. Schema de banco — Prisma/SQLite

Todas as tabelas vivem no mesmo SQLite local, garantindo transação atômica entre evento de domínio e outbox.

### 7.1 `integracao_connector`

Cadastro do tipo de conector disponível.

| Campo                     | Tipo                               |
| ------------------------- | ---------------------------------- |
| `id`                      | uuid                               |
| `code`                    | string (`sap`, `totvs`, `omie`...) |
| `name`                    | string                             |
| `version`                 | string                             |
| `enabled`                 | boolean                            |
| `supportedAuthMethods`    | json                               |
| `supportedEntities`       | json                               |
| `createdAt` / `updatedAt` | datetime                           |

### 7.2 `integracao_profile`

Instância configurada (cliente conecta seu ERP).

| Campo                                  | Tipo                                          |
| -------------------------------------- | --------------------------------------------- |
| `id`                                   | uuid                                          |
| `tenantId` / `empresaId` / `unidadeId` | uuid                                          |
| `connectorId`                          | fk                                            |
| `environment`                          | enum (`homologacao`, `producao`)              |
| `baseUrl`                              | string                                        |
| `authMethod`                           | enum                                          |
| `secretRef`                            | string (referência ao cofre)                  |
| `enabled`                              | boolean                                       |
| `syncDirection`                        | enum (`inbound`, `outbound`, `bidirectional`) |
| `createdBy` / `updatedBy`              | uuid                                          |

### 7.3 `integracao_mapping`

Mapping declarativo por entidade.

| Campo                      | Tipo                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| `id`                       | uuid                                                             |
| `profileId`                | fk                                                               |
| `entityType`               | string                                                           |
| `localField`               | string                                                           |
| `remoteField`              | string                                                           |
| `transformationType`       | enum (`direct`, `fixed`, `expression`, `lookup`, `unit-convert`) |
| `transformationExpression` | string                                                           |
| `required`                 | boolean                                                          |
| `defaultValue`             | string                                                           |
| `enabled`                  | boolean                                                          |

### 7.4 `integracao_external_link`

Liga entidade local a ID externo do ERP.

| Campo             | Tipo     |
| ----------------- | -------- |
| `id`              | uuid     |
| `profileId`       | fk       |
| `entityType`      | string   |
| `localId`         | uuid     |
| `externalId`      | string   |
| `externalCode`    | string   |
| `externalVersion` | string   |
| `lastSyncedAt`    | datetime |
| `checksum`        | string   |

### 7.5 `integracao_outbox`

Eventos locais aguardando envio.

| Campo                       | Tipo                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `id`                        | uuid                                                                                   |
| `profileId`                 | fk                                                                                     |
| `eventType`                 | string                                                                                 |
| `entityType`                | string                                                                                 |
| `entityId`                  | uuid                                                                                   |
| `revision`                  | int                                                                                    |
| `idempotencyKey`            | string (unique)                                                                        |
| `payloadCanonical`          | json                                                                                   |
| `payloadRemote`             | json                                                                                   |
| `status`                    | enum (`pending`, `processing`, `sent`, `error`, `awaiting_retry`, `cancelled`, `dead`) |
| `attempts`                  | int                                                                                    |
| `nextRetryAt`               | datetime                                                                               |
| `lastError`                 | text                                                                                   |
| `lastErrorCategory`         | enum (`technical`, `business`)                                                         |
| `correlationId`             | string                                                                                 |
| `createdAt` / `processedAt` | datetime                                                                               |

### 7.6 `integracao_inbox`

Eventos recebidos do ERP.

| Campo                       | Tipo            |
| --------------------------- | --------------- |
| `id`                        | uuid            |
| `profileId`                 | fk              |
| `sourceEventId`             | string          |
| `entityType`                | string          |
| `externalId`                | string          |
| `payloadRemote`             | json            |
| `payloadCanonical`          | json            |
| `status`                    | enum            |
| `idempotencyKey`            | string (unique) |
| `createdAt` / `processedAt` | datetime        |

### 7.7 `integracao_checkpoint`

Cursor incremental por entidade.

| Campo          | Tipo     |
| -------------- | -------- |
| `id`           | uuid     |
| `profileId`    | fk       |
| `entityType`   | string   |
| `lastToken`    | string   |
| `lastDate`     | datetime |
| `lastPage`     | int      |
| `lastSequence` | bigint   |
| `updatedAt`    | datetime |

### 7.8 `integracao_log`

Log técnico/funcional com payloads mascarados.

| Campo                   | Tipo                         |
| ----------------------- | ---------------------------- |
| `id`                    | uuid                         |
| `profileId`             | fk                           |
| `direction`             | enum (`outbound`, `inbound`) |
| `operation`             | string                       |
| `status`                | enum                         |
| `correlationId`         | string                       |
| `requestPayloadMasked`  | json                         |
| `responsePayloadMasked` | json                         |
| `httpStatus`            | int                          |
| `durationMs`            | int                          |
| `errorCode`             | string                       |
| `errorMessage`          | text                         |
| `createdAt`             | datetime                     |

### 7.9 `integracao_secret`

**Nunca armazenar segredo em texto claro no SQLite.**

| Campo                     | Tipo                                                    |
| ------------------------- | ------------------------------------------------------- |
| `id`                      | uuid                                                    |
| `profileId`               | fk                                                      |
| `provider`                | enum (`windows-dpapi`, `os-keyring`, `encrypted-local`) |
| `encryptedValue`          | blob                                                    |
| `createdAt` / `rotatedAt` | datetime                                                |

Em Windows desktop, o padrão recomendado é **DPAPI** (Data Protection API) — chave derivada do perfil do usuário Windows, sem necessidade de gerenciar chave mestra própria.

---

## 8. Métodos de comunicação suportados

Um único ERP pode exigir múltiplos métodos. O módulo suporta todos via _strategy pattern_.

### 8.1 REST / JSON

Padrão para ERPs modernos cloud (Bling, Omie, ContaAzul, Tiny, Sankhya, TOTVS REST, NetSuite SuiteTalk REST, Dynamics 365, SAP S/4HANA OData v4, Acumatica, Epicor Kinetic).

### 8.2 OData (v2/v4)

SAP S/4HANA Cloud, Dynamics 365 Business Central, Dynamics 365 F&O (`/data`), Infor (via ION), IFS Cloud, Acumatica.

### 8.3 SOAP / XML

Ainda obrigatório em on-premise legado: TOTVS Protheus customizado, RM (TBC), NetSuite SOAP, SAP PI/PO, Sage X3, Senior G7, CIGAM Integrador, Mega ERP.

### 8.4 GraphQL

Odoo 17+, alguns endpoints Workday.

### 8.5 RPC

Odoo (XML-RPC e JSON-RPC) — modelo ORM exposto como CRUD.

### 8.6 Mensageria assíncrona

- AMQP/RabbitMQ — TOTVS Carol/TBC
- Kafka — SAP Event Mesh, Oracle Cloud Streaming
- Azure Service Bus — Dynamics 365
- AWS EventBridge — integrações cloud-native
- IBM MQ — corporações tradicionais

### 8.7 Webhooks (entrantes)

**Ponto crítico no Solution Ticket**: backend é localhost. Webhooks diretos do ERP não chegam. Padrão:

```
ERP -> Relay Cloud / iPaaS -> Agent local -> SQLite
```

ou:

```
ERP -> fila/middleware -> polling local -> SQLite
```

**Nunca** abrir porta pública na máquina da balança.

### 8.8 Polling

**Padrão para ambientes desktop/offline** do Solution Ticket. Consulta periódica de:

- Pedidos liberados
- Produtos alterados
- Clientes atualizados
- NF-e disponíveis
- Status de lançamentos enviados

Com checkpoint incremental (data, token, sequência) para não reprocessar tudo.

### 8.9 SFTP / CSV / XML / TXT

Essencial para clientes legados:

- CSV de cadastros (clientes, produtos, veículos)
- XML de NF-e e CT-e
- TXT posicional com layout proprietário
- Arquivo de retorno com status

Componentes: watcher (chokidar), parser com schema validation, conciliador.

### 8.10 EDI

EDIFACT/X12 para grandes operações de logística, indústria, agro:

- Ordem de carregamento
- Recebimento de mercadoria
- Romaneio
- Confirmação de entrega

### 8.11 Banco de dados / staging

**Aceitável**: ler view, ler tabela staging homologada pelo ERP, gravar em tabela staging aprovada pelo fornecedor.

**Não aceitável**: INSERT/UPDATE direto em tabela transacional do ERP. Sempre via stored procedure dedicada quando inevitável.

Regra: **escrita direta em banco do ERP é último recurso** e exige evidência externa do fornecedor/cliente registrada em `EXTERNAL-DEPENDENCIES.md`.

### 8.12 iPaaS / ESB

O módulo deve falar com endpoints genéricos REST/webhook para que o iPaaS faça a tradução:

- SAP Integration Suite
- Oracle Integration Cloud (OIC)
- Microsoft Power Platform / Logic Apps
- MuleSoft
- Boomi
- Digibee
- TOTVS Fluig
- n8n self-hosted
- Workato

### 8.13 RPA / automação de tela

**Último recurso**. Só quando ERP não tem API, banco ou arquivo. Não é padrão do produto.

---

## 9. Segurança

### 9.1 Autenticação suportada

- API Key (rotativa)
- Basic Auth (apenas com TLS, em legados)
- OAuth 2.0 Client Credentials
- OAuth 2.0 Authorization Code + PKCE
- JWT Bearer
- mTLS (certificados client)
- HMAC signature
- SAML (SSO administrativo)
- Certificados A1/A3 ICP-Brasil (NF-e, CT-e)
- Token customizado por ERP

### 9.2 Cofre de credenciais

Em ordem de preferência:

1. **Windows DPAPI** — desktop, deriva de perfil do usuário Windows
2. **OS Keyring** (Keychain/Secret Service)
3. **HashiCorp Vault / Azure Key Vault / AWS Secrets Manager** — quando há infra cloud
4. **AES-256 com chave protegida** — fallback local

**Nunca**:

- Texto claro em arquivo de configuração
- Texto claro em SQLite
- Em variável de ambiente persistente
- Em log

### 9.3 Rotação

- Token OAuth renovado proativamente antes de expirar
- API Key rotacionável via UI sem reiniciar serviço
- Certificados com alerta 60/30/7 dias antes do vencimento

### 9.4 Criptografia

- **Em trânsito**: TLS 1.2+ obrigatório, certificate pinning opcional para conectores críticos
- **Em repouso**: AES-256 para PII (CPF, CNPJ, dados bancários) em logs/auditoria

### 9.5 Assinatura de webhook

Webhooks emitidos pelo Solution Ticket usam HMAC-SHA256:

```
X-SolutionTicket-Timestamp: 2026-04-27T10:16:00Z
X-SolutionTicket-Signature: hmac-sha256(...)
X-SolutionTicket-Event-Id: uuid
```

Receptor valida assinatura + janela de tempo (anti-replay de 5min).

### 9.6 Rate limiting e Circuit Breaker

- Token bucket por conector, respeitando limites do ERP-alvo
- Circuit breaker (padrão Resilience4j) por endpoint
- Bulkhead: pool isolado por cliente

### 9.7 LGPD

Dados sensíveis no contexto: CPF/CNPJ, motorista, placa, documentos fiscais, financeiro, payloads de log.

Controles:

- Minimização (não logar o que não precisa)
- Mascaramento configurável em logs
- Retenção configurável com TTL
- Direito ao esquecimento propagado
- Exportação auditada
- Termo de responsabilidade para integrações de terceiros

### 9.8 Exposição em rede

| Cenário   | Padrão                                              |
| --------- | --------------------------------------------------- |
| Localhost | Permitido sempre                                    |
| LAN       | Habilitação explícita + TLS + firewall + auth forte |
| Internet  | Apenas via relay/cloud/iPaaS — nunca direto         |

### 9.9 Permissões internas

Granularidade mínima:

- Ver conectores
- Criar/editar conector
- Alterar credenciais
- Testar conexão
- Reprocessar evento
- Ignorar erro
- Ver payload técnico
- Exportar logs
- Alterar mapeamento
- Ativar/desativar perfil

---

## 10. Observabilidade e suporte

### 10.1 Tracing distribuído

OpenTelemetry: cada pesagem rastreável da balança até confirmação no ERP, com correlation ID propagado.

### 10.2 Logs estruturados

JSON, com:

- correlationId
- tenantId
- profileId
- entityType, entityId
- operation, status, durationMs
- errorCategory (technical/business)
- payload mascarado

### 10.3 Métricas

- Throughput por conector
- Latência p50/p95/p99
- Taxa de erro por categoria
- Tamanho do outbox
- Idade do item mais antigo na DLQ
- ERP availability (heartbeat)

### 10.4 Dashboard operacional

Tela acessível ao cliente final, sem necessidade de chamado:

**Indicadores**:

- Conectores ativos e status
- Última sincronização por conector
- Eventos pendentes / em erro / em DLQ
- Tempo médio de envio
- ERP indisponível (com tempo)
- Pendências por entidade
- Divergências de reconciliação
- Volume enviado por dia
- Top erros recentes

**Tela de eventos** com filtros por: ERP, unidade, ticket, placa, data, status, entidade, tipo de erro, correlation ID.

**Ações por evento**:

- Reprocessar
- Ver payload canônico
- Ver payload enviado
- Ver resposta do ERP
- Marcar como resolvido
- Exportar diagnóstico
- Abrir ticket de suporte (gera support bundle)

### 10.5 Alertas

- DLQ acima de N itens
- Conector down > 5min
- Divergência de reconciliação > X%
- Certificado expira em < 30 dias
- Token OAuth não renovou em N tentativas

### 10.6 Auditoria fiscal

Cada documento enviado mantém **5 anos** (Receita Federal):

- Payload exato enviado
- Resposta completa do ERP
- Timestamps (local + UTC)
- Usuário responsável
- Hash de integridade
- Versão do conector e do mapping usados

Storage append-only, sem possibilidade de edição.

### 10.7 Support bundle

Botão "exportar diagnóstico" gera ZIP com:

- Configuração do conector (sem segredos)
- Mapping ativo
- Últimos N logs com correlation ID solicitado
- Versões de todos os componentes
- Métricas das últimas 24h
- Teste de conexão atual

Para envio ao suporte sem comprometer credenciais.

---

## 11. Regras de propriedade e conflito de dados

### 11.1 Regra geral

- **ERP vence** para cadastros mestres (cliente, produto, fiscal)
- **Solution Ticket vence** para evento de pesagem (peso capturado, evidência operacional)
- **ERP vence** para validação de negócio (regra fiscal, contábil, financeira)

### 11.2 Por entidade

| Entidade             | Dono                                   | Quando ST pode criar/alterar                                     |
| -------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Cliente / Fornecedor | ERP                                    | Cadastro temporário marcado como "pendente ERP", concilia depois |
| Produto              | ERP                                    | Nunca alterar código fiscal; criar local só com flag pendente    |
| Veículo              | Configurável (perfil)                  | Opção 1: ERP dono / Opção 2: portaria dona, ERP só recebe        |
| Motorista            | Configurável                           | Em portaria, normalmente ST é dono operacional                   |
| Pedido / Contrato    | ERP                                    | ST apenas referencia; nunca cria                                 |
| NF-e / CT-e          | ERP / SEFAZ                            | ST apenas vincula e confere                                      |
| Pesagem              | ST                                     | ERP recebe e valida; pode rejeitar                               |
| Tara conhecida       | Configurável                           | Quando vem do ERP, balança usa como referência                   |
| Movimento de estoque | ERP origina baixa após receber pesagem |                                                                  |

### 11.3 Status de divergência

Quando ERP rejeita pesagem, ticket local não é apagado — vira:

```
status: CLOSED_LOCAL / ERP_REJECTED
```

Operador resolve via tela de divergências, ações possíveis: corrigir cadastro no ERP e reenviar / cancelar localmente / aceitar divergência com justificativa.

### 11.4 Cancelamento

Ticket já enviado **nunca é apagado**. Vira evento `weighing.ticket.cancelled` que o conector traduz como:

- Cancelamento de documento
- Estorno
- Reversão
- Movimento negativo
- Documento corretivo

Cada ERP escolhe a semântica correta na implementação do conector.

---

## 12. Fluxos essenciais de pesagem

### 12.1 Fluxo A — ERP libera ordem de carregamento

```
ERP cria pedido/ordem
  -> ST importa ordem (pull periódico)
  -> Operador seleciona ordem na entrada
  -> Primeira pesagem (entrada)
  -> Carregamento/descarregamento
  -> Segunda pesagem (saída)
  -> Ticket fecha
  -> Outbox dispara push para ERP
  -> ERP gera movimento/baixa/recebimento
  -> Confirmação volta via inbox
  -> external_link atualizado
```

### 12.2 Fluxo B — Pesagem avulsa, vinculação posterior

```
Operador registra pesagem sem pedido
  -> Ticket fecha localmente
  -> Outbox envia como documento operacional
  -> Usuário do ERP vincula a pedido/fatura depois
```

Útil quando operação não pode parar para esperar cadastro.

### 12.3 Fluxo C — NF-e como documento de entrada

```
NF-e importada (XML, manual ou via ERP)
  -> ST identifica emitente, destinatário, produtos
  -> Operador vincula NF-e à pesagem
  -> Pesagem calcula líquido
  -> ST envia ao ERP: peso conferido vs. quantidade fiscal
  -> Divergência registrada se houver
```

### 12.4 Fluxo D — Umidade / desconto (agro, biomassa, madeira)

```
Peso bruto/líquido calculado
  -> Tabela de umidade/desconto aplicada
  -> Peso líquido técnico calculado
  -> ERP recebe:
       - peso líquido original
       - % umidade
       - desconto em kg
       - peso final aceito
       - regra aplicada
       - usuário responsável
```

### 12.5 Fluxo E — Cancelamento

```
Ticket enviado ao ERP
  -> Operador cancela ticket localmente
  -> Sistema exige permissão + justificativa
  -> Evento de cancelamento entra no outbox
  -> Conector traduz para semântica do ERP
  -> ERP cancela/reverte lançamento
  -> Confirmação registrada em audit
```

### 12.6 Fluxo F — Fila de retry e DLQ

```
Push falha (técnico)
  -> status: awaiting_retry
  -> backoff exponencial + jitter
  -> após N tentativas -> DLQ
  -> alerta operacional
  -> operador investiga via UI
  -> opções: corrigir + reprocessar / cancelar / ignorar com justificativa
```

```
Push falha (negócio)
  -> status: error (não entra em retry automático)
  -> operador notificado
  -> OPERATIONAL_ACTION_REQUIRED
```

---

## 13. API pública e webhooks

### 13.1 Princípios

- Versionada: `/api/v1`
- OpenAPI/Swagger publicado
- Autenticação própria (API Key + OAuth opcional)
- Rate limit
- Idempotência (header `Idempotency-Key`)
- Logs com correlation ID
- Escopos de permissão
- IP allowlist quando exposta em rede
- TLS obrigatório fora de localhost
- Payloads canônicos
- **Nunca expor endpoints administrativos internos**

### 13.2 Endpoints mínimos

```
GET    /api/v1/integration/health
GET    /api/v1/integration/capabilities

GET    /api/v1/partners
POST   /api/v1/partners/import

GET    /api/v1/products
POST   /api/v1/products/import

GET    /api/v1/vehicles
POST   /api/v1/vehicles/import

GET    /api/v1/drivers
POST   /api/v1/drivers/import

POST   /api/v1/order-references/import
GET    /api/v1/order-references/{id}

GET    /api/v1/weighing-tickets
GET    /api/v1/weighing-tickets/{id}
POST   /api/v1/weighing-tickets/{id}/export
POST   /api/v1/weighing-tickets/{id}/cancel
POST   /api/v1/weighing-tickets/{id}/reprocess

GET    /api/v1/integration/events
GET    /api/v1/integration/outbox
POST   /api/v1/integration/outbox/{id}/retry

GET    /api/v1/integration/reconciliation
POST   /api/v1/integration/reconciliation/run
```

### 13.3 Webhooks emitidos

```
weighing.ticket.created
weighing.ticket.first_weight_done
weighing.ticket.closed
weighing.ticket.cancelled
weighing.ticket.reversed
weighing.ticket.manual_weight_used
weighing.ticket.printed
weighing.ticket.exported
weighing.ticket.export_failed
```

Payload padrão inclui: eventId, eventType, occurredAt, tenantId, entityId, entityVersion, idempotencyKey, data (ticket canônico), signature (HMAC).

---

## 14. Matriz dos 20 ERPs prioritários

Lista combinada com foco em domínio de pesagem (agro, indústria, logística, distribuição), priorizando relevância no Brasil + presença global.

| #   | ERP                                         | Método principal                                   | Métodos alternativos                                               | Notas para pesagem                                                                                                             |
| --- | ------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **SAP S/4HANA / ECC / Business One**        | OData v4 (Cloud), BAPI/RFC (ECC) via SAP JCo, IDoc | SAP Integration Suite (CPI), PI/PO, Event Mesh (Kafka), arquivos   | Pesagem entra como Inbound Delivery (LIKP/LIPS) + Goods Movement (BAPI_GOODSMVT_CREATE). ECC ainda domina em indústria grande. |
| 2   | **TOTVS Protheus**                          | REST API (Harpia 2023+), SOAP WS clássico          | ADVPL/TLPP, TOTVS Carol/iPaaS, banco staging (último recurso)      | Cada cliente customiza; mapping nunca é genérico. Romaneio agro = SC7/SD1/SD2 + tabelas NN5/NN6.                               |
| 3   | **TOTVS RM**                                | TBC (TOTVS Business Connect, SOAP), API REST       | DataServer .NET, arquivos                                          | DataServer é o objeto canônico do RM.                                                                                          |
| 4   | **TOTVS Datasul**                           | API REST FLEX, EAI (HUB de mensageria), JMS        | Progress 4GL APIs                                                  | EAI Datasul publica eventos via fila — mais robusto que polling REST.                                                          |
| 5   | **Oracle Fusion Cloud ERP**                 | REST APIs (`/fscmRestApi`)                         | SOAP, FBDI (File-Based Data Import), ESS jobs, OIC                 | FBDI ainda é o caminho oficial para cargas em massa.                                                                           |
| 6   | **Oracle NetSuite**                         | SuiteTalk REST                                     | SuiteTalk SOAP, RESTlets, SuiteScript, ODBC                        | Limites de governança rígidos (1000 unidades/script). RESTlets dão flexibilidade.                                              |
| 7   | **Microsoft Dynamics 365 F&O**              | OData (`/data` + Data Entities)                    | DMF (Data Management Framework), Azure Service Bus, Power Automate | Recurring Integrations via DMF para volume alto. Auth via Microsoft Entra ID.                                                  |
| 8   | **Microsoft Dynamics 365 Business Central** | REST API v2.0 + OData                              | SOAP (Page/Codeunit), webhooks                                     | AL extensions para customizar endpoints. Foco PME/midmarket.                                                                   |
| 9   | **Sankhya OM**                              | API Services REST (Gateway) + EIP Sankhya          | JAPE (Java), Apsen mensageria, webhooks                            | API Gateway moderno e bem documentado. Modelo MGE.                                                                             |
| 10  | **Senior Sistemas (G5/G7/Senior X)**        | APIs públicas Senior X (REST)                      | SOAP (G7/Conector Senior), regras LSP, arquivos                    | Senior X é a plataforma cloud nova. Forte em indústria, RH, logística, WMS.                                                    |
| 11  | **Benner**                                  | BOA — Benner Open API (HTTP REST)                  | Web services, integrações customizadas                             | Padrão REST com paginação, status HTTP, auth e logs.                                                                           |
| 12  | **CIGAM**                                   | Integrador CIGAM (Web Services em IIS)             | API portal, arquivos, processos assíncronos                        | Auth por chave/PIN, valida regras de negócio, suporta sync e async. Forte em indústria BR.                                     |
| 13  | **Mega ERP**                                | APIs REST e SOAP por produto                       | Cloud/on-premise, arquivos                                         | Relevante em construção, indústria, corporativo. Portal de APIs com docs fiscais.                                              |
| 14  | **Alterdata Bimer / ERP4ME**                | API Bimer                                          | ePlugin, banco homologado                                          | Implantação técnica local exige IIS, .NET, acesso SQL e ambiente de homologação.                                               |
| 15  | **Omie**                                    | REST JSON / SOAP                                   | Webhooks                                                           | PME/contador BR. APIs estáveis, auth por chave. Bom para financeiro/cliente/produto.                                           |
| 16  | **Bling**                                   | REST v3 + OAuth 2.0                                | Webhooks, marketplaces                                             | PME/e-commerce. Rate limit rígido (3 req/s). Bom para distribuição/comércio.                                                   |
| 17  | **ContaAzul**                               | REST/JSON + OpenAPI + OAuth 2.0/PKCE               | Webhooks, marketplace                                              | PME pequena/contador. Recursos: clientes, vendas, financeiro, estoque, notas.                                                  |
| 18  | **Infor CloudSuite (M3, LN, SyteLine)**     | Infor ION API Gateway (OAuth2)                     | BODs (XML, padrão OAGIS), Enterprise Connector                     | ION é obrigatório como hub. BODs seguem OAGIS.                                                                                 |
| 19  | **Epicor Kinetic**                          | REST/OData com OpenAPI/Swagger                     | BAQ (Business Activity Queries), Service Connect, Functions        | Functions expõem lógica custom como REST. Forte em manufatura.                                                                 |
| 20  | **IFS Cloud**                               | RESTful OData APIs (Projections)                   | Middleware, IFS Connect, PL/SQL APIs                               | Projections expõem entidades de negócio como OData. Forte em ativos, manutenção, indústria.                                    |

### 14.1 Menções honrosas (backlog secundário)

| ERP                         | Razão                                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| **Acumatica**               | REST/OData + webhooks. Médias empresas distribuídas.                   |
| **Sage Intacct / Sage X3**  | REST API (Intacct) e SOAP (X3). Financeiro/gestão global.              |
| **Odoo 17+**                | XML-RPC/JSON-RPC. Flexível, customizável, PME que aceita customização. |
| **WK Radar**                | PME brasileiro.                                                        |
| **Linx**                    | Varejo/postos, integração com TEF e fiscal.                            |
| **Tiny ERP (Olist)**        | PME, varejo, marketplaces.                                             |
| **QAD**                     | Manufatura.                                                            |
| **SAP Agribusiness Add-on** | Vertical agro do S/4HANA — contratos, classificação, umidade.          |
| **Siagri**                  | Agro BR; integração com balança é caso primário.                       |
| **TOTVS Agro Multicultivo** | Vertical agro do Protheus.                                             |

### 14.2 Atenção comercial

A priorização final deve ser guiada pela **carteira-alvo** do produto, não por ranking genérico. Cliente que paga determina ordem, não tabela.

---

## 15. Estratégia por grupo de ERP

### 15.1 Grupo 1 — Corporativos globais

SAP, Oracle, Microsoft Dynamics, Infor, IFS, Epicor, NetSuite.

**Características**: APIs robustas, auth complexa, ambientes de homologação, consultoria de implantação, regras fiscais rígidas, baixa tolerância a integração improvisada.

**Requisitos do módulo**:

- OAuth 2.0 / Client Credentials
- OData
- Paginação, batch
- Payload versionado
- Idempotência forte
- Logs técnicos completos
- Reprocessamento granular
- Validação antes do envio
- Separação homologação/produção
- Documentação OpenAPI publicada
- Investimento em certificações (SAP Certified Integration, Microsoft AppSource)

### 15.2 Grupo 2 — Brasileiros médios/grandes

TOTVS (Protheus, RM, Datasul), Sankhya, Senior, Benner, CIGAM, Mega, Alterdata.

**Características**: forte variação por versão, muitos on-premise, muitas customizações, integração via REST/SOAP/staging/arquivo, dependência de consultoria local.

**Requisitos do módulo**:

- Conector parametrizável
- Templates por produto
- Suporte a SOAP
- Suporte a CSV/XML/SFTP
- Suporte a banco staging
- Mapeamento visual
- Tabelas de equivalência
- Validação de negócio local antes do envio
- Exportação de logs para suporte
- Programa de parceria com fornecedor (TOTVS Partner, Senior Partner)

### 15.3 Grupo 3 — PME e comércio

Omie, Bling, ContaAzul, Tiny, Odoo, Acumatica.

**Características**: API cloud, auth por chave/OAuth, boa documentação, limites de requisição, operações simples, menor profundidade industrial.

**Requisitos do módulo**:

- REST/JSON
- Webhooks
- Rate limiting rigoroso
- Retry com backoff
- Mapeamento de cliente/produto/pedido
- Sincronização financeira opcional
- Evitar dependência de customização

---

## 16. Riscos e mitigações

| Risco                                      | Mitigação                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Cliente customizou Protheus de forma única | Mapping declarativo + serviço de "onboarding técnico" pago; mapping versionado por cliente        |
| ERP cai e perdemos pesagens                | Outbox + DLQ + reprocessamento; pesagem nunca depende de ERP online                               |
| Mudança de versão do ERP quebra integração | Conector versionado + suíte de testes de contrato (Pact); sandbox por ERP em CI                   |
| Vazamento de credenciais de cliente        | Cofre + DPAPI/Vault + rotação automática + auditoria; nunca em log                                |
| Receita Federal exige rastro de NF         | Storage append-only com 5 anos de retenção, hash de integridade                                   |
| Rate limit do ERP estoura em pico (safra)  | Token bucket por conector + agendamento inteligente (priorizar tickets fiscais sobre cadastros)   |
| Conector quebra em produção                | Circuit breaker + degradação local + alerta para suporte; outros clientes não afetados (bulkhead) |
| Webhook entrante não chega (localhost)     | Relay cloud + agent local + polling fallback                                                      |
| Operador edita ticket já enviado           | Imutabilidade + evento de correção, nunca sobrescrita                                             |
| Erro de negócio entra em retry infinito    | Categorização técnico vs. negócio na DLQ; negócio não retenta automaticamente                     |
| Reprocessamento gera duplicidade           | Chave idempotente determinística obrigatória                                                      |

---

## 17. Critérios de aceite por conector

Conector só vai para produção quando:

### 17.1 Técnico

- [ ] Teste de conexão funcional
- [ ] Homologação e produção separados
- [ ] Credenciais protegidas em cofre
- [ ] Retry automático com backoff
- [ ] Idempotência validada (envio duplicado não duplica)
- [ ] Rate limit respeitado
- [ ] Logs com correlation ID
- [ ] Payload mascarado
- [ ] Reprocessamento operacional auditado via UI/API
- [ ] Dead-letter funcional
- [ ] Checkpoint incremental
- [ ] Paginação de pull
- [ ] Tratamento de timezone (local + UTC)
- [ ] Tratamento de decimal/unidade (kg/ton/saca)
- [ ] Testes automatizados de transformação
- [ ] Teste de carga: 10x volume médio sem degradação
- [ ] Teste de resiliência: ERP offline/lento/5xx — comportamento validado

### 17.2 Funcional

- [ ] Importa produto
- [ ] Importa parceiro
- [ ] Importa veículo/motorista (quando aplicável)
- [ ] Importa pedido/ordem (quando aplicável)
- [ ] Exporta ticket fechado
- [ ] Exporta cancelamento
- [ ] Exporta correção/reversão
- [ ] Trata erro de cadastro
- [ ] Trata erro de documento
- [ ] Trata erro de quantidade
- [ ] Gera relatório de divergência
- [ ] Auditoria fiscal: amostra de 100 documentos rastreáveis fim-a-fim

### 17.3 Operacional

- [ ] Operação da balança não para se ERP cair
- [ ] Usuário enxerga pendências
- [ ] Suporte consegue diagnosticar via support bundle
- [ ] Reprocessamento não duplica lançamento
- [ ] Erro de negócio não entra em retry infinito
- [ ] Auditoria mostra quem fez o quê
- [ ] Integração pode ser desligada por unidade
- [ ] Runbook operacional escrito
- [ ] Dashboard publicado no portal do cliente

### 17.4 Segurança

- [ ] Sem segredo em log
- [ ] Sem senha em texto claro
- [ ] Permissão para alterar conector
- [ ] Permissão para ver payload
- [ ] TLS fora de localhost
- [ ] API pública com auth forte
- [ ] Webhook assinado
- [ ] Logs com retenção definida

### 17.5 Homologação externa

- [ ] Quando exigida pelo fornecedor: SAP Certified Integration, Microsoft AppSource, TOTVS Partner, Senior Partner

---

## 18. Faseamento de implementação

### Fase 0 — Fundação (2 meses)

**Entregáveis**:

- `IntegracaoModule` no NestJS
- Tabelas outbox/inbox/checkpoint/log/secret/profile/mapping
- Modelo canônico v1
- Mapping engine declarativo (YAML)
- Outbox dispatcher + DLQ
- Idempotência + retry + circuit breaker
- Cofre de credenciais (DPAPI)
- Dashboard de eventos
- API pública `/api/v1` + OpenAPI
- Conector genérico REST
- Conector genérico CSV/XML/SFTP
- Reprocessamento via UI
- Logs mascarados
- Reconciliação básica
- Support bundle

**Já permite**: integrar clientes via iPaaS, arquivos e APIs simples.

### Fase 1 — Brasil PME (3 meses) — payback rápido

Ordem sugerida: Bling, Omie, ContaAzul, Tiny, Sankhya.

**Por quê**: APIs REST modernas, OAuth, baixo custo de homologação, base ampla de clientes pagantes, ciclo de venda curto.

### Fase 2 — Brasil Tier-1 (4 meses) — alta margem

Ordem: TOTVS Protheus, TOTVS RM, TOTVS Datasul, Senior G7/Senior X.

**Por quê**: maior receita por conta. Exige programa de parceria TOTVS/Senior. Mapping cliente-a-cliente.

### Fase 3 — Global Tier-1 (4 meses) — entrada em grandes contas

Ordem: SAP S/4HANA, Microsoft Dynamics 365, NetSuite, Oracle Fusion.

**Por quê**: ticket médio alto, ciclo de venda longo. Exige certificações formais e investimento em sandbox.

### Fase 4 — Long tail e legados (3 meses)

Sob demanda: Infor, Epicor, IFS, Sage, Acumatica, Odoo, Mega, Alterdata, CIGAM, Benner, WK Radar, layouts proprietários EDI.

**Estratégia**: publicar **Connector SDK público** para que parceiros desenvolvam contra contrato canônico (modelo Zapier/MuleSoft Exchange).

---

## 19. Empacotamento comercial e monetização

### 19.1 Planos sugeridos

| Plano          | Inclui                                                                                                                                                                                     | Público                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| **Standard**   | Exportação CSV/XML, importação manual, API local apenas para consulta, sem conectores nativos                                                                                              | Clientes pequenos sem ERP |
| **Pro**        | API REST aberta, conector genérico REST, webhooks, outbox/inbox, reprocessamento, **um** conector ERP nativo incluído                                                                      | PME com 1 ERP             |
| **Enterprise** | Múltiplos conectores, multi-empresa/multi-unidade, iPaaS, SFTP, SOAP, OData, banco staging, reconciliação avançada, auditoria completa, suporte a homologação, SLA, templates customizados | Grandes contas            |

Encaixa com o roadmap atual do projeto que já reserva API REST aberta para o plano Pro.

### 19.2 Modelo de monetização

- **Setup fee** por conector ativado (homologação + mapping inicial). Conectores Tier-1 corporativos: 5–10x o valor de PME.
- **Mensalidade** por volume de pesagens sincronizadas/mês com tiers.
- **Marketplace de conectores** (Fase 4+): parceiros desenvolvem contra SDK público, dividindo receita.
- **Serviços profissionais** de onboarding (mapping de cliente customizado, treinamento, integração com iPaaS do cliente).

---

## 20. Checklist final

### Núcleo

- [ ] Módulo NestJS dedicado
- [ ] Modelo canônico versionado
- [ ] API pública versionada com OpenAPI
- [ ] Conectores plugáveis com SDK
- [ ] Outbox transacional
- [ ] Inbox idempotente
- [ ] Idempotência por chave determinística
- [ ] Retry com backoff + jitter
- [ ] Dead-letter queue
- [ ] Checkpoint incremental
- [ ] Reconciliação programada
- [ ] Auditoria fiscal append-only (5 anos)
- [ ] Logs estruturados mascarados
- [ ] Dashboard operacional

### Métodos

- [ ] REST/JSON
- [ ] OData v2/v4
- [ ] SOAP
- [ ] Webhook entrante (via relay)
- [ ] Webhook emitido (assinado HMAC)
- [ ] Polling com checkpoint
- [ ] SFTP/CSV/XML/TXT
- [ ] EDI (EDIFACT/X12)
- [ ] Banco staging (com SP, nunca DML direto)
- [ ] iPaaS (endpoint genérico)
- [ ] RPA apenas como exceção documentada

### Entidades canônicas

- [ ] Partner, Vehicle, Driver, Carrier
- [ ] Product, Location
- [ ] OrderReference, FiscalDocumentReference
- [ ] WeighingTicket, WeighingEvent
- [ ] QualityDiscount
- [ ] InventoryMovement
- [ ] InvoiceRequest
- [ ] Attachment

### Segurança

- [ ] OAuth 2.0 (Client Credentials + Auth Code/PKCE)
- [ ] API Key rotativa
- [ ] JWT Bearer
- [ ] mTLS
- [ ] HMAC signature
- [ ] Certificados ICP-Brasil
- [ ] Cofre (DPAPI/Keyring/Vault)
- [ ] Rotação automática
- [ ] TLS 1.2+ obrigatório fora de localhost
- [ ] AES-256 em repouso para PII
- [ ] Permissões granulares por ação
- [ ] LGPD: minimização, mascaramento, retenção, esquecimento
- [ ] Allowlist de IP quando exposta em rede

### Operação

- [ ] Balança não para com ERP fora
- [ ] Reprocessamento não duplica
- [ ] Erro técnico vs. negócio separados
- [ ] Erro de negócio gera `OPERATIONAL_ACTION_REQUIRED` com ação sugerida
- [ ] Relatório de divergência por reconciliação
- [ ] Homologação separada de produção
- [ ] Support bundle exportável
- [ ] Runbook documentado por conector
- [ ] Alertas configurados (DLQ, conector down, certificado expirando)

---

## 21. Conclusão executiva

O módulo correto para o Solution Ticket é um **Hub de Integração ERP local-first** baseado em três pilares:

1. **Modelo canônico único** + **conectores plugáveis** (Anti-Corruption Layer + Hexagonal). Trocar/adicionar ERP **não toca o core** de pesagem.
2. **Outbox transacional + idempotência + DLQ + reconciliação** garantem **confiabilidade fiscal** — nada perdido, nada duplicado, rastro de 5 anos.
3. **Local-first**: balança nunca depende de internet/ERP/token. Pesagem grava local, sincroniza quando puder.

**Diferencial competitivo**:

- **Confiabilidade fiscal**: rastro auditável com hash de integridade, 5 anos retenção, append-only.
- **Velocidade de onboarding**: novo cliente com ERP já suportado entra em produção em **dias**, não meses (mapping declarativo + sandbox + templates).
- **Cobertura de mercado**: 20 ERPs cobrem ~90% do mercado brasileiro de pesagem (agro, indústria, logística, varejo) e abrem porta para contas globais.
- **Escalabilidade comercial**: SDK público + marketplace de conectores na Fase 4 permite crescimento via parceiros.

**Investimento estimado**: 12–18 meses de uma squad dedicada (1 arquiteto, 2–3 desenvolvedores, 1 PM, 1 SRE part-time), com **payback a partir do 6º mês** via Fase 1 (PME brasileiro com APIs simples).

**Decisão arquitetural não-negociável**: o módulo deve nascer como **camada independente**, não como código espalhado em `ticket`, `fatura`, `romaneio` ou `cadastros`. Módulos de negócio emitem eventos; módulo de integração consome; conectores traduzem. Esse desenho preserva o core e permite adicionar ERPs sem reescrever pesagem.

---

**Próximos passos sugeridos**:

1. Detalhar desenho técnico do **Mapping Engine** com pseudocódigo e exemplo YAML.
2. Especificar o **Connector SDK** público para parceiros (interfaces, testes de contrato, certificação).
3. Montar matriz **esforço × prioridade** dos 20 conectores com estimativas em pessoa-mês.
4. Desenhar a **arquitetura de relay cloud** para webhooks entrantes (componente fora do desktop).
