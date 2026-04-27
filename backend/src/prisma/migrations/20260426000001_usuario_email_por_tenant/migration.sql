-- F-014: Remove unique global de email e adiciona unique composta (tenantId, email)
-- SQLite exige recriação da tabela para alterar constraints.

CREATE TABLE "usuario_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acesso" DATETIME,
    "tentativas_login" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" DATETIME,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

INSERT INTO "usuario_new" SELECT * FROM "usuario";

DROP TABLE "usuario";
ALTER TABLE "usuario_new" RENAME TO "usuario";

CREATE UNIQUE INDEX "usuario_tenant_email_unique" ON "usuario"("tenant_id", "email");
CREATE INDEX "usuario_tenant_idx" ON "usuario"("tenant_id");
