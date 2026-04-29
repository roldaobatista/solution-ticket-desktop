# ADR-005: Conectores ERP plugáveis via Strategy

**Status**: Aprovada
**Data**: 2026-04-26

## Contexto

O módulo precisa suportar múltiplos ERPs com características muito distintas (REST/SOAP/SFTP/banco/iPaaS, autenticação variada, semântica de erro diferente). Implementar `if (erp === 'sap') { ... } else if (erp === 'totvs') { ... }` é insustentável.

## Decisão

Cada conector implementa a interface `IErpConnector` (ver ADR-001 / PLANO seção 5.3). Cada conector é um **adapter** isolado em `backend/src/integracao/connectors/<erp>/`, registrado no `ConnectorRegistryService` por código.

O `ConnectorFactoryService` recebe um `profile` e devolve a instância apropriada via lookup no registry. O dispatcher do outbox **não conhece** ERPs específicos — fala apenas com `IErpConnector`.

### Capacidades declaradas

Cada conector publica `capabilities()` informando: pull/push, webhook, batch, attachments, cancellation, reversal, custom fields, entidades suportadas, métodos de auth aceitos, rate limits. Isso permite que UI e orquestrador decidam comportamento sem switch case por ERP.

### Estrutura padrão

```
connectors/<erp>/
  <erp>.connector.ts        IErpConnector
  <erp>.auth.ts             estratégia de autenticação
  <erp>.mapper.ts           canônico ↔ ERP
  <erp>.client.ts           HTTP client + retry específico
  <erp>.errors.ts           classificação técnico vs negócio
  <erp>.fixtures.ts         payloads de teste
  *.spec.ts                 testes unitários e de contrato
  mapping/<erp>-default.yaml template de mapping
```

## Consequências

### Positivas

- Adicionar conector novo não toca código existente
- Conectores podem evoluir em ritmo independente
- Habilita SDK público (parceiros) na Fase 4
- Test harness reusável para todos os conectores

### Negativas

- Boilerplate por conector (mitigado por scaffold/template)
- Exige disciplina de não vazar lógica genérica para conectores específicos

## Alternativas consideradas

- **Switch case central**: rejeitada por insustentabilidade
- **Plugins NPM dinâmicos**: deferida para Fase 4 (SDK público)

## Referências

- `docs/PLANO-MODULO-INTEGRACAO.md` seção 13 (Playbook Universal)
- Gamma et al., _Design Patterns_, Strategy
