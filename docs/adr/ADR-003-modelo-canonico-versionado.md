# ADR-003: Modelo canônico versionado

**Status**: Aprovada
**Data**: 2026-04-26

## Contexto

Cada ERP tem seu próprio modelo de dados (SAP usa `MARA`/`KNA1`, TOTVS usa `SB1`/`SA1`, Bling usa REST JSON). Se o módulo de integração falar diretamente com cada modelo, cria-se acoplamento N×M entre conectores e módulos de negócio.

## Decisão

Definir um **modelo canônico próprio** (DTOs internos do hub) que serve como contrato único entre:

- **Módulos de negócio** (ticket, romaneio, fatura) → emitem dados em formato canônico
- **Conectores ERP** → traduzem canônico ↔ formato do ERP

O modelo canônico é **versionado** (`v1`, `v2`, ...). Evolução compatível adiciona campos opcionais; mudança incompatível exige nova versão e migração de conectores.

### Entidades canônicas mínimas (v1)

- `WeighingTicket`, `WeighingEvent`
- `Partner` (cliente, fornecedor, transportadora)
- `Vehicle`, `Driver`
- `Product`, `Location`
- `OrderReference`, `FiscalDocumentReference`
- `QualityDiscount`, `InventoryMovement`, `InvoiceRequest`, `Attachment`

### Versionamento

- Schema declarado em `backend/src/integracao/canonical/v1/`
- Cada conector declara qual versão consome via `getCapabilities()`
- Migração automática entre versões via mapping engine quando possível

## Consequências

### Positivas

- Adicionar conector novo não exige tocar módulos de negócio
- Testes do mapping engine independem de ERP real
- Permite SDK público (parceiros) na Fase 4
- Auditoria fiscal armazena formato estável (canônico) + payload do ERP (variável)

### Negativas

- Curva de aprendizado: time precisa entender canônico antes de qualquer conector
- Risco de "vazamento" de conceitos de ERP no canônico — exige revisão arquitetural
- Versionamento exige disciplina

## Alternativas consideradas

- **Sem canônico** (mapping direto módulo→ERP): rejeitada por acoplamento
- **OpenAPI como canônico**: rejeitada — OpenAPI descreve API, não modelo de domínio
- **Schema do ERP dominante** (ex: usar SAP como referência): rejeitada — amarra ao SAP

## Referências

- `docs/GUIA-INTEGRACAO-ERP.md` seção 6
- `docs/PLANO-MODULO-INTEGRACAO.md` seção 11 (Épico 2)
