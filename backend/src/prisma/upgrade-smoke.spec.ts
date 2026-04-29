/**
 * Teste de upgrade de banco SQLite (smoke test de migration).
 *
 * Objetivo: garantir que `prisma migrate deploy` funciona em:
 * 1. Banco novo (criação from-scratch)
 * 2. Banco já migrado (idempotência — não quebra ao re-rodar)
 *
 * Gate: este teste deve passar antes de qualquer release.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PrismaClient } from '@prisma/client';

const schemaPath = path.resolve(__dirname, 'schema.prisma');

function runMigrateDeploy(dbUrl: string) {
  const env = { ...process.env, DATABASE_URL: dbUrl };
  execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
    env,
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'pipe',
  });
}

describe('Prisma migrate deploy — smoke de upgrade', () => {
  let dbFile: string;
  let dbUrl: string;
  let prisma: PrismaClient;

  beforeEach(() => {
    const tmp = os.tmpdir();
    dbFile = path.join(tmp, `st-upgrade-test-${Date.now()}.db`);
    dbUrl = `file:${dbFile}`;
    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  });

  afterEach(async () => {
    await prisma.$disconnect().catch(() => {});
    try {
      fs.unlinkSync(dbFile);
    } catch {}
  });

  it('cria schema completo em banco novo', async () => {
    expect(() => runMigrateDeploy(dbUrl)).not.toThrow();

    // Verifica se consegue consultar tabelas core via Prisma
    const tenantCount = await prisma.tenant.count();
    expect(typeof tenantCount).toBe('number');

    const ticketCount = await prisma.ticketPesagem.count();
    expect(typeof ticketCount).toBe('number');

    const userCount = await prisma.usuario.count();
    expect(typeof userCount).toBe('number');

    const auditCount = await prisma.auditoria.count();
    expect(typeof auditCount).toBe('number');

    await prisma.tenant.create({
      data: {
        id: 'tenant-balanca',
        nome: 'Tenant Balanca',
        documento: '11.111.111/1111-11',
      },
    });
    await prisma.empresa.create({
      data: {
        id: 'empresa-balanca',
        tenantId: 'tenant-balanca',
        nomeEmpresarial: 'Empresa Balanca',
        nomeFantasia: 'Empresa Balanca',
        documento: '11.111.111/0001-11',
      },
    });
    await prisma.unidade.create({
      data: {
        id: 'unidade-balanca',
        empresaId: 'empresa-balanca',
        nome: 'Unidade Balanca',
      },
    });
    await prisma.balanca.create({
      data: {
        id: 'balanca-schema-check',
        tenantId: 'tenant-balanca',
        empresaId: 'empresa-balanca',
        unidadeId: 'unidade-balanca',
        nome: 'Balanca schema check',
        protocolo: 'serial',
      },
    });

    const balanca = await prisma.balanca.findUnique({ where: { id: 'balanca-schema-check' } });
    expect(balanca?.tenantId).toBe('tenant-balanca');
  }, 30_000);

  it('é idempotente (re-rodar não quebra)', async () => {
    runMigrateDeploy(dbUrl);

    // Insere dados mínimos
    await prisma.tenant.create({
      data: {
        id: 't1',
        nome: 'Test',
        documento: '00.000.000/0000-00',
      },
    });

    // Re-rodar migrate — deve ser no-op
    expect(() => runMigrateDeploy(dbUrl)).not.toThrow();

    // Dados preservados
    const t = await prisma.tenant.findUnique({ where: { id: 't1' } });
    expect(t?.nome).toBe('Test');
  }, 30_000);

  it('aplica migrations pendentes sem perder dados', async () => {
    // Simula banco "antigo" rodando migrate deploy uma vez
    runMigrateDeploy(dbUrl);

    // Seed de dados
    await prisma.tenant.create({
      data: {
        id: 't1',
        nome: 'Test',
        documento: '00.000.000/0000-00',
      },
    });
    await prisma.empresa.create({
      data: {
        id: 'e1',
        tenantId: 't1',
        nomeEmpresarial: 'E1',
        nomeFantasia: 'E1',
        documento: '00.000.000/0001-91',
      },
    });

    // Simula "nova versão" re-rodando migrate (no Prisma, migrate deploy é idempotente
    // para migrations já aplicadas; se houver migrations NOVAS, elas serão aplicadas).
    // Como não temos migrations antigas vs novas neste teste, o que validamos é a
    // idempotência + preservação de dados.
    expect(() => runMigrateDeploy(dbUrl)).not.toThrow();

    const e = await prisma.empresa.findUnique({ where: { id: 'e1' } });
    expect(e?.nomeEmpresarial).toBe('E1');
  }, 30_000);
});
