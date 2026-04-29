# 002 — Modelo Canônico de Dados

**Versão**: v1.1 — 2026-04-27 (refactor extensions verticais)
**Status**: Aprovado
**Pasta de implementação**: `backend/src/integracao/canonical/v1/`

> ⚠️ **Refactor pós-auditoria**: campos verticais agro (`quality.*`, `harvestId`) foram movidos para `extensions.agro` (resolve HIGH H1). Ver `REFACTOR-CANONICO-EXTENSIONS.md` para detalhes. Schemas abaixo refletem nova estrutura core + extensions.

---

## 1. Por que existe um modelo canônico

Cada ERP tem seu próprio modelo. Sem canônico, o módulo precisaria conhecer detalhes de N ERPs, criando acoplamento N×M com módulos de negócio.

O canônico é o **contrato único** entre:

- **Módulos de negócio** → emitem dados em formato canônico
- **Conectores** → traduzem canônico ↔ ERP

Detalhe arquitetural: ADR-003.

---

## 2. Versionamento

- Pasta `canonical/v1/` para a versão 1
- Evolução compatível: adicionar campos opcionais — não muda versão
- Mudança incompatível: criar `v2/`, conectores declaram qual consomem
- Migração entre versões via mapping engine quando viável

---

## 3. Entidades canônicas (v1)

### 3.1 `WeighingTicket` — entidade principal

```typescript
interface CanonicalWeighingTicket {
  // Identificação
  ticketId: string; // UUID interno
  ticketNumber: string; // sequência fiscal local
  tenantId: string;
  companyId: string;
  unitId: string;
  scaleId: string;

  // Operação
  operationType: 'PURCHASE' | 'SALE' | 'TRANSFER' | 'SERVICE' | 'OTHER';
  status: 'OPEN' | 'FIRST_WEIGHT' | 'CLOSED' | 'CANCELLED' | 'REVERSED';
  direction: 'INBOUND' | 'OUTBOUND';

  // Veículo
  vehicle: {
    plate: string;
    type?: 'TRUCK' | 'TRACTOR' | 'TRAILER';
    axles?: number;
    knownTareKg?: number;
    externalId?: string;
  };

  // Pessoas
  driver?: {
    document?: string;
    name: string;
    cnh?: string;
  };

  carrier?: {
    document: string;
    name: string;
    antt?: string;
  };

  partner: {
    type: 'CUSTOMER' | 'SUPPLIER' | 'CARRIER';
    externalId?: string;
    taxId: string;
    stateRegistration?: string;
    name: string;
  };

  // Produto
  product: {
    externalId?: string;
    code: string;
    description: string;
    unit: 'KG' | 'TON' | 'SACA';
    density?: number;
  };

  // Referências (core — comum a todos verticais)
  references?: {
    purchaseOrder?: string;
    salesOrder?: string;
    invoiceNumber?: string;
    invoiceKey?: string;
    contractNumber?: string;
    // harvestId movido para extensions.agro
  };

  // Pesagem
  weights: {
    grossKg: number;
    tareKg: number;
    netKg: number;
    manualWeight: boolean;
    stableWeight: boolean;
  };

  // ⚠️ "quality" foi MOVIDO para extensions.agro (refactor v1.1)
  // Não usar este campo — usar extensions.agro.* abaixo

  // Extensions verticais (opcional, ver REFACTOR-CANONICO-EXTENSIONS.md)
  extensions?: {
    agro?: {
      moisturePercent?: number;
      impurityPercent?: number;
      discountKg?: number;
      netAfterDiscountKg?: number;
      qualityRule?: string;
      classification?: string;
      harvestId?: string;
      cooperativeMemberId?: string;
      productOrigin?: 'OWN' | 'PARTNER' | 'PURCHASED';
    };
    industry?: {
      /* ver REFACTOR */
    };
    logistics?: {
      /* ver REFACTOR */
    };
    waste?: {
      /* ver REFACTOR */
    };
    mining?: {
      /* ver REFACTOR */
    };
  };

  // Tempos
  timestamps: {
    entryAt?: string; // ISO 8601 com timezone
    firstWeightAt?: string;
    secondWeightAt?: string;
    closedAt: string;
    exitAt?: string;
  };

  // Auditoria
  audit: {
    createdBy: string;
    closedBy?: string;
    manualReason?: string;
    hash: string; // sha256 do payload congelado
    signatures?: Array<{ user: string; at: string }>;
  };

  // Anexos
  attachments?: Array<{
    type: 'PHOTO_PLATE' | 'TICKET_PDF' | 'SIGNATURE' | 'OTHER';
    uri: string;
    checksum: string;
    sizeBytes: number;
  }>;
}
```

### 3.2 `Partner`

```typescript
interface CanonicalPartner {
  externalId?: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'CARRIER';
  taxId: string; // CNPJ ou CPF (só dígitos)
  taxIdType: 'CNPJ' | 'CPF' | 'OTHER';
  name: string;
  fantasyName?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
  address?: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  contacts?: Array<{
    type: 'PHONE' | 'EMAIL' | 'OTHER';
    value: string;
  }>;
}
```

