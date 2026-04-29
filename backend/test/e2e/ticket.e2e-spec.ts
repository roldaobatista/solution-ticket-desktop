import request from 'supertest';
import { setupTestApp, TestAppContext, limparDadosTransacionais } from './helpers/test-app';

describe('Ticket (e2e)', () => {
  let ctx: TestAppContext;
  const auth = () => `Bearer ${ctx.jwtToken}`;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  beforeEach(async () => {
    await limparDadosTransacionais(ctx.prisma);
    const trial = await request(ctx.app.getHttpServer())
      .post('/api/licenca/iniciar-trial')
      .set('Authorization', auth())
      .send({ unidadeId: ctx.unidadeId });
    expect(trial.status).toBe(201);
  });

  async function criarTicket() {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/tickets')
      .set('Authorization', auth())
      .send({
        unidadeId: ctx.unidadeId,
        fluxoPesagem: 'PF2_BRUTO_TARA',
        clienteId: ctx.clienteId,
        produtoId: ctx.produtoId,
      });
    expect(res.status).toBe(201);
    return res.body.data;
  }

  it('POST /api/tickets cria ticket', async () => {
    const ticket = await criarTicket();
    expect(ticket.id).toBeDefined();
    expect(ticket.statusOperacional).toBe('ABERTO');
    expect(ticket.numero).toMatch(/^TK-\d{4}-\d{4}$/);
  });

  it('Fluxo completo: cria ticket, registra 2 passagens e fecha', async () => {
    const ticket = await criarTicket();

    const p1 = await request(ctx.app.getHttpServer())
      .post(`/api/tickets/${ticket.id}/passagens`)
      .set('Authorization', auth())
      .send({
        tipoPassagem: 'OFICIAL',
        direcaoOperacional: 'ENTRADA',
        papelCalculo: 'BRUTO_OFICIAL',
        condicaoVeiculo: 'CARREGADO',
        pesoCapturado: 20000,
        balancaId: ctx.balancaId,
        origemLeitura: 'MANUAL',
        observacao: 'Peso manual justificado no teste E2E',
      });
    expect(p1.status).toBe(201);

    const p2 = await request(ctx.app.getHttpServer())
      .post(`/api/tickets/${ticket.id}/passagens`)
      .set('Authorization', auth())
      .send({
        tipoPassagem: 'OFICIAL',
        direcaoOperacional: 'SAIDA',
        papelCalculo: 'TARA_OFICIAL',
        condicaoVeiculo: 'VAZIO',
        pesoCapturado: 8000,
        balancaId: ctx.balancaId,
        origemLeitura: 'MANUAL',
        observacao: 'Peso manual justificado no teste E2E',
      });
    expect(p2.status).toBe(201);

    const fechar = await request(ctx.app.getHttpServer())
      .post(`/api/tickets/${ticket.id}/fechar`)
      .set('Authorization', auth())
      .send({});
    expect(fechar.status).toBe(201);
    expect(fechar.body.data.statusOperacional).toBe('FECHADO');
    expect(Number(fechar.body.data.pesoLiquidoFinal)).toBe(12000);
    expect(Number(fechar.body.data.pesoBrutoApurado)).toBe(20000);
    expect(Number(fechar.body.data.pesoTaraApurada)).toBe(8000);
  });

  it('GET /api/tickets lista tickets paginado', async () => {
    await criarTicket();
    const res = await request(ctx.app.getHttpServer())
      .get('/api/tickets')
      .set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/tickets/:id/cancelar cancela ticket aberto', async () => {
    const ticket = await criarTicket();
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/tickets/${ticket.id}/cancelar`)
      .set('Authorization', auth())
      .send({ motivo: 'Teste' });
    expect(res.status).toBe(201);
    expect(res.body.data.statusOperacional).toBe('CANCELADO');
  });
});
