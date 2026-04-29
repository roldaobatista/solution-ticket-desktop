import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  StatusOperacional,
  StatusComercial,
  FluxoPesagem,
  TipoPassagem,
  DirecaoOperacional,
  PapelCalculo,
  StatusPassagem,
  OrigemLeitura,
  StatusLicenca,
  TaraReferenciaTipo,
  ModoComercial,
  CondicaoVeiculo,
} from '../constants/enums';
import { Permissao } from '../constants/permissoes';
import { seedIndicadoresHardware } from './seed-indicadores';

const prisma = new PrismaClient();

async function seedTiposFaturaIdempotente(tenantId: string) {
  const tipos = [
    { codigo: 'ADIANTAMENTO_VENDA', descricao: 'ADIANTAMENTO VENDA', operacao: 'CREDITO' },
    { codigo: 'ADIANTAMENTO_COMPRA', descricao: 'ADIANTAMENTO COMPRA', operacao: 'DEBITO' },
    { codigo: 'FATURA_VENDA', descricao: 'FATURA DE VENDA', operacao: 'CREDITO' },
    { codigo: 'FATURA_COMPRA', descricao: 'FATURA DE COMPRA', operacao: 'DEBITO' },
    { codigo: 'RECEITA', descricao: 'RECEITA', operacao: 'CREDITO' },
    { codigo: 'DESPESA', descricao: 'DESPESA', operacao: 'DEBITO' },
  ];
  for (const t of tipos) {
    const existe = await prisma.tipoFatura.findFirst({ where: { tenantId, codigo: t.codigo } });
    if (!existe) {
      await prisma.tipoFatura.create({ data: { tenantId, ...t } });
    }
  }
  console.log('Tipos de fatura garantidos');
}

async function seedConectoresIntegracaoIdempotente() {
  const connectors = [
    {
      code: 'mock',
      name: 'Mock ERP Connector',
      version: '1.0.0',
      authMethods: ['none'],
      entities: ['weighing_ticket', 'partner', 'product', 'vehicle'],
    },
    {
      code: 'generic-rest',
      name: 'Generic REST ERP Connector',
      version: '1.0.0',
      authMethods: ['none', 'api_key', 'basic'],
      entities: ['weighing_ticket', 'partner', 'product', 'vehicle'],
    },
  ];

  for (const connector of connectors) {
    await prisma.integracaoConnector.upsert({
      where: {
        integracao_connector_code_version_unique: {
          code: connector.code,
          version: connector.version,
        },
      },
      update: {
        name: connector.name,
        enabled: true,
        supportedAuthMethods: JSON.stringify(connector.authMethods),
        supportedEntities: JSON.stringify(connector.entities),
      },
      create: {
        code: connector.code,
        name: connector.name,
        version: connector.version,
        enabled: true,
        supportedAuthMethods: JSON.stringify(connector.authMethods),
        supportedEntities: JSON.stringify(connector.entities),
      },
    });
  }
  console.log('Conectores de integracao garantidos');
}

async function seedPermissoesIntegracaoAdminIdempotente(tenantId: string) {
  const perfilAdmin = await prisma.perfil.findFirst({
    where: { tenantId, nome: 'Administrador', ativo: true },
  });
  if (!perfilAdmin) return;

  const permissoesIntegracao = [
    Permissao.INTEGRACAO_VER,
    Permissao.INTEGRACAO_CRIAR,
    Permissao.INTEGRACAO_EDITAR,
    Permissao.INTEGRACAO_ALTERAR_CREDENCIAL,
    Permissao.INTEGRACAO_TESTAR_CONEXAO,
    Permissao.INTEGRACAO_VER_PAYLOAD_MASCARADO,
    Permissao.INTEGRACAO_VER_PAYLOAD_CRU,
    Permissao.INTEGRACAO_REPROCESSAR,
    Permissao.INTEGRACAO_REPROCESSAR_FISCAL,
    Permissao.INTEGRACAO_IGNORAR_ERRO,
    Permissao.INTEGRACAO_EXPORTAR_LOG,
    Permissao.INTEGRACAO_RECONCILIAR,
  ];

  for (const acao of permissoesIntegracao) {
    const existe = await prisma.permissao.findFirst({
      where: { perfilId: perfilAdmin.id, acao },
    });
    if (!existe) {
      await prisma.permissao.create({
        data: {
          perfilId: perfilAdmin.id,
          modulo: acao.split(':')[0],
          acao,
          concedido: true,
        },
      });
    }
  }
  console.log('Permissoes de integracao garantidas para Administrador');
}

