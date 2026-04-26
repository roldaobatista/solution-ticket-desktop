-- Onda 1.7 + 4.4 — campos de estabilidade configuravel e modo debug por balanca.

ALTER TABLE "balanca" ADD COLUMN "tolerancia_estabilidade" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "janela_estabilidade" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "debug_mode" BOOLEAN NOT NULL DEFAULT 0;
