import request from 'supertest';
import { setupTestApp, TestAppContext, limparDadosTransacionais } from './helpers/test-app';
import { TEST_PUBLIC_KEY, gerarChaveRSA } from '../fixtures/rsa-test-keys';
import * as fingerprintUtil from '../../src/licenca/fingerprint.util';
import { LicencaService } from '../../src/licenca/licenca.service';

describe('Licenca (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await setupTestApp();
    const licencaService = ctx.app.get<LicencaService>(LicencaService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (licencaService as any).publicKey = TEST_PUBLIC_KEY;
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  beforeEach(async () => {
    await limparDadosTransacionais(ctx.prisma);
  });

  it('GET /api/licenca/fingerprint retorna fingerprint não vazio', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/licenca/fingerprint');
    expect(res.status).toBe(200);
    expect(res.body.data.fingerprint).toMatch(/^[a-f0-9]{32}$/);
  });

  const auth = () => `Bearer ${ctx.jwtToken}`;

  it('POST /api/licenca/iniciar-trial cria licença TRIAL', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/licenca/iniciar-trial')
      .set('Authorization', auth())
      .send({ unidadeId: ctx.unidadeId, tenantId: ctx.tenantId });
    expect(res.status).toBe(201);
    expect(res.body.data.statusLicenca).toBe('TRIAL');
    expect(res.body.data.pesagensRestantesTrial).toBe(100);
  });

  it('POST /api/licenca/iniciar-trial é idempotente', async () => {
    const r1 = await request(ctx.app.getHttpServer())
      .post('/api/licenca/iniciar-trial')
      .set('Authorization', auth())
      .send({ unidadeId: ctx.unidadeId, tenantId: ctx.tenantId });
    const r2 = await request(ctx.app.getHttpServer())
      .post('/api/licenca/iniciar-trial')
      .set('Authorization', auth())
      .send({ unidadeId: ctx.unidadeId, tenantId: ctx.tenantId });
    expect(r1.body.data.id).toBe(r2.body.data.id);
  });

  it('GET /api/licenca/status retorna SEM_LICENCA quando não existe', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/licenca/status')
      .query({ unidadeId: ctx.unidadeId });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SEM_LICENCA');
  });

  it('POST /api/licenca/ativar com chave RSA válida (fluxo real gerar-chave)', async () => {
    const fp = fingerprintUtil.obterFingerprint();
    const chave = gerarChaveRSA({
      fingerprints: [fp],
      plan: 'PADRAO',
      validadeSegundos: 86400 * 30,
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/licenca/ativar')
      .set('Authorization', auth())
      .send({ unidadeId: ctx.unidadeId, tenantId: ctx.tenantId, chave });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('ATIVA');
    expect(res.body.data.plan).toBe('PADRAO');
  });

  it('POST /api/licenca/ativar rejeita chave com fingerprint divergente', async () => {
    const chave = gerarChaveRSA({
      fingerprints: ['fp-de-outra-maquina-aaaaaaaa'],
      plan: 'PADRAO',
    });
    const res = await request(ctx.app.getHttpServer())
      .post('/api/licenca/ativar')
      .set('Authorization', auth())
      .send({ unidadeId: ctx.unidadeId, tenantId: ctx.tenantId, chave });
    expect(res.status).toBe(400);
  });
});
