-- Onda 2.3 — tokenVersion habilita revogacao de JWT em massa.
-- Default 0; JwtStrategy compara com payload.tv e rejeita tokens com versao antiga.

ALTER TABLE "usuario" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
