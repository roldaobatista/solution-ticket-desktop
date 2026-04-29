/**
 * Mappers backend (camelCase + relações aninhadas) → frontend (snake_case + plano).
 *
 * Esses mappers isolam a divergência de contrato API/UI em um único lugar,
 * permitindo que o backend continue retornando entidades Prisma/DTOs naturais
 * e o frontend consuma o formato esperado pelos componentes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  TicketPesagem,
  PassagemPesagem,
  DashboardKpis,
  PesagensPorPeriodo,
  TopClienteVolume,
  DistribuicaoProduto,
  Cliente,
  Transportadora,
  Motorista,
  Produto,
  Veiculo,
  Armazem,
  Empresa,
  Unidade,
  Balanca,
  Romaneio,
  Fatura,
  PagamentoFatura,
} from '@/types';

export function mapPassagem(raw: any): PassagemPesagem {
  return {
    id: raw.id,
    ticket_id: raw.ticketId,
    sequencia: raw.sequencia,
    tipo_passagem: raw.tipoPassagem,
    direcao_operacional: raw.direcaoOperacional,
    papel_calculo: raw.papelCalculo,
    condicao_veiculo: raw.condicaoVeiculo,
    status_passagem: raw.statusPassagem,
    peso_capturado: raw.pesoCapturado != null ? Number(raw.pesoCapturado) : 0,
    data_hora: raw.dataHora,
    balanca_id: raw.balancaId,
    balanca_nome: raw.balanca?.nome,
    usuario_id: raw.usuarioId,
    usuario_nome: raw.usuario?.nome,
    origem_leitura: raw.origemLeitura,
    indicador_estabilidade:
      raw.indicadorEstabilidade != null ? Number(raw.indicadorEstabilidade) : 0,
    observacao: raw.observacao,
    created_at: raw.criadoEm || raw.createdAt,
  };
}

export function mapTicket(raw: any): TicketPesagem {
  return {
    id: raw.id,
    numero: raw.numero,
    status_operacional: raw.statusOperacional,
    status_comercial: raw.statusComercial,
    fluxo_pesagem: raw.fluxoPesagem,
    total_passagens_previstas: raw.totalPassagensPrevistas,
    total_passagens_realizadas: raw.totalPassagensRealizadas,
    cliente_id: raw.clienteId,
    cliente_nome: raw.cliente?.razaoSocial,
    transportadora_id: raw.transportadoraId,
    transportadora_nome: raw.transportadora?.nome,
    motorista_id: raw.motoristaId,
    motorista_nome: raw.motorista?.nome,
    veiculo_id: raw.veiculoId,
    veiculo_placa: raw.veiculoPlaca || raw.veiculo?.placa,
    produto_id: raw.produtoId,
    produto_nome: raw.produto?.descricao,
    produto_unidade: raw.produto?.unidade,
    origem_id: raw.origemId,
    origem_nome: raw.origem?.descricao,
    destino_id: raw.destinoId,
    destino_nome: raw.destino?.descricao,
    armazem_id: raw.armazemId,
    armazem_nome: raw.armazem?.descricao,
    nota_fiscal: raw.notaFiscal,
    peso_nf: raw.pesoNf != null ? Number(raw.pesoNf) : undefined,
    peso_bruto_apurado: raw.pesoBrutoApurado != null ? Number(raw.pesoBrutoApurado) : undefined,
    peso_tara_apurada: raw.pesoTaraApurada != null ? Number(raw.pesoTaraApurada) : undefined,
    peso_liquido_sem_desconto:
      raw.pesoLiquidoSemDesconto != null ? Number(raw.pesoLiquidoSemDesconto) : undefined,
    total_descontos: raw.totalDescontos != null ? Number(raw.totalDescontos) : undefined,
    peso_liquido_final: raw.pesoLiquidoFinal != null ? Number(raw.pesoLiquidoFinal) : undefined,
    tara_cadastrada_snapshot:
      raw.taraCadastradaSnapshot != null ? Number(raw.taraCadastradaSnapshot) : undefined,
    tara_referencia_tipo: raw.taraReferenciaTipo,
    valor_unitario: raw.valorUnitario != null ? Number(raw.valorUnitario) : undefined,
    valor_total: raw.valorTotal != null ? Number(raw.valorTotal) : undefined,
    primeira_passagem_em: raw.primeiraPassagemEm,
    ultima_passagem_em: raw.ultimaPassagemEm,
    observacao: raw.observacao,
    campo1: raw.campo1,
    campo2: raw.campo2,
    usuario_abertura_id: raw.usuarioAberturaId || raw.abertoPor,
    usuario_abertura_nome: raw.usuarioAbertura?.nome,
    usuario_fechamento_id: raw.usuarioFechamentoId,
    cancelado_motivo: raw.motivoCancelamento,
    cancelado_por_id: raw.canceladoPorId,
    cancelado_em: raw.canceladoEm,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
    passagens: Array.isArray(raw.passagens) ? raw.passagens.map(mapPassagem) : undefined,
  };
}

export function mapPaginatedTickets(raw: any) {
  const data = Array.isArray(raw.data) ? raw.data.map(mapTicket) : [];
  return {
    data,
    total: raw.total ?? data.length,
    page: raw.page ?? 1,
    limit: raw.limit ?? 10,
    totalPages: raw.totalPages ?? 1,
  };
}

export function mapDashboardKpis(raw: any): DashboardKpis {
  return {
    pesagens_hoje: raw.pesagensHoje ?? 0,
    pesagens_em_aberto: raw.pesagensEmAndamento ?? 0,
    balancas_online: raw.balancasOnline ?? 0,
    balancas_offline: raw.balancasOffline ?? 0,
    peso_total_hoje: raw.totalPesoHoje ?? 0,
    tempo_medio_operacao: raw.mediaPeso ?? 0,
    pesagens_semana: raw.pesagensSemana,
    pesagens_mes: raw.pesagensMes,
    peso_total_semana: raw.totalPesoSemana ?? raw.pesoTotalSemana,
    peso_total_mes: raw.totalPesoMes ?? raw.pesoTotalMes,
    tickets_em_aberto: raw.ticketsEmAberto ?? raw.pesagensEmAndamento,
  };
}

export function mapPesagensPorPeriodo(raw: any): PesagensPorPeriodo {
  return {
    periodo: raw.data,
    total: raw.tickets ?? 0,
    peso_total: raw.peso ?? 0,
  };
}

export function mapTopCliente(raw: any): TopClienteVolume {
  return {
    cliente_id: raw.clienteId,
    cliente_nome: raw.clienteNome,
    peso_total: raw.pesoTotal ?? 0,
    total_pesagens: raw.totalPesagens ?? 0,
  };
}

export function mapDistribuicaoProduto(raw: any): DistribuicaoProduto {
  return {
    produto_id: raw.produtoId,
    produto_nome: raw.produtoNome,
    peso_total: raw.pesoTotal ?? 0,
    percentual: raw.percentual ?? 0,
  };
}

export function mapStatusBalanca(raw: any): {
  id: string;
  nome: string;
  online: boolean;
} {
  return {
    id: raw.id,
    nome: raw.nome,
    online: raw.status === 'ONLINE' || raw.statusOnline === true,
  };
}

// ---------------------------------------------------------------------------
// Cadastros — camelCase → snake_case
// ---------------------------------------------------------------------------

export function mapCliente(raw: any): Cliente {
  return {
    id: raw.id,
    razao_social: raw.razaoSocial,
    documento: raw.documento,
    endereco: raw.endereco,
    cidade: raw.cidade,
    uf: raw.uf,
    telefone: raw.telefone,
    email: raw.email,
    codigo_integracao: raw.codigoIntegracao,
    saldo_financeiro: raw.saldoFinanceiro != null ? Number(raw.saldoFinanceiro) : undefined,
    ativo: raw.ativo ?? true,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapTransportadora(raw: any): Transportadora {
  return {
    id: raw.id,
    nome: raw.nome,
    documento: raw.documento,
    contatos: raw.contatos,
    observacoes: raw.observacoes,
    ativo: raw.ativo ?? true,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapMotorista(raw: any): Motorista {
  return {
    id: raw.id,
    nome: raw.nome,
    documento: raw.documento,
    cnh: raw.cnh,
    telefone: raw.telefone,
    transportadora_id: raw.transportadoraId,
    transportadora_nome: raw.transportadora?.nome,
    ativo: raw.ativo ?? true,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapProduto(raw: any): Produto {
  return {
    id: raw.id,
    descricao: raw.descricao,
    codigo_interno: raw.codigoInterno,
    unidade: raw.unidade,
    densidade: raw.densidade != null ? Number(raw.densidade) : undefined,
    tipo_operacao: raw.tipoOperacao,
    permite_fracionado: raw.permiteFracionado ?? false,
    armazem_padrao_id: raw.armazemPadraoId,
    ativo: raw.ativo ?? true,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapVeiculo(raw: any): Veiculo {
  return {
    id: raw.id,
    placa: raw.placa,
    transportadora_id: raw.transportadoraId,
    transportadora_nome: raw.transportadora?.nome,
    tara_cadastrada: raw.taraCadastrada != null ? Number(raw.taraCadastrada) : undefined,
    observacoes: raw.observacoes,
    ativo: raw.ativo ?? true,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapArmazem(raw: any): Armazem {
  return {
    id: raw.id,
    codigo: raw.codigo,
    descricao: raw.descricao,
    capacidade: raw.capacidade != null ? Number(raw.capacidade) : undefined,
    limiteMIN: raw.limiteMin != null ? Number(raw.limiteMin) : undefined,
    limiteMAX: raw.limiteMax != null ? Number(raw.limiteMax) : undefined,
    saldoInicial: raw.saldoInicial != null ? Number(raw.saldoInicial) : undefined,
    dataSaldo: raw.dataSaldo,
    ativo: raw.ativo ?? true,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapEmpresa(raw: any): Empresa {
  return {
    id: raw.id,
    nomeEmpresarial: raw.nomeEmpresarial,
    nomeFantasia: raw.nomeFantasia,
    documento: raw.documento,
    endereco: raw.endereco,
    cidade: raw.cidade,
    uf: raw.uf,
    telefone: raw.telefone,
    email: raw.email,
    site: raw.site,
    logoPrincipal: raw.logoPrincipal,
    logoRelatorios: raw.logoRelatorios,
    ativo: raw.ativo ?? true,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapUnidade(raw: any): Unidade {
  return {
    id: raw.id,
    empresaId: raw.empresaId,
    empresa_id: raw.empresaId,
    nome: raw.nome,
    endereco: raw.endereco,
    cidade: raw.cidade,
    uf: raw.uf,
    telefone: raw.telefone,
    ativo: raw.ativo ?? true,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapBalanca(raw: any): Balanca {
  const protocolo = raw.protocolo as string | undefined;
  const tipoConexao =
    raw.tipoConexao ??
    (protocolo === 'tcp'
      ? 'TCP'
      : protocolo === 'modbus-rtu'
        ? 'MODBUS_RTU'
        : protocolo === 'modbus-tcp'
          ? 'MODBUS_TCP'
          : 'SERIAL');
  const online = raw.statusOnline === true;
  return {
    id: raw.id,
    nome: raw.nome,
    empresaId: raw.empresaId,
    empresa_id: raw.empresaId,
    unidadeId: raw.unidadeId,
    unidade_id: raw.unidadeId,
    unidade_nome: raw.unidade?.nome,
    indicadorId: raw.indicadorId,
    indicador_id: raw.indicadorId,
    indicador_nome: raw.indicador?.modelo,
    indicador: raw.indicador,
    tipoEntradaSaida: raw.tipoEntradaSaida,
    tipo_entrada_saida: raw.tipoEntradaSaida,
    tipoConexao,
    tipo_conexao: tipoConexao,
    porta: raw.porta,
    ativa: raw.ativa,
    serial_number: raw.serialNumber,
    protocolo: raw.protocolo,
    baudRate: raw.baudRate,
    baud_rate: raw.baudRate,
    host: raw.enderecoIp,
    enderecoIp: raw.enderecoIp,
    endereco_ip: raw.enderecoIp,
    portaTcp: raw.portaTcp,
    porta_tcp: raw.portaTcp,
    modbusUnitId: raw.modbusUnitId,
    modbus_unit_id: raw.modbusUnitId,
    modbusRegister: raw.modbusRegister,
    modbus_register: raw.modbusRegister,
    modbusFunction: raw.modbusFunction,
    modbus_function: raw.modbusFunction,
    modbusByteOrder: raw.modbusByteOrder,
    modbus_byte_order: raw.modbusByteOrder,
    modbusWordOrder: raw.modbusWordOrder,
    modbus_word_order: raw.modbusWordOrder,
    modbusSigned: raw.modbusSigned,
    modbus_signed: raw.modbusSigned,
    modbusScale: raw.modbusScale == null ? undefined : Number(raw.modbusScale),
    modbus_scale: raw.modbusScale == null ? undefined : Number(raw.modbusScale),
    modbusOffset: raw.modbusOffset == null ? undefined : Number(raw.modbusOffset),
    modbus_offset: raw.modbusOffset == null ? undefined : Number(raw.modbusOffset),
    ovrDataBits: raw.ovrDataBits,
    ovr_data_bits: raw.ovrDataBits,
    ovrParity: raw.ovrParity,
    ovr_parity: raw.ovrParity,
    ovrStopBits: raw.ovrStopBits,
    ovr_stop_bits: raw.ovrStopBits,
    ovrFlowControl: raw.ovrFlowControl,
    ovr_flow_control: raw.ovrFlowControl,
    ovrParserTipo: raw.ovrParserTipo,
    ovr_parser_tipo: raw.ovrParserTipo,
    ovrInicioPeso: raw.ovrInicioPeso,
    ovr_inicio_peso: raw.ovrInicioPeso,
    ovrTamanhoPeso: raw.ovrTamanhoPeso,
    ovr_tamanho_peso: raw.ovrTamanhoPeso,
    ovrTamanhoString: raw.ovrTamanhoString,
    ovr_tamanho_string: raw.ovrTamanhoString,
    ovrMarcador: raw.ovrMarcador,
    ovr_marcador: raw.ovrMarcador,
    ovrFator: raw.ovrFator,
    ovr_fator: raw.ovrFator,
    ovrInvertePeso: raw.ovrInvertePeso,
    ovr_inverte_peso: raw.ovrInvertePeso,
    ovrAtraso: raw.ovrAtraso,
    ovr_atraso: raw.ovrAtraso,
    toleranciaEstabilidade: raw.toleranciaEstabilidade,
    janelaEstabilidade: raw.janelaEstabilidade,
    debugMode: raw.debugMode,
    readMode: raw.readMode,
    read_mode: raw.readMode,
    readCommandHex: raw.readCommandHex,
    read_command_hex: raw.readCommandHex,
    readIntervalMs: raw.readIntervalMs,
    read_interval_ms: raw.readIntervalMs,
    readTimeoutMs: raw.readTimeoutMs,
    read_timeout_ms: raw.readTimeoutMs,
    status_conexao: raw.statusConexao ?? (online ? 'ONLINE' : 'OFFLINE'),
    balanca_entrada: raw.balancaEntrada,
    balanca_saida: raw.balancaSaida,
    ativo: raw.ativo,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapRomaneio(raw: any): Romaneio {
  return {
    id: raw.id,
    numero: raw.numero,
    cliente_id: raw.clienteId,
    cliente_nome: raw.cliente?.razaoSocial,
    data_inicio: raw.dataInicio,
    data_fim: raw.dataFim,
    peso_total: raw.pesoTotal != null ? Number(raw.pesoTotal) : 0,
    valor_total: raw.valorTotal != null ? Number(raw.valorTotal) : 0,
    status: raw.status,
    observacao: raw.observacao,
    usuario_emissao_id: raw.usuarioEmissaoId,
    usuario_emissao_nome: raw.usuarioEmissao?.nome,
    emitido_em: raw.emitidoEm,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
    itens: Array.isArray(raw.itens) ? raw.itens.map(mapItemRomaneio) : undefined,
  };
}

function mapItemRomaneio(raw: any) {
  return {
    id: raw.id,
    romaneio_id: raw.romaneioId,
    ticket_id: raw.ticketId,
    ticket_numero: raw.ticket?.numero,
    peso_liquido: raw.pesoLiquido != null ? Number(raw.pesoLiquido) : 0,
    valor: raw.valor != null ? Number(raw.valor) : 0,
    sequencia: raw.sequencia,
    created_at: raw.criadoEm || raw.createdAt,
  };
}

export function mapFatura(raw: any): Fatura {
  return {
    id: raw.id,
    numero: raw.numero,
    serie: raw.serie,
    tipo_fatura: raw.tipoFatura,
    data_emissao: raw.dataEmissao,
    cliente_id: raw.clienteId,
    cliente_nome: raw.cliente?.razaoSocial,
    nota_fiscal_associada: raw.notaFiscalAssociada,
    observacao: raw.observacao,
    total_romaneio: raw.totalRomaneio != null ? Number(raw.totalRomaneio) : 0,
    total_adiantamento: raw.totalAdiantamento != null ? Number(raw.totalAdiantamento) : 0,
    total_geral: raw.totalGeral != null ? Number(raw.totalGeral) : 0,
    status: raw.status,
    usuario_emissao_id: raw.usuarioEmissaoId,
    usuario_emissao_nome: raw.usuarioEmissao?.nome,
    emitido_em: raw.emitidoEm,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
    pagamentos: Array.isArray(raw.pagamentos) ? raw.pagamentos.map(mapPagamentoFatura) : undefined,
  };
}

export function mapPagamentoFatura(raw: any): PagamentoFatura {
  return {
    id: raw.id,
    fatura_id: raw.faturaId,
    forma_pagamento_id: raw.formaPagamentoId,
    forma_pagamento_descricao: raw.formaPagamento?.descricao,
    valor: raw.valor != null ? Number(raw.valor) : 0,
    data_emissao: raw.dataEmissao,
    data_vencimento: raw.dataVencimento,
    numero_documento: raw.numeroDocumento,
    observacao: raw.observacao,
    usuario_id: raw.usuarioId,
    created_at: raw.criadoEm || raw.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Generic paginated mapper
// ---------------------------------------------------------------------------

export function mapLicenca(raw: any) {
  return {
    id: raw.id,
    status_licenca: raw.status,
    plano: raw.plan,
    fingerprint: raw.fingerprint,
    dias_restantes: raw.diasRestantes,
    pesagens_restantes_trial: raw.pesagensRestantes,
    ativado_em: raw.ativadoEm,
    expira_em: raw.expira,
    trial_iniciado_em: raw.trialIniciadoEm,
    limite_pesagens_trial: raw.limitePesagensTrial,
    chave_validacao_hash: raw.chaveValidacaoHash,
    chave_licenciamento_hash: raw.chaveLicenciamentoHash,
    bloqueado_em: raw.bloqueadoEm,
    motivo_bloqueio: raw.motivoBloqueio,
  };
}

export function mapPaginated<T>(raw: any, mapItem: (item: any) => T) {
  const data = Array.isArray(raw.data) ? raw.data.map(mapItem) : [];
  return {
    data,
    total: raw.total ?? data.length,
    page: raw.page ?? 1,
    limit: raw.limit ?? 10,
    totalPages: raw.totalPages ?? 1,
  };
}

// ---------------------------------------------------------------------------
// Auxiliares — perfis, usuarios, origens, destinos, tipos desconto, comercial
// ---------------------------------------------------------------------------

export function mapPerfil(raw: any) {
  return {
    id: raw.id,
    nome: raw.nome,
    descricao: raw.descricao,
  };
}

export function mapUsuarioCadastro(raw: any) {
  return {
    id: raw.id,
    nome: raw.nome,
    email: raw.email,
    senha: raw.senha,
    perfis: Array.isArray(raw.perfis) ? raw.perfis.map(mapPerfil) : undefined,
    perfilIds: raw.perfilIds,
    ativo: raw.ativo ?? true,
    created_at: raw.criadoEm || raw.createdAt,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapOrigem(raw: any) {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    descricao: raw.descricao,
    clienteId: raw.clienteId,
    endereco: raw.endereco,
    cidade: raw.cidade,
    uf: raw.uf,
    ativo: raw.ativo ?? true,
  };
}

export function mapDestino(raw: any) {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    descricao: raw.descricao,
    clienteId: raw.clienteId,
    endereco: raw.endereco,
    cidade: raw.cidade,
    uf: raw.uf,
    ativo: raw.ativo ?? true,
  };
}

export function mapTipoDesconto(raw: any) {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    descricao: raw.descricao,
    tipo: raw.tipo,
    teto: raw.teto != null ? Number(raw.teto) : null,
    carencia: raw.carencia != null ? Number(raw.carencia) : null,
    valor: raw.valor != null ? Number(raw.valor) : 0,
    visivelPE: raw.visivelPE ?? false,
    visivelPS: raw.visivelPS ?? false,
    visivelPortaria: raw.visivelPortaria ?? false,
    visivelApontamento: raw.visivelApontamento ?? false,
    visivelPosApontamento: raw.visivelPosApontamento ?? false,
    calcula: raw.calcula ?? false,
    mantem: raw.mantem ?? false,
    ativo: raw.ativo ?? true,
    createdAt: raw.criadoEm || raw.createdAt,
    updatedAt: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapTabelaPrecoProduto(raw: any) {
  return {
    id: raw.id,
    produto_id: raw.produtoId,
    produto_nome: raw.produto?.descricao,
    preco: raw.preco != null ? Number(raw.preco) : 0,
    vigencia_inicio: raw.vigenciaInicio,
    vigencia_fim: raw.vigenciaFim,
    ativo: raw.ativo ?? true,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapTabelaPrecoProdutoCliente(raw: any) {
  return {
    id: raw.id,
    produto_id: raw.produtoId,
    produto_nome: raw.produto?.descricao,
    cliente_id: raw.clienteId,
    cliente_nome: raw.cliente?.razaoSocial,
    preco: raw.preco != null ? Number(raw.preco) : 0,
    vigencia_inicio: raw.vigenciaInicio,
    vigencia_fim: raw.vigenciaFim,
    ativo: raw.ativo ?? true,
    updated_at: raw.atualizadoEm || raw.updatedAt,
  };
}

export function mapHistoricoPreco(raw: any) {
  return {
    id: raw.id,
    produto_id: raw.produtoId,
    produto_nome: raw.produto?.descricao,
    cliente_id: raw.clienteId,
    cliente_nome: raw.cliente?.razaoSocial,
    preco_anterior: raw.precoAnterior != null ? Number(raw.precoAnterior) : 0,
    preco_novo: raw.precoNovo != null ? Number(raw.precoNovo) : 0,
    alterado_por: raw.alteradoPor,
    alterado_em: raw.alteradoEm,
    motivo: raw.motivo,
  };
}

export function mapMovimentacaoRelatorio(raw: any) {
  return {
    ticket_id: raw.ticketId,
    ticket_numero: raw.ticketNumero,
    data: raw.data,
    cliente_nome: raw.clienteNome,
    produto_nome: raw.produtoNome,
    motorista_nome: raw.motoristaNome,
    transportadora_nome: raw.transportadoraNome,
    veiculo_placa: raw.veiculoPlaca,
    armazem_nome: raw.armazemNome,
    peso_bruto: raw.pesoBruto != null ? Number(raw.pesoBruto) : 0,
    peso_tara: raw.pesoTara != null ? Number(raw.pesoTara) : 0,
    peso_liquido: raw.pesoLiquido != null ? Number(raw.pesoLiquido) : 0,
  };
}

export function mapPesagemAlterada(raw: any) {
  return {
    id: raw.id,
    ticket_id: raw.ticketId,
    ticket_numero: raw.ticketNumero,
    data_alteracao: raw.dataAlteracao,
    usuario_nome: raw.usuarioNome,
    campo_alterado: raw.campoAlterado,
    valor_anterior: raw.valorAnterior,
    valor_novo: raw.valorNovo,
    motivo: raw.motivo,
  };
}

export function mapPesagemExcluida(raw: any) {
  return {
    id: raw.id,
    ticket_numero: raw.ticketNumero,
    data_exclusao: raw.dataExclusao,
    motivo: raw.motivo,
    usuario_nome: raw.usuarioNome,
  };
}
