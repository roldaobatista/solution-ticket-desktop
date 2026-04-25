import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AutomacaoService } from './automacao.service';

@ApiTags('Automacao')
@ApiBearerAuth()
@Controller('automacao')
@UseGuards(JwtAuthGuard)
export class AutomacaoController {
  constructor(private readonly service: AutomacaoService) {}

  @Post('comando')
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
  ) {
    return this.service.enviarComando(body);
  }

  @Post(':id/executado')
  @ApiOperation({ summary: 'Marca evento como executado (callback do adapter)' })
  executado(@Param('id') id: string) {
    return this.service.marcarExecutado(id);
  }

  @Post(':id/falha')
  @ApiOperation({ summary: 'Marca evento como falha (callback do adapter)' })
  falha(@Param('id') id: string, @Body() body: { motivo: string }) {
    return this.service.marcarFalha(id, body.motivo);
  }

  @Get('historico/:unidadeId')
  @ApiOperation({ summary: 'Histórico de eventos de automação (últimos N)' })
  historico(@Param('unidadeId') unidadeId: string, @Query('limit') limit?: string) {
    return this.service.historico(unidadeId, limit ? parseInt(limit, 10) : 50);
  }
}
