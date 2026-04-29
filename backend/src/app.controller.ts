import { Controller, Get, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './common/decorators/public.decorator';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';
import { Roles } from './common/decorators/roles.decorator';
import { Permissao } from './constants/permissoes';

const bootedAt = new Date();

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness — sem checagens externas' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round((Date.now() - bootedAt.getTime()) / 1000),
      version: process.env.npm_package_version,
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness — checa DB; 503 se degradado' })
  async ready() {
    let db = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      db = `error: ${(err as Error).message}`;
    }
    const ok = db === 'ok';
    if (!ok) {
      throw new HttpException(
        { status: 'degraded', services: { database: db } },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return { status: 'ok', services: { database: db } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Permissao.DASHBOARD_VISUALIZAR)
  @Get('metrics')
  @ApiOperation({ summary: 'Métricas de negócio agregadas (não-Prometheus)' })
  async metrics(@CurrentUser('tenantId') tenantId: string) {
    const hoje = startOfDay();
    const [totalTickets, ticketsHoje, ticketsAbertos, pesagensHoje, balancasOnline, ultimoBackup] =
      await Promise.all([
        this.prisma.ticketPesagem.count({ where: { tenantId } }),
        this.prisma.ticketPesagem.count({ where: { tenantId, abertoEm: { gte: hoje } } }),
        this.prisma.ticketPesagem.count({
          where: {
            tenantId,
            statusOperacional: { in: ['ABERTO', 'EM_PESAGEM', 'AGUARDANDO_PASSAGEM'] },
          },
        }),
        this.prisma.passagemPesagem.count({
          where: { dataHora: { gte: hoje }, ticket: { tenantId } },
        }),
        this.prisma.balanca.count({ where: { tenantId, statusOnline: true } }),
        this.prisma.fotoPesagem
          .findFirst({ where: { ticket: { tenantId } }, orderBy: { capturadoEm: 'desc' } })
          .then((f) => (f ? f.capturadoEm.toISOString() : null))
          .catch(() => null),
      ]);

    return {
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round((Date.now() - bootedAt.getTime()) / 1000),
      tickets: { total: totalTickets, hoje: ticketsHoje, abertos: ticketsAbertos },
      pesagens: { hoje: pesagensHoje },
      balancas: { online: balancasOnline },
      ultimaFotoCapturada: ultimoBackup,
    };
  }
}

function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
