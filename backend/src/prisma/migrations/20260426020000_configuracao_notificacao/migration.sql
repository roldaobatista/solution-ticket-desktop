-- F-005: Preferencias de notificacao por tenant (alertas por e-mail e webhook)

CREATE TABLE "configuracao_notificacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "email_erros_impressao" BOOLEAN NOT NULL DEFAULT false,
    "email_backup_falha" BOOLEAN NOT NULL DEFAULT false,
    "email_enderecos" TEXT NOT NULL DEFAULT '',
    "webhook_url" TEXT NOT NULL DEFAULT '',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "configuracao_notificacao_tenant_unique" ON "configuracao_notificacao"("tenant_id");
