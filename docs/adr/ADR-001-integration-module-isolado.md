# ADR-001: Módulo de Integração como camada isolada

**Status**: Aprovada
**Data**: 2026-04-26
**Contexto técnico**: Solução desktop (Electron + NestJS + SQLite + Prisma)

## Contexto

O Solution Ticket precisa integrar com 20+ ERPs ao longo de 18 meses. Há duas abordagens possíveis:

1. **Espalhar lógica de integração** dentro dos módulos existentes (`ticket`, `fatura`, `romaneio`, `cadastros`)
2. **Criar camada nova e independente** que consome eventos desses módulos

A primeira opção parece simples no início (1 cliente, 1 ERP), mas degrada rapidamente: cada novo ERP exige edição de N módulos; testes ficam acoplados; trocar ERP exige refactor profundo; reuso entre clientes é zero.

## Decisão

Criar **`IntegracaoModule`** como módulo NestJS isolado em `backend/src/integracao/`, seguindo Anti-Corruption Layer (DDD) + Hexagonal Architecture.

Os módulos de negócio **emitem eventos de domínio** (`weighing.ticket.closed`, etc.). O módulo de integração **consome esses eventos** e despacha via conectores plugáveis. Os módulos de negócio **não conhecem** ERP algum.

## Consequências

### Positivas

- Trocar/adicionar ERP não toca o core de pesagem
- Testes do módulo de integração isolados
- Permite versionamento independente do contrato canônico
- Habilita marketplace de conectores parceiros (Fase 4)
- Módulos de negócio permanecem testáveis sem mock de ERP

### Negativas

- Camada de indireção adicional (eventos) — overhead para casos triviais
- Exige disciplina de não vazar tipos de ERP para o core
- Code review precisa vigiar acoplamento

## Alternativas consideradas

**A. Lógica no módulo de pesagem**: rejeitada por acoplamento e reuso zero.

**B. Microsserviço externo**: rejeitada — produto é desktop local-first; não faz sentido ter serviço externo obrigatório.

**C. Plugins NPM separados**: rejeitada na v1 — overhead de versionamento. Pode ser revisitada na Fase 4 com SDK público.

## Referências

- `docs/PLANO-MODULO-INTEGRACAO.md` seção 3
- `docs/GUIA-INTEGRACAO-ERP.md` seção 3
- Eric Evans, _Domain-Driven Design_, cap. 14 (Anti-Corruption Layer)
