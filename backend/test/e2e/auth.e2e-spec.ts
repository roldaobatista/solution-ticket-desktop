import request from 'supertest';
import { setupTestApp, TestAppContext } from './helpers/test-app';

describe('Auth (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('POST /api/auth/login - sucesso', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@teste.com', senha: 'senha123' });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.usuario.email).toBe('admin@teste.com');
  });

  it('POST /api/auth/login - senha errada 401', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@teste.com', senha: 'errada' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login - usuário inexistente 401', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'naoexiste@x.com', senha: 'x' });
    expect(res.status).toBe(401);
  });
});
