-- Onda 5.2 — historico de calibracoes por balanca.

CREATE TABLE IF NOT EXISTS "calibracao_balanca" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "balanca_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "peso_referencia" DECIMAL NOT NULL,
    "peso_lido" DECIMAL NOT NULL,
    "fator_calculado" DECIMAL NOT NULL,
    "observacao" TEXT,
    "usuario_id" TEXT,
    "realizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calibracao_balanca_balanca_id_fkey"
      FOREIGN KEY ("balanca_id") REFERENCES "balanca" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "calibracao_balanca_balanca_id_realizado_em_idx"
  ON "calibracao_balanca"("balanca_id", "realizado_em");
