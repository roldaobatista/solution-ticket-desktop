-- Corrige drift historico: o schema atual exige balanca.tenant_id,
-- mas a cadeia de migrations anterior recriava a tabela sem a coluna.
ALTER TABLE "balanca" ADD COLUMN "tenant_id" TEXT;

UPDATE "balanca"
SET "tenant_id" = COALESCE(
  (SELECT "tenant_id" FROM "empresa" WHERE "empresa"."id" = "balanca"."empresa_id"),
  (SELECT "id" FROM "tenant" LIMIT 1),
  'legacy'
)
WHERE "tenant_id" IS NULL;

CREATE INDEX IF NOT EXISTS "balanca_tenant_id_idx" ON "balanca"("tenant_id");
