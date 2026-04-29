import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BackupService } from './backup.service';
import { Permissao } from '../constants/permissoes';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Backup')
@ApiBearerAuth()
@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Permissao.CONFIG_GERENCIAR)
export class BackupController {
  constructor(private readonly service: BackupService) {}

  @Get()
  @ApiOperation({ summary: 'Lista backups disponíveis' })
  list() {
    return this.service.list();
  }

  @Post('create')
  @ApiOperation({ summary: 'Cria backup manual imediato' })
  create() {
    return this.service.create('manual');
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verifica integridade (sha256) de um backup' })
  verify(@Body() body: { filename: string }) {
    return this.service.verify(body.filename);
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restaura banco a partir de um backup (operação destrutiva)' })
  restore(
    @Body() body: { filename: string },
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') usuarioId?: string,
  ) {
    return this.service.restore(body.filename, { tenantId, usuarioId });
  }
}
