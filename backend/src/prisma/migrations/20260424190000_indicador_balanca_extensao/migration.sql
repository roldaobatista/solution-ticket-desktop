-- IndicadorPesagem: novos campos
ALTER TABLE "indicador_pesagem" ADD COLUMN "fabricante" TEXT;
ALTER TABLE "indicador_pesagem" ADD COLUMN "modelo" TEXT;
ALTER TABLE "indicador_pesagem" ADD COLUMN "protocolo" TEXT NOT NULL DEFAULT 'serial';
ALTER TABLE "indicador_pesagem" ADD COLUMN "builtin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "indicador_pesagem" ADD COLUMN "exemplo_trama" TEXT;
ALTER TABLE "indicador_pesagem" ADD COLUMN "notas" TEXT;
ALTER TABLE "indicador_pesagem" ADD COLUMN "atraso" INTEGER;

-- Balanca: overrides + telemetria
ALTER TABLE "balanca" ADD COLUMN "ovr_data_bits" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "ovr_parity" TEXT;
ALTER TABLE "balanca" ADD COLUMN "ovr_stop_bits" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "ovr_flow_control" TEXT;
ALTER TABLE "balanca" ADD COLUMN "ovr_inicio_peso" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "ovr_tamanho_peso" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "ovr_tamanho_string" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "ovr_marcador" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "ovr_fator" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "ovr_inverte_peso" BOOLEAN;
ALTER TABLE "balanca" ADD COLUMN "ovr_atraso" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "ovr_parser_tipo" TEXT;
ALTER TABLE "balanca" ADD COLUMN "ultima_conexao" DATETIME;
ALTER TABLE "balanca" ADD COLUMN "ultima_leitura" DATETIME;
