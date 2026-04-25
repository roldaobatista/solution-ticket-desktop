# Migrations em Campo — SQLite do Cliente Instalado

Cobre o achado D4 da auditoria. Descreve a estratégia de atualização de schema no banco SQLite que vive no computador do cliente (`%APPDATA%\@solution-ticket\electron\solution-ticket.db`).

## Contexto

- Cada instalação tem um `.db` próprio, não compartilhado.
- Primeira instalação: `electron/main.js` → `runMigrationsIfNeeded()` aplica migrations do bundle quando o DB ainda não existe.
- Atualizações subsequentes (v1.0 → v1.1 etc.): o schema evolui e precisamos aplicar migrations sobre um DB com dados de produção do cliente.

## Estratégia

### 1. Geração de migrations

Durante desenvolvimento, **sempre** usar `prisma migrate dev` em vez de `prisma db push`. Isso gera a pasta `backend/src/prisma/migrations/<timestamp>_<nome>/migration.sql` versionada no Git.

```bash
cd backend
npx prisma migrate dev --name add_indice_ticket_unidade --schema=src/prisma/schema.prisma
```

**Regra:** qualquer mudança de schema que chegar em `main` tem uma migration correspondente.

### 2. Aplicação no app empacotado

No boot do Electron, ANTES de subir o backend:

```js
// electron/main.js (já existe — ver runMigrationsIfNeeded)
spawn(process.execPath, [prismaBin, 'migrate', 'deploy', `--schema=${schemaPath}`], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', DATABASE_URL: `file:${dbPath}` },
});
```

`migrate deploy` é **idempotente**: só aplica migrations que ainda não estão registradas na tabela `_prisma_migrations`.

### 3. Backup automático antes de migrar

**NÃO IMPLEMENTADO AINDA — Issue pendente.**

Proposta:

```js
function backupDatabase(dbPath) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = `${dbPath}.backup-${ts}`;
  fs.copyFileSync(dbPath, backup);
  // Rotação: manter só os últimos 5 backups
  return backup;
}

async function runMigrationsIfNeeded() {
  const dbPath = getDatabasePath();
  if (fs.existsSync(dbPath) && precisaMigrar(dbPath)) {
    const backup = backupDatabase(dbPath);
    try {
      await rodarPrismaDeploy(dbPath);
    } catch (err) {
      // Rollback: restaurar backup
      fs.copyFileSync(backup, dbPath);
      throw err;
    }
  }
}
```

### 4. Detecção de "precisa migrar"

Comparar `applied_migrations` no `_prisma_migrations` com o bundle:

```js
function precisaMigrar(dbPath) {
  const bundleMigrations = fs.readdirSync(getMigrationsDir()).filter((n) => n.match(/^\d{14}_/));
  const aplicadas = consultarPrismaMigrations(dbPath);
  return bundleMigrations.some((m) => !aplicadas.includes(m));
}
```

Isso evita rodar `migrate deploy` toda vez que o app abre (economia de ~500 ms no cold start).

### 5. Migrations destrutivas

Qualquer migration que faça `DROP COLUMN`, `DROP TABLE`, `ALTER COLUMN TYPE` ou mudança incompatível:

1. Gerar em branch separada.
2. Revisar no PR com label `migration-destrutiva`.
3. Escrever script de migração de dados **antes** do DDL (`INSERT INTO ... SELECT`).
4. Testar em cópia de banco de cliente real (se possível).
5. Release com changelog explícito avisando.

### 6. Comunicação com o usuário

Splash do Electron deve exibir durante migrations:

```
"Atualizando banco de dados (backup criado em ...backup-2026-04-24T...)"
```

Em caso de erro:

```
"Falha ao atualizar banco. O sistema reverteu para o backup.
 Entre em contato com o suporte."
```

## Comandos úteis (desenvolvedor)

```bash
# Aplicar schema direto (sem migration formal) — só em desenvolvimento
cd backend
DATABASE_URL="file:C:/Users/.../AppData/Roaming/@solution-ticket/electron/solution-ticket.db" \
  npx prisma db push --schema=src/prisma/schema.prisma --accept-data-loss

# Inspecionar migrations aplicadas num banco de cliente
DATABASE_URL="file:..." \
  npx prisma migrate status --schema=src/prisma/schema.prisma

# Reset total (DEV APENAS)
DATABASE_URL="file:..." \
  npx prisma migrate reset --schema=src/prisma/schema.prisma
```

## Checklist de release

- [ ] Todas as mudanças de schema têm migration versionada
- [ ] Rodei `prisma migrate deploy` localmente num `.db` vindo de cliente (se possível)
- [ ] Testei instalação limpa em VM Windows
- [ ] Testei upgrade de versão anterior em VM Windows
- [ ] Backup automático funciona (quando implementado)
- [ ] Changelog menciona qualquer migration destrutiva

## Migration de catch-up `20260425000000_catchup_indices_uniques_v1_1`

Resolve RD1 da reauditoria 2026-04-25. Reconcilia drift entre schema.prisma e o histórico de migrations.

**Importante:** antes de aplicar em produção, rodar:

```bash
sqlite3 solution-ticket.db < src/prisma/migrations/20260425000000_catchup_indices_uniques_v1_1/PRE-CHECK-duplicates.sql
```

Para detalhes ver `backend/src/prisma/migrations/20260425000000_catchup_indices_uniques_v1_1/README.md`.

## Referências

- Prisma docs — Production migrations: https://www.prisma.io/docs/orm/prisma-migrate/workflows/production-and-testing
- SQLite pragmas aplicados: `PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA synchronous=NORMAL;` (ver `backend/src/prisma/prisma.service.ts`)
