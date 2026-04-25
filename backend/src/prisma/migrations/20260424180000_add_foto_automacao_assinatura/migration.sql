-- CreateTable: foto_pesagem
CREATE TABLE "foto_pesagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "passagem_id" TEXT,
    "caminho_arquivo" TEXT NOT NULL,
    "origem" TEXT NOT NULL DEFAULT 'WEBCAM',
    "placa_detectada" TEXT,
    "tamanho_bytes" INTEGER NOT NULL DEFAULT 0,
    "sha256" TEXT,
    "capturado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "foto_pesagem_ticket_id_idx" ON "foto_pesagem"("ticket_id");
CREATE INDEX "foto_pesagem_passagem_id_idx" ON "foto_pesagem"("passagem_id");

-- CreateTable: evento_automacao
CREATE TABLE "evento_automacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unidade_id" TEXT NOT NULL,
    "dispositivo" TEXT NOT NULL,
    "comando" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "motivo" TEXT,
    "ticket_id" TEXT,
    "usuario_id" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executado_em" DATETIME
);
CREATE INDEX "evento_automacao_unidade_id_idx" ON "evento_automacao"("unidade_id");
CREATE INDEX "evento_automacao_dispositivo_idx" ON "evento_automacao"("dispositivo");

-- CreateTable: assinatura_ticket
CREATE TABLE "assinatura_ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL UNIQUE,
    "papel" TEXT NOT NULL,
    "nome" TEXT,
    "documento" TEXT,
    "assinatura_png" TEXT NOT NULL,
    "capturado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "assinatura_ticket_ticket_id_idx" ON "assinatura_ticket"("ticket_id");
