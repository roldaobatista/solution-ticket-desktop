import { Balanca } from '@/types';

function limparPayload(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== ''),
  );
}

function firstDefined(...values: unknown[]) {
  return values.find((value) => value !== undefined);
}

export function mapBalancaPayload(data: Partial<Balanca>): Record<string, unknown> {
  const tipo = firstDefined(data.tipoConexao, data.tipo_conexao);
  const protocolo =
    firstDefined(data.protocolo) ??
    (tipo === 'TCP'
      ? 'tcp'
      : tipo === 'MODBUS_RTU'
        ? 'modbus-rtu'
        : tipo === 'MODBUS_TCP'
          ? 'modbus-tcp'
          : 'serial');
  return limparPayload({
    empresaId: firstDefined(data.empresaId, data.empresa_id),
    unidadeId: firstDefined(data.unidadeId, data.unidade_id),
    indicadorId: firstDefined(data.indicadorId, data.indicador_id),
    nome: data.nome,
    tipoEntradaSaida: firstDefined(data.tipoEntradaSaida, data.tipo_entrada_saida),
    protocolo,
    porta: data.porta,
    baudRate: firstDefined(data.baudRate, data.baud_rate),
    enderecoIp: firstDefined(data.enderecoIp, data.endereco_ip, data.host),
    portaTcp: firstDefined(data.portaTcp, data.porta_tcp),
    ativo: firstDefined(data.ativo, data.ativa),
    modbusUnitId: firstDefined(data.modbusUnitId, data.modbus_unit_id),
    modbusRegister: firstDefined(data.modbusRegister, data.modbus_register),
    modbusFunction: firstDefined(data.modbusFunction, data.modbus_function),
    modbusByteOrder: firstDefined(data.modbusByteOrder, data.modbus_byte_order),
    modbusWordOrder: firstDefined(data.modbusWordOrder, data.modbus_word_order),
    modbusSigned: firstDefined(data.modbusSigned, data.modbus_signed),
    modbusScale: firstDefined(data.modbusScale, data.modbus_scale),
    modbusOffset: firstDefined(data.modbusOffset, data.modbus_offset),
    ovrDataBits: firstDefined(data.ovrDataBits, data.ovr_data_bits),
    ovrParity: firstDefined(data.ovrParity, data.ovr_parity),
    ovrStopBits: firstDefined(data.ovrStopBits, data.ovr_stop_bits),
    ovrFlowControl: firstDefined(data.ovrFlowControl, data.ovr_flow_control),
    ovrParserTipo: firstDefined(data.ovrParserTipo, data.ovr_parser_tipo),
    ovrInicioPeso: firstDefined(data.ovrInicioPeso, data.ovr_inicio_peso),
    ovrTamanhoPeso: firstDefined(data.ovrTamanhoPeso, data.ovr_tamanho_peso),
    ovrTamanhoString: firstDefined(data.ovrTamanhoString, data.ovr_tamanho_string),
    ovrMarcador: firstDefined(data.ovrMarcador, data.ovr_marcador),
    ovrFator: firstDefined(data.ovrFator, data.ovr_fator),
    ovrInvertePeso: firstDefined(data.ovrInvertePeso, data.ovr_inverte_peso),
    ovrAtraso: firstDefined(data.ovrAtraso, data.ovr_atraso),
    toleranciaEstabilidade: data.toleranciaEstabilidade,
    janelaEstabilidade: data.janelaEstabilidade,
    debugMode: data.debugMode,
    readMode: firstDefined(data.readMode, data.read_mode),
    readCommandHex: firstDefined(data.readCommandHex, data.read_command_hex),
    readIntervalMs: firstDefined(data.readIntervalMs, data.read_interval_ms),
    readTimeoutMs: firstDefined(data.readTimeoutMs, data.read_timeout_ms),
  });
}
