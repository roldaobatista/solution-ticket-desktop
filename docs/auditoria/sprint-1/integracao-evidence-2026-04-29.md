# Evidence Pack — Sprint 1 Integração ERP

Data: 2026-04-29
Branch: `feature/modulo-integracao-execucao`

## Escopo verificado

- `IntegracaoModule` registrado no backend.
- 13 tabelas `integracao_*` criadas por migration Prisma formal.
- CRUD de `IntegracaoProfile` com escopo por tenant.
- Outbox idempotente com retry, DLQ e reprocessamento.
- Worker de processamento local da outbox contra conectores registrados.
- Logs com payload mascarado.
- `MockErpConnector` funcional e registry plugável.
- Endpoints de teste local: enfileirar evento mock e processar próximo item da outbox.
- 12 permissões `integracao:*` cadastradas para Administrador via seed idempotente.

## Evidências

- `npx prisma migrate deploy --schema=src/prisma/schema.prisma`: aplicado com sucesso.
- `pnpm --filter ./backend db:seed`: aplicado com sucesso.
- `npx prisma migrate status --schema=src/prisma/schema.prisma`: schema atualizado.
- `PRAGMA foreign_key_check`: 0 violações.
- Conector `mock@1.0.0`: presente.
- Permissões `integracao:*`: 12 registros.
- `pnpm --filter ./backend test`: 53 test suites, 329 testes passando.
- `pnpm --filter ./backend build`: build NestJS concluído.
- `eslint src/integracao/**/*.ts`: sem warnings/erros no módulo.

## Dependências externas

Nenhum conector ERP real foi marcado como `PILOT_READY` ou `COMMERCIAL_GA_READY`.
Sandboxes, cliente piloto, contrato, termo externo, DPO/CISO reais e programas de parceria permanecem em `EXTERNAL-DEPENDENCIES.md`.
