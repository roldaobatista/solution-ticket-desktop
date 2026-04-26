import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import helmet from 'helmet';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { Permissao } from '../../../src/constants/permissoes';

export interface TestAppContext {
  app: INestApplication;
  prisma: PrismaService;
  jwt: JwtService;
  jwtToken: string;
  tenantId: string;
  empresaId: string;
  unidadeId: string;
  usuarioId: string;
  clienteId: string;
  produtoId: string;
  balancaId: string;
  dbPath: string;
  cleanup: () => Promise<void>;
}

/**
 * Cria um arquivo SQLite temporário único e roda as migrations.
 * Define DATABASE_URL antes de carregar o AppModule.
 */
export async function setupTestApp(): Promise<TestAppContext> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'st-e2e-'));
  const dbPath = path.join(tmpDir, 'test.db');
  const dbUrl = `file:${dbPath}`;
  process.env.DATABASE_URL = dbUrl;
  process.env.NODE_ENV = 'test';
  process.env.DISABLE_THROTTLER = '1'; // Onda 2.8: bypass explicito de throttler
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-e2e';

  // Aplica schema via prisma db push (rápido e não exige histórico)
  const backendRoot = path.resolve(__dirname, '../../..');
  const schemaPath = path.join(backendRoot, 'src', 'prisma', 'schema.prisma');
  try {
    execSync(`npx prisma db push --schema "${schemaPath}" --skip-generate --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: dbUrl },
      cwd: backendRoot,
      stdio: 'ignore',
    });
  } catch (e) {
    throw new Error(`Falha ao aplicar schema: ${(e as Error).message}`);
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  const prisma = app.get(PrismaService);
  const jwt = app.get(JwtService);

  // Seed mínimo
  const seed = await seedMinimo(prisma);
  const jwtToken = jwt.sign({
    sub: seed.usuarioId,
    email: 'admin@teste.com',
    nome: 'Admin Teste',
    tenantId: seed.tenantId,
  });

  const cleanup = async () => {
    try {
      await app.close();
    } catch {
      /* ignore */
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  };

  return { app, prisma, jwt, jwtToken, ...seed, dbPath, cleanup };
}

async function seedMinimo(prisma: PrismaService) {
  const tenant = await prisma.tenant.create({ data: { nome: 'Tenant Teste' } });
  const empresa = await prisma.empresa.create({
    data: {
      tenantId: tenant.id,
      nomeEmpresarial: 'Empresa Teste',
      documento: '00.000.000/0001-91',
    },
  });
  const unidade = await prisma.unidade.create({
    data: { empresaId: empresa.id, nome: 'Unidade Teste' },
  });
  const senhaHash = await bcrypt.hash('senha123', 4);
  const perfilAdmin = await prisma.perfil.create({
    data: { tenantId: tenant.id, nome: 'Admin Teste', descricao: 'Acesso total' },
  });
  const permissoesAdmin = Object.values(Permissao);
  for (const acao of permissoesAdmin) {
    const modulo = acao.split(':')[0];
    await prisma.permissao.create({
      data: { perfilId: perfilAdmin.id, modulo, acao, concedido: true },
    });
  }
  const usuario = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      senhaHash,
      ativo: true,
    },
  });
  await prisma.usuarioPerfil.create({
    data: { usuarioId: usuario.id, perfilId: perfilAdmin.id },
  });
  const cliente = await prisma.cliente.create({
    data: { tenantId: tenant.id, razaoSocial: 'Cliente Teste' },
  });
  const produto = await prisma.produto.create({
    data: { tenantId: tenant.id, descricao: 'Produto Teste', unidade: 'KG' },
  });
  const balanca = await prisma.balanca.create({
    data: {
      tenantId: tenant.id,
      empresaId: empresa.id,
      unidadeId: unidade.id,
      nome: 'Balanca Teste',
      protocolo: 'serial',
      porta: 'COM-INEXISTENTE',
    },
  });

  return {
    tenantId: tenant.id,
    empresaId: empresa.id,
    unidadeId: unidade.id,
    usuarioId: usuario.id,
    clienteId: cliente.id,
    produtoId: produto.id,
    balancaId: balanca.id,
  };
}

export async function limparDadosTransacionais(prisma: PrismaService) {
  // Limpa na ordem de dependências
  await prisma.eventoLicenciamento.deleteMany({});
  await prisma.licencaInstalacao.deleteMany({});
  await prisma.descontoPesagem.deleteMany({});
  await prisma.passagemPesagem.deleteMany({});
  await prisma.snapshotComercialTicket.deleteMany({});
  await prisma.ticketPesagem.deleteMany({});
  await prisma.auditoria.deleteMany({});
}
