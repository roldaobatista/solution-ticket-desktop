-- AlterTable
ALTER TABLE "licenca_instalacao" ADD COLUMN "expira_em" DATETIME;

-- CreateTable
CREATE TABLE "tipo_veiculo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco_pesagem" DECIMAL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "historico_preco" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "produto_id" TEXT,
    "cliente_id" TEXT,
    "tipo" TEXT NOT NULL,
    "valor_antigo" DECIMAL,
    "valor_novo" DECIMAL NOT NULL,
    "usuario_id" TEXT,
    "ocorrido_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tipo_fatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "recibo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "cedente" TEXT NOT NULL,
    "sacado" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "telefone" TEXT,
    "celular" TEXT,
    "cpf" TEXT,
    "endereco" TEXT,
    "valor_extenso" TEXT,
    "referente" TEXT,
    "usuario_id" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tipo_desconto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "teto" DECIMAL,
    "carencia" DECIMAL,
    "mantem" BOOLEAN NOT NULL DEFAULT false,
    "calcula" BOOLEAN NOT NULL DEFAULT true,
    "visivel_p_e" BOOLEAN NOT NULL DEFAULT true,
    "visivel_p_s" BOOLEAN NOT NULL DEFAULT true,
    "visivel_portaria" BOOLEAN NOT NULL DEFAULT false,
    "visivel_apontamento" BOOLEAN NOT NULL DEFAULT false,
    "visivel_pos_apontamento" BOOLEAN NOT NULL DEFAULT false,
    "valor" DECIMAL,
    "original" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "relatorio_salvo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "filtros" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "token_reset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expira_em" DATETIME NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "erro_impressao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT,
    "template" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'PDF',
    "mensagem" TEXT NOT NULL,
    "stack" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 1,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "resolvido_em" DATETIME,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_balanca" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "unidade_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "protocolo" TEXT NOT NULL DEFAULT 'serial',
    "porta" TEXT,
    "baud_rate" INTEGER,
    "endereco_ip" TEXT,
    "porta_tcp" INTEGER,
    "status_online" BOOLEAN NOT NULL DEFAULT true,
    "tipo_entrada_saida" TEXT,
    "indicador_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ovr_data_bits" INTEGER,
    "ovr_parity" TEXT,
    "ovr_stop_bits" INTEGER,
    "ovr_flow_control" TEXT,
    "ovr_inicio_peso" INTEGER,
    "ovr_tamanho_peso" INTEGER,
    "ovr_tamanho_string" INTEGER,
    "ovr_marcador" INTEGER,
    "ovr_fator" INTEGER,
    "ovr_inverte_peso" BOOLEAN,
    "ovr_atraso" INTEGER,
    "ovr_parser_tipo" TEXT,
    "ultima_conexao" DATETIME,
    "ultima_leitura" DATETIME,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "balanca_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "balanca_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "balanca_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicador_pesagem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_balanca" ("ativo", "atualizado_em", "baud_rate", "criado_em", "empresa_id", "endereco_ip", "id", "marca", "modelo", "nome", "ovr_atraso", "ovr_data_bits", "ovr_fator", "ovr_flow_control", "ovr_inicio_peso", "ovr_inverte_peso", "ovr_marcador", "ovr_parity", "ovr_parser_tipo", "ovr_stop_bits", "ovr_tamanho_peso", "ovr_tamanho_string", "porta", "porta_tcp", "protocolo", "status_online", "tipo_entrada_saida", "ultima_conexao", "ultima_leitura", "unidade_id") SELECT "ativo", "atualizado_em", "baud_rate", "criado_em", "empresa_id", "endereco_ip", "id", "marca", "modelo", "nome", "ovr_atraso", "ovr_data_bits", "ovr_fator", "ovr_flow_control", "ovr_inicio_peso", "ovr_inverte_peso", "ovr_marcador", "ovr_parity", "ovr_parser_tipo", "ovr_stop_bits", "ovr_tamanho_peso", "ovr_tamanho_string", "porta", "porta_tcp", "protocolo", "status_online", "tipo_entrada_saida", "ultima_conexao", "ultima_leitura", "unidade_id" FROM "balanca";