async function main() {
  console.log('Seeding database...');

  // Se o banco ja foi semeado (tem tenant), apenas garante upserts idempotentes
  const tenantExistente = await prisma.tenant.findFirst();
  if (tenantExistente) {
    console.log('Banco ja semeado. Aplicando upserts idempotentes...');
    await seedTiposFaturaIdempotente(tenantExistente.id);
    await seedConectoresIntegracaoIdempotente();
    await seedPermissoesIntegracaoAdminIdempotente(tenantExistente.id);
    return;
  }

  // Senha inicial via env. Em prod, exija troca após primeiro login.
  const senhaInicial = process.env.SEED_DEFAULT_PASSWORD;
  if (!senhaInicial || senhaInicial.length < 8) {
    throw new Error(
      'SEED_DEFAULT_PASSWORD ausente ou < 8 caracteres. Defina em backend/.env antes de rodar o seed.',
    );
  }
  if (senhaInicial === '123456' || senhaInicial.toLowerCase() === 'changeme') {
    throw new Error('SEED_DEFAULT_PASSWORD com valor trivial. Escolha uma senha forte.');
  }
  const senhaHash = await bcrypt.hash(senhaInicial, 10);
  console.log(
    'Seed: usando senha inicial de SEED_DEFAULT_PASSWORD (operadores devem trocar no 1º login).',
  );

  // 1. Tenant
  const tenant = await prisma.tenant.create({
    data: {
      nome: 'Solution Ticket Principal',
      documento: '12.345.678/0001-90',
    },
  });
  console.log('Tenant created:', tenant.id);

  // 2. Empresa
  const empresa = await prisma.empresa.create({
    data: {
      tenantId: tenant.id,
      nomeEmpresarial: 'Grãos do Brasil Ltda',
      nomeFantasia: 'Grãos do Brasil',
      documento: '12.345.678/0001-90',
      endereco: 'Rodovia BR-163, KM 450',
      cidade: 'Rondonópolis',
      uf: 'MT',
      telefone: '(66) 3333-4444',
      email: 'contato@graosdobrasil.com.br',
      site: 'www.graosdobrasil.com.br',
    },
  });
  console.log('Empresa created:', empresa.id);

  // 3. Unidade
  const unidade = await prisma.unidade.create({
    data: {
      empresaId: empresa.id,
      nome: 'Unidade Matriz',
      endereco: 'Rodovia BR-163, KM 450',
      cidade: 'Rondonópolis',
      uf: 'MT',
      telefone: '(66) 3333-4444',
    },
  });
  console.log('Unidade created:', unidade.id);

  // 4. Perfis
  const perfilAdmin = await prisma.perfil.create({
    data: { tenantId: tenant.id, nome: 'Administrador', descricao: 'Acesso total ao sistema' },
  });
  const perfilOperador = await prisma.perfil.create({
    data: { tenantId: tenant.id, nome: 'Operador', descricao: 'Operador de balança' },
  });
  const perfilSupervisor = await prisma.perfil.create({
    data: { tenantId: tenant.id, nome: 'Supervisor', descricao: 'Supervisor operacional' },
  });
  console.log('Perfis created');

  // 5. Permissoes
  const permissoesAdmin = [
    Permissao.TICKET_CRIAR,
    Permissao.TICKET_EDITAR,
    Permissao.TICKET_FECHAR,
    Permissao.TICKET_CANCELAR,
    Permissao.TICKET_MANUTENCAO,
    Permissao.TICKET_REIMPRIMIR,
    Permissao.CADASTRO_GERENCIAR,
    Permissao.CONFIG_GERENCIAR,
    Permissao.ROMANEIO_GERENCIAR,
    Permissao.FATURA_GERENCIAR,
    Permissao.RELATORIO_VISUALIZAR,
    Permissao.DASHBOARD_VISUALIZAR,
    Permissao.USUARIOS_GERENCIAR,
    Permissao.LICENCA_GERENCIAR,
    Permissao.AUDITORIA_VISUALIZAR,
    Permissao.PESO_MANUAL,
    Permissao.PASSAGEM_INVALIDAR,
    Permissao.PAGAMENTO_GERENCIAR,
    Permissao.INTEGRACAO_VER,
    Permissao.INTEGRACAO_CRIAR,
    Permissao.INTEGRACAO_EDITAR,
    Permissao.INTEGRACAO_ALTERAR_CREDENCIAL,
    Permissao.INTEGRACAO_TESTAR_CONEXAO,
    Permissao.INTEGRACAO_VER_PAYLOAD_MASCARADO,
    Permissao.INTEGRACAO_VER_PAYLOAD_CRU,
    Permissao.INTEGRACAO_REPROCESSAR,
    Permissao.INTEGRACAO_REPROCESSAR_FISCAL,
    Permissao.INTEGRACAO_IGNORAR_ERRO,
    Permissao.INTEGRACAO_EXPORTAR_LOG,
    Permissao.INTEGRACAO_RECONCILIAR,
  ];
  for (const acao of permissoesAdmin) {
    const modulo = acao.split(':')[0];
    await prisma.permissao.create({
      data: { perfilId: perfilAdmin.id, modulo, acao, concedido: true },
    });
  }

  const permissoesOperador = [
    Permissao.TICKET_CRIAR,
    Permissao.TICKET_EDITAR,
    Permissao.TICKET_FECHAR,
    Permissao.TICKET_REIMPRIMIR,
    Permissao.PESO_MANUAL,
  ];
  for (const acao of permissoesOperador) {
    const modulo = acao.split(':')[0];
    await prisma.permissao.create({
      data: { perfilId: perfilOperador.id, modulo, acao, concedido: true },
    });
  }

  const permissoesSupervisor = [
    Permissao.TICKET_CRIAR,
    Permissao.TICKET_EDITAR,
    Permissao.TICKET_FECHAR,
    Permissao.TICKET_CANCELAR,
    Permissao.TICKET_MANUTENCAO,
    Permissao.TICKET_REIMPRIMIR,
    Permissao.PASSAGEM_INVALIDAR,
    Permissao.PESO_MANUAL,
    Permissao.RELATORIO_VISUALIZAR,
    Permissao.DASHBOARD_VISUALIZAR,
    Permissao.AUDITORIA_VISUALIZAR,
    Permissao.ROMANEIO_GERENCIAR,
    Permissao.FATURA_GERENCIAR,
  ];
  for (const acao of permissoesSupervisor) {
    const modulo = acao.split(':')[0];
    await prisma.permissao.create({
      data: { perfilId: perfilSupervisor.id, modulo, acao, concedido: true },
    });
  }
  console.log('Permissoes created');

  // 6. Usuarios
  const usuarios = [
    {
      nome: 'Administrador',
      email: 'admin@solutionticket.com',
      tenantId: tenant.id,
      perfilId: perfilAdmin.id,
    },
    {
      nome: 'João Operador',
      email: 'joao@solutionticket.com',
      tenantId: tenant.id,
      perfilId: perfilOperador.id,
    },
    {
      nome: 'Maria Supervisor',
      email: 'maria@solutionticket.com',
      tenantId: tenant.id,
      perfilId: perfilSupervisor.id,
    },
  ];
  for (const u of usuarios) {
    const usuario = await prisma.usuario.create({
      data: {
        tenantId: u.tenantId,
        nome: u.nome,
        email: u.email,
        senhaHash,
        ativo: true,
      },
    });
    await prisma.usuarioPerfil.create({
      data: { usuarioId: usuario.id, perfilId: u.perfilId },
    });
  }
  console.log('Usuarios created');

  // 7. Clientes
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        razaoSocial: 'Agropecuária Santa Fé Ltda',
        documento: '11.222.333/0001-44',
        cidade: 'Rondonópolis',
        uf: 'MT',
        telefone: '(66) 3444-5555',
      },
    }),
    prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        razaoSocial: 'Cooperativa Mato Grosso',
        documento: '22.333.444/0001-55',
        cidade: 'Primavera do Leste',
        uf: 'MT',
        telefone: '(66) 3555-6666',
      },
    }),
    prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        razaoSocial: 'Fazenda Boa Esperança',
        documento: '33.444.555/0001-66',
        cidade: 'Sorriso',
        uf: 'MT',
        telefone: '(66) 3666-7777',
      },
    }),
    prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        razaoSocial: 'Transgrãos Logística S.A.',
        documento: '44.555.666/0001-77',
        cidade: 'Cuiabá',
        uf: 'MT',
        telefone: '(65) 3777-8888',
      },
    }),
    prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        razaoSocial: 'Armazéns do Centro Oeste',
        documento: '55.666.777/0001-88',
        cidade: 'Lucas do Rio Verde',
        uf: 'MT',
        telefone: '(65) 3888-9999',
      },
    }),
    prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        razaoSocial: 'Produtores Associados MT',
        documento: '66.777.888/0001-99',
        cidade: 'Sinop',
        uf: 'MT',
        telefone: '(66) 3999-0000',
      },
    }),
  ]);
  console.log('Clientes created');

  // 8. Transportadoras
  const transportadoras = await Promise.all([
    prisma.transportadora.create({
      data: { tenantId: tenant.id, nome: 'Transporte Rodrigues', documento: '12.345.678/0001-01' },
    }),
    prisma.transportadora.create({
      data: { tenantId: tenant.id, nome: 'Logística Silva', documento: '23.456.789/0001-02' },
    }),
    prisma.transportadora.create({
      data: { tenantId: tenant.id, nome: 'Caminhões do Pampa', documento: '34.567.890/0001-03' },
    }),
    prisma.transportadora.create({
      data: { tenantId: tenant.id, nome: 'Transborte Express', documento: '45.678.901/0001-04' },
    }),
  ]);
  console.log('Transportadoras created');

  // 9. Motoristas
  const motoristas = await Promise.all([
    prisma.motorista.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        nome: 'Carlos Souza',
        documento: '123.456.789-00',
        cnh: '00123456789',
        transportadoraId: transportadoras[0].id,
      },
    }),
    prisma.motorista.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        nome: 'Pedro Oliveira',
        documento: '234.567.890-11',
        cnh: '00234567890',
        transportadoraId: transportadoras[1].id,
      },
    }),
    prisma.motorista.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        nome: 'Antônio Ferreira',
        documento: '345.678.901-22',
        cnh: '00345678901',
        transportadoraId: transportadoras[2].id,
      },
    }),
    prisma.motorista.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        nome: 'José Santos',
        documento: '456.789.012-33',
        cnh: '00456789012',
        transportadoraId: transportadoras[0].id,
      },
    }),
    prisma.motorista.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        nome: 'Fernando Lima',
        documento: '567.890.123-44',
        cnh: '00567890123',
        transportadoraId: transportadoras[3].id,
      },
    }),
    prisma.motorista.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        nome: 'Roberto Dias',
        documento: '678.901.234-55',
        cnh: '00678901234',
        transportadoraId: transportadoras[1].id,
      },
    }),
  ]);
  console.log('Motoristas created');

  // 10. Produtos
  const produtos = await Promise.all([
    prisma.produto.create({
      data: {
        tenantId: tenant.id,
        descricao: 'Milho em Grão',
        codigoInterno: 'MIL-001',
        unidade: 'kg',
        tipoOperacao: 'COMPRA',
      },
    }),
    prisma.produto.create({
      data: {
        tenantId: tenant.id,
        descricao: 'Soja em Grão',
        codigoInterno: 'SOJ-001',
        unidade: 'kg',
        tipoOperacao: 'COMPRA',
      },
    }),
    prisma.produto.create({
      data: {
        tenantId: tenant.id,
        descricao: 'Trigo',
        codigoInterno: 'TRI-001',
        unidade: 'kg',
        tipoOperacao: 'COMPRA',
      },
    }),
    prisma.produto.create({
      data: {
        tenantId: tenant.id,
        descricao: 'Algodão em Caroço',
        codigoInterno: 'ALG-001',
        unidade: 'kg',
        tipoOperacao: 'COMPRA',
      },
    }),
    prisma.produto.create({
      data: {
        tenantId: tenant.id,
        descricao: 'Sorgo',
        codigoInterno: 'SOR-001',
        unidade: 'kg',
        tipoOperacao: 'COMPRA',
      },
    }),
    prisma.produto.create({
      data: {
        tenantId: tenant.id,
        descricao: 'Farelo de Soja',
        codigoInterno: 'FAR-001',
        unidade: 'kg',
        tipoOperacao: 'VENDA',
      },
    }),
  ]);
  console.log('Produtos created');

  // 11. Veiculos
  const veiculos = await Promise.all([
    prisma.veiculo.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        placa: 'MTT-1234',
        transportadoraId: transportadoras[0].id,
        taraCadastrada: 14500,
      },
    }),
    prisma.veiculo.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        placa: 'MTT-5678',
        transportadoraId: transportadoras[1].id,
        taraCadastrada: 15200,
      },
    }),
    prisma.veiculo.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        placa: 'MTT-9012',
        transportadoraId: transportadoras[2].id,
        taraCadastrada: 14800,
      },
    }),
    prisma.veiculo.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        placa: 'MTT-3456',
        transportadoraId: transportadoras[0].id,
        taraCadastrada: 16100,
      },
    }),
    prisma.veiculo.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        placa: 'MTT-7890',
        transportadoraId: transportadoras[3].id,
        taraCadastrada: 13900,
      },
    }),
    prisma.veiculo.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        placa: 'MTT-2468',
        transportadoraId: transportadoras[1].id,
        taraCadastrada: 15500,
      },
    }),
  ]);
  console.log('Veiculos created');

  // 12. Destinos
  const destinos = await Promise.all([
    prisma.destino.create({
      data: { tenantId: tenant.id, descricao: 'Armazém Central - Rondonópolis' },
    }),
    prisma.destino.create({
      data: { tenantId: tenant.id, descricao: 'Terminal de Grãos - Primavera' },
    }),
    prisma.destino.create({ data: { tenantId: tenant.id, descricao: 'Porto de Miritituba - PA' } }),
    prisma.destino.create({
      data: { tenantId: tenant.id, descricao: 'Unidade Industrial - Cuiabá' },
    }),
  ]);
  console.log('Destinos created');

  // 13. Origens
  const origens = await Promise.all([
    prisma.origem.create({
      data: { tenantId: tenant.id, descricao: 'Fazenda Santa Fé - Zona Rural' },
    }),
    prisma.origem.create({
      data: { tenantId: tenant.id, descricao: 'Fazenda Boa Esperança - Sorriso' },
    }),
    prisma.origem.create({
      data: { tenantId: tenant.id, descricao: 'Unidade Produtiva - Lucas do Rio Verde' },
    }),
    prisma.origem.create({ data: { tenantId: tenant.id, descricao: 'Fornecedor Externo - MT' } }),
  ]);
  console.log('Origens created');

  // 14. Armazens
  const armazens = await Promise.all([
    prisma.armazem.create({
      data: {
        tenantId: tenant.id,
        descricao: 'Silo 01 - Capacidade 50.000t',
        localizacao: 'Setor A',
      },
    }),
    prisma.armazem.create({
      data: {
        tenantId: tenant.id,
        descricao: 'Silo 02 - Capacidade 30.000t',
        localizacao: 'Setor B',
      },
    }),
    prisma.armazem.create({
      data: { tenantId: tenant.id, descricao: 'Patio de Armazenagem', localizacao: 'Setor C' },
    }),
  ]);
  console.log('Armazens created');

  // 15. Indicadores
  const indicadores = await Promise.all([
    prisma.indicadorPesagem.create({
      data: { tenantId: tenant.id, descricao: 'Pesagem Normal', cor: '#4CAF50' },
    }),
    prisma.indicadorPesagem.create({
      data: { tenantId: tenant.id, descricao: 'Pesagem com Atraso', cor: '#FF9800' },
    }),
    prisma.indicadorPesagem.create({
      data: { tenantId: tenant.id, descricao: 'Urgente', cor: '#F44336' },
    }),
    prisma.indicadorPesagem.create({
      data: { tenantId: tenant.id, descricao: 'Retorno de Carga', cor: '#2196F3' },
    }),
  ]);
  console.log('Indicadores created');

  // 15.1 Indicadores de Hardware (PesoLog - 12 modelos)
  await seedIndicadoresHardware(prisma, tenant.id);

  // 16. Formas de Pagamento
  const formasPagamento = await Promise.all([
    prisma.formaPagamento.create({
      data: { tenantId: tenant.id, descricao: 'Dinheiro', tipo: 'AVISTA' },
    }),
    prisma.formaPagamento.create({
      data: { tenantId: tenant.id, descricao: 'Boleto Bancário', tipo: 'PRAZO' },
    }),
    prisma.formaPagamento.create({
      data: { tenantId: tenant.id, descricao: 'Transferência Bancária', tipo: 'AVISTA' },
    }),
    prisma.formaPagamento.create({
      data: { tenantId: tenant.id, descricao: 'Carta de Crédito', tipo: 'PRAZO' },
    }),
    prisma.formaPagamento.create({
      data: { tenantId: tenant.id, descricao: 'Cheque', tipo: 'PRAZO' },
    }),
  ]);
  console.log('Formas de pagamento created');

  // 17. Balancas
  const balancas = await Promise.all([
    prisma.balanca.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        unidadeId: unidade.id,
        nome: 'Balança Entrada - Toledo',
        marca: 'Toledo',
        modelo: '9090',
        protocolo: 'serial',
        porta: 'COM3',
        baudRate: 9600,
        statusOnline: true,
        tipoEntradaSaida: 'ENTRADA',
      },
    }),
    prisma.balanca.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        unidadeId: unidade.id,
        nome: 'Balança Saída - Toledo',
        marca: 'Toledo',
        modelo: '9090',
        protocolo: 'serial',
        porta: 'COM4',
        baudRate: 9600,
        statusOnline: true,
        tipoEntradaSaida: 'SAIDA',
      },
    }),
  ]);
  console.log('Balancas created');

  // 18. Configuracao Operacional
  await prisma.configuracaoOperacionalUnidade.create({
    data: {
      empresaId: empresa.id,
      unidadeId: unidade.id,
      pesagemComTara: true,
      pesagemEntrada: true,
      pesagemSaida: true,
      financeiro: true,
      cameras: false,
      transportadoraHabilitada: true,
      motoristaHabilitado: true,
      armazemHabilitado: true,
      manutencaoTicket: true,
      conversaoUnidade: false,
      precoVenda: true,
      bilhetagem: false,
      origemDestino: true,
      calculoFrete: true,
      tabelaUmidade: true,
      descontos: true,
      emissaoRomaneio: true,
      edicaoRomaneio: true,
      habilitaBaixa: true,
      listaDocumentos: true,
      previewImpressao: true,
      numeroCopias: 1,
      manterPreviewAberto: false,
      modeloTicketPadrao: 'A4_DETALHADO',
      labelAdicional1: 'Lote',
      labelAdicional2: 'Safra',
      observacaoHabilitada: true,
      manterTaraCadastrada: true,
    },
  });
  console.log('Configuracao operacional created');

  // 19. Licenca: seed NÃO cria trial automaticamente (F-027).
  // O onboarding da aplicação guiará o usuário a iniciar trial com fingerprint real.
  console.log('Licenca: nenhuma criada no seed (onboarding demanda trial real)');

  // 20. Tickets com passagens
  const allUsuarios = await prisma.usuario.findMany();
  const operador = allUsuarios.find((u) => u.email === 'joao@solutionticket.com') || allUsuarios[0];

  // Ticket 1: 2PF fechado - Milho
  const ticket1 = await prisma.ticketPesagem.create({
    data: {
      numero: 'TK-2024-0001',
      unidadeId: unidade.id,
      tenantId: tenant.id,
      statusOperacional: StatusOperacional.FECHADO,
      statusComercial: StatusComercial.NAO_ROMANEADO,
      fluxoPesagem: FluxoPesagem.PF2_BRUTO_TARA,
      totalPassagensPrevistas: 2,
      totalPassagensRealizadas: 2,
      clienteId: clientes[0].id,
      transportadoraId: transportadoras[0].id,
      motoristaId: motoristas[0].id,
      veiculoId: veiculos[0].id,
      veiculoPlaca: veiculos[0].placa,
      produtoId: produtos[0].id,
      destinoId: destinos[0].id,
      armazemId: armazens[0].id,
      pesoBrutoApurado: 48000,
      pesoTaraApurada: 14500,
      pesoLiquidoSemDesconto: 33500,
      totalDescontos: 300,
      pesoLiquidoFinal: 33200,
      taraCadastradaSnapshot: 14500,
      taraReferenciaTipo: TaraReferenciaTipo.CAPTURADA_EM_BALANCA,
      modoComercial: ModoComercial.INFORMATIVO,
      primeiraPassagemEm: new Date('2024-01-15T08:30:00'),
      ultimaPassagemEm: new Date('2024-01-15T14:20:00'),
      abertoEm: new Date('2024-01-15T08:15:00'),
      fechadoEm: new Date('2024-01-15T14:25:00'),
      observacao: 'Pesagem normal de milho',
    },
  });

  await prisma.passagemPesagem.createMany({
    data: [
      {
        ticketId: ticket1.id,
        sequencia: 1,
        tipoPassagem: TipoPassagem.ENTRADA,
        direcaoOperacional: DirecaoOperacional.ENTRADA,
        papelCalculo: PapelCalculo.BRUTO_OFICIAL,
        condicaoVeiculo: CondicaoVeiculo.CARREGADO,
        statusPassagem: StatusPassagem.VALIDA,
        pesoCapturado: 48000,
        dataHora: new Date('2024-01-15T08:30:00'),
        balancaId: balancas[0].id,
        usuarioId: operador.id,
        origemLeitura: OrigemLeitura.AUTOMATICA,
      },
      {
        ticketId: ticket1.id,
        sequencia: 2,
        tipoPassagem: TipoPassagem.SAIDA,
        direcaoOperacional: DirecaoOperacional.SAIDA,
        papelCalculo: PapelCalculo.TARA_OFICIAL,
        condicaoVeiculo: CondicaoVeiculo.VAZIO,
        statusPassagem: StatusPassagem.VALIDA,
        pesoCapturado: 14500,
        dataHora: new Date('2024-01-15T14:20:00'),
        balancaId: balancas[1].id,
        usuarioId: operador.id,
        origemLeitura: OrigemLeitura.AUTOMATICA,
      },
    ],
  });
  console.log('Ticket 1 created (2PF fechado)');

  // Ticket 2: 1PF tara referenciada - Soja
  const ticket2 = await prisma.ticketPesagem.create({
    data: {
      numero: 'TK-2024-0002',
      unidadeId: unidade.id,
      tenantId: tenant.id,
      statusOperacional: StatusOperacional.FECHADO,
      statusComercial: StatusComercial.NAO_ROMANEADO,
      fluxoPesagem: FluxoPesagem.PF1_TARA_REFERENCIADA,
      totalPassagensPrevistas: 1,
      totalPassagensRealizadas: 1,
      clienteId: clientes[1].id,
      transportadoraId: transportadoras[1].id,
      motoristaId: motoristas[1].id,
      veiculoId: veiculos[1].id,
      veiculoPlaca: veiculos[1].placa,
      produtoId: produtos[1].id,
      destinoId: destinos[1].id,
      armazemId: armazens[1].id,
      pesoBrutoApurado: 52400,
      pesoTaraApurada: 15200,
      pesoLiquidoSemDesconto: 37200,
      totalDescontos: 0,
      pesoLiquidoFinal: 37200,
      taraCadastradaSnapshot: 15200,
      taraReferenciaTipo: TaraReferenciaTipo.CADASTRADA,
      modoComercial: ModoComercial.INFORMATIVO,
      primeiraPassagemEm: new Date('2024-01-15T10:00:00'),
      ultimaPassagemEm: new Date('2024-01-15T10:00:00'),
      abertoEm: new Date('2024-01-15T09:45:00'),
      fechadoEm: new Date('2024-01-15T10:05:00'),
      observacao: 'Soja com tara referenciada',
    },
  });

  await prisma.passagemPesagem.create({
    data: {
      ticketId: ticket2.id,
      sequencia: 1,
      tipoPassagem: TipoPassagem.ENTRADA,
      direcaoOperacional: DirecaoOperacional.ENTRADA,
      papelCalculo: PapelCalculo.BRUTO_OFICIAL,
      condicaoVeiculo: CondicaoVeiculo.CARREGADO,
      statusPassagem: StatusPassagem.VALIDA,
      pesoCapturado: 52400,
      dataHora: new Date('2024-01-15T10:00:00'),
      balancaId: balancas[0].id,
      usuarioId: operador.id,
      origemLeitura: OrigemLeitura.AUTOMATICA,
    },
  });
  console.log('Ticket 2 created (1PF tara referenciada)');

  // Ticket 3: 2PF fechado - Trigo
  const ticket3 = await prisma.ticketPesagem.create({
    data: {
      numero: 'TK-2024-0003',
      unidadeId: unidade.id,
      tenantId: tenant.id,
      statusOperacional: StatusOperacional.FECHADO,
      statusComercial: StatusComercial.ROMANEADO,
      fluxoPesagem: FluxoPesagem.PF2_BRUTO_TARA,
      totalPassagensPrevistas: 2,
      totalPassagensRealizadas: 2,
      clienteId: clientes[2].id,
      transportadoraId: transportadoras[2].id,
      motoristaId: motoristas[2].id,
      veiculoId: veiculos[2].id,
      veiculoPlaca: veiculos[2].placa,
      produtoId: produtos[2].id,
      destinoId: destinos[2].id,
      armazemId: armazens[0].id,
      pesoBrutoApurado: 51800,
      pesoTaraApurada: 14800,
      pesoLiquidoSemDesconto: 37000,
      totalDescontos: 500,
      pesoLiquidoFinal: 36500,
      taraCadastradaSnapshot: 14800,
      taraReferenciaTipo: TaraReferenciaTipo.CAPTURADA_EM_BALANCA,
      modoComercial: ModoComercial.OBRIGATORIO,
      valorUnitario: 85.5,
      valorTotal: 3119.25,
      primeiraPassagemEm: new Date('2024-01-16T07:15:00'),
      ultimaPassagemEm: new Date('2024-01-16T16:30:00'),
      abertoEm: new Date('2024-01-16T07:00:00'),
      fechadoEm: new Date('2024-01-16T16:35:00'),
      observacao: 'Trigo com desconto por umidade',
    },
  });

  await prisma.passagemPesagem.createMany({
    data: [
      {
        ticketId: ticket3.id,
        sequencia: 1,
        tipoPassagem: TipoPassagem.ENTRADA,
        direcaoOperacional: DirecaoOperacional.ENTRADA,
        papelCalculo: PapelCalculo.BRUTO_OFICIAL,
        condicaoVeiculo: CondicaoVeiculo.CARREGADO,
        statusPassagem: StatusPassagem.VALIDA,
        pesoCapturado: 51800,
        dataHora: new Date('2024-01-16T07:15:00'),
        balancaId: balancas[0].id,
        usuarioId: operador.id,
        origemLeitura: OrigemLeitura.AUTOMATICA,
      },
      {
        ticketId: ticket3.id,
        sequencia: 2,
        tipoPassagem: TipoPassagem.SAIDA,
        direcaoOperacional: DirecaoOperacional.SAIDA,
        papelCalculo: PapelCalculo.TARA_OFICIAL,
        condicaoVeiculo: CondicaoVeiculo.VAZIO,
        statusPassagem: StatusPassagem.VALIDA,
        pesoCapturado: 14800,
        dataHora: new Date('2024-01-16T16:30:00'),
        balancaId: balancas[1].id,
        usuarioId: operador.id,
        origemLeitura: OrigemLeitura.AUTOMATICA,
      },
    ],
  });

  await prisma.descontoPesagem.create({
    data: {
      ticketId: ticket3.id,
      tipo: 'umidade',
      descricao: 'Desconto por umidade 13.5%',
      valor: 500,
      percentual: 1.35,
      origem: 'tabela',
    },
  });
  console.log('Ticket 3 created (2PF com desconto)');

  // Tickets 4-10: variados
  interface TicketSeed {
    num: string;
    cli: number;
    trans: number;
    mot: number;
    vei: number;
    prod: number;
    statusOp: string;
    statusCom: string;
    fluxo: string;
    bruto: number | null;
    tara: number | null;
    liq: number | null;
    desc: number | null;
    final: number | null;
    obs: string;
  }
  const ticketData: TicketSeed[] = [
    {
      num: 'TK-2024-0004',
      cli: 3,
      trans: 3,
      mot: 3,
      vei: 3,
      prod: 3,
      statusOp: StatusOperacional.FECHADO,
      statusCom: StatusComercial.FATURADO,
      fluxo: FluxoPesagem.PF2_BRUTO_TARA,
      bruto: 49200,
      tara: 16100,
      liq: 33100,
      desc: 0,
      final: 33100,
      obs: 'Algodão - pesagem normal',
    },
    {
      num: 'TK-2024-0005',
      cli: 4,
      trans: 0,
      mot: 4,
      vei: 4,
      prod: 4,
      statusOp: StatusOperacional.FECHADO,
      statusCom: StatusComercial.BAIXADO,
      fluxo: FluxoPesagem.PF2_BRUTO_TARA,
      bruto: 47600,
      tara: 13900,
      liq: 33700,
      desc: 200,
      final: 33500,
      obs: 'Sorgo com desconto',
    },
    {
      num: 'TK-2024-0006',
      cli: 0,
      trans: 1,
      mot: 5,
      vei: 5,
      prod: 0,
      statusOp: StatusOperacional.CANCELADO,
      statusCom: StatusComercial.NAO_ROMANEADO,
      fluxo: FluxoPesagem.PF2_BRUTO_TARA,
      bruto: null,
      tara: null,
      liq: null,
      desc: null,
      final: null,
      obs: 'Cancelado - veículo errado',
    },
    {
      num: 'TK-2024-0007',
      cli: 1,
      trans: 2,
      mot: 0,
      vei: 0,
      prod: 1,
      statusOp: StatusOperacional.EM_PESAGEM,
      statusCom: StatusComercial.NAO_ROMANEADO,
      fluxo: FluxoPesagem.PF2_BRUTO_TARA,
      bruto: 55000,
      tara: null,
      liq: null,
      desc: null,
      final: null,
      obs: 'Aguardando pesagem de saída',
    },
    {
      num: 'TK-2024-0008',
      cli: 2,
      trans: 0,
      mot: 1,
      vei: 1,
      prod: 2,
      statusOp: StatusOperacional.ABERTO,
      statusCom: StatusComercial.NAO_ROMANEADO,
      fluxo: FluxoPesagem.PF2_BRUTO_TARA,
      bruto: null,
      tara: null,
      liq: null,
      desc: null,
      final: null,
      obs: 'Ticket aberto',
    },
    {
      num: 'TK-2024-0009',
      cli: 5,
      trans: 1,
      mot: 2,
      vei: 2,
      prod: 5,
      statusOp: StatusOperacional.FECHADO,
      statusCom: StatusComercial.NAO_ROMANEADO,
      fluxo: FluxoPesagem.PF1_TARA_REFERENCIADA,
      bruto: 32000,
      tara: 14800,
      liq: 17200,
      desc: 0,
      final: 17200,
      obs: 'Farelo de soja - tara referenciada',
    },
    {
      num: 'TK-2024-0010',
      cli: 0,
      trans: 2,
      mot: 3,
      vei: 3,
      prod: 0,
      statusOp: StatusOperacional.AGUARDANDO_PASSAGEM,
      statusCom: StatusComercial.NAO_ROMANEADO,
      fluxo: FluxoPesagem.PF3_COM_CONTROLE,
      bruto: 51000,
      tara: null,
      liq: null,
      desc: null,
      final: null,
      obs: '3PF - aguardando tara e controle',
    },
  ];

  for (let i = 0; i < ticketData.length; i++) {
    const td = ticketData[i];
    const t = await prisma.ticketPesagem.create({
      data: {
        numero: td.num,
        unidadeId: unidade.id,
        tenantId: tenant.id,
        statusOperacional: td.statusOp,
        statusComercial: td.statusCom,
        fluxoPesagem: td.fluxo,
        totalPassagensPrevistas:
          td.fluxo === FluxoPesagem.PF1_TARA_REFERENCIADA
            ? 1
            : td.fluxo === FluxoPesagem.PF3_COM_CONTROLE
              ? 3
              : 2,
        totalPassagensRealizadas:
          td.statusOp === StatusOperacional.FECHADO
            ? td.fluxo === FluxoPesagem.PF1_TARA_REFERENCIADA
              ? 1
              : td.fluxo === FluxoPesagem.PF3_COM_CONTROLE
                ? 1
                : 2
            : td.statusOp === StatusOperacional.EM_PESAGEM
              ? 1
              : td.statusOp === StatusOperacional.AGUARDANDO_PASSAGEM
                ? 1
                : 0,
        clienteId: clientes[td.cli].id,
        transportadoraId: transportadoras[td.trans]?.id || null,
        motoristaId: motoristas[td.mot]?.id || null,
        veiculoId: veiculos[td.vei]?.id || null,
        veiculoPlaca: veiculos[td.vei]?.placa || null,
        produtoId: produtos[td.prod].id,
        pesoBrutoApurado: td.bruto,
        pesoTaraApurada: td.tara,
        pesoLiquidoSemDesconto: td.liq,
        totalDescontos: td.desc ?? 0,
        pesoLiquidoFinal: td.final,
        taraCadastradaSnapshot: veiculos[td.vei]?.taraCadastrada || null,
        taraReferenciaTipo:
          td.fluxo === FluxoPesagem.PF1_TARA_REFERENCIADA
            ? TaraReferenciaTipo.CADASTRADA
            : TaraReferenciaTipo.CAPTURADA_EM_BALANCA,
        modoComercial: ModoComercial.DESABILITADO,
        abertoEm: new Date(),
        fechadoEm: td.statusOp === StatusOperacional.FECHADO ? new Date() : null,
        canceladoEm: td.statusOp === StatusOperacional.CANCELADO ? new Date() : null,
        motivoCancelamento: td.statusOp === StatusOperacional.CANCELADO ? td.obs : null,
        observacao: td.obs,
      },
    });

    // Criar passagens para tickets fechados ou em andamento
    if (td.bruto) {
      await prisma.passagemPesagem.create({
        data: {
          ticketId: t.id,
          sequencia: 1,
          tipoPassagem: TipoPassagem.ENTRADA,
          direcaoOperacional: DirecaoOperacional.ENTRADA,
          papelCalculo: PapelCalculo.BRUTO_OFICIAL,
          condicaoVeiculo: CondicaoVeiculo.CARREGADO,
          statusPassagem: StatusPassagem.VALIDA,
          pesoCapturado: td.bruto,
          dataHora: new Date(),
          balancaId: balancas[0].id,
          usuarioId: operador.id,
          origemLeitura: OrigemLeitura.AUTOMATICA,
        },
      });
    }

    if (td.tara) {
      await prisma.passagemPesagem.create({
        data: {
          ticketId: t.id,
          sequencia: 2,
          tipoPassagem: TipoPassagem.SAIDA,
          direcaoOperacional: DirecaoOperacional.SAIDA,
          papelCalculo: PapelCalculo.TARA_OFICIAL,
          condicaoVeiculo: CondicaoVeiculo.VAZIO,
          statusPassagem: StatusPassagem.VALIDA,
          pesoCapturado: td.tara,
          dataHora: new Date(),
          balancaId: balancas[1].id,
          usuarioId: operador.id,
          origemLeitura: OrigemLeitura.AUTOMATICA,
        },
      });
    }
  }

  console.log('All tickets created');

  // Seed de Tipos de Fatura (idempotente)
  await seedTiposFaturaIdempotente(tenant.id);
  await seedConectoresIntegracaoIdempotente();
  await seedPermissoesIntegracaoAdminIdempotente(tenant.id);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
