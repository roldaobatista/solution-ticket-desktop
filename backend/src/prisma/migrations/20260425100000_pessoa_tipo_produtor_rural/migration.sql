-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "tipo_pessoa" TEXT NOT NULL DEFAULT 'PJ',
    "documento" TEXT,
    "inscricao_estadual" TEXT,
    "inscricao_municipal" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "codigo_integracao" TEXT,
    "saldo_financeiro" DECIMAL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);
INSERT INTO "new_cliente" ("ativo", "atualizado_em", "cidade", "codigo_integracao", "criado_em", "documento", "email", "endereco", "id", "razao_social", "saldo_financeiro", "telefone", "tenant_id", "uf") SELECT "ativo", "atualizado_em", "cidade", "codigo_integracao", "criado_em", "documento", "email", "endereco", "id", "razao_social", "saldo_financeiro", "telefone", "tenant_id", "uf" FROM "cliente";
DROP TABLE "cliente";
ALTER TABLE "new_cliente" RENAME TO "cliente";
CREATE INDEX "cliente_tenant_id_idx" ON "cliente"("tenant_id");
CREATE TABLE "new_empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "nome_empresarial" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "tipo_pessoa" TEXT NOT NULL DEFAULT 'PJ',
    "documento" TEXT,
    "inscricao_estadual" TEXT,
    "inscricao_municipal" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "logo_principal" TEXT,
    "logo_relatorios" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "empresa_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_empresa" ("ativo", "atualizado_em", "cidade", "criado_em", "documento", "email", "endereco", "id", "logo_principal", "logo_relatorios", "nome_empresarial", "nome_fantasia", "site", "telefone", "tenant_id", "uf") SELECT "ativo", "atualizado_em", "cidade", "criado_em", "documento", "email", "endereco", "id", "logo_principal", "logo_relatorios", "nome_empresarial", "nome_fantasia", "site", "telefone", "tenant_id", "uf" FROM "empresa";
DROP TABLE "empresa";
ALTER TABLE "new_empresa" RENAME TO "empresa";
CREATE INDEX "empresa_tenant_id_idx" ON "empresa"("tenant_id");
CREATE UNIQUE INDEX "empresa_tenant_id_documento_key" ON "empresa"("tenant_id", "documento");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineIndex

