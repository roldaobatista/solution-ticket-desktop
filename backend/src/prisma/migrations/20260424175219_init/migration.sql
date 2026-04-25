-- CreateTable
CREATE TABLE "tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "nome_empresarial" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "documento" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "logo_principal" TEXT,
    "logo_relatorios" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "empresa_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "unidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "unidade_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "perfil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "perfil_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permissao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "perfil_id" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "concedido" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "usuario_perfil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "perfil_id" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuario_perfil_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "usuario_perfil_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acesso" DATETIME,
    "tentativas_login" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" DATETIME,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "usuario_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "documento" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "codigo_integracao" TEXT,
    "saldo_financeiro" DECIMAL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transportadora" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "contatos" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "motorista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "empresa_id" TEXT,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "cnh" TEXT,
    "telefone" TEXT,
    "transportadora_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "motorista_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "motorista_transportadora_id_fkey" FOREIGN KEY ("transportadora_id") REFERENCES "transportadora" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "codigo_interno" TEXT,
    "unidade" TEXT NOT NULL,
    "densidade" DECIMAL,
    "tipo_operacao" TEXT,
    "permite_fracionado" BOOLEAN NOT NULL DEFAULT false,
    "armazem_padrao_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "veiculo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "empresa_id" TEXT,
    "placa" TEXT NOT NULL,
    "transportadora_id" TEXT,
    "tara_cadastrada" DECIMAL,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "veiculo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "veiculo_transportadora_id_fkey" FOREIGN KEY ("transportadora_id") REFERENCES "transportadora" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "destino" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "cliente_id" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "origem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "cliente_id" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "armazem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "localizacao" TEXT,
    "capacidade_kg" DECIMAL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "indicador_pesagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "cor" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "forma_pagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "balanca" (
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
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "balanca_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "balanca_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuracao_operacional_unidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa_id" TEXT NOT NULL,
    "unidade_id" TEXT NOT NULL,
    "pesagem_com_tara" BOOLEAN NOT NULL DEFAULT true,
    "pesagem_entrada" BOOLEAN NOT NULL DEFAULT true,
    "pesagem_saida" BOOLEAN NOT NULL DEFAULT true,
    "financeiro" BOOLEAN NOT NULL DEFAULT false,
    "cameras" BOOLEAN NOT NULL DEFAULT false,
    "transportadora_habilitada" BOOLEAN NOT NULL DEFAULT true,
    "motorista_habilitado" BOOLEAN NOT NULL DEFAULT true,
    "armazem_habilitado" BOOLEAN NOT NULL DEFAULT false,
    "manutencao_ticket" BOOLEAN NOT NULL DEFAULT true,
    "conversao_unidade" BOOLEAN NOT NULL DEFAULT false,
    "preco_venda" BOOLEAN NOT NULL DEFAULT false,
    "bilhetagem" BOOLEAN NOT NULL DEFAULT false,
    "origem_destino" BOOLEAN NOT NULL DEFAULT false,
    "calculo_frete" BOOLEAN NOT NULL DEFAULT false,
    "tabela_umidade" BOOLEAN NOT NULL DEFAULT false,
    "descontos" BOOLEAN NOT NULL DEFAULT false,
    "emissao_romaneio" BOOLEAN NOT NULL DEFAULT false,
    "edicao_romaneio" BOOLEAN NOT NULL DEFAULT false,
    "habilita_baixa" BOOLEAN NOT NULL DEFAULT false,
    "lista_documentos" BOOLEAN NOT NULL DEFAULT false,
    "preview_impressao" BOOLEAN NOT NULL DEFAULT true,
    "numero_copias" INTEGER NOT NULL DEFAULT 1,
    "manter_preview_aberto" BOOLEAN NOT NULL DEFAULT false,
    "modelo_ticket_padrao" TEXT,
    "logomarca_padrao" TEXT,
    "logomarca_relatorio" TEXT,
    "label_adicional_1" TEXT,
    "label_adicional_2" TEXT,
    "observacao_habilitada" BOOLEAN NOT NULL DEFAULT true,
    "rodape_texto" TEXT,
    "manter_tara_cadastrada" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "configuracao_operacional_unidade_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "configuracao_operacional_unidade_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "matriz_regra_operacional" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT,
    "empresa_id" TEXT,
    "unidade_id" TEXT,
    "tipo_operacao" TEXT,
    "cliente_id" TEXT,
    "produto_id" TEXT,
    "campo_alvo" TEXT NOT NULL,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "editavel" BOOLEAN NOT NULL DEFAULT true,
    "valor_padrao" TEXT,
    "ordem_exibicao" INTEGER,
    "prioridade_resolucao" INTEGER NOT NULL DEFAULT 0,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "matriz_regra_operacional_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "matriz_regra_operacional_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_pesagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "unidade_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "status_operacional" TEXT NOT NULL,
    "status_comercial" TEXT NOT NULL DEFAULT 'NAO_ROMANEADO',
    "fluxo_pesagem" TEXT NOT NULL,
    "total_passagens_previstas" INTEGER NOT NULL DEFAULT 2,
    "total_passagens_realizadas" INTEGER NOT NULL DEFAULT 0,
    "cliente_id" TEXT NOT NULL,
    "transportadora_id" TEXT,
    "motorista_id" TEXT,
    "veiculo_id" TEXT,
    "veiculo_placa" TEXT,
    "produto_id" TEXT NOT NULL,
    "origem_id" TEXT,
    "destino_id" TEXT,
    "armazem_id" TEXT,
    "indicador_pesagem_id" TEXT,
    "nota_fiscal" TEXT,
    "peso_nf" DECIMAL,
    "peso_bruto_apurado" DECIMAL,
    "peso_tara_apurada" DECIMAL,
    "peso_liquido_sem_desconto" DECIMAL,
    "total_descontos" DECIMAL DEFAULT 0,
    "peso_liquido_final" DECIMAL,
    "tara_cadastrada_snapshot" DECIMAL,
    "tara_referencia_tipo" TEXT,
    "snapshot_comercial_versao" INTEGER,
    "modo_comercial" TEXT NOT NULL DEFAULT 'DESABILITADO',
    "valor_unitario" DECIMAL,
    "valor_total" DECIMAL,
    "primeira_passagem_em" DATETIME,
    "ultima_passagem_em" DATETIME,
    "aberto_em" DATETIME,
    "fechado_em" DATETIME,
    "cancelado_em" DATETIME,
    "motivo_cancelamento" TEXT,
    "observacao" TEXT,
    "campo_1" TEXT,
    "campo_2" TEXT,
    "payload_campos_adicionais" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "ticket_pesagem_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ticket_pesagem_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ticket_pesagem_transportadora_id_fkey" FOREIGN KEY ("transportadora_id") REFERENCES "transportadora" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ticket_pesagem_motorista_id_fkey" FOREIGN KEY ("motorista_id") REFERENCES "motorista" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ticket_pesagem_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ticket_pesagem_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ticket_pesagem_origem_id_fkey" FOREIGN KEY ("origem_id") REFERENCES "origem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ticket_pesagem_destino_id_fkey" FOREIGN KEY ("destino_id") REFERENCES "destino" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ticket_pesagem_armazem_id_fkey" FOREIGN KEY ("armazem_id") REFERENCES "armazem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ticket_pesagem_indicador_pesagem_id_fkey" FOREIGN KEY ("indicador_pesagem_id") REFERENCES "indicador_pesagem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "passagem_pesagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "tipo_passagem" TEXT NOT NULL,
    "direcao_operacional" TEXT NOT NULL,
    "papel_calculo" TEXT NOT NULL,
    "condicao_veiculo" TEXT NOT NULL DEFAULT 'NAO_INFORMADO',
    "status_passagem" TEXT NOT NULL,
    "peso_capturado" DECIMAL NOT NULL,
    "data_hora" DATETIME NOT NULL,
    "captured_at_local" DATETIME,
    "received_at_backend" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balanca_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "origem_leitura" TEXT NOT NULL,
    "indicador_estabilidade" DECIMAL,
    "sequence_no_dispositivo" INTEGER,
    "event_id_origem" TEXT,
    "observacao" TEXT,
    "motivo_invalidacao" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "passagem_pesagem_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket_pesagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "passagem_pesagem_balanca_id_fkey" FOREIGN KEY ("balanca_id") REFERENCES "balanca" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "passagem_pesagem_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "desconto_pesagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL NOT NULL,
    "percentual" DECIMAL,
    "origem" TEXT NOT NULL DEFAULT 'manual',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "desconto_pesagem_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket_pesagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documento_pesagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT,
    "arquivo_url" TEXT,
    "observacao" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documento_pesagem_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket_pesagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "snapshot_comercial_ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "modo_comercial_ticket" TEXT NOT NULL,
    "preco_origem" TEXT,
    "frete_origem" TEXT,
    "desconto_origem" TEXT,
    "umidade_origem" TEXT,
    "vigencia_aplicada" DATETIME,
    "valor_unitario" DECIMAL,
    "valor_frete" DECIMAL,
    "valor_total_bruto" DECIMAL,
    "valor_total_liquido" DECIMAL,
    "peso_base_comercial" DECIMAL,
    "versao_snapshot" INTEGER NOT NULL,
    "gerado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gerado_por" TEXT,
    CONSTRAINT "snapshot_comercial_ticket_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket_pesagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tabela_umidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "faixa_inicial" DECIMAL NOT NULL,
    "faixa_final" DECIMAL NOT NULL,
    "desconto_percentual" DECIMAL NOT NULL,
    "vigencia_inicio" DATETIME NOT NULL,
    "vigencia_fim" DATETIME,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "tabela_umidade_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tabela_preco_produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "unidade" TEXT NOT NULL,
    "vigencia_inicio" DATETIME NOT NULL,
    "vigencia_fim" DATETIME,
    "prioridade_resolucao" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "tabela_preco_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tabela_preco_produto_cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "destino_id" TEXT,
    "valor" DECIMAL NOT NULL,
    "unidade" TEXT NOT NULL,
    "vigencia_inicio" DATETIME NOT NULL,
    "vigencia_fim" DATETIME,
    "prioridade_resolucao" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "tabela_preco_produto_cliente_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tabela_preco_produto_cliente_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tabela_frete" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "produto_id" TEXT,
    "cliente_id" TEXT,
    "destino_id" TEXT,
    "faixa_peso_inicial" DECIMAL,
    "faixa_peso_final" DECIMAL,
    "valor" DECIMAL NOT NULL,
    "vigencia_inicio" DATETIME NOT NULL,
    "vigencia_fim" DATETIME,
    "prioridade_resolucao" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "tabela_frete_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tabela_frete_destino_id_fkey" FOREIGN KEY ("destino_id") REFERENCES "destino" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "romaneio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "periodo_inicio" DATETIME NOT NULL,
    "periodo_fim" DATETIME NOT NULL,
    "peso_total" DECIMAL,
    "valor_total" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "observacao" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "romaneio_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_romaneio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "romaneio_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "peso" DECIMAL NOT NULL,
    "valor" DECIMAL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "item_romaneio_romaneio_id_fkey" FOREIGN KEY ("romaneio_id") REFERENCES "romaneio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "item_romaneio_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket_pesagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "serie" TEXT,
    "tipo_fatura" TEXT NOT NULL DEFAULT 'NORMAL',
    "tenant_id" TEXT NOT NULL,
    "romaneio_id" TEXT,
    "cliente_id" TEXT NOT NULL,
    "data_emissao" DATETIME NOT NULL,
    "nota_fiscal" TEXT,
    "observacao" TEXT,
    "total_romaneio" DECIMAL,
    "total_geral" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "fatura_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fatura_romaneio_id_fkey" FOREIGN KEY ("romaneio_id") REFERENCES "romaneio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagamento_fatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fatura_id" TEXT NOT NULL,
    "forma_pagamento_id" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "data_emissao" DATETIME NOT NULL,
    "data_vencimento" DATETIME,
    "numero_documento" TEXT,
    "observacao" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagamento_fatura_fatura_id_fkey" FOREIGN KEY ("fatura_id") REFERENCES "fatura" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pagamento_fatura_forma_pagamento_id_fkey" FOREIGN KEY ("forma_pagamento_id") REFERENCES "forma_pagamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "licenca_instalacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unidade_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "tipo_licenca" TEXT NOT NULL,
    "status_licenca" TEXT NOT NULL,
    "fingerprint_dispositivo" TEXT,
    "trial_iniciado_em" DATETIME,
    "trial_expira_em" DATETIME,
    "limite_pesagens_trial" INTEGER,
    "pesagens_restantes_trial" INTEGER,
    "chave_validacao_hash" TEXT,
    "chave_licenciamento_hash" TEXT,
    "ativado_em" DATETIME,
    "bloqueado_em" DATETIME,
    "motivo_bloqueio" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "licenca_instalacao_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evento_licenciamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenca_instalacao_id" TEXT NOT NULL,
    "tipo_evento" TEXT NOT NULL,
    "status_anterior" TEXT,
    "status_novo" TEXT NOT NULL,
    "payload_resumido" TEXT,
    "usuario_responsavel" TEXT,
    "ocorrido_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evento_licenciamento_licenca_instalacao_id_fkey" FOREIGN KEY ("licenca_instalacao_id") REFERENCES "licenca_instalacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "solicitacao_aprovacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo_solicitacao" TEXT NOT NULL,
    "entidade_alvo" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "solicitante_id" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "aprovador_primario_id" TEXT,
    "aprovador_secundario_id" TEXT,
    "solicitada_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidida_em" DATETIME,
    "justificativa_decisao" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "estado_anterior" TEXT,
    "estado_novo" TEXT,
    "usuario_id" TEXT,
    "motivo" TEXT,
    "data_hora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
