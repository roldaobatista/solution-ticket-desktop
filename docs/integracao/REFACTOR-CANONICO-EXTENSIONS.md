# Refactor do Modelo Canônico — Extensions Verticais

**Status**: Especificação para Sprint -2 (resolve HIGH H1 da auditoria)
**Versão**: 1.0 — 2026-04-26

---

## Problema

Auditor arquitetural apontou: `WeighingTicket` v1 inclui campos de **vertical agro** hardcoded:

- `quality.moisturePercent` (umidade)
- `quality.impurityPercent` (impureza)
- `quality.discountKg` (desconto)
- `references.harvestId` (safra)

Isso **contradiz ADR-003** ("risco de vazamento de conceitos no canônico"). Verticais futuras (siderurgia, mineração, gerenciamento de resíduos, transporte de cargas perigosas) exigirão **mudanças no canônico v1** — quebra promessa de estabilidade.

## Solução

Mover conceitos verticais para **extensions opcionais**, mantendo `WeighingTicket` core mínimo e estável.

### Estrutura proposta

```typescript
interface CanonicalWeighingTicket {
  // === CORE (estável, todos os verticais) ===
  ticketId: string;
  ticketNumber: string;
  tenantId: string;
  companyId: string;
  unitId: string;
  scaleId: string;
  operationType: 'PURCHASE' | 'SALE' | 'TRANSFER' | 'SERVICE' | 'OTHER';
  status: TicketStatus;
  direction: 'INBOUND' | 'OUTBOUND';

  vehicle: CanonicalVehicle;
  driver?: CanonicalDriver;
  carrier?: CanonicalCarrier;
  partner: CanonicalPartner;
  product: CanonicalProduct;

  references?: {
    purchaseOrder?: string;
    salesOrder?: string;
    invoiceNumber?: string;
    invoiceKey?: string;
    contractNumber?: string;
    // harvestId movido para extensions.agro
  };

  weights: {
    grossKg: number;
    tareKg: number;
    netKg: number;
    manualWeight: boolean;
    stableWeight: boolean;
    // discountKg movido para extensions
  };

  timestamps: TicketTimestamps;
  audit: TicketAudit;
  attachments?: CanonicalAttachment[];

  // === EXTENSIONS (opcional, por vertical) ===
  extensions?: {
    agro?: AgroExtension;
    industry?: IndustryExtension;
    logistics?: LogisticsExtension;
    waste?: WasteExtension;
    mining?: MiningExtension;
    // novos verticais entram aqui sem mudar v1
  };
}
```

### Definição das extensions

#### `AgroExtension`

```typescript
interface AgroExtension {
  moisturePercent?: number; // umidade %
  impurityPercent?: number; // impureza %
  discountKg?: number; // desconto técnico
  netAfterDiscountKg?: number; // peso ajustado
  qualityRule?: string; // regra aplicada (ex: "soja-2026-csp")
  classification?: string; // tipo/classe
  harvestId?: string;
  cooperativeMemberId?: string; // cooperado
  contractNumber?: string;
  productOrigin?: 'OWN' | 'PARTNER' | 'PURCHASED';
}
```

#### `IndustryExtension`

```typescript
interface IndustryExtension {
  productionOrderId?: string;
  workCenter?: string;
  shift?: string;
  batchNumber?: string;
  qualityCheckPassed?: boolean;
  rejectionReason?: string;
}
```

#### `LogisticsExtension`

```typescript
interface LogisticsExtension {
  cteKey?: string; // chave CT-e
  mdfeKey?: string; // chave MDF-e
  freightValue?: number;
  freightType?: 'CIF' | 'FOB' | 'OTHER';
  routeId?: string;
  expectedDeliveryDate?: string;
  rntrcCarrier?: string;
  toll?: number; // valor de pedágio (CT-e — comp. NUM 02)
}
```

#### `WasteExtension`

```typescript
interface WasteExtension {
  manifestNumber?: string; // MTR (Manifesto de Transporte de Resíduos)
  manifestExpiration?: string; // ISO date — validade do MTR (SINIR/SIGOR)
  wasteCode?: string; // código IBAMA
  destination?: string;
  treatmentType?: 'LANDFILL' | 'INCINERATION' | 'RECYCLING' | 'COMPOSTING';
  hazardousClass?: string;
}
```

> **Evolução das extensions**: campos podem ser **adicionados** sem
> versionamento breaking — clientes que não consomem o campo simplesmente
> não o referenciam no mapping. O contrato é "aditivo": novos campos
> opcionais entram conforme demanda real de cliente piloto, sem bump de
> versão do canônico. **Renomear ou remover** campo é breaking e exige ADR
>
> - migração.

#### `MiningExtension`

```typescript
interface MiningExtension {
  mineralType?: string;
  oreGrade?: number; // teor %
  mineralRightHolder?: string;
  shippingDocument?: string;
  royaltyApplicable?: boolean;
}
```

### Regras de uso

1. **Cliente não declara vertical no canônico** — extensions são opcionais
2. **Conector ERP escolhe** quais extensions consumir baseado no mapping
3. **Mapping declarativo** acessa extensions com path `extensions.agro.moisturePercent`
4. **Validação por extension** — schemas separados, não obrigatórios no core

### Versionamento

- **Core schema** muda lentamente — major version exige migração
- **Extensions** podem evoluir independentemente:
  - `AgroExtension` v1, v2, v3...
  - Conector declara qual versão suporta

## Migração

### Passo 1 (Sprint -2 / refactor)

- Mover campos `quality.*` e `harvestId` para `extensions.agro.*`
- Manter compat retroativa: deserializar dados v1 antigos para `extensions.agro` automaticamente
- Atualizar `002-modelo-canonico.md`

### Passo 2 (Sprint -1)

- Atualizar 6 contratos ERP para usar nova estrutura
- Especialmente Protheus (cliente agro) e SAP Agribusiness

### Passo 3 (Sprint 0–1)

- Implementar `WeighingTicket` core como classe TypeScript
- Implementar extensions como interfaces separadas
- Testes de validação por extension

### Passo 4 (futuro)

- Adicionar verticais novas conforme demanda comercial
- Cliente de mineração/resíduos pede → criar extension

## Impacto

### Positivo

- Canônico v1 fica **estável** (não quebra com vertical novo)
- Conector novo só precisa entender extensions relevantes
- Habilita SDK público para verticais (parceiros)
- Documentação fica mais limpa

### Negativo

- Mais um nível de aninhamento (`extensions.agro.moisturePercent` vs `quality.moisturePercent`)
- Migração de mappings existentes (script auxilia)
- Devs precisam aprender quando usar extension vs core

## Decisão

Adotar refactor.

## Próximos passos

1. Atualizar `002-modelo-canonico.md` com nova estrutura
2. Criar arquivos:
   - `backend/src/integracao/canonical/v1/core.ts`
   - `backend/src/integracao/canonical/v1/extensions/agro.ts`
   - `backend/src/integracao/canonical/v1/extensions/industry.ts`
   - `backend/src/integracao/canonical/v1/extensions/logistics.ts`
3. Atualizar contratos ERP
4. Documentar em `001-arquitetura-integration-hub.md`

## Referências

- ADR-003 — Modelo canônico versionado
- Auditoria 10-agentes — finding H1
- `002-modelo-canonico.md` — atualizar
