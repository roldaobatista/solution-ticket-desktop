import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SerialTerminalService } from './serial-terminal.service';

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
  ) {
    return this.service.criarSessao(body);
  }

  @Post('sessao/:id/enviar')
  @ApiOperation({ summary: 'Envia dados pela sessao' })
  async enviar(@Param('id') id: string, @Body() body: { data: string; formato: 'ASCII' | 'HEX' }) {
    return this.service.enviar(id, body.data, body.formato || 'ASCII');
  }

  @Get('sessao/:id/buffer')
  @ApiOperation({ summary: 'Le e limpa buffer de recepcao' })
  buffer(@Param('id') id: string) {
    return this.service.lerBuffer(id);
  }

  @Delete('sessao/:id')
  @ApiOperation({ summary: 'Encerra sessao serial' })
  encerrar(@Param('id') id: string) {
    return this.service.encerrar(id);
  }
}
