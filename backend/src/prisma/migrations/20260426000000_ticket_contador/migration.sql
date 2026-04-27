-- CreateTable
CREATE TABLE "ticket_contador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unidade_id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "ultimo_numero" INTEGER NOT NULL DEFAULT 0,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_contador_unidade_ano_unique" ON "ticket_contador"("unidade_id", "ano");
