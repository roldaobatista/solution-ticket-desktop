import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { AutomacaoService } from './automacao.service';

@ApiTags('Automacao')
@ApiBearerAuth()
@Controller('automacao')
@UseGuards(JwtAuthGuard)
export class AutomacaoController {
  constructor(private readonly service: AutomacaoService) {}

  @Post('comando')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Envia comando para semáforo ou cancela' })
  comando(
    @Body()
    body: {
      unidadeId: string;
      dispositivo: 'SEMAFORO' | 'CANCELA';
      comando: 'VERDE' | 'VERMELHO' | 'AMARELO' | 'ABRIR' | 'FECHAR';
      motivo?: string;
      ticketId?: string;
      usuarioId?: string;
    },
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.enviarComando({ ...body, usuarioId: userId }, tenantId);
  }

  @Post(':id/executado')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Marca evento como executado (callback do adapter)' })
  executado(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.marcarExecutado(id, tenantId);
  }

  @Post(':id/falha')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Marca evento como falha (callback do adapter)' })
  falha(
    @Param('id') id: string,
    @Body() body: { motivo: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.marcarFalha(id, body.motivo, tenantId);
  }

  @Get('historico/:unidadeId')
  @ApiOperation({ summary: 'Histórico de eventos de automação (últimos N)' })
  historico(
    @Param('unidadeId') unidadeId: string,
    @Query('limit') limit: string | undefined,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.historico(unidadeId, tenantId, limit ? parseInt(limit, 10) : 50);
  }
}