DROP TABLE "balanca";
ALTER TABLE "new_balanca" RENAME TO "balanca";
CREATE INDEX "balanca_empresa_id_unidade_id_idx" ON "balanca"("empresa_id", "unidade_id");
CREATE INDEX "balanca_indicador_id_idx" ON "balanca"("indicador_id");
CREATE TABLE "new_indicador_pesagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "cor" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    "fabricante" TEXT,
    "modelo" TEXT,
    "protocolo" TEXT NOT NULL DEFAULT 'serial',
    "builtin" BOOLEAN NOT NULL DEFAULT false,
    "exemplo_trama" TEXT,
    "notas" TEXT,
    "parser_tipo" TEXT,
    "baudrate" INTEGER,
    "databits" INTEGER,
    "stopbits" INTEGER,
    "parity" TEXT,
    "flow_control" TEXT,
    "inicio_peso" INTEGER,
    "tamanho_peso" INTEGER,
    "tamanho_string" INTEGER,
    "marcador" INTEGER,
    "fator" INTEGER,
    "inverte_peso" BOOLEAN NOT NULL DEFAULT false,
    "atraso" INTEGER
);
INSERT INTO "new_indicador_pesagem" ("ativo", "atraso", "atualizado_em", "builtin", "cor", "criado_em", "descricao", "exemplo_trama", "fabricante", "id", "modelo", "notas", "protocolo", "tenant_id") SELECT "ativo", "atraso", "atualizado_em", "builtin", "cor", "criado_em", "descricao", "exemplo_trama", "fabricante", "id", "modelo", "notas", "protocolo", "tenant_id" FROM "indicador_pesagem";
DROP TABLE "indicador_pesagem";
ALTER TABLE "new_indicador_pesagem" RENAME TO "indicador_pesagem";
CREATE TABLE "new_pagamento_fatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fatura_id" TEXT NOT NULL,
    "forma_pagamento_id" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "data_emissao" DATETIME NOT NULL,
    "data_vencimento" DATETIME,
    "numero_documento" TEXT,
    "observacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "data_baixa" DATETIME,
    "usuario_baixa" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagamento_fatura_fatura_id_fkey" FOREIGN KEY ("fatura_id") REFERENCES "fatura" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagamento_fatura_forma_pagamento_id_fkey" FOREIGN KEY ("forma_pagamento_id") REFERENCES "forma_pagamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pagamento_fatura" ("criado_em", "data_emissao", "data_vencimento", "fatura_id", "forma_pagamento_id", "id", "numero_documento", "observacao", "valor") SELECT "criado_em", "data_emissao", "data_vencimento", "fatura_id", "forma_pagamento_id", "id", "numero_documento", "observacao", "valor" FROM "pagamento_fatura";
DROP TABLE "pagamento_fatura";
ALTER TABLE "new_pagamento_fatura" RENAME TO "pagamento_fatura";
CREATE INDEX "pagamento_fatura_fatura_id_idx" ON "pagamento_fatura"("fatura_id");
CREATE INDEX "pagamento_fatura_status_idx" ON "pagamento_fatura"("status");
CREATE TABLE "new_permissao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "perfil_id" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "concedido" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissao_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_permissao" ("acao", "concedido", "criado_em", "id", "modulo", "perfil_id") SELECT "acao", "concedido", "criado_em", "id", "modulo", "perfil_id" FROM "permissao";
DROP TABLE "permissao";
ALTER TABLE "new_permissao" RENAME TO "permissao";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "token_reset_token_key" ON "token_reset"("token");

-- CreateIndex
CREATE INDEX "erro_impressao_resolvido_idx" ON "erro_impressao"("resolvido");

-- CreateIndex
CREATE INDEX "erro_impressao_ticket_id_idx" ON "erro_impressao"("ticket_id");

-- CreateIndex
CREATE INDEX "auditoria_tenant_id_idx" ON "auditoria"("tenant_id");

-- CreateIndex
CREATE INDEX "auditoria_data_hora_idx" ON "auditoria"("data_hora");

-- CreateIndex
CREATE INDEX "auditoria_entidade_entidade_id_idx" ON "auditoria"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "cliente_tenant_id_idx" ON "cliente"("tenant_id");

-- CreateIndex
CREATE INDEX "desconto_pesagem_ticket_id_idx" ON "desconto_pesagem"("ticket_id");

-- CreateIndex
CREATE INDEX "documento_pesagem_ticket_id_idx" ON "documento_pesagem"("ticket_id");

-- CreateIndex
CREATE INDEX "empresa_tenant_id_idx" ON "empresa"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_tenant_id_documento_key" ON "empresa"("tenant_id", "documento");

-- CreateIndex
CREATE INDEX "fatura_tenant_id_idx" ON "fatura"("tenant_id");

