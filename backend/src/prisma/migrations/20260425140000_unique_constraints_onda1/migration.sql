-- Onda 1.2 — uniqueness criticos para integridade transacional.
-- Idempotente (CREATE INDEX IF NOT EXISTS) para nao explodir em DBs onde
-- o schema ja foi propagado via prisma db push.

-- ConfiguracaoOperacionalUnidade: 1 config por unidade (impede config duplicada)
CREATE UNIQUE INDEX IF NOT EXISTS "configuracao_operacional_unidade_unidade_id_key"
  ON "configuracao_operacional_unidade"("unidade_id");

-- Fatura: numero unico por tenant
CREATE UNIQUE INDEX IF NOT EXISTS "fatura_tenant_id_numero_key"
  ON "fatura"("tenant_id", "numero");

-- IndicadorPesagem: descricao unica por tenant + indice de tenant
CREATE INDEX IF NOT EXISTS "indicador_pesagem_tenant_id_idx"
  ON "indicador_pesagem"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "indicador_pesagem_tenant_id_descricao_key"
  ON "indicador_pesagem"("tenant_id", "descricao");

-- PassagemPesagem: sequencia unica por ticket (rede de seguranca contra
-- race em registrarPassagem; protege mesmo se a contagem dentro da tx falhar)
CREATE UNIQUE INDEX IF NOT EXISTS "passagem_pesagem_ticket_id_sequencia_key"
  ON "passagem_pesagem"("ticket_id", "sequencia");

-- Romaneio: numero unico por tenant
CREATE UNIQUE INDEX IF NOT EXISTS "romaneio_tenant_id_numero_key"
  ON "romaneio"("tenant_id", "numero");

-- TicketPesagem: numero unico por unidade (rede de seguranca contra race
-- em create; antes a unicidade dependia apenas do count + create dentro
-- da transacao).
CREATE UNIQUE INDEX IF NOT EXISTS "ticket_pesagem_unidade_id_numero_key"
  ON "ticket_pesagem"("unidade_id", "numero");
