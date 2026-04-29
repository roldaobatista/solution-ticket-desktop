# Política de Migrations Prisma — Módulo Integração ERP

> **Status:** Vigente a partir de Sprint 1
> **Owner agentico:** `Architecture-Agent` + `SRE-Agent`
> **Aplica-se a:** todo schema que sustenta dado fiscal, financeiro ou de auditoria do módulo Integração ERP

---

## 1. Contexto e motivação

O `CLAUDE.md` do produto-base reconhece que o fluxo de dev usa `prisma db push` (sincronização direta sem histórico de migrations). Isso é aceitável em protótipo de tela, mas **inaceitável** para o módulo Integração ERP, onde:

- Tabelas carregam dado fiscal (CFOP, CST, NCM, CT-e, NF-e) com regras de retenção legal.
- Outbox armazena eventos que comprovam transmissão para ERPs de clientes (prova jurídica em caso de divergência).
- Logs de auditoria não podem perder linhas em mudança de schema.

`db push` apaga e recria estrutura sem registro do que mudou — qualquer rollback ou auditoria fica impossível.

## 2. Regras

### 2.1. Toda alteração de schema = migration formal

A partir de Sprint 1, qualquer mudança em `prisma/schema.prisma` que afete tabelas do módulo Integração ERP **exige**:

```bash
npx prisma migrate dev --name <descricao_curta>
```

`db push` fica proibido em qualquer branch que toque essas tabelas. Pre-commit hook bloqueia commits de `prisma/schema.prisma` sem migration correspondente em `prisma/migrations/`.

### 2.2. Migrations em revisão obrigatória

Toda migration entra em PR (mesmo no fluxo direto-em-main, criar PR específico para migration) com:

- Diff SQL gerado pelo Prisma anexado.
- Justificativa da mudança no corpo do PR.
- Estimativa de impacto (linhas afetadas, tempo esperado de execução).
- Plano de rollback explicitado.

### 2.3. Migrations destrutivas

`DROP COLUMN`, `DROP TABLE`, `ALTER COLUMN ... NOT NULL` em coluna existente, ou qualquer mudança que perde dados:

- **2 reviewers agenticos independentes** (`Architecture-Agent` + `SRE-Agent` ou `QA-Automation-Agent`).
- **Período de coexistência mínimo de 1 release**: marcar coluna como `@deprecated` no schema, parar de escrever, manter leitura. Apenas no release seguinte remove.
- Estratégia documentada em ADR caso afete tabela com >100k linhas.

### 2.4. Rollback testado antes de release

Antes de aplicar migration em produção:

1. Tirar snapshot do banco de um cliente real (anonimizado).
2. Aplicar a migration nessa cópia.
3. Aplicar o rollback (`prisma migrate resolve --rolled-back <migration>`).
4. Validar que estado pós-rollback é idêntico ao pré-migration.

Sem essa validação, release não vai a produção.

### 2.5. Backup automático antes de cada migration em produção

Coberto pela política de backup (ADR-019 quando criado / `BACKUP-RESTORE-SQLITE.md`). Resumo:

- Backup completo do `.db` + `.wal` + `.shm` antes de aplicar migration.
- Backup retido por mínimo 30 dias.
- Hash SHA-256 do backup registrado no log de release.

## 3. Procedimento padrão de release

1. **Backup** do banco do cliente (script automatizado, validado por hash).
2. **Aplicar migration em staging** com snapshot de produção carregado.
3. **Validação de smoke**:
   - Queries-chave (count por tabela crítica, sum de campos financeiros).
   - Comparação row count antes/depois.
   - Smoke E2E: criar ticket, despachar, verificar log.
4. **Janela de manutenção** (off-hour, normalmente madrugada do horário do cliente):
   - Avisar cliente com 24h de antecedência.
   - Aplicar `prisma migrate deploy`.
   - Tempo máximo aceitável: 5 min para clientes pequenos, 30 min para grandes (caso ultrapasse, abortar e reagendar com janela maior).
5. **Smoke pós-deploy**: mesmas queries do passo 3 + healthcheck do hub.
6. **Se falhar**: executar rollback (`prisma migrate resolve --rolled-back <migration>` + restore do backup do passo 1 se necessário).

## 4. Casos especiais

### 4.1. Adicionar coluna `NOT NULL` em tabela grande

Estratégia em 2 releases:

- **Release N:** adiciona coluna como `NULL`; código novo escreve valor; backfill rodando em background com batches de 1000 linhas.
- **Release N+1:** após confirmar 100% backfilled, altera para `NOT NULL`.

### 4.2. Renomear coluna ou tabela

Estratégia em 3 releases:

- **N:** adiciona nome novo, copia valores via trigger ou backfill, código escreve nos dois.
- **N+1:** código lê só do novo, escreve só no novo.
- **N+2:** remove o antigo.

### 4.3. Mudança de tipo (ex: `Int` → `BigInt`)

Mesmo padrão do 4.2: nova coluna, backfill, swap, drop.

## 4.4. Cobertura progressiva de testes em migrations

A cobertura de testes que **acompanha** cada migration sobe gradualmente conforme o módulo amadurece. Não fixar 80% desde Sprint 0 — isso vira "ou bate cobertura ou entrega no prazo", e a primeira opção sempre perde.

### Banda por sprint

| Fase              | Sprints         | Cobertura mínima de migrations | Justificativa                                                          |
| ----------------- | --------------- | ------------------------------ | ---------------------------------------------------------------------- |
| Chassi novo       | Sprint 0 – 3    | **60%**                        | Instabilidade aceitável; schema muda muito; teste pesado é desperdício |
| Mapping + UI      | Sprint 4 – 5    | **70%**                        | Schema do mapping engine estabiliza; testes de UI entram               |
| Estabilidade      | Sprint 6+       | **80%**                        | Módulo em homologação; cobertura padrão da casa                        |
| Críticos (sempre) | qualquer sprint | **90%**                        | Tabelas Outbox, Mapping, Cofre, Audit Trail                            |

### Como interpretar

- **60%/70%/80%** = cobertura de linhas dos arquivos `prisma/migrations/**/*.sql` exercidos por testes de migração (apply + rollback).
- **90% nos críticos** vale **independente de sprint** — qualquer migration que toca `outbox_event`, `mapping_definition`, `vault_secret`, `audit_log` exige 90% desde o primeiro dia.
- Cobertura medida via Istanbul/c8 sobre os scripts de teste de migração, não sobre o schema em si.

### Aplicação

- Pre-commit hook lê o sprint atual do `.sprint-config.json` e aplica o threshold correspondente.
- Cobertura abaixo do threshold bloqueia merge no PR de migration (ver ADR-022 §2.2).
- Exceção concedida apenas por decision record do `Agent-Orchestrator`, com justificativa e prazo de correção.

## 5. Governança

- Auditoria mensal de `prisma/migrations/` cruzando com tickets de release.
- Toda migration executada em produção tem entrada em runbook com: cliente, data, hash do backup, resultado de smoke, observações.
- Ferramentas: Prisma Migrate + script de rollback testado + dashboard de status de migrations por cliente.
