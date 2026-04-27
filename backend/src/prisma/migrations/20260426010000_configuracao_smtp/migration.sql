-- F-005: Configuracao SMTP para envio de e-mail (recuperacao de senha, alertas)

CREATE TABLE "configuracao_smtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "user" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "from_name" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "configuracao_smtp_tenant_unique" ON "configuracao_smtp"("tenant_id");