### 3.3 `Product`

```typescript
interface CanonicalProduct {
  externalId?: string;
  code: string;
  description: string;
  unit: string; // canônico: 'KG', 'TON', 'SACA', 'UN', 'L'
  fiscalCode?: string; // NCM
  category?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
  density?: number;
  qualityRules?: Array<{
    type: 'MOISTURE' | 'IMPURITY' | 'OTHER';
    threshold: number;
    discountFormula: string;
  }>;
}
```

### 3.4 `Vehicle`

```typescript
interface CanonicalVehicle {
  externalId?: string;
  plate: string; // sempre uppercase
  type?: 'TRUCK' | 'TRACTOR' | 'TRAILER' | 'OTHER';
  axles?: number;
  knownTareKg?: number;
  ownerType?: 'OWN' | 'AGGREGATED' | 'THIRD_PARTY';
  ownerDocument?: string;
  rntrc?: string;
}
```

### 3.5 `Driver`

```typescript
interface CanonicalDriver {
  externalId?: string;
  document: string; // CPF (só dígitos)
  name: string;
  cnh?: string;
  cnhCategory?: string;
  cnhExpirationDate?: string;
}
```

### 3.6 `FiscalDocumentReference`

```typescript
interface CanonicalFiscalDocumentReference {
  externalId?: string;
  type: 'NFE' | 'CTE' | 'MDFE' | 'NF' | 'OTHER';
  number: string;
  series?: string;
  accessKey?: string; // chave 44 dígitos para NF-e
  issuerTaxId: string;
  recipientTaxId: string;
  issueDate: string;
  totalQuantity?: number;
  totalValue?: number;
  status: 'ISSUED' | 'CANCELLED' | 'OTHER';
}
```

### 3.7 `OrderReference`

```typescript
interface CanonicalOrderReference {
  externalId: string;
  type: 'PURCHASE_ORDER' | 'SALES_ORDER' | 'CONTRACT' | 'LOAD_ORDER';
  number: string;
  partnerExternalId: string;
  productExternalId?: string;
  expectedQuantity?: number;
  unit?: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  expirationDate?: string;
}
```

### 3.8 Outras entidades

- `CanonicalInventoryMovement` — movimento de estoque gerado pela pesagem
- `CanonicalInvoiceRequest` — solicitação de emissão de fatura
- `CanonicalAttachment` — anexo (foto, assinatura, PDF)
- `CanonicalQualityDiscount` — desconto por umidade/impureza

(Schemas completos em `backend/src/integracao/canonical/v1/`)

---

## 4. Validação

Todos os schemas usam `class-validator` + `class-transformer`. Exemplo:

```typescript
import { IsString, IsEnum, ValidateNested, IsOptional } from 'class-validator';

export class CanonicalWeighingTicketDto {
  @IsString()
  ticketId: string;

  @IsString()
  ticketNumber: string;

  @IsEnum(['PURCHASE', 'SALE', 'TRANSFER', 'SERVICE', 'OTHER'])
  operationType: OperationType;

  @ValidateNested()
  @Type(() => CanonicalVehicleDto)
  vehicle: CanonicalVehicleDto;

  // ...
}
```

---

## 5. Convenções

### 5.1 Identificadores

- IDs internos: UUID v4
- Campo `externalId` armazena ID do ERP (string para flexibilidade)
- Vínculo persistido em `integracao_external_link`

### 5.2 Datas

- Formato ISO 8601 com timezone explícito
- Conversão para UTC só no momento do envio (mapping engine)

### 5.3 Pesos

- Sempre em quilogramas no canônico
- Conversão para outras unidades só no mapping (`unit-convert`)

### 5.4 Documentos

- CNPJ/CPF: apenas dígitos no canônico
- Formatação só no display

### 5.5 Strings opcionais vs vazias

- Campo opcional ausente: `undefined` (não enviar no JSON)
- Campo opcional vazio: `null` ou `""` é semanticamente diferente

---

## 6. Hash de integridade

`audit.hash` é calculado no momento de fechamento do ticket:

```
sha256(JSON.stringify(ticketCanonical, ordenadoAlfabeticamente))
```

Permite detectar alteração posterior. Mudança no ticket após envio gera **evento de correção** (não sobrescreve).

---

## 7. Evolução

Quando precisar adicionar campo:

1. Adicionar como **opcional** em v1
2. Atualizar conectores para preencher (gradualmente)
3. Documentar em changelog

Quando precisar mudar campo de forma incompatível:

1. Criar v2 com o novo formato
2. Conectores declaram versão suportada
3. Mapping engine faz conversão v1↔v2 quando trivial
4. Deprecar v1 com prazo mínimo de 6 meses

---

## 8. Referências

- ADR-003 — Modelo canônico versionado
- `docs/GUIA-INTEGRACAO-ERP.md` seção 6
- `backend/src/integracao/canonical/v1/`
