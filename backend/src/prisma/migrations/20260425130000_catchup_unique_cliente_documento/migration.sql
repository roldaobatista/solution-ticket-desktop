-- Onda 0 — sincronização defensiva entre schema.prisma e banco existente.
-- Em ambientes onde o banco foi criado via `prisma db push` antes desta migration,
-- estes índices/constraints já existem. IF NOT EXISTS torna a aplicação idempotente.

-- CreateIndex (unique cliente por tenant+documento)
CREATE UNIQUE INDEX IF NOT EXISTS "cliente_tenant_id_documento_key" ON "cliente"("tenant_id", "documento");

-- CreateIndex (unique empresa por tenant+documento)
CREATE UNIQUE INDEX IF NOT EXISTS "empresa_tenant_id_documento_key" ON "empresa"("tenant_id", "documento");

-- CreateIndex (índices compostos para performance de listagens de ticket)
CREATE INDEX IF NOT EXISTS "ticket_pesagem_tenant_id_cliente_id_criado_em_idx" ON "ticket_pesagem"("tenant_id", "cliente_id", "criado_em");
CREATE INDEX IF NOT EXISTS "ticket_pesagem_tenant_id_status_comercial_criado_em_idx" ON "ticket_pesagem"("tenant_id", "status_comercial", "criado_em");

-- CreateIndex (assinatura única por ticket)
CREATE UNIQUE INDEX IF NOT EXISTS "assinatura_ticket_ticket_id_key" ON "assinatura_ticket"("ticket_id");

-- CreateIndex (auditoria — busca por entidade afetada)
CREATE INDEX IF NOT EXISTS "auditoria_entidade_entidade_id_idx" ON "auditoria"("entidade", "entidade_id");
CREATE INDEX IF NOT EXISTS "auditoria_data_hora_idx" ON "auditoria"("data_hora");
CREATE INDEX IF NOT EXISTS "auditoria_tenant_id_idx" ON "auditoria"("tenant_id");
