import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

describe('migration balanca_read_command', () => {
  let dbFile: string;
  let prisma: PrismaClient;

  beforeEach(() => {
    dbFile = path.join(os.tmpdir(), `st-read-command-${Date.now()}.db`);
    prisma = new PrismaClient({ datasources: { db: { url: `file:${dbFile}` } } });
  });

  afterEach(async () => {
    await prisma.$disconnect().catch(() => {});
    try {
      fs.unlinkSync(dbFile);
    } catch {}
  });

  it('faz backfill de polling ENQ para indicadores existentes Toledo C e Filizola @', async () => {
    await prisma.$executeRawUnsafe(
      'CREATE TABLE "indicador_pesagem" ("id" TEXT PRIMARY KEY, "parser_tipo" TEXT, "atraso" INTEGER)',
    );
    await prisma.$executeRawUnsafe('CREATE TABLE "balanca" ("id" TEXT PRIMARY KEY)');
    await prisma.$executeRawUnsafe(
      `INSERT INTO "indicador_pesagem" ("id", "parser_tipo", "atraso") VALUES
        ('toledo', 'toledo-c', NULL),
        ('filizola', 'filizola-at', 750),
        ('streaming', 'generic', NULL)`,
    );

    const migrationPath = path.resolve(
      __dirname,
      'migrations/20260429160000_balanca_read_command/migration.sql',
    );
    const statements = fs
      .readFileSync(migrationPath, 'utf8')
      .split(';')
      .map((stmt) => stmt.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        read_mode: string;
        read_command_hex: string | null;
        read_interval_ms: number | null;
      }>
    >(
      'SELECT id, read_mode, read_command_hex, read_interval_ms FROM "indicador_pesagem" ORDER BY id',
    );

    expect(rows).toEqual([
      {
        id: 'filizola',
        read_mode: 'polling',
        read_command_hex: '05',
        read_interval_ms: 750,
      },
      {
        id: 'streaming',
        read_mode: 'continuous',
        read_command_hex: null,
        read_interval_ms: null,
      },
      {
        id: 'toledo',
        read_mode: 'polling',
        read_command_hex: '05',
        read_interval_ms: 500,
      },
    ]);
  });
});
