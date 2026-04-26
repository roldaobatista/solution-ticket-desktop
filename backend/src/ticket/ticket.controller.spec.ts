import { Test, TestingModule } from '@nestjs/testing';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { PassagemService } from './passagem.service';

describe('TicketController', () => {
  let controller: TicketController;
  let ticketService: jest.Mocked<TicketService>;
  let passagemService: jest.Mocked<PassagemService>;

  const mockTicketService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    getEstatisticas: jest.fn(),
    registrarPassagem: jest.fn(),
    fecharTicket: jest.fn(),
    cancelarTicket: jest.fn(),
    solicitarManutencao: jest.fn(),
    concluirManutencao: jest.fn(),
    getHistorico: jest.fn(),
    reimprimir: jest.fn(),
  };

  const mockPassagemService = {
    findByTicket: jest.fn(),
    invalidar: jest.fn(),
    adicionarDesconto: jest.fn(),
    listarDescontos: jest.fn(),
  };

  const tenantId = 'tenant-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        { provide: TicketService, useValue: mockTicketService },
        { provide: PassagemService, useValue: mockPassagemService },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
    ticketService = module.get(TicketService);
    passagemService = module.get(PassagemService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar ticket', async () => {
      const dto = { unidadeId: 'u1', clienteId: 'c1', produtoId: 'p1' } as any;
      const ticket = { id: 'tid' };
      ticketService.create.mockResolvedValue(ticket as any);

      const result = await controller.create(dto, tenantId);

      expect(ticketService.create).toHaveBeenCalledWith(dto, tenantId);
      expect(result).toEqual(ticket);
    });
  });

  describe('findAll', () => {
    it('deve listar tickets com filtros', async () => {
      const filter = { unidadeId: 'u1' } as any;
      const tickets = [{ id: 't1' }];
      ticketService.findAll.mockResolvedValue(tickets as any);

      const result = await controller.findAll(filter, tenantId);

      expect(ticketService.findAll).toHaveBeenCalledWith(filter, tenantId);
      expect(result).toEqual(tickets);
    });
  });

  describe('findOne', () => {
    it('deve buscar ticket por id', async () => {
      const ticket = { id: 't1' };
      ticketService.findOne.mockResolvedValue(ticket as any);

      const result = await controller.findOne('t1', tenantId);

      expect(ticketService.findOne).toHaveBeenCalledWith('t1', tenantId);
      expect(result).toEqual(ticket);
    });
  });

  describe('update', () => {
    it('deve atualizar ticket', async () => {
      const dto = { observacao: 'obs' } as any;
      const ticket = { id: 't1' };
      ticketService.update.mockResolvedValue(ticket as any);

      const result = await controller.update('t1', dto, tenantId);

      expect(ticketService.update).toHaveBeenCalledWith('t1', dto, tenantId);
      expect(result).toEqual(ticket);
    });
  });

  describe('getEstatisticas', () => {
    it('deve retornar estatísticas da unidade', async () => {
      const stats = { pesagensHoje: 5 };
      ticketService.getEstatisticas.mockResolvedValue(stats as any);

      const result = await controller.getEstatisticas('u1', tenantId);

      expect(ticketService.getEstatisticas).toHaveBeenCalledWith('u1', tenantId);
      expect(result).toEqual(stats);
    });
  });

  describe('registrarPassagem', () => {
    it('deve registrar passagem', async () => {
      const dto = { pesoCapturado: 1000 } as any;
      const passagem = { id: 'p1' };
      ticketService.registrarPassagem.mockResolvedValue(passagem as any);

      const result = await controller.registrarPassagem('t1', dto, tenantId);

      expect(ticketService.registrarPassagem).toHaveBeenCalledWith('t1', dto, tenantId);
      expect(result).toEqual(passagem);
    });
  });

  describe('listarPassagens', () => {
    it('deve listar passagens do ticket', async () => {
      const passagens = [{ id: 'p1' }];
      passagemService.findByTicket.mockResolvedValue(passagens as any);

      const result = await controller.listarPassagens('t1', tenantId);

      expect(passagemService.findByTicket).toHaveBeenCalledWith('t1', tenantId);
      expect(result).toEqual(passagens);
    });
  });

  describe('invalidarPassagem', () => {
    it('deve invalidar passagem', async () => {
      const res = { ok: true };
      passagemService.invalidar.mockResolvedValue(res as any);

      const result = await controller.invalidarPassagem(
        't1',
        'p1',
        { motivo: 'erro balanca' },
        tenantId,
      );

      expect(passagemService.invalidar).toHaveBeenCalledWith('t1', 'p1', 'erro balanca', tenantId);
      expect(result).toEqual(res);
    });
  });

  describe('fecharTicket', () => {
    it('deve fechar ticket', async () => {
      const dto = { usuarioId: 'u1' } as any;
      const ticket = { id: 't1', statusOperacional: 'FECHADO' };
      ticketService.fecharTicket.mockResolvedValue(ticket as any);

      const result = await controller.fecharTicket('t1', dto, tenantId);

      expect(ticketService.fecharTicket).toHaveBeenCalledWith('t1', dto, tenantId);
      expect(result).toEqual(ticket);
    });
  });

  describe('cancelarTicket', () => {
    it('deve cancelar ticket', async () => {
      const dto = { usuarioId: 'u1', motivo: 'erro' } as any;
      const ticket = { id: 't1', statusOperacional: 'CANCELADO' };
      ticketService.cancelarTicket.mockResolvedValue(ticket as any);

      const result = await controller.cancelarTicket('t1', dto, tenantId);

      expect(ticketService.cancelarTicket).toHaveBeenCalledWith('t1', dto, tenantId);
      expect(result).toEqual(ticket);
    });
  });

  describe('solicitarManutencao', () => {
    it('deve solicitar manutencao', async () => {
      const ticket = { id: 't1', statusOperacional: 'EM_MANUTENCAO' };
      ticketService.solicitarManutencao.mockResolvedValue(ticket as any);

      const result = await controller.solicitarManutencao(
        't1',
        { motivo: 'erro peso' },
        'u1',
        tenantId,
      );

      expect(ticketService.solicitarManutencao).toHaveBeenCalledWith(
        't1',
        'erro peso',
        'u1',
        tenantId,
      );
      expect(result).toEqual(ticket);
    });
  });

  describe('concluirManutencao', () => {
    it('deve concluir manutencao', async () => {
      const ticket = { id: 't1', statusOperacional: 'FECHADO' };
      ticketService.concluirManutencao.mockResolvedValue(ticket as any);

      const result = await controller.concluirManutencao('t1', 'u1', tenantId);

      expect(ticketService.concluirManutencao).toHaveBeenCalledWith('t1', 'u1', tenantId);
      expect(result).toEqual(ticket);
    });
  });

  describe('adicionarDesconto', () => {
    it('deve adicionar desconto', async () => {
      const dto = { tipoDescontoId: 'd1', valor: 100 } as any;
      const res = { id: 'desc1' };
      passagemService.adicionarDesconto.mockResolvedValue(res as any);

      const result = await controller.adicionarDesconto('t1', dto, tenantId);

      expect(passagemService.adicionarDesconto).toHaveBeenCalledWith('t1', dto, tenantId);
      expect(result).toEqual(res);
    });
  });

  describe('listarDescontos', () => {
    it('deve listar descontos', async () => {
      const descontos = [{ id: 'd1' }];
      passagemService.listarDescontos.mockResolvedValue(descontos as any);

      const result = await controller.listarDescontos('t1', tenantId);

      expect(passagemService.listarDescontos).toHaveBeenCalledWith('t1', tenantId);
      expect(result).toEqual(descontos);
    });
  });

  describe('getHistorico', () => {
    it('deve retornar historico', async () => {
      const historico = [{ evento: 'fechamento' }];
      ticketService.getHistorico.mockResolvedValue(historico as any);

      const result = await controller.getHistorico('t1', tenantId);

      expect(ticketService.getHistorico).toHaveBeenCalledWith('t1', tenantId);
      expect(result).toEqual(historico);
    });
  });

  describe('reimprimirTicket', () => {
    it('deve registrar reimpressao', async () => {
      const res = { sucesso: true };
      ticketService.reimprimir.mockResolvedValue(res as any);

      const result = await controller.reimprimirTicket('t1', 'u1', tenantId);

      expect(ticketService.reimprimir).toHaveBeenCalledWith('t1', tenantId, 'u1');
      expect(result).toEqual(res);
    });
  });
});
