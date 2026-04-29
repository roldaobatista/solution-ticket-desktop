ALTER TABLE "integracao_log" ADD COLUMN "prev_hash" TEXT;
ALTER TABLE "integracao_log" ADD COLUMN "hash" TEXT NOT NULL DEFAULT 'legacy';

CREATE INDEX "integracao_log_profile_hash_idx" ON "integracao_log"("profile_id", "hash");
