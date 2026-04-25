import request from 'supertest';
import { setupTestApp, TestAppContext } from './helpers/test-app';

describe('Balancas (e2e)', () => {
  let ctx: TestAppContext;
  const auth = () => `Bearer ${ctx.jwtToken}`;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('GET /api/balancas lista balancas', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/balancas')
      .set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });

  it('GET /api/balancas/:id retorna balanca', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/balancas/${ctx.balancaId}`)
      .set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(ctx.balancaId);
  });

  it('GET /api/balancas/:id/status sem conexão → offline', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/balancas/${ctx.balancaId}/status`)
      .set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(res.body.data.online).toBe(false);
    expect(res.body.data.ultimaLeitura).toBeNull();
  });

  it('POST /api/balancas/:id/testar sem hardware real → sucesso:false com erro amigável', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/balancas/${ctx.balancaId}/testar`)
      .set('Authorization', auth());
    expect(res.status).toBe(201);
    expect(res.body.data.sucesso).toBe(false);
    expect(typeof res.body.data.erro).toBe('string');
  });

  it('POST /api/balancas cria balanca (CRUD básico)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/balancas')
      .set('Authorization', auth())
      .send({
        empresaId: ctx.empresaId,
        unidadeId: ctx.unidadeId,
        nome: 'Nova Balanca',
        protocolo: 'serial',
        porta: 'COM99',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.nome).toBe('Nova Balanca');
  });

  it('GET /api/balancas/:id inexistente → 404', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/balancas/00000000-0000-0000-0000-000000000000')
      .set('Authorization', auth());
    expect(res.status).toBe(404);
  });
});
