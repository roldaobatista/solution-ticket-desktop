import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificacaoService } from './notificacao.service';
import { UpdateNotificacaoDto } from './dto/update-notificacao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Notificacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificacoes/config')
export class NotificacaoController {
  constructor(private readonly service: NotificacaoService) {}

  @Get()
  @ApiOperation({ summary: 'Obter preferencias de notificacao do tenant' })
  async get(@CurrentUser('tenantId') tenantId: string) {
    const cfg = await this.service.getConfig(tenantId);
    return (
      cfg ?? {
        emailErrosImpressao: false,
        emailBackupFalha: false,
        emailEnderecos: '',
        webhookUrl: '',
      }
    );
  }

  @Put()
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar preferencias de notificacao do tenant' })
  upsert(@CurrentUser('tenantId') tenantId: string, @Body() dto: UpdateNotificacaoDto) {
    return this.service.upsertConfig(tenantId, dto);
  }
}
