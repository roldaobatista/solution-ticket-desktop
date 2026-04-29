ALTER TABLE "auditoria" ADD COLUMN "prev_hash" TEXT;
ALTER TABLE "auditoria" ADD COLUMN "hash" TEXT NOT NULL DEFAULT 'legacy';

CREATE INDEX "auditoria_tenant_hash_idx" ON "auditoria"("tenant_id", "hash");
