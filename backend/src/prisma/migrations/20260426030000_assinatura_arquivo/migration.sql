-- F-015: Move o conteudo da assinatura para arquivo no disco.
-- Antes: assinatura_png armazenava base64 dentro do banco.
-- Agora: caminho_arquivo aponta para userData/assinaturas/<id>.png.
-- Nenhuma rota produtiva grava AssinaturaTicket ainda; tabela esta vazia.

CREATE TABLE "assinatura_ticket_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "nome" TEXT,
    "documento" TEXT,
    "caminho_arquivo" TEXT NOT NULL,
    "tamanho_bytes" INTEGER NOT NULL DEFAULT 0,
    "sha256" TEXT,
    "capturado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE "assinatura_ticket";
ALTER TABLE "assinatura_ticket_new" RENAME TO "assinatura_ticket";

CREATE UNIQUE INDEX "assinatura_ticket_ticket_id_key" ON "assinatura_ticket"("ticket_id");
CREATE INDEX "assinatura_ticket_ticket_id_idx" ON "assinatura_ticket"("ticket_id");
