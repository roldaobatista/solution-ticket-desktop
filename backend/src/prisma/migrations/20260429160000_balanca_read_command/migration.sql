ALTER TABLE "indicador_pesagem" ADD COLUMN "read_mode" TEXT NOT NULL DEFAULT 'continuous';
ALTER TABLE "indicador_pesagem" ADD COLUMN "read_command_hex" TEXT;
ALTER TABLE "indicador_pesagem" ADD COLUMN "read_interval_ms" INTEGER;
ALTER TABLE "indicador_pesagem" ADD COLUMN "read_timeout_ms" INTEGER;

ALTER TABLE "balanca" ADD COLUMN "read_mode" TEXT;
ALTER TABLE "balanca" ADD COLUMN "read_command_hex" TEXT;
ALTER TABLE "balanca" ADD COLUMN "read_interval_ms" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "read_timeout_ms" INTEGER;

UPDATE "indicador_pesagem"
SET
  "read_mode" = 'polling',
  "read_command_hex" = '05',
  "read_interval_ms" = COALESCE("atraso", 500),
  "read_timeout_ms" = 2000
WHERE lower("parser_tipo") IN ('toledo-c', 'filizola-at', 'filizola-@');
