import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production' && process.env.RUN_MIGRATIONS_ON_BOOT !== 'false') {
      this.applyMigrationsOnBoot();
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Em produção, roda `prisma migrate deploy` no boot (idempotente).
   * Desabilite com RUN_MIGRATIONS_ON_BOOT=false para deploys manuais.
   */
  private applyMigrationsOnBoot() {
    try {
      const schemaPath = this.resolveSchemaPath();
      if (!schemaPath) {
        this.logger.warn('schema.prisma não encontrado — pulando migrate deploy.');
        return;
      }
      this.logger.log(`Rodando prisma migrate deploy (schema: ${schemaPath})`);
      execFileSync('npx', ['prisma', 'migrate', 'deploy', `--schema=${schemaPath}`], {
        stdio: 'inherit',
        env: process.env,
      });
      this.logger.log('Migrations aplicadas com sucesso.');
    } catch (err) {
      this.logger.error(`Falha ao aplicar migrations: ${(err as Error).message}`);
      throw err;
    }
  }

  private resolveSchemaPath(): string | null {
    const candidates = [
      path.join(process.cwd(), 'src', 'prisma', 'schema.prisma'),
      path.join(process.cwd(), 'prisma', 'schema.prisma'),
      path.join(__dirname, '..', 'prisma', 'schema.prisma'),
      path.join(__dirname, 'schema.prisma'),
    ];
    return candidates.find((p) => fs.existsSync(p)) ?? null;
  }
}
