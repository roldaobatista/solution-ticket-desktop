export interface Cliente {
  id: string;
  razao_social: string;
  documento: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  codigo_integracao?: string;
  saldo_financeiro?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transportadora {
  id: string;
  nome: string;
  documento?: string;
  contatos?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Motorista {
  id: string;
  nome: string;
  documento?: string;
  cnh?: string;
  telefone?: string;
  transportadora_id?: string;
  transportadora_nome?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Veiculo {
  id: string;
  placa: string;
  transportadora_id?: string;
  transportadora_nome?: string;
  tara_cadastrada?: number;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  descricao: string;
  codigo_interno?: string;
  unidade: string;
  densidade?: number;
  tipo_operacao?: string;
  permite_fracionado: boolean;
  armazem_padrao_id?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Balanca {
  id: string;
  nome: string;
  unidadeId?: string;
  unidade_id?: string;
  unidade_nome?: string;
  indicadorId?: string;
  indicador_id?: string;
  indicador_nome?: string;
  indicador?: IndicadorPesagem;
  tipoConexao?: 'SERIAL' | 'TCP' | 'MODBUS_RTU' | 'MODBUS_TCP';
  tipo_conexao?: 'SERIAL' | 'TCP' | 'MODBUS_RTU' | 'MODBUS_TCP';
  porta?: string;
  ativa?: boolean;
  // legacy fields kept for backward compatibility with mock data
  serial_number?: string;
  protocolo?: string;
  baud_rate?: number;
  host?: string;
  porta_tcp?: number;
  status_conexao?: string;
  balanca_entrada?: boolean;
  balanca_saida?: boolean;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IndicadorPesagem {
  id: string;
  modelo: string;
  fabricante: string;
  parserTipo?: string;
  baudrate?: number;
  databits?: number;
  stopbits?: number;
  parity?: string;
  flowControl?: string;
  inicioPeso?: number;
  tamanhoPeso?: number;
  tamanhoString?: number;
  marcador?: string;
  fator?: number;
  invertePeso?: boolean;
}

export interface BalancaStatus {
  online: boolean;
  erro?: string | null;
  ultimaLeitura?: string | null;
}

export interface LeituraPeso {
  peso: number;
  estavel: boolean;
  timestamp: string;
}

export interface TestarConexaoResult {
  sucesso: boolean;
  erro?: string;
}

export interface Unidade {
  id: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Armazem {
  id: string;
  codigo?: string;
  descricao: string;
  capacidade?: number;
  limiteMIN?: number;
  limiteMAX?: number;
  saldoInicial?: number;
  dataSaldo?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Empresa {
  id: string;
  nomeEmpresarial: string;
  nomeFantasia?: string;
  documento: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  site?: string;
  logoPrincipal?: string;
  logoRelatorios?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TipoVeiculo {
  id: string;
  descricao: string;
  precoPesagem?: number;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Perfil {
  id: string;
  nome: string;
  descricao?: string;
}

export interface UsuarioCadastro {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  perfis?: Perfil[];
  perfilIds?: string[];
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PassagemPesagem {
  id: string;
  ticket_id: string;
  sequencia: number;
  tipo_passagem: string;
  direcao_operacional: string;
  papel_calculo: string;
  condicao_veiculo: string;
  status_passagem: string;
  peso_capturado: number;
  data_hora: string;
  balanca_id: string;
  balanca_nome?: string;
  usuario_id: string;
  usuario_nome?: string;
  origem_leitura: string;
  indicador_estabilidade: number;
  observacao?: string;
  created_at: string;
}

export interface TicketPesagem {
  id: string;
  numero: string;
  status_operacional: string;
  status_comercial: string;
  fluxo_pesagem: string;
  total_passagens_previstas: number;
  total_passagens_realizadas: number;
  cliente_id: string;
  cliente_nome?: string;
  transportadora_id?: string;
  transportadora_nome?: string;
  motorista_id?: string;
  motorista_nome?: string;
  veiculo_id?: string;
  veiculo_placa: string;
  produto_id: string;
  produto_nome?: string;
  produto_unidade?: string;
  origem_id?: string;
  origem_nome?: string;
  destino_id?: string;
  destino_nome?: string;
  armazem_id?: string;
  armazem_nome?: string;
  nota_fiscal?: string;
  peso_nf?: number;
  peso_bruto_apurado?: number;
  peso_tara_apurada?: number;
  peso_liquido_sem_desconto?: number;
  total_descontos?: number;
  peso_liquido_final?: number;
  tara_cadastrada_snapshot?: number;
  tara_referencia_tipo?: string;
  valor_unitario?: number;
  valor_total?: number;
  primeira_passagem_em?: string;
  ultima_passagem_em?: string;
  observacao?: string;
  campo1?: string;
  campo2?: string;
  usuario_abertura_id: string;
  usuario_abertura_nome?: string;
  usuario_fechamento_id?: string;
  cancelado_motivo?: string;
  cancelado_por_id?: string;
  cancelado_em?: string;
  created_at: string;
  updated_at: string;
  passagens?: PassagemPesagem[];
}

export interface Romaneio {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nome?: string;
  data_inicio: string;
  data_fim: string;
  peso_total: number;
  valor_total: number;
  status: string;
  observacao?: string;
  usuario_emissao_id: string;
  usuario_emissao_nome?: string;
  emitido_em: string;
  created_at: string;
  updated_at: string;
  itens?: ItemRomaneio[];
}

export interface ItemRomaneio {
  id: string;
  romaneio_id: string;
  ticket_id: string;
  ticket_numero?: string;
  peso_liquido: number;
  valor: number;
  sequencia: number;
  created_at: string;
}

export interface Fatura {
  id: string;
  numero: string;
  serie?: string;
  tipo_fatura: string;
  data_emissao: string;
  cliente_id: string;
  cliente_nome?: string;
  nota_fiscal_associada?: string;
  observacao?: string;
  total_romaneio: number;
  total_adiantamento?: number;
  total_geral: number;
  status: string;
  usuario_emissao_id: string;
  usuario_emissao_nome?: string;
  emitido_em: string;
  created_at: string;
  updated_at: string;
  pagamentos?: PagamentoFatura[];
}

export interface PagamentoFatura {
  id: string;
  fatura_id: string;
  forma_pagamento_id: string;
  forma_pagamento_descricao?: string;
  valor: number;
  data_emissao: string;
  data_vencimento?: string;
  numero_documento?: string;
  observacao?: string;
  usuario_id: string;
  created_at: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  permissoes: string[];
  unidade_id?: string;
  ultimo_acesso?: string;
}

export interface Licenca {
  id?: string;
  status_licenca: string;
  plano?: string | null;
  fingerprint?: string | null;
  dias_restantes?: number | null;
  trial_iniciado_em?: string;
  trial_expira_em?: string;
  limite_pesagens_trial?: number;
  pesagens_restantes_trial?: number;
  chave_validacao_hash?: string;
  chave_licenciamento_hash?: string;
  ativado_em?: string;
  expira_em?: string;
  bloqueado_em?: string;
  motivo_bloqueio?: string;
}

export interface ConfiguracaoOperacional {
  pesagem_com_tara: boolean;
  pesagem_entrada: boolean;
  pesagem_saida: boolean;
  financeiro: boolean;
  cameras: boolean;
  transportadora_habilitada: boolean;
  motorista_habilitado: boolean;
  armazem_habilitado: boolean;
  manutencao_ticket: boolean;
  conversao_unidade: boolean;
  preco_venda: boolean;
  bilhetagem: boolean;
  origem_destino: boolean;
  calculo_frete: boolean;
  tabela_umidade: boolean;
  descontos: boolean;
  emissao_romaneio: boolean;
  edicao_romaneio: boolean;
  habilita_baixa: boolean;
  lista_documentos: boolean;
  preview_impressao: boolean;
  numero_copias: number;
  manter_preview_aberto: boolean;
  observacao_habilitada: boolean;
  manter_tara_cadastrada: boolean;
  // Campos avancados (Onda — config reorganizado)
  modelo_ticket_padrao?: string | null;
  logomarca_padrao?: string | null;
  logomarca_relatorio?: string | null;
  label_adicional_1?: string | null;
  label_adicional_2?: string | null;
  rodape_texto?: string | null;
  balanca_padrao_entrada?: string | null;
  balanca_padrao_saida?: string | null;
}

export interface DashboardKpis {
  pesagens_hoje: number;
  pesagens_em_aberto: number;
  balancas_online: number;
  balancas_offline: number;
  peso_total_hoje: number;
  tempo_medio_operacao: number;
  pesagens_semana?: number;
  pesagens_mes?: number;
  peso_total_semana?: number;
  peso_total_mes?: number;
  tickets_em_aberto?: number;
}

export interface PesagensPorPeriodo {
  periodo: string;
  total: number;
  peso_total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TopClienteVolume {
  cliente_id: string;
  cliente_nome: string;
  peso_total: number;
  total_pesagens: number;
}

export interface DistribuicaoProduto {
  produto_id: string;
  produto_nome: string;
  peso_total: number;
  percentual: number;
}

export interface TipoFatura {
  id: string;
  descricao: string;
  sinal: 'RECEBER' | 'PAGAR';
  ativo: boolean;
}

export interface FormaPagamento {
  id: string;
  descricao: string;
  prazo_dias?: number;
  ativo: boolean;
}

export interface SaldoCliente {
  cliente_id: string;
  cliente_nome: string;
  saldo_atual: number;
  data_ultimo_saldo: string;
  total_faturado: number;
  total_pago: number;
}

export interface ExtratoItem {
  id: string;
  tipo: 'PESAGEM' | 'FATURA' | 'PAGAMENTO';
  data: string;
  descricao: string;
  valor: number;
  referencia?: string;
}

export interface TabelaPrecoProduto {
  id: string;
  produto_id: string;
  produto_nome?: string;
  preco: number;
  vigencia_inicio: string;
  vigencia_fim?: string;
  ativo: boolean;
  updated_at: string;
}

export interface TabelaPrecoProdutoCliente {
  id: string;
  produto_id: string;
  produto_nome?: string;
  cliente_id: string;
  cliente_nome?: string;
  preco: number;
  vigencia_inicio: string;
  vigencia_fim?: string;
  ativo: boolean;
  updated_at: string;
}

export interface HistoricoPreco {
  id: string;
  produto_id: string;
  produto_nome?: string;
  cliente_id?: string;
  cliente_nome?: string;
  preco_anterior: number;
  preco_novo: number;
  alterado_por?: string;
  alterado_em: string;
  motivo?: string;
}

export interface PesagemAlterada {
  id: string;
  ticket_id: string;
  ticket_numero: string;
  data_alteracao: string;
  usuario_nome: string;
  campo_alterado: string;
  valor_anterior: string;
  valor_novo: string;
  motivo: string;
}

export interface PesagemExcluida {
  id: string;
  ticket_numero: string;
  data_exclusao: string;
  motivo: string;
  usuario_nome: string;
}

export interface MovimentacaoRelatorio {
  ticket_id: string;
  ticket_numero: string;
  data: string;
  cliente_nome: string;
  produto_nome: string;
  motorista_nome?: string;
  transportadora_nome?: string;
  veiculo_placa: string;
  armazem_nome?: string;
  peso_bruto: number;
  peso_tara: number;
  peso_liquido: number;
}

export interface FiltroRelatorioValues {
  dataInicio?: string;
  dataFim?: string;
  clienteId?: string;
  produtoId?: string;
  motoristaId?: string;
  transportadoraId?: string;
  veiculoId?: string;
  armazemId?: string;
  status?: string;
  tipoFaturaId?: string;
}
