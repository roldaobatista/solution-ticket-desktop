import {
  Cliente,
  Transportadora,
  Motorista,
  Produto,
  Veiculo,
  Balanca,
  TicketPesagem,
  PassagemPesagem,
  Romaneio,
  Fatura,
  PagamentoFatura,
  Usuario,
  Licenca,
  ConfiguracaoOperacional,
  DashboardKpis,
  PesagensPorPeriodo,
  PaginatedResponse,
  TopClienteVolume,
  DistribuicaoProduto,
  TipoFatura,
  FormaPagamento,
  SaldoCliente,
  ExtratoItem,
  TabelaPrecoProduto,
  TabelaPrecoProdutoCliente,
  HistoricoPreco,
  PesagemAlterada,
  PesagemExcluida,
  MovimentacaoRelatorio,
  FiltroRelatorioValues,
} from '@/types';

// ============================================================
// Seed Data
// ============================================================

let clientes: Cliente[] = [
  {
    id: 'c1',
    razao_social: 'Agropecuaria Sul Ltda',
    documento: '12.345.678/0001-90',
    endereco: 'Rodovia BR-163, KM 45',
    cidade: 'Campo Grande',
    uf: 'MS',
    telefone: '(67) 3322-4455',
    email: 'contato@agrosul.com',
    codigo_integracao: 'AG001',
    saldo_financeiro: 12500.5,
    ativo: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  {
    id: 'c2',
    razao_social: 'Cooperativa Mista dos Produtores',
    documento: '23.456.789/0001-01',
    endereco: 'Av. dos Produtores, 1500',
    cidade: 'Dourados',
    uf: 'MS',
    telefone: '(67) 3412-7890',
    email: 'coop@produtores.com',
    codigo_integracao: 'CP002',
    saldo_financeiro: 45000,
    ativo: true,
    created_at: '2024-02-10T09:30:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },
  {
    id: 'c3',
    razao_social: 'Cerealistas Brasil S/A',
    documento: '34.567.890/0001-12',
    endereco: 'Rua dos Comerciantes, 800',
    cidade: 'Rondonopolis',
    uf: 'MT',
    telefone: '(66) 3522-9988',
    email: 'vendas@cerealistas.com',
    codigo_integracao: 'CB003',
    saldo_financeiro: -3200,
    ativo: true,
    created_at: '2024-03-05T11:00:00Z',
    updated_at: '2024-12-10T09:00:00Z',
  },
  {
    id: 'c4',
    razao_social: 'Fazenda Primavera',
    documento: '45.678.901/0001-23',
    endereco: 'Estrada Municipal, S/N',
    cidade: 'Sidrolandia',
    uf: 'MS',
    telefone: '(67) 3255-6677',
    email: 'fazenda@primavera.com',
    codigo_integracao: 'FP004',
    saldo_financeiro: 8000,
    ativo: true,
    created_at: '2024-04-12T08:00:00Z',
    updated_at: '2024-11-15T11:00:00Z',
  },
  {
    id: 'c5',
    razao_social: 'Industrias Alimenticias Norte',
    documento: '56.789.012/0001-34',
    endereco: 'Distrito Industrial, Lote 12',
    cidade: 'Cuiaba',
    uf: 'MT',
    telefone: '(65) 3314-5566',
    email: 'compras@ianorte.com',
    codigo_integracao: 'IA005',
    saldo_financeiro: 22000,
    ativo: true,
    created_at: '2024-05-20T13:00:00Z',
    updated_at: '2024-12-05T08:30:00Z',
  },
  {
    id: 'c6',
    razao_social: 'Transportadora Ribeirao',
    documento: '67.890.123/0001-45',
    endereco: 'Av. Brasil, 2000',
    cidade: 'Campo Grande',
    uf: 'MS',
    telefone: '(67) 3388-7744',
    email: 'logistica@ribeirao.com',
    codigo_integracao: 'TR006',
    saldo_financeiro: 500,
    ativo: false,
    created_at: '2024-06-01T07:00:00Z',
    updated_at: '2024-10-01T10:00:00Z',
  },
];

let transportadoras: Transportadora[] = [
  {
    id: 't1',
    nome: 'Transcarga Express Ltda',
    documento: '11.222.333/0001-44',
    contatos: '(67) 99988-7766',
    observacoes: 'Frota propria de 50 caminhoes',
    ativo: true,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  {
    id: 't2',
    nome: 'Logistica do Sul',
    documento: '22.333.444/0001-55',
    contatos: '(67) 99887-6655',
    observacoes: 'Especializada em graos',
    ativo: true,
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },
  {
    id: 't3',
    nome: 'Frete Rapido S/A',
    documento: '33.444.555/0001-66',
    contatos: '(66) 99776-5544',
    observacoes: 'Cobertura nacional',
    ativo: true,
    created_at: '2024-03-20T11:00:00Z',
    updated_at: '2024-12-10T09:00:00Z',
  },
  {
    id: 't4',
    nome: 'Transportes Horizonte',
    documento: '44.555.666/0001-77',
    contatos: '(65) 99665-4433',
    observacoes: 'Atua na regiao norte',
    ativo: true,
    created_at: '2024-04-25T08:00:00Z',
    updated_at: '2024-11-15T11:00:00Z',
  },
];

let motoristas: Motorista[] = [
  {
    id: 'm1',
    nome: 'Joao Carlos da Silva',
    documento: '123.456.789-00',
    cnh: '00123456789',
    telefone: '(67) 99911-2233',
    transportadora_id: 't1',
    transportadora_nome: 'Transcarga Express Ltda',
    ativo: true,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  {
    id: 'm2',
    nome: 'Pedro Henrique Oliveira',
    documento: '234.567.890-11',
    cnh: '00234567890',
    telefone: '(67) 99822-3344',
    transportadora_id: 't1',
    transportadora_nome: 'Transcarga Express Ltda',
    ativo: true,
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },
  {
    id: 'm3',
    nome: 'Antonio Marcos Souza',
    documento: '345.678.901-22',
    cnh: '00345678901',
    telefone: '(66) 99733-4455',
    transportadora_id: 't2',
    transportadora_nome: 'Logistica do Sul',
    ativo: true,
    created_at: '2024-03-10T11:00:00Z',
    updated_at: '2024-12-10T09:00:00Z',
  },
  {
    id: 'm4',
    nome: 'Carlos Eduardo Lima',
    documento: '456.789.012-33',
    cnh: '00456789012',
    telefone: '(65) 99644-5566',
    transportadora_id: 't3',
    transportadora_nome: 'Frete Rapido S/A',
    ativo: true,
    created_at: '2024-04-15T08:00:00Z',
    updated_at: '2024-11-15T11:00:00Z',
  },
  {
    id: 'm5',
    nome: 'Marcelo Andrade Costa',
    documento: '567.890.123-44',
    cnh: '00567890123',
    telefone: '(67) 99555-6677',
    transportadora_id: 't2',
    transportadora_nome: 'Logistica do Sul',
    ativo: true,
    created_at: '2024-05-25T13:00:00Z',
    updated_at: '2024-12-05T08:30:00Z',
  },
  {
    id: 'm6',
    nome: 'Roberto Dias Fernandes',
    documento: '678.901.234-55',
    cnh: '00678901234',
    telefone: '(67) 99466-7788',
    transportadora_id: 't4',
    transportadora_nome: 'Transportes Horizonte',
    ativo: true,
    created_at: '2024-06-30T07:00:00Z',
    updated_at: '2024-11-01T10:00:00Z',
  },
];

let produtos: Produto[] = [
  {
    id: 'p1',
    descricao: 'Soja em Grao',
    codigo_interno: 'SOJ-001',
    unidade: 'kg',
    densidade: 0.75,
    tipo_operacao: 'Compra',
    permite_fracionado: false,
    ativo: true,
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  {
    id: 'p2',
    descricao: 'Milho em Grao',
    codigo_interno: 'MIL-002',
    unidade: 'kg',
    densidade: 0.72,
    tipo_operacao: 'Compra',
    permite_fracionado: false,
    ativo: true,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },
  {
    id: 'p3',
    descricao: 'Trigo',
    codigo_interno: 'TRI-003',
    unidade: 'kg',
    densidade: 0.78,
    tipo_operacao: 'Compra',
    permite_fracionado: false,
    ativo: true,
    created_at: '2024-02-01T11:00:00Z',
    updated_at: '2024-12-10T09:00:00Z',
  },
  {
    id: 'p4',
    descricao: 'Sorgo',
    codigo_interno: 'SOR-004',
    unidade: 'kg',
    densidade: 0.7,
    tipo_operacao: 'Compra',
    permite_fracionado: false,
    ativo: true,
    created_at: '2024-03-15T08:00:00Z',
    updated_at: '2024-11-15T11:00:00Z',
  },
  {
    id: 'p5',
    descricao: 'Farelo de Soja',
    codigo_interno: 'FAR-005',
    unidade: 'kg',
    densidade: 0.6,
    tipo_operacao: 'Venda',
    permite_fracionado: false,
    ativo: true,
    created_at: '2024-04-20T13:00:00Z',
    updated_at: '2024-12-05T08:30:00Z',
  },
  {
    id: 'p6',
    descricao: 'Fertilizante NPK',
    codigo_interno: 'FER-006',
    unidade: 'kg',
    densidade: 0.85,
    tipo_operacao: 'Venda',
    permite_fracionado: true,
    ativo: true,
    created_at: '2024-05-10T07:00:00Z',
    updated_at: '2024-11-01T10:00:00Z',
  },
];

let veiculos: Veiculo[] = [
  {
    id: 'v1',
    placa: 'ABC-1234',
    transportadora_id: 't1',
    transportadora_nome: 'Transcarga Express Ltda',
    tara_cadastrada: 13200,
    observacoes: 'Carreta graneleira 3 eixos',
    ativo: true,
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  {
    id: 'v2',
    placa: 'DEF-5678',
    transportadora_id: 't1',
    transportadora_nome: 'Transcarga Express Ltda',
    tara_cadastrada: 14100,
    observacoes: 'Carreta graneleira 3 eixos',
    ativo: true,
    created_at: '2024-02-05T09:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },
  {
    id: 'v3',
    placa: 'GHI-9012',
    transportadora_id: 't2',
    transportadora_nome: 'Logistica do Sul',
    tara_cadastrada: 12800,
    observacoes: 'Carreta basculante',
    ativo: true,
    created_at: '2024-03-15T11:00:00Z',
    updated_at: '2024-12-10T09:00:00Z',
  },
  {
    id: 'v4',
    placa: 'JKL-3456',
    transportadora_id: 't3',
    transportadora_nome: 'Frete Rapido S/A',
    tara_cadastrada: 15500,
    observacoes: 'Cavalo mecanico 6x2 + carreta',
    ativo: true,
    created_at: '2024-04-20T08:00:00Z',
    updated_at: '2024-11-15T11:00:00Z',
  },
  {
    id: 'v5',
    placa: 'MNO-7890',
    transportadora_id: 't2',
    transportadora_nome: 'Logistica do Sul',
    tara_cadastrada: 13500,
    observacoes: 'Carreta graneleira 2 eixos',
    ativo: true,
    created_at: '2024-05-30T13:00:00Z',
    updated_at: '2024-12-05T08:30:00Z',
  },
  {
    id: 'v6',
    placa: 'PQR-1111',
    transportadora_id: 't4',
    transportadora_nome: 'Transportes Horizonte',
    tara_cadastrada: 14800,
    observacoes: 'Cavalo mecanico + graneleira',
    ativo: true,
    created_at: '2024-06-15T07:00:00Z',
    updated_at: '2024-11-01T10:00:00Z',
  },
];

let balancas: Balanca[] = [
  {
    id: 'b1',
    nome: 'Balanca Principal - Entrada',
    serial_number: 'BL-2024-001',
    protocolo: 'SERIAL',
    porta: 'COM3',
    baud_rate: 9600,
    status_conexao: 'ONLINE',
    balanca_entrada: true,
    balanca_saida: false,
    ativo: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-12-20T08:00:00Z',
  },
  {
    id: 'b2',
    nome: 'Balanca Secundaria - Saida',
    serial_number: 'BL-2024-002',
    protocolo: 'TCP',
    host: '192.168.1.100',
    porta_tcp: 3000,
    status_conexao: 'ONLINE',
    balanca_entrada: false,
    balanca_saida: true,
    ativo: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-12-20T08:00:00Z',
  },
];

let usuarios: Usuario[] = [
  {
    id: 'u1',
    nome: 'Administrador',
    email: 'admin@solutionticket.com',
    perfil: 'Administrador',
    permissoes: [
      'ABRIR_TICKET',
      'FECHAR_TICKET',
      'CANCELAR_TICKET',
      'EDITAR_TICKET',
      'EDITAR_PESO_MANUAL',
      'APROVAR_BAIXA',
      'VISUALIZAR_VALORES',
      'EXPORTAR_RELATORIOS',
      'CONFIGURAR_TEMPLATES',
      'MANUTENCAO_TICKET',
      'APROVAR_EXCECAO',
      'CONFIGURAR_SISTEMA',
      'GERENCIAR_USUARIOS',
      'GERENCIAR_LICENCA',
      'REIMPRIMIR_TICKET',
      'VISUALIZAR_AUDITORIA',
      'EMISSAO_ROMANEIO',
      'EDICAO_ROMANEIO',
      'EMISSAO_FATURA',
      'REGISTRAR_PAGAMENTO',
    ],
    ultimo_acesso: '2024-12-20T14:30:00Z',
  },
  {
    id: 'u2',
    nome: 'Operador Balanca',
    email: 'operador@solutionticket.com',
    perfil: 'Operador',
    permissoes: ['ABRIR_TICKET', 'FECHAR_TICKET', 'REIMPRIMIR_TICKET'],
    ultimo_acesso: '2024-12-20T13:00:00Z',
  },
  {
    id: 'u3',
    nome: 'Supervisor',
    email: 'supervisor@solutionticket.com',
    perfil: 'Supervisor',
    permissoes: [
      'ABRIR_TICKET',
      'FECHAR_TICKET',
      'CANCELAR_TICKET',
      'EDITAR_TICKET',
      'MANUTENCAO_TICKET',
      'APROVAR_EXCECAO',
      'REIMPRIMIR_TICKET',
      'VISUALIZAR_AUDITORIA',
    ],
    ultimo_acesso: '2024-12-20T12:00:00Z',
  },
];

let licenca: Licenca = {
  id: 'l1',
  status_licenca: 'TRIAL',
  trial_iniciado_em: '2024-12-01T00:00:00Z',
  trial_expira_em: '2024-12-30T23:59:59Z',
  limite_pesagens_trial: 100,
  pesagens_restantes_trial: 72,
  chave_validacao_hash: 'ST-VALID-ABC123XYZ-7890-MOTHERBOARD-V1',
};

let configuracao: ConfiguracaoOperacional = {
  pesagem_com_tara: true,
  pesagem_entrada: true,
  pesagem_saida: true,
  financeiro: true,
  cameras: false,
  transportadora_habilitada: true,
  motorista_habilitado: true,
  armazem_habilitado: true,
  manutencao_ticket: true,
  conversao_unidade: false,
  preco_venda: true,
  bilhetagem: false,
  origem_destino: true,
  calculo_frete: false,
  tabela_umidade: true,
  descontos: true,
  emissao_romaneio: true,
  edicao_romaneio: true,
  habilita_baixa: true,
  lista_documentos: false,
  preview_impressao: true,
  numero_copias: 2,
  manter_preview_aberto: false,
  observacao_habilitada: true,
  manter_tara_cadastrada: true,
};

let currentUser: Usuario | null = null;
let nextId = 100;

function genId(prefix: string) {
  return `${prefix}${nextId++}-${Date.now().toString(36)}`;
}

function paginate<T>(
  items: T[],
  page = 1,
  limit = 10,
  search?: string,
  searchFields?: (keyof T)[],
): PaginatedResponse<T> {
  let filtered = [...items];
  if (search && searchFields) {
    const s = search.toLowerCase();
    filtered = filtered.filter((item) =>
      searchFields.some((field) => {
        const val = item[field];
        return val != null && String(val).toLowerCase().includes(s);
      }),
    );
  }
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);
  return { data, total, page, limit, totalPages };
}

export const mockApi = {
  // Auth
  login: async (
    email: string,
    senha: string,
  ): Promise<{ access_token: string; usuario: Usuario }> => {
    await delay(300);
    const user = usuarios.find((u) => u.email === email);
    if (!user) throw new Error('Usuario nao encontrado');
    if (senha !== '123456') throw new Error('Senha incorreta');
    currentUser = user;
    return { access_token: 'mock-jwt-token-' + Date.now(), usuario: user };
  },

  getMe: async (): Promise<Usuario> => {
    await delay(200);
    if (!currentUser) throw new Error('Nao autenticado');
    return currentUser;
  },

  // Dashboard
  getDashboardKpis: async (): Promise<DashboardKpis> => {
    await delay(300);
    return {
      pesagens_hoje: 47,
      pesagens_em_aberto: 8,
      balancas_online: 2,
      balancas_offline: 0,
      peso_total_hoje: 1865000,
      tempo_medio_operacao: 8.5,
    };
  },

  getPesagensPorPeriodo: async (_periodo?: string): Promise<PesagensPorPeriodo[]> => {
    await delay(200);
    return [
      { periodo: '06:00', total: 5, peso_total: 180000 },
      { periodo: '07:00', total: 8, peso_total: 320000 },
      { periodo: '08:00', total: 12, peso_total: 480000 },
      { periodo: '09:00', total: 10, peso_total: 410000 },
      { periodo: '10:00', total: 6, peso_total: 250000 },
      { periodo: '11:00', total: 4, peso_total: 180000 },
      { periodo: '12:00', total: 2, peso_total: 145000 },
    ];
  },

  // Clientes
  getClientes: async (
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResponse<Cliente>> => {
    await delay(200);
    return paginate(clientes, page, limit, search, [
      'razao_social',
      'documento',
      'codigo_integracao',
    ]);
  },
  getClienteById: async (id: string): Promise<Cliente> => {
    await delay(200);
    const c = clientes.find((x) => x.id === id);
    if (!c) throw new Error('Cliente nao encontrado');
    return c;
  },
  createCliente: async (data: Partial<Cliente>): Promise<Cliente> => {
    await delay(300);
    const novo: Cliente = {
      id: genId('c'),
      ...data,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Cliente;
    clientes.push(novo);
    return novo;
  },
  updateCliente: async (id: string, data: Partial<Cliente>): Promise<Cliente> => {
    await delay(300);
    const idx = clientes.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Cliente nao encontrado');
    clientes[idx] = { ...clientes[idx], ...data, updated_at: new Date().toISOString() };
    return clientes[idx];
  },
  deleteCliente: async (id: string): Promise<void> => {
    await delay(300);
    clientes = clientes.filter((x) => x.id !== id);
  },

  // Transportadoras
  getTransportadoras: async (
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResponse<Transportadora>> => {
    await delay(200);
    return paginate(transportadoras, page, limit, search, ['nome', 'documento']);
  },
  createTransportadora: async (data: Partial<Transportadora>): Promise<Transportadora> => {
    await delay(300);
    const novo: Transportadora = {
      id: genId('t'),
      ...data,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Transportadora;
    transportadoras.push(novo);
    return novo;
  },
  updateTransportadora: async (
    id: string,
    data: Partial<Transportadora>,
  ): Promise<Transportadora> => {
    await delay(300);
    const idx = transportadoras.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Transportadora nao encontrada');
    transportadoras[idx] = {
      ...transportadoras[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return transportadoras[idx];
  },
  deleteTransportadora: async (id: string): Promise<void> => {
    await delay(300);
    transportadoras = transportadoras.filter((x) => x.id !== id);
  },

  // Motoristas
  getMotoristas: async (
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResponse<Motorista>> => {
    await delay(200);
    return paginate(motoristas, page, limit, search, ['nome', 'documento', 'cnh']);
  },
  createMotorista: async (data: Partial<Motorista>): Promise<Motorista> => {
    await delay(300);
    const t = transportadoras.find((x) => x.id === data.transportadora_id);
    const novo: Motorista = {
      id: genId('m'),
      ...data,
      transportadora_nome: t?.nome,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Motorista;
    motoristas.push(novo);
    return novo;
  },
  updateMotorista: async (id: string, data: Partial<Motorista>): Promise<Motorista> => {
    await delay(300);
    const idx = motoristas.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Motorista nao encontrado');
    const t = transportadoras.find(
      (x) => x.id === (data.transportadora_id || motoristas[idx].transportadora_id),
    );
    motoristas[idx] = {
      ...motoristas[idx],
      ...data,
      transportadora_nome: t?.nome,
      updated_at: new Date().toISOString(),
    };
    return motoristas[idx];
  },
  deleteMotorista: async (id: string): Promise<void> => {
    await delay(300);
    motoristas = motoristas.filter((x) => x.id !== id);
  },

  // Produtos
  getProdutos: async (
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResponse<Produto>> => {
    await delay(200);
    return paginate(produtos, page, limit, search, ['descricao', 'codigo_interno']);
  },
  createProduto: async (data: Partial<Produto>): Promise<Produto> => {
    await delay(300);
    const novo: Produto = {
      id: genId('p'),
      ...data,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Produto;
    produtos.push(novo);
    return novo;
  },
  updateProduto: async (id: string, data: Partial<Produto>): Promise<Produto> => {
    await delay(300);
    const idx = produtos.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Produto nao encontrado');
    produtos[idx] = { ...produtos[idx], ...data, updated_at: new Date().toISOString() };
    return produtos[idx];
  },
  deleteProduto: async (id: string): Promise<void> => {
    await delay(300);
    produtos = produtos.filter((x) => x.id !== id);
  },

  // Veiculos
  getVeiculos: async (
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResponse<Veiculo>> => {
    await delay(200);
    return paginate(veiculos, page, limit, search, ['placa', 'observacoes']);
  },
  createVeiculo: async (data: Partial<Veiculo>): Promise<Veiculo> => {
    await delay(300);
    const t = transportadoras.find((x) => x.id === data.transportadora_id);
    const novo: Veiculo = {
      id: genId('v'),
      ...data,
      transportadora_nome: t?.nome,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Veiculo;
    veiculos.push(novo);
    return novo;
  },
  updateVeiculo: async (id: string, data: Partial<Veiculo>): Promise<Veiculo> => {
    await delay(300);
    const idx = veiculos.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Veiculo nao encontrado');
    const t = transportadoras.find(
      (x) => x.id === (data.transportadora_id || veiculos[idx].transportadora_id),
    );
    veiculos[idx] = {
      ...veiculos[idx],
      ...data,
      transportadora_nome: t?.nome,
      updated_at: new Date().toISOString(),
    };
    return veiculos[idx];
  },
  deleteVeiculo: async (id: string): Promise<void> => {
    await delay(300);
    veiculos = veiculos.filter((x) => x.id !== id);
  },

  // Balancas
  getBalancas: async (
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResponse<Balanca>> => {
    await delay(200);
    return paginate(balancas, page, limit, search, ['nome', 'serial_number']);
  },
  createBalanca: async (data: Partial<Balanca>): Promise<Balanca> => {
    await delay(300);
    const novo: Balanca = {
      id: genId('b'),
      ...data,
      status_conexao: 'OFFLINE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Balanca;
    balancas.push(novo);
    return novo;
  },
  updateBalanca: async (id: string, data: Partial<Balanca>): Promise<Balanca> => {
    await delay(300);
    const idx = balancas.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Balanca nao encontrada');
    balancas[idx] = { ...balancas[idx], ...data, updated_at: new Date().toISOString() };
    return balancas[idx];
  },
  deleteBalanca: async (id: string): Promise<void> => {
    await delay(300);
    balancas = balancas.filter((x) => x.id !== id);
  },

  // Tickets
  getTickets: async (
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
  ): Promise<PaginatedResponse<TicketPesagem>> => {
    await delay(300);
    const all: TicketPesagem[] = [
      // 1PF with tara referenced
      {
        id: 'tk1',
        numero: 'T-2024-0001',
        status_operacional: 'FECHADO',
        status_comercial: 'NAO_ROMANEADO',
        fluxo_pesagem: '1PF_TARA_REFERENCIADA',
        total_passagens_previstas: 1,
        total_passagens_realizadas: 1,
        cliente_id: 'c1',
        cliente_nome: 'Agropecuaria Sul Ltda',
        transportadora_id: 't1',
        transportadora_nome: 'Transcarga Express Ltda',
        motorista_id: 'm1',
        motorista_nome: 'Joao Carlos da Silva',
        veiculo_id: 'v1',
        veiculo_placa: 'ABC-1234',
        produto_id: 'p1',
        produto_nome: 'Soja em Grao',
        produto_unidade: 'kg',
        nota_fiscal: 'NF-001234',
        peso_bruto_apurado: 48000,
        peso_tara_apurada: 13200,
        peso_liquido_sem_desconto: 34800,
        total_descontos: 300,
        peso_liquido_final: 34500,
        tara_cadastrada_snapshot: 13200,
        tara_referencia_tipo: 'CADASTRADA',
        valor_unitario: 125.5,
        valor_total: 4329750,
        primeira_passagem_em: '2024-12-20T08:15:00Z',
        ultima_passagem_em: '2024-12-20T08:15:00Z',
        observacao: 'Qualidade excelente',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-20T08:00:00Z',
        updated_at: '2024-12-20T08:20:00Z',
      },
      // 2PF: bruto + tara
      {
        id: 'tk2',
        numero: 'T-2024-0002',
        status_operacional: 'FECHADO',
        status_comercial: 'ROMANEADO',
        fluxo_pesagem: '2PF_BRUTO_TARA',
        total_passagens_previstas: 2,
        total_passagens_realizadas: 2,
        cliente_id: 'c2',
        cliente_nome: 'Cooperativa Mista dos Produtores',
        transportadora_id: 't2',
        transportadora_nome: 'Logistica do Sul',
        motorista_id: 'm3',
        motorista_nome: 'Antonio Marcos Souza',
        veiculo_id: 'v3',
        veiculo_placa: 'GHI-9012',
        produto_id: 'p2',
        produto_nome: 'Milho em Grao',
        produto_unidade: 'kg',
        nota_fiscal: 'NF-001235',
        peso_bruto_apurado: 52400,
        peso_tara_apurada: 14100,
        peso_liquido_sem_desconto: 38300,
        total_descontos: 0,
        peso_liquido_final: 38300,
        tara_referencia_tipo: 'CAPTURADA_EM_BALANCA',
        valor_unitario: 38.9,
        valor_total: 1489870,
        primeira_passagem_em: '2024-12-20T09:30:00Z',
        ultima_passagem_em: '2024-12-20T10:45:00Z',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-20T09:15:00Z',
        updated_at: '2024-12-20T10:50:00Z',
      },
      // 2PF: tara + bruto (reverse order)
      {
        id: 'tk3',
        numero: 'T-2024-0003',
        status_operacional: 'FECHADO',
        status_comercial: 'FATURADO',
        fluxo_pesagem: '2PF_BRUTO_TARA',
        total_passagens_previstas: 2,
        total_passagens_realizadas: 2,
        cliente_id: 'c3',
        cliente_nome: 'Cerealistas Brasil S/A',
        transportadora_id: 't3',
        transportadora_nome: 'Frete Rapido S/A',
        motorista_id: 'm4',
        motorista_nome: 'Carlos Eduardo Lima',
        veiculo_id: 'v4',
        veiculo_placa: 'JKL-3456',
        produto_id: 'p1',
        produto_nome: 'Soja em Grao',
        produto_unidade: 'kg',
        nota_fiscal: 'NF-001236',
        peso_bruto_apurado: 51800,
        peso_tara_apurada: 13900,
        peso_liquido_sem_desconto: 37900,
        total_descontos: 0,
        peso_liquido_final: 37900,
        tara_referencia_tipo: 'CAPTURADA_EM_BALANCA',
        valor_unitario: 126,
        valor_total: 4775400,
        primeira_passagem_em: '2024-12-20T11:00:00Z',
        ultima_passagem_em: '2024-12-20T12:30:00Z',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-20T10:45:00Z',
        updated_at: '2024-12-20T12:35:00Z',
      },
      // 1PF
      {
        id: 'tk4',
        numero: 'T-2024-0004',
        status_operacional: 'AGUARDANDO_PASSAGEM',
        status_comercial: 'NAO_ROMANEADO',
        fluxo_pesagem: '2PF_BRUTO_TARA',
        total_passagens_previstas: 2,
        total_passagens_realizadas: 1,
        cliente_id: 'c4',
        cliente_nome: 'Fazenda Primavera',
        transportadora_id: 't4',
        transportadora_nome: 'Transportes Horizonte',
        motorista_id: 'm6',
        motorista_nome: 'Roberto Dias Fernandes',
        veiculo_id: 'v6',
        veiculo_placa: 'PQR-1111',
        produto_id: 'p3',
        produto_nome: 'Trigo',
        produto_unidade: 'kg',
        peso_bruto_apurado: 45600,
        tara_cadastrada_snapshot: 14800,
        primeira_passagem_em: '2024-12-20T13:00:00Z',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-20T12:45:00Z',
        updated_at: '2024-12-20T13:05:00Z',
      },
      // Open ticket
      {
        id: 'tk5',
        numero: 'T-2024-0005',
        status_operacional: 'ABERTO',
        status_comercial: 'NAO_ROMANEADO',
        fluxo_pesagem: '2PF_BRUTO_TARA',
        total_passagens_previstas: 2,
        total_passagens_realizadas: 0,
        cliente_id: 'c5',
        cliente_nome: 'Industrias Alimenticias Norte',
        veiculo_placa: 'MNO-7890',
        produto_id: 'p4',
        produto_nome: 'Sorgo',
        produto_unidade: 'kg',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-20T14:00:00Z',
        updated_at: '2024-12-20T14:00:00Z',
      },
      // Cancelled ticket
      {
        id: 'tk6',
        numero: 'T-2024-0006',
        status_operacional: 'CANCELADO',
        status_comercial: 'NAO_ROMANEADO',
        fluxo_pesagem: '2PF_BRUTO_TARA',
        total_passagens_previstas: 2,
        total_passagens_realizadas: 1,
        cliente_id: 'c1',
        cliente_nome: 'Agropecuaria Sul Ltda',
        transportadora_id: 't1',
        transportadora_nome: 'Transcarga Express Ltda',
        motorista_id: 'm2',
        motorista_nome: 'Pedro Henrique Oliveira',
        veiculo_id: 'v2',
        veiculo_placa: 'DEF-5678',
        produto_id: 'p2',
        produto_nome: 'Milho em Grao',
        produto_unidade: 'kg',
        peso_bruto_apurado: 51000,
        primeira_passagem_em: '2024-12-19T15:00:00Z',
        cancelado_motivo: 'Veiculo com problema mecanico',
        cancelado_por_id: 'u3',
        cancelado_em: '2024-12-19T15:30:00Z',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-19T14:45:00Z',
        updated_at: '2024-12-19T15:30:00Z',
      },
      // 3PF with control
      {
        id: 'tk7',
        numero: 'T-2024-0007',
        status_operacional: 'FECHADO',
        status_comercial: 'NAO_ROMANEADO',
        fluxo_pesagem: '3PF_COM_CONTROLE',
        total_passagens_previstas: 3,
        total_passagens_realizadas: 3,
        cliente_id: 'c2',
        cliente_nome: 'Cooperativa Mista dos Produtores',
        transportadora_id: 't2',
        transportadora_nome: 'Logistica do Sul',
        motorista_id: 'm5',
        motorista_nome: 'Marcelo Andrade Costa',
        veiculo_id: 'v5',
        veiculo_placa: 'MNO-7890',
        produto_id: 'p1',
        produto_nome: 'Soja em Grao',
        produto_unidade: 'kg',
        nota_fiscal: 'NF-001237',
        peso_bruto_apurado: 52000,
        peso_tara_apurada: 13800,
        peso_liquido_sem_desconto: 38200,
        total_descontos: 450,
        peso_liquido_final: 37750,
        tara_referencia_tipo: 'CAPTURADA_EM_BALANCA',
        valor_unitario: 125,
        valor_total: 4718750,
        primeira_passagem_em: '2024-12-19T08:00:00Z',
        ultima_passagem_em: '2024-12-19T10:30:00Z',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-19T07:45:00Z',
        updated_at: '2024-12-19T10:35:00Z',
      },
      // 1PF with discounts
      {
        id: 'tk8',
        numero: 'T-2024-0008',
        status_operacional: 'FECHADO',
        status_comercial: 'ROMANEADO',
        fluxo_pesagem: '1PF_TARA_REFERENCIADA',
        total_passagens_previstas: 1,
        total_passagens_realizadas: 1,
        cliente_id: 'c4',
        cliente_nome: 'Fazenda Primavera',
        transportadora_id: 't3',
        transportadora_nome: 'Frete Rapido S/A',
        motorista_id: 'm4',
        motorista_nome: 'Carlos Eduardo Lima',
        veiculo_placa: 'JKL-3456',
        produto_id: 'p2',
        produto_nome: 'Milho em Grao',
        produto_unidade: 'kg',
        nota_fiscal: 'NF-001238',
        peso_bruto_apurado: 49500,
        peso_tara_apurada: 13500,
        peso_liquido_sem_desconto: 36000,
        total_descontos: 720,
        peso_liquido_final: 35280,
        tara_cadastrada_snapshot: 13500,
        tara_referencia_tipo: 'CADASTRADA',
        valor_unitario: 39.2,
        valor_total: 1382976,
        primeira_passagem_em: '2024-12-19T11:00:00Z',
        ultima_passagem_em: '2024-12-19T11:00:00Z',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-19T10:45:00Z',
        updated_at: '2024-12-19T11:15:00Z',
      },
      // Maintenance ticket
      {
        id: 'tk9',
        numero: 'T-2024-0009',
        status_operacional: 'EM_MANUTENCAO',
        status_comercial: 'NAO_ROMANEADO',
        fluxo_pesagem: '2PF_BRUTO_TARA',
        total_passagens_previstas: 2,
        total_passagens_realizadas: 2,
        cliente_id: 'c3',
        cliente_nome: 'Cerealistas Brasil S/A',
        transportadora_id: 't1',
        transportadora_nome: 'Transcarga Express Ltda',
        motorista_id: 'm1',
        motorista_nome: 'Joao Carlos da Silva',
        veiculo_placa: 'ABC-1234',
        produto_id: 'p3',
        produto_nome: 'Trigo',
        produto_unidade: 'kg',
        nota_fiscal: 'NF-001239',
        peso_bruto_apurado: 55000,
        peso_tara_apurada: 13200,
        peso_liquido_sem_desconto: 41800,
        total_descontos: 0,
        peso_liquido_final: 41800,
        tara_referencia_tipo: 'CAPTURADA_EM_BALANCA',
        valor_unitario: 72.5,
        valor_total: 3030500,
        primeira_passagem_em: '2024-12-18T09:00:00Z',
        ultima_passagem_em: '2024-12-18T11:00:00Z',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-18T08:45:00Z',
        updated_at: '2024-12-20T08:00:00Z',
      },
      // Draft
      {
        id: 'tk10',
        numero: 'T-2024-0010',
        status_operacional: 'RASCUNHO',
        status_comercial: 'NAO_ROMANEADO',
        fluxo_pesagem: '2PF_BRUTO_TARA',
        total_passagens_previstas: 2,
        total_passagens_realizadas: 0,
        cliente_id: 'c5',
        cliente_nome: 'Industrias Alimenticias Norte',
        veiculo_placa: 'GHI-9012',
        produto_id: 'p5',
        produto_nome: 'Farelo de Soja',
        produto_unidade: 'kg',
        usuario_abertura_id: 'u2',
        usuario_abertura_nome: 'Operador Balanca',
        created_at: '2024-12-20T15:00:00Z',
        updated_at: '2024-12-20T15:00:00Z',
      },
    ];
    let filtered = all;
    if (search) {
      const s = search.toLowerCase();
      filtered = all.filter(
        (t) =>
          t.numero.toLowerCase().includes(s) ||
          t.cliente_nome?.toLowerCase().includes(s) ||
          t.veiculo_placa.toLowerCase().includes(s),
      );
    }
    if (status) {
      filtered = filtered.filter((t) => t.status_operacional === status);
    }
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, total, page, limit, totalPages };
  },

  getTicketById: async (id: string): Promise<TicketPesagem> => {
    await delay(200);
    const res = await mockApi.getTickets(1, 100);
    const ticket = res.data.find((t) => t.id === id);
    if (!ticket) throw new Error('Ticket nao encontrado');

    // Add passagens for complete tickets
    if (id === 'tk1') {
      ticket.passagens = [
        {
          id: 'pa1',
          ticket_id: 'tk1',
          sequencia: 1,
          tipo_passagem: 'ENTRADA',
          direcao_operacional: 'ENTRADA',
          papel_calculo: 'BRUTO_OFICIAL',
          condicao_veiculo: 'CARREGADO',
          status_passagem: 'VALIDA',
          peso_capturado: 48000,
          data_hora: '2024-12-20T08:15:00Z',
          balanca_id: 'b1',
          balanca_nome: 'Balanca Principal - Entrada',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 98,
          created_at: '2024-12-20T08:15:00Z',
        },
      ];
    } else if (id === 'tk2') {
      ticket.passagens = [
        {
          id: 'pa2',
          ticket_id: 'tk2',
          sequencia: 1,
          tipo_passagem: 'ENTRADA',
          direcao_operacional: 'ENTRADA',
          papel_calculo: 'BRUTO_OFICIAL',
          condicao_veiculo: 'CARREGADO',
          status_passagem: 'VALIDA',
          peso_capturado: 52400,
          data_hora: '2024-12-20T09:30:00Z',
          balanca_id: 'b1',
          balanca_nome: 'Balanca Principal - Entrada',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 97,
          created_at: '2024-12-20T09:30:00Z',
        },
        {
          id: 'pa3',
          ticket_id: 'tk2',
          sequencia: 2,
          tipo_passagem: 'SAIDA',
          direcao_operacional: 'SAIDA',
          papel_calculo: 'TARA_OFICIAL',
          condicao_veiculo: 'VAZIO',
          status_passagem: 'VALIDA',
          peso_capturado: 14100,
          data_hora: '2024-12-20T10:45:00Z',
          balanca_id: 'b2',
          balanca_nome: 'Balanca Secundaria - Saida',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 99,
          created_at: '2024-12-20T10:45:00Z',
        },
      ];
    } else if (id === 'tk3') {
      ticket.passagens = [
        {
          id: 'pa4',
          ticket_id: 'tk3',
          sequencia: 1,
          tipo_passagem: 'ENTRADA',
          direcao_operacional: 'ENTRADA',
          papel_calculo: 'BRUTO_OFICIAL',
          condicao_veiculo: 'CARREGADO',
          status_passagem: 'VALIDA',
          peso_capturado: 51800,
          data_hora: '2024-12-20T11:00:00Z',
          balanca_id: 'b1',
          balanca_nome: 'Balanca Principal - Entrada',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 95,
          created_at: '2024-12-20T11:00:00Z',
        },
        {
          id: 'pa5',
          ticket_id: 'tk3',
          sequencia: 2,
          tipo_passagem: 'SAIDA',
          direcao_operacional: 'SAIDA',
          papel_calculo: 'TARA_OFICIAL',
          condicao_veiculo: 'VAZIO',
          status_passagem: 'VALIDA',
          peso_capturado: 13900,
          data_hora: '2024-12-20T12:30:00Z',
          balanca_id: 'b2',
          balanca_nome: 'Balanca Secundaria - Saida',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 98,
          created_at: '2024-12-20T12:30:00Z',
        },
      ];
    } else if (id === 'tk4') {
      ticket.passagens = [
        {
          id: 'pa6',
          ticket_id: 'tk4',
          sequencia: 1,
          tipo_passagem: 'ENTRADA',
          direcao_operacional: 'ENTRADA',
          papel_calculo: 'BRUTO_OFICIAL',
          condicao_veiculo: 'CARREGADO',
          status_passagem: 'VALIDA',
          peso_capturado: 45600,
          data_hora: '2024-12-20T13:00:00Z',
          balanca_id: 'b1',
          balanca_nome: 'Balanca Principal - Entrada',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 96,
          created_at: '2024-12-20T13:00:00Z',
        },
      ];
    } else if (id === 'tk7') {
      ticket.passagens = [
        {
          id: 'pa7',
          ticket_id: 'tk7',
          sequencia: 1,
          tipo_passagem: 'ENTRADA',
          direcao_operacional: 'ENTRADA',
          papel_calculo: 'BRUTO_OFICIAL',
          condicao_veiculo: 'CARREGADO',
          status_passagem: 'VALIDA',
          peso_capturado: 52000,
          data_hora: '2024-12-19T08:00:00Z',
          balanca_id: 'b1',
          balanca_nome: 'Balanca Principal - Entrada',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 97,
          created_at: '2024-12-19T08:00:00Z',
        },
        {
          id: 'pa8',
          ticket_id: 'tk7',
          sequencia: 2,
          tipo_passagem: 'SAIDA',
          direcao_operacional: 'SAIDA',
          papel_calculo: 'TARA_OFICIAL',
          condicao_veiculo: 'VAZIO',
          status_passagem: 'VALIDA',
          peso_capturado: 13800,
          data_hora: '2024-12-19T09:30:00Z',
          balanca_id: 'b2',
          balanca_nome: 'Balanca Secundaria - Saida',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 99,
          created_at: '2024-12-19T09:30:00Z',
        },
        {
          id: 'pa9',
          ticket_id: 'tk7',
          sequencia: 3,
          tipo_passagem: 'INTERMEDIARIA',
          direcao_operacional: 'NEUTRA',
          papel_calculo: 'CONTROLE',
          condicao_veiculo: 'PARCIAL',
          status_passagem: 'VALIDA',
          peso_capturado: 13950,
          data_hora: '2024-12-19T10:30:00Z',
          balanca_id: 'b1',
          balanca_nome: 'Balanca Principal - Entrada',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 94,
          created_at: '2024-12-19T10:30:00Z',
        },
      ];
    } else if (id === 'tk8') {
      ticket.passagens = [
        {
          id: 'pa10',
          ticket_id: 'tk8',
          sequencia: 1,
          tipo_passagem: 'ENTRADA',
          direcao_operacional: 'ENTRADA',
          papel_calculo: 'BRUTO_OFICIAL',
          condicao_veiculo: 'CARREGADO',
          status_passagem: 'VALIDA',
          peso_capturado: 49500,
          data_hora: '2024-12-19T11:00:00Z',
          balanca_id: 'b1',
          balanca_nome: 'Balanca Principal - Entrada',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 98,
          created_at: '2024-12-19T11:00:00Z',
        },
      ];
    } else if (id === 'tk9') {
      ticket.passagens = [
        {
          id: 'pa11',
          ticket_id: 'tk9',
          sequencia: 1,
          tipo_passagem: 'ENTRADA',
          direcao_operacional: 'ENTRADA',
          papel_calculo: 'BRUTO_OFICIAL',
          condicao_veiculo: 'CARREGADO',
          status_passagem: 'VALIDA',
          peso_capturado: 55000,
          data_hora: '2024-12-18T09:00:00Z',
          balanca_id: 'b1',
          balanca_nome: 'Balanca Principal - Entrada',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 96,
          created_at: '2024-12-18T09:00:00Z',
        },
        {
          id: 'pa12',
          ticket_id: 'tk9',
          sequencia: 2,
          tipo_passagem: 'SAIDA',
          direcao_operacional: 'SAIDA',
          papel_calculo: 'TARA_OFICIAL',
          condicao_veiculo: 'VAZIO',
          status_passagem: 'VALIDA',
          peso_capturado: 13200,
          data_hora: '2024-12-18T11:00:00Z',
          balanca_id: 'b2',
          balanca_nome: 'Balanca Secundaria - Saida',
          usuario_id: 'u2',
          usuario_nome: 'Operador Balanca',
          origem_leitura: 'AUTOMATICA',
          indicador_estabilidade: 97,
          created_at: '2024-12-18T11:00:00Z',
        },
      ];
    }

    return ticket;
  },

  createTicket: async (data: Partial<TicketPesagem>): Promise<TicketPesagem> => {
    await delay(400);
    const num = `T-2024-${String(1000 + Math.floor(Math.random() * 9000)).slice(-4)}`;
    const cliente = clientes.find((c) => c.id === data.cliente_id);
    const produto = produtos.find((p) => p.id === data.produto_id);
    const transportadora = transportadoras.find((t) => t.id === data.transportadora_id);
    const motorista = motoristas.find((m) => m.id === data.motorista_id);
    const veiculo = veiculos.find((v) => v.id === data.veiculo_id);
    const novo: TicketPesagem = {
      id: genId('tk'),
      numero: num,
      status_operacional: 'ABERTO',
      status_comercial: 'NAO_ROMANEADO',
      total_passagens_previstas:
        data.fluxo_pesagem === '1PF_TARA_REFERENCIADA'
          ? 1
          : data.fluxo_pesagem === '3PF_COM_CONTROLE'
            ? 3
            : 2,
      total_passagens_realizadas: 0,
      ...data,
      cliente_nome: cliente?.razao_social,
      produto_nome: produto?.descricao,
      produto_unidade: produto?.unidade,
      transportadora_nome: transportadora?.nome,
      motorista_nome: motorista?.nome,
      veiculo_placa: veiculo?.placa || data.veiculo_placa || '',
      usuario_abertura_id: currentUser?.id || 'u2',
      usuario_abertura_nome: currentUser?.nome || 'Operador Balanca',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as TicketPesagem;
    return novo;
  },

  fecharTicket: async (id: string): Promise<TicketPesagem> => {
    await delay(400);
    const ticket = await mockApi.getTicketById(id);
    return { ...ticket, status_operacional: 'FECHADO', updated_at: new Date().toISOString() };
  },

  cancelarTicket: async (id: string, motivo: string): Promise<TicketPesagem> => {
    await delay(400);
    const ticket = await mockApi.getTicketById(id);
    return {
      ...ticket,
      status_operacional: 'CANCELADO',
      cancelado_motivo: motivo,
      cancelado_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  registrarPassagem: async (
    ticketId: string,
    data: Partial<PassagemPesagem>,
  ): Promise<PassagemPesagem> => {
    await delay(300);
    const balanca = balancas.find((b) => b.id === data.balanca_id);
    const nova: PassagemPesagem = {
      id: genId('pa'),
      ticket_id: ticketId,
      sequencia: data.sequencia || 1,
      ...data,
      balanca_nome: balanca?.nome,
      usuario_nome: currentUser?.nome || 'Operador Balanca',
      status_passagem: 'VALIDA',
      created_at: new Date().toISOString(),
    } as PassagemPesagem;
    return nova;
  },

  // Romaneios
  getRomaneios: async (page = 1, limit = 10): Promise<PaginatedResponse<Romaneio>> => {
    await delay(200);
    const all: Romaneio[] = [
      {
        id: 'r1',
        numero: 'ROM-2024-0001',
        cliente_id: 'c2',
        cliente_nome: 'Cooperativa Mista dos Produtores',
        data_inicio: '2024-12-20',
        data_fim: '2024-12-20',
        peso_total: 38300,
        valor_total: 1489870,
        status: 'FECHADO',
        observacao: 'Entrega lotes 45-50',
        usuario_emissao_id: 'u3',
        usuario_emissao_nome: 'Supervisor',
        emitido_em: '2024-12-20T13:00:00Z',
        created_at: '2024-12-20T13:00:00Z',
        updated_at: '2024-12-20T13:00:00Z',
      },
      {
        id: 'r2',
        numero: 'ROM-2024-0002',
        cliente_id: 'c4',
        cliente_nome: 'Fazenda Primavera',
        data_inicio: '2024-12-19',
        data_fim: '2024-12-19',
        peso_total: 35280,
        valor_total: 1382976,
        status: 'FECHADO',
        observacao: 'Entrega safra 2024',
        usuario_emissao_id: 'u3',
        usuario_emissao_nome: 'Supervisor',
        emitido_em: '2024-12-19T14:00:00Z',
        created_at: '2024-12-19T14:00:00Z',
        updated_at: '2024-12-19T14:00:00Z',
      },
    ];
    const total = all.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return { data: all.slice(start, start + limit), total, page, limit, totalPages };
  },

  createRomaneio: async (data: Partial<Romaneio>): Promise<Romaneio> => {
    await delay(300);
    const num = `ROM-2024-${String(1000 + Math.floor(Math.random() * 9000)).slice(-4)}`;
    const cliente = clientes.find((c) => c.id === data.cliente_id);
    const novo: Romaneio = {
      id: genId('r'),
      numero: num,
      ...data,
      cliente_nome: cliente?.razao_social,
      usuario_emissao_id: currentUser?.id || 'u3',
      usuario_emissao_nome: currentUser?.nome || 'Supervisor',
      emitido_em: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Romaneio;
    return novo;
  },

  // Faturas
  getFaturas: async (page = 1, limit = 10): Promise<PaginatedResponse<Fatura>> => {
    await delay(200);
    const all: Fatura[] = [
      {
        id: 'f1',
        numero: 'FAT-2024-0001',
        serie: 'A',
        tipo_fatura: 'Receber',
        data_emissao: '2024-12-20',
        cliente_id: 'c3',
        cliente_nome: 'Cerealistas Brasil S/A',
        nota_fiscal_associada: 'NF-001236',
        observacao: 'Fatura referente a romaneio ROM-2024-0003',
        total_romaneio: 4775400,
        total_adiantamento: 0,
        total_geral: 4775400,
        status: 'ABERTA',
        usuario_emissao_id: 'u3',
        usuario_emissao_nome: 'Supervisor',
        emitido_em: '2024-12-20T14:00:00Z',
        created_at: '2024-12-20T14:00:00Z',
        updated_at: '2024-12-20T14:00:00Z',
        pagamentos: [],
      },
      {
        id: 'f2',
        numero: 'FAT-2024-0002',
        serie: 'A',
        tipo_fatura: 'Receber',
        data_emissao: '2024-12-19',
        cliente_id: 'c2',
        cliente_nome: 'Cooperativa Mista dos Produtores',
        observacao: 'Consolidado de 2 romaneios',
        total_romaneio: 4325000,
        total_adiantamento: 500000,
        total_geral: 3825000,
        status: 'PARCIALMENTE_PAGA',
        usuario_emissao_id: 'u3',
        usuario_emissao_nome: 'Supervisor',
        emitido_em: '2024-12-19T16:00:00Z',
        created_at: '2024-12-19T16:00:00Z',
        updated_at: '2024-12-19T16:00:00Z',
        pagamentos: [
          {
            id: 'pg1',
            fatura_id: 'f2',
            forma_pagamento_id: 'fp1',
            forma_pagamento_descricao: 'Transferencia Bancaria',
            valor: 1500000,
            data_emissao: '2024-12-19',
            data_vencimento: '2024-12-26',
            numero_documento: 'BOLETO-001',
            observacao: 'Primeira parcela',
            usuario_id: 'u1',
            created_at: '2024-12-19T16:30:00Z',
          },
        ],
      },
    ];
    const total = all.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return { data: all.slice(start, start + limit), total, page, limit, totalPages };
  },

  getFaturaById: async (id: string): Promise<Fatura> => {
    await delay(200);
    const res = await mockApi.getFaturas(1, 10);
    const fatura = res.data.find((f) => f.id === id);
    if (!fatura) throw new Error('Fatura nao encontrada');
    return fatura;
  },

  // Licenca
  getLicenca: async (): Promise<Licenca> => {
    await delay(200);
    return { ...licenca };
  },

  ativarLicenca: async (chave: string): Promise<Licenca> => {
    await delay(500);
    if (chave.length < 20) throw new Error('Chave de licenciamento invalida');
    licenca = {
      ...licenca,
      status_licenca: 'ATIVA',
      chave_licenciamento_hash: chave,
      ativado_em: new Date().toISOString(),
      trial_expira_em: undefined,
      pesagens_restantes_trial: undefined,
    };
    return licenca;
  },

  // Configuracao
  getConfiguracao: async (): Promise<ConfiguracaoOperacional> => {
    await delay(200);
    return { ...configuracao };
  },

  updateConfiguracao: async (
    data: Partial<ConfiguracaoOperacional>,
  ): Promise<ConfiguracaoOperacional> => {
    await delay(300);
    configuracao = { ...configuracao, ...data };
    return configuracao;
  },

  // ========== Dashboard extras ==========
  getTopClientesVolume: async (_periodo = 'mes'): Promise<TopClienteVolume[]> => {
    await delay(200);
    return [
      {
        cliente_id: 'c3',
        cliente_nome: 'Cerealistas Brasil S/A',
        peso_total: 520600,
        total_pesagens: 15,
      },
      {
        cliente_id: 'c1',
        cliente_nome: 'Agropecuaria Sul Ltda',
        peso_total: 425800,
        total_pesagens: 12,
      },
      {
        cliente_id: 'c2',
        cliente_nome: 'Cooperativa Mista',
        peso_total: 310200,
        total_pesagens: 8,
      },
      {
        cliente_id: 'c4',
        cliente_nome: 'Fazenda Primavera',
        peso_total: 210800,
        total_pesagens: 7,
      },
      {
        cliente_id: 'c5',
        cliente_nome: 'Industrias Alimenticias Norte',
        peso_total: 180000,
        total_pesagens: 5,
      },
    ];
  },

  getDistribuicaoProduto: async (_periodo = 'mes'): Promise<DistribuicaoProduto[]> => {
    await delay(200);
    return [
      { produto_id: 'p1', produto_nome: 'Soja em Grao', peso_total: 680400, percentual: 54 },
      { produto_id: 'p2', produto_nome: 'Milho em Grao', peso_total: 420100, percentual: 33 },
      { produto_id: 'p3', produto_nome: 'Trigo', peso_total: 155800, percentual: 12 },
      { produto_id: 'p4', produto_nome: 'Sorgo', peso_total: 15000, percentual: 1 },
    ];
  },

  // ========== Faturas extras ==========
  createFatura: async (data: {
    cliente_id: string;
    tipo_fatura_id?: string;
    tipo_fatura?: string;
    tickets_ids: string[];
    observacao?: string;
  }): Promise<Fatura> => {
    await delay(400);
    const num = `FAT-2024-${String(9000 + Math.floor(Math.random() * 999)).slice(-4)}`;
    return {
      id: genId('f'),
      numero: num,
      tipo_fatura: data.tipo_fatura || 'Receber',
      data_emissao: new Date().toISOString(),
      cliente_id: data.cliente_id,
      cliente_nome: 'Cliente selecionado',
      observacao: data.observacao,
      total_romaneio: data.tickets_ids.length * 1200000,
      total_adiantamento: 0,
      total_geral: data.tickets_ids.length * 1200000,
      status: 'ABERTA',
      usuario_emissao_id: currentUser?.id || 'u1',
      usuario_emissao_nome: currentUser?.nome || 'Administrador',
      emitido_em: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pagamentos: [],
    };
  },

  cancelarFatura: async (id: string, motivo: string): Promise<Fatura> => {
    await delay(400);
    const f = await mockApi.getFaturaById(id);
    return {
      ...f,
      status: 'CANCELADA',
      observacao: `Cancelada: ${motivo}`,
      updated_at: new Date().toISOString(),
    };
  },

  getTicketsPendentesFaturamento: async (cliente_id?: string) => {
    await delay(200);
    const res = await mockApi.getTickets(1, 50);
    return res.data.filter(
      (t) =>
        t.status_operacional === 'FECHADO' &&
        (t.status_comercial === 'NAO_ROMANEADO' || t.status_comercial === 'ROMANEADO') &&
        (!cliente_id || t.cliente_id === cliente_id),
    );
  },

  getTiposFatura: async (): Promise<TipoFatura[]> => {
    await delay(100);
    return [
      { id: 'tf1', descricao: 'Fatura a Receber', sinal: 'RECEBER', ativo: true },
      { id: 'tf2', descricao: 'Adiantamento', sinal: 'RECEBER', ativo: true },
      { id: 'tf3', descricao: 'Fatura a Pagar', sinal: 'PAGAR', ativo: true },
    ];
  },

  // ========== Pagamentos ==========
  getPagamentos: async (
    page = 1,
    limit = 10,
    fatura_id?: string,
  ): Promise<PaginatedResponse<PagamentoFatura>> => {
    await delay(200);
    const all: PagamentoFatura[] = [
      {
        id: 'pg1',
        fatura_id: 'f2',
        forma_pagamento_id: 'fp1',
        forma_pagamento_descricao: 'Transferencia Bancaria',
        valor: 1500000,
        data_emissao: '2024-12-19',
        data_vencimento: '2024-12-26',
        numero_documento: 'BOLETO-001',
        observacao: 'Primeira parcela',
        usuario_id: 'u1',
        created_at: '2024-12-19T16:30:00Z',
      },
      {
        id: 'pg2',
        fatura_id: 'f1',
        forma_pagamento_id: 'fp2',
        forma_pagamento_descricao: 'Boleto Bancario',
        valor: 2000000,
        data_emissao: '2024-12-20',
        data_vencimento: '2025-01-05',
        numero_documento: 'BOL-002',
        usuario_id: 'u1',
        created_at: '2024-12-20T10:00:00Z',
      },
      {
        id: 'pg3',
        fatura_id: 'f2',
        forma_pagamento_id: 'fp3',
        forma_pagamento_descricao: 'PIX',
        valor: 800000,
        data_emissao: '2024-12-21',
        data_vencimento: '2024-12-21',
        numero_documento: 'PIX-E202',
        usuario_id: 'u1',
        created_at: '2024-12-21T11:00:00Z',
      },
    ];
    const filtered = fatura_id ? all.filter((p) => p.fatura_id === fatura_id) : all;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return { data: filtered.slice(start, start + limit), total, page, limit, totalPages };
  },

  createPagamento: async (data: Partial<PagamentoFatura>): Promise<PagamentoFatura> => {
    await delay(300);
    return {
      id: genId('pg'),
      fatura_id: data.fatura_id || '',
      forma_pagamento_id: data.forma_pagamento_id || '',
      forma_pagamento_descricao: data.forma_pagamento_descricao,
      valor: data.valor || 0,
      data_emissao: data.data_emissao || new Date().toISOString(),
      data_vencimento: data.data_vencimento,
      numero_documento: data.numero_documento,
      observacao: data.observacao,
      usuario_id: currentUser?.id || 'u1',
      created_at: new Date().toISOString(),
    };
  },

  baixarPagamento: async (id: string): Promise<PagamentoFatura> => {
    await delay(200);
    return {
      id,
      fatura_id: 'f1',
      forma_pagamento_id: 'fp1',
      forma_pagamento_descricao: 'Transferencia',
      valor: 1000000,
      data_emissao: new Date().toISOString(),
      usuario_id: currentUser?.id || 'u1',
      created_at: new Date().toISOString(),
      observacao: 'BAIXADO',
    };
  },

  getFormasPagamento: async (): Promise<FormaPagamento[]> => {
    await delay(100);
    return [
      { id: 'fp1', descricao: 'Transferencia Bancaria', prazo_dias: 0, ativo: true },
      { id: 'fp2', descricao: 'Boleto Bancario', prazo_dias: 15, ativo: true },
      { id: 'fp3', descricao: 'PIX', prazo_dias: 0, ativo: true },
      { id: 'fp4', descricao: 'Cheque', prazo_dias: 30, ativo: true },
      { id: 'fp5', descricao: 'Dinheiro', prazo_dias: 0, ativo: true },
    ];
  },

  // ========== Saldos / Extrato ==========
  getSaldosClientes: async (): Promise<SaldoCliente[]> => {
    await delay(200);
    return clientes
      .filter((c) => c.ativo)
      .map((c) => ({
        cliente_id: c.id,
        cliente_nome: c.razao_social,
        saldo_atual: c.saldo_financeiro || 0,
        data_ultimo_saldo: c.updated_at,
        total_faturado: Math.abs(c.saldo_financeiro || 0) * 2,
        total_pago: Math.abs(c.saldo_financeiro || 0),
      }));
  },

  getExtratoCliente: async (cliente_id: string): Promise<ExtratoItem[]> => {
    await delay(200);
    return [
      {
        id: 'e1',
        tipo: 'PESAGEM',
        data: '2024-12-18T08:00:00Z',
        descricao: 'Ticket T-2024-0001 - Soja em Grao',
        valor: 43297.5,
        referencia: 'T-2024-0001',
      },
      {
        id: 'e2',
        tipo: 'FATURA',
        data: '2024-12-19T16:00:00Z',
        descricao: 'Fatura FAT-2024-0002 emitida',
        valor: 38250,
        referencia: 'FAT-2024-0002',
      },
      {
        id: 'e3',
        tipo: 'PAGAMENTO',
        data: '2024-12-19T16:30:00Z',
        descricao: 'Pagamento - Transferencia Bancaria',
        valor: -15000,
        referencia: 'BOLETO-001',
      },
      {
        id: 'e4',
        tipo: 'PESAGEM',
        data: '2024-12-20T09:30:00Z',
        descricao: 'Ticket T-2024-0002 - Milho em Grao',
        valor: 14898.7,
        referencia: 'T-2024-0002',
      },
      {
        id: 'e5',
        tipo: 'PAGAMENTO',
        data: '2024-12-21T11:00:00Z',
        descricao: 'Pagamento - PIX',
        valor: -8000,
        referencia: 'PIX-E202',
      },
    ];
  },

  // ========== Ajuste de Preco ==========
  getTabelaPrecoProdutos: async (): Promise<TabelaPrecoProduto[]> => {
    await delay(200);
    return produtos.map((p, i) => ({
      id: `tp${i + 1}`,
      produto_id: p.id,
      produto_nome: p.descricao,
      preco: [125.5, 38.9, 72.5, 45.0, 52.3, 180.0][i] || 50,
      vigencia_inicio: '2024-01-01',
      ativo: true,
      updated_at: '2024-12-01T08:00:00Z',
    }));
  },

  getTabelaPrecoProdutoCliente: async (
    cliente_id?: string,
  ): Promise<TabelaPrecoProdutoCliente[]> => {
    await delay(200);
    const all: TabelaPrecoProdutoCliente[] = [
      {
        id: 'tpc1',
        produto_id: 'p1',
        produto_nome: 'Soja em Grao',
        cliente_id: 'c1',
        cliente_nome: 'Agropecuaria Sul Ltda',
        preco: 128.0,
        vigencia_inicio: '2024-11-01',
        ativo: true,
        updated_at: '2024-11-01T10:00:00Z',
      },
      {
        id: 'tpc2',
        produto_id: 'p2',
        produto_nome: 'Milho em Grao',
        cliente_id: 'c2',
        cliente_nome: 'Cooperativa Mista',
        preco: 40.5,
        vigencia_inicio: '2024-10-15',
        ativo: true,
        updated_at: '2024-10-15T10:00:00Z',
      },
    ];
    return cliente_id ? all.filter((x) => x.cliente_id === cliente_id) : all;
  },

  ajustarPrecoProduto: async (
    produto_id: string,
    preco: number,
    _motivo?: string,
  ): Promise<TabelaPrecoProduto> => {
    await delay(300);
    const p = produtos.find((x) => x.id === produto_id);
    return {
      id: genId('tp'),
      produto_id,
      produto_nome: p?.descricao,
      preco,
      vigencia_inicio: new Date().toISOString(),
      ativo: true,
      updated_at: new Date().toISOString(),
    };
  },

  ajustarPrecoCliente: async (
    produto_id: string,
    cliente_id: string,
    preco: number,
    _motivo?: string,
  ): Promise<TabelaPrecoProdutoCliente> => {
    await delay(300);
    const p = produtos.find((x) => x.id === produto_id);
    const c = clientes.find((x) => x.id === cliente_id);
    return {
      id: genId('tpc'),
      produto_id,
      produto_nome: p?.descricao,
      cliente_id,
      cliente_nome: c?.razao_social,
      preco,
      vigencia_inicio: new Date().toISOString(),
      ativo: true,
      updated_at: new Date().toISOString(),
    };
  },

  getHistoricoPreco: async (
    _produto_id?: string,
    _cliente_id?: string,
  ): Promise<HistoricoPreco[]> => {
    await delay(200);
    return [
      {
        id: 'h1',
        produto_id: 'p1',
        produto_nome: 'Soja em Grao',
        preco_anterior: 120.0,
        preco_novo: 125.5,
        alterado_por: 'Administrador',
        alterado_em: '2024-12-10T10:00:00Z',
        motivo: 'Reajuste trimestral',
      },
      {
        id: 'h2',
        produto_id: 'p2',
        produto_nome: 'Milho em Grao',
        preco_anterior: 36.0,
        preco_novo: 38.9,
        alterado_por: 'Supervisor',
        alterado_em: '2024-11-15T14:30:00Z',
        motivo: 'Alta do mercado',
      },
      {
        id: 'h3',
        produto_id: 'p1',
        produto_nome: 'Soja em Grao',
        cliente_id: 'c1',
        cliente_nome: 'Agropecuaria Sul Ltda',
        preco_anterior: 125.0,
        preco_novo: 128.0,
        alterado_por: 'Administrador',
        alterado_em: '2024-11-01T10:00:00Z',
        motivo: 'Negociacao cliente',
      },
    ];
  },

  // ========== Relatorios ==========
  getRelatorioMovimentacao: async (
    filtros: FiltroRelatorioValues,
  ): Promise<MovimentacaoRelatorio[]> => {
    await delay(400);
    const res = await mockApi.getTickets(1, 100);
    return res.data
      .filter((t) => t.status_operacional === 'FECHADO')
      .filter((t) => !filtros.clienteId || t.cliente_id === filtros.clienteId)
      .filter((t) => !filtros.produtoId || t.produto_id === filtros.produtoId)
      .filter((t) => !filtros.motoristaId || t.motorista_id === filtros.motoristaId)
      .filter((t) => !filtros.transportadoraId || t.transportadora_id === filtros.transportadoraId)
      .filter((t) => !filtros.veiculoId || t.veiculo_id === filtros.veiculoId)
      .map((t) => ({
        ticket_id: t.id,
        ticket_numero: t.numero,
        data: t.primeira_passagem_em || t.created_at,
        cliente_nome: t.cliente_nome || '-',
        produto_nome: t.produto_nome || '-',
        motorista_nome: t.motorista_nome,
        transportadora_nome: t.transportadora_nome,
        veiculo_placa: t.veiculo_placa,
        armazem_nome: t.armazem_nome,
        peso_bruto: t.peso_bruto_apurado || 0,
        peso_tara: t.peso_tara_apurada || 0,
        peso_liquido: t.peso_liquido_final || 0,
      }));
  },

  exportarRelatorioMovimentacaoPdf: async (): Promise<Blob> => {
    await delay(500);
    const content = '%PDF-1.4\n% Mock PDF - Relatorio Movimentacao\n';
    return new Blob([content], { type: 'application/pdf' });
  },

  getPesagensAlteradas: async (_filtros: FiltroRelatorioValues): Promise<PesagemAlterada[]> => {
    await delay(300);
    return [
      {
        id: 'pa1',
        ticket_id: 'tk1',
        ticket_numero: 'T-2024-0001',
        data_alteracao: '2024-12-20T14:00:00Z',
        usuario_nome: 'Supervisor',
        campo_alterado: 'peso_bruto_apurado',
        valor_anterior: '47800',
        valor_novo: '48000',
        motivo: 'Correcao de leitura',
      },
      {
        id: 'pa2',
        ticket_id: 'tk3',
        ticket_numero: 'T-2024-0003',
        data_alteracao: '2024-12-20T15:30:00Z',
        usuario_nome: 'Administrador',
        campo_alterado: 'nota_fiscal',
        valor_anterior: 'NF-001230',
        valor_novo: 'NF-001236',
        motivo: 'NF cadastrada errada',
      },
      {
        id: 'pa3',
        ticket_id: 'tk7',
        ticket_numero: 'T-2024-0007',
        data_alteracao: '2024-12-19T16:00:00Z',
        usuario_nome: 'Supervisor',
        campo_alterado: 'total_descontos',
        valor_anterior: '300',
        valor_novo: '450',
        motivo: 'Reaplicacao de umidade',
      },
    ];
  },

  getPesagensExcluidas: async (_filtros: FiltroRelatorioValues): Promise<PesagemExcluida[]> => {
    await delay(300);
    return [
      {
        id: 'px1',
        ticket_numero: 'T-2024-0006',
        data_exclusao: '2024-12-19T15:30:00Z',
        motivo: 'Veiculo com problema mecanico',
        usuario_nome: 'Supervisor',
      },
      {
        id: 'px2',
        ticket_numero: 'T-2024-0099',
        data_exclusao: '2024-12-15T10:00:00Z',
        motivo: 'Cadastro duplicado',
        usuario_nome: 'Administrador',
      },
    ];
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
