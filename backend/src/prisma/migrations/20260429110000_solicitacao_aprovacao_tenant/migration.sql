ALTER TABLE "solicitacao_aprovacao"
ADD COLUMN "tenant_id" TEXT NOT NULL DEFAULT 'legacy';

CREATE INDEX "solicitacao_aprovacao_tenant_id_idx"
ON "solicitacao_aprovacao"("tenant_id");