-- CreateIndex
CREATE INDEX "fatura_cliente_id_idx" ON "fatura"("cliente_id");

-- CreateIndex
CREATE INDEX "fatura_status_idx" ON "fatura"("status");

-- CreateIndex
CREATE INDEX "fatura_data_emissao_idx" ON "fatura"("data_emissao");

-- CreateIndex
CREATE INDEX "item_romaneio_romaneio_id_idx" ON "item_romaneio"("romaneio_id");

-- CreateIndex
CREATE INDEX "item_romaneio_ticket_id_idx" ON "item_romaneio"("ticket_id");

-- CreateIndex
CREATE INDEX "licenca_instalacao_unidade_id_idx" ON "licenca_instalacao"("unidade_id");

-- CreateIndex
CREATE INDEX "licenca_instalacao_tenant_id_idx" ON "licenca_instalacao"("tenant_id");

-- CreateIndex
CREATE INDEX "motorista_tenant_id_idx" ON "motorista"("tenant_id");

-- CreateIndex
CREATE INDEX "motorista_empresa_id_idx" ON "motorista"("empresa_id");

-- CreateIndex
CREATE INDEX "motorista_transportadora_id_idx" ON "motorista"("transportadora_id");

-- CreateIndex
CREATE INDEX "passagem_pesagem_ticket_id_idx" ON "passagem_pesagem"("ticket_id");

-- CreateIndex
CREATE INDEX "passagem_pesagem_balanca_id_idx" ON "passagem_pesagem"("balanca_id");

-- CreateIndex
CREATE INDEX "passagem_pesagem_usuario_id_idx" ON "passagem_pesagem"("usuario_id");

-- CreateIndex
CREATE INDEX "passagem_pesagem_data_hora_idx" ON "passagem_pesagem"("data_hora");

-- CreateIndex
CREATE INDEX "produto_tenant_id_idx" ON "produto"("tenant_id");

-- CreateIndex
CREATE INDEX "romaneio_tenant_id_idx" ON "romaneio"("tenant_id");

-- CreateIndex
CREATE INDEX "romaneio_cliente_id_idx" ON "romaneio"("cliente_id");

-- CreateIndex
CREATE INDEX "romaneio_status_idx" ON "romaneio"("status");

-- CreateIndex
CREATE INDEX "snapshot_comercial_ticket_ticket_id_idx" ON "snapshot_comercial_ticket"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_pesagem_tenant_id_idx" ON "ticket_pesagem"("tenant_id");

-- CreateIndex
CREATE INDEX "ticket_pesagem_unidade_id_idx" ON "ticket_pesagem"("unidade_id");

-- CreateIndex
CREATE INDEX "ticket_pesagem_cliente_id_idx" ON "ticket_pesagem"("cliente_id");

-- CreateIndex
CREATE INDEX "ticket_pesagem_veiculo_id_idx" ON "ticket_pesagem"("veiculo_id");

-- CreateIndex
CREATE INDEX "ticket_pesagem_criado_em_idx" ON "ticket_pesagem"("criado_em");

-- CreateIndex
CREATE INDEX "ticket_pesagem_status_operacional_idx" ON "ticket_pesagem"("status_operacional");

-- CreateIndex
CREATE INDEX "transportadora_tenant_id_idx" ON "transportadora"("tenant_id");

-- CreateIndex
CREATE INDEX "unidade_empresa_id_idx" ON "unidade"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_tenant_id_idx" ON "usuario"("tenant_id");

-- CreateIndex
CREATE INDEX "veiculo_empresa_id_idx" ON "veiculo"("empresa_id");

-- CreateIndex
CREATE INDEX "veiculo_transportadora_id_idx" ON "veiculo"("transportadora_id");

-- CreateIndex
CREATE UNIQUE INDEX "veiculo_tenant_id_placa_key" ON "veiculo"("tenant_id", "placa");

-- RedefineIndex
-- SQLite nao permite DROP do sqlite_autoindex_* (gerado automaticamente pela
-- declaracao UNIQUE em modelos anteriores). O auto-index e funcionalmente
-- equivalente ao nomeado, entao apenas pulamos esse rename — Prisma trata
-- ambos corretamente. Removido para evitar P3018 (P3009 em retomadas).
-- Original:
--   DROP INDEX "sqlite_autoindex_assinatura_ticket_2";
--   CREATE UNIQUE INDEX "assinatura_ticket_ticket_id_key" ON "assinatura_ticket"("ticket_id");

