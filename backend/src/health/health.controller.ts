import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';
import { getUserDataDir } from '../common/desktop-paths';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  // Onda 2.6: health permanece publico (necessario para o splash do Electron
  // saber se backend ja subiu antes do login). Nao expoe dados sensiveis.
  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.disk.checkStorage('disk', { thresholdPercent: 0.9, path: getUserDataDir() }),
      async () => {
        await this.prisma.$queryRaw`SELECT 1`;
        return { database: { status: 'up' } };
      },
    ]);
  }
}
