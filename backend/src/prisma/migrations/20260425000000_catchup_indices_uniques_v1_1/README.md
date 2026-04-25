# Migration `20260425000000_catchup_indices_uniques_v1_1`

**Data:** 2026-04-25
**Origem:** RD1 + RD2 da reauditoria 2026-04-25.

## O que faz

Catch-up migration que reconcilia o estado do schema (`schema.prisma`) com o histórico de migrations versionado em `migrations/`. O drift veio de uso de `prisma db push` em desenvolvimento sem geração de migration formal correspondente.

### Mudanças incluídas

| Bloco | Tipo                             | Descrição                                                                                                                       |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `ALTER TABLE`                    | `licenca_instalacao` ganha `expira_em DATETIME`                                                                                 |
| 2     | 8 `CREATE TABLE`                 | `tipo_veiculo`, `historico_preco`, `tipo_fatura`, `recibo`, `tipo_desconto`, `relatorio_salvo`, `token_reset`, `erro_impressao` |
| 3     | 4 redefines (drop+create+rename) | `balanca`, `indicador_pesagem`, `pagamento_fatura`, `permissao` — adiciona colunas via SQLite-style table redefinition          |
| 4     | 44 `CREATE INDEX`                | índices em FKs e campos de busca (Wave 3 da auditoria original)                                                                 |
| 5     | 5 `CREATE UNIQUE INDEX`          | inclui dois constraints tenant-scoped: `empresa(tenant_id, documento)` e `veiculo(tenant_id, placa)`                            |

## ⚠️ Pré-checagem obrigatória em produção

Os 2 uniques tenant-scoped podem **falhar** em clientes que tenham duplicatas. **Antes de aplicar:**

```bash
sqlite3 "%APPDATA%\@solution-ticket\electron\solution-ticket.db" < PRE-CHECK-duplicates.sql
```

Se retornar **qualquer linha**, siga o procedimento RECOVERY documentado no próprio script antes de prosseguir.

## Aplicação

### Cliente já em produção

```bash
# 1. Backup
cp "%APPDATA%\@solution-ticket\electron\solution-ticket.db" \
   "%APPDATA%\@solution-ticket\electron\solution-ticket.backup-pre-1.1.db"

# 2. Pre-check
sqlite3 ... < PRE-CHECK-duplicates.sql

# 3. Aplicar (Electron faz isso no boot via prisma migrate deploy)
DATABASE_URL="file:..." npx prisma migrate deploy --schema=src/prisma/schema.prisma
```

### Instalação nova

Migration roda automaticamente após init/foto-automacao-assinatura/indicador-extensao/balanca-padrao no boot do Electron (ver `electron/main.js:runMigrationsIfNeeded`).

## Validação pós-aplicação

```bash
# Confirma _prisma_migrations atualizado
sqlite3 solution-ticket.db "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;"

# Confirma novos índices criados
sqlite3 solution-ticket.db "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%_idx';" | wc -l
# Esperado: ≥ 44
```

## Rollback

Se a migração falhar a meio, `_prisma_migrations` registra estado `failed`. Procedimento:

1. Restaurar `solution-ticket.backup-pre-1.1.db` para `solution-ticket.db`.
2. Reabrir app — migrations bundled vão tentar reaplicar (idempotente até falhar de novo).
3. Investigar a falha (provavelmente unique constraint em duplicata) e tratar via PRE-CHECK.

## Observações sobre tabela redefinition

Os 4 blocos do tipo "drop + create new_X + insert + rename" (balanca, indicador_pesagem, pagamento_fatura, permissao) são o padrão SQLite para alterações de coluna não-additivas. Em clientes que **já tinham** essas colunas via `db push`, o resultado é uma tabela idêntica — operação custosa mas idempotente.
