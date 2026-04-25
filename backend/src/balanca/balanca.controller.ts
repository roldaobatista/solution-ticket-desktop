import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Sse,
  MessageEvent,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { BalancaService } from './balanca.service';
import { BalancaConnectionService } from './balanca-connection.service';
import { BalancaRealtimeService } from './balanca-realtime.service';
import { CreateBalancaDto } from './dto/create-balanca.dto';
import { UpdateBalancaDto } from './dto/update-balanca.dto';
import { BalancaFilterDto } from './dto/balanca-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Balanças')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('balancas')
export class BalancaController {
  constructor(
    private readonly balancaService: BalancaService,
    private readonly connService: BalancaConnectionService,
    private readonly realtimeService: BalancaRealtimeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar balanca' })
  create(@Body() dto: CreateBalancaDto) {
    return this.balancaService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar balancas' })
  findAll(@Query() filter: BalancaFilterDto) {
    return this.balancaService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar balanca por ID' })
  findOne(@Param('id') id: string) {
    return this.balancaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar balanca' })
  update(@Param('id') id: string, @Body() dto: UpdateBalancaDto) {
    return this.balancaService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status online/offline' })
  updateStatus(@Param('id') id: string, @Body('statusOnline') statusOnline: boolean) {
    return this.balancaService.updateStatus(id, statusOnline);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover balanca' })
  remove(@Param('id') id: string) {
    return this.balancaService.remove(id);
  }

  // ============ HARDWARE ============

  @Get(':id/peso')
  @ApiOperation({ summary: 'Retorna a última leitura de peso' })
  async peso(@Param('id') id: string) {
    if (!this.connService.isConectada(id)) {
      await this.connService.conectar(id).catch(() => undefined);
    }
    const leitura = this.connService.getUltimaLeitura(id);
    return { leitura, status: this.connService.getStatus(id) };
  }

  /**
   * Stream SSE de peso em tempo real.
   * @security O token JWT é propagado via cookie HttpOnly no header Authorization.
   * Evite passar tokens em query strings — URLs podem ser logadas por proxies/navegadores.
   */
  @Sse(':id/stream')
  @ApiOperation({ summary: 'Stream SSE de peso em tempo real' })
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.realtimeService.stream(id) as unknown as Observable<MessageEvent>;
  }

  @Post(':id/capturar')
  @ApiOperation({ summary: 'Captura peso estável (aguarda até 3s)' })
  async capturar(@Param('id') id: string) {
    const leitura = await this.connService.capturar(id, 3000);
    if (!leitura) {
      throw new HttpException('Sem leitura disponível', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { leitura, estavel: leitura.estavel };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Status da conexão com a balança' })
  status(@Param('id') id: string) {
    return this.connService.getStatus(id);
  }

  @Post(':id/testar')
  @ApiOperation({ summary: 'Tenta abrir a conexão por 2s' })
  testar(@Param('id') id: string) {
    return this.connService.testar(id, 2000);
  }

  @Post(':id/conectar')
  @ApiOperation({ summary: 'Inicia conexão contínua (daemon)' })
  async conectar(@Param('id') id: string) {
    const status = await this.connService.conectar(id);
    return status;
  }

  @Post(':id/desconectar')
  @ApiOperation({ summary: 'Encerra a conexão contínua' })
  async desconectar(@Param('id') id: string) {
    await this.connService.desconectar(id);
    return { ok: true };
  }
}
