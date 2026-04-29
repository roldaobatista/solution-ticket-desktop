import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SerialTerminalService } from './serial-terminal.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Utilitarios - Serial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('utilitarios/serial')
export class SerialTerminalController {
  constructor(private readonly service: SerialTerminalService) {}

  @Get('portas')
  @ApiOperation({ summary: 'Lista portas seriais disponiveis' })
  portas() {
    return this.service.listarPortas();
  }

  @Post('sessao')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Abre sessao serial' })
  async abrirSessao(
    @Body()
    body: {
      porta: string;
      baudrate?: number;
      databits?: number;
      parity?: string;
      stopbits?: number;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.criarSessao(body, userId, tenantId);
  }

  @Post('sessao/:id/enviar')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Envia dados pela sessao' })
  async enviar(
    @Param('id') id: string,
    @Body() body: { data: string; formato: 'ASCII' | 'HEX' },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.enviar(id, userId, tenantId, body.data, body.formato || 'ASCII');
  }

  @Get('sessao/:id/buffer')
  @ApiOperation({ summary: 'Le e limpa buffer de recepcao' })
  buffer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.lerBuffer(id, userId, tenantId);
  }

  @Delete('sessao/:id')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Encerra sessao serial' })
  encerrar(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.encerrar(id, userId, tenantId);
  }
}
