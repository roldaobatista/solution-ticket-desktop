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
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { BalancaService } from './balanca.service';
import { BalancaConnectionService } from './balanca-connection.service';
import { BalancaRealtimeService } from './balanca-realtime.service';
import { CalibracaoService } from './calibracao.service';
import { CreateBalancaDto } from './dto/create-balanca.dto';
import { UpdateBalancaDto } from './dto/update-balanca.dto';
import { BalancaFilterDto } from './dto/balanca-filter.dto';
import { RegistrarCalibracaoDto } from './dto/registrar-calibracao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';

@ApiTags('Balanças')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('balancas')
export class BalancaController {
  constructor(
    private readonly balancaService: BalancaService,
    private readonly connService: BalancaConnectionService,
    private readonly realtimeService: BalancaRealtimeService,
    private readonly calibracaoService: CalibracaoService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Criar balanca' })
  create(@Body() dto: CreateBalancaDto, @CurrentUser('tenantId') tenantId: string) {
    return this.balancaService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar balancas' })
  findAll(@Query() filter: BalancaFilterDto, @CurrentUser('tenantId') tenantId: string) {
    return this.balancaService.findAll(filter, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar balanca por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.balancaService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar balanca' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBalancaDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.balancaService.update(id, dto, tenantId);
  }

  @Patch(':id/status')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar status online/offline' })
  updateStatus(
    @Param('id') id: string,
    @Body('statusOnline') statusOnline: boolean,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.balancaService.updateStatus(id, statusOnline, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Remover balanca' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.balancaService.remove(id, tenantId);
  }

  // ============ HARDWARE ============

  @Get(':id/peso')
  @ApiOperation({ summary: 'Retorna a última leitura de peso' })
  async peso(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    if (!this.connService.isConectada(id)) {
      await this.connService.conectar(id, tenantId).catch(() => undefined);
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
  @Public()
  @ApiOperation({ summary: 'Stream SSE de peso em tempo real' })
  async stream(
    @Param('id') id: string,
    @Query('access_token') token?: string,
  ): Promise<Observable<MessageEvent>> {
    if (!token) throw new UnauthorizedException('Token SSE obrigatorio');
    const { tenantId } = await this.authService.validateSseToken(token);
    return this.realtimeService.stream(id, tenantId) as unknown as Observable<MessageEvent>;
  }

  @Post(':id/capturar')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Captura peso estável (aguarda até 3s)' })
  async capturar(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    const leitura = await this.connService.capturar(id, tenantId, 3000);
    if (!leitura) {
      throw new HttpException('Sem leitura disponível', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { leitura, estavel: leitura.estavel };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Status da conexão com a balança' })
  status(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.balancaService.findOne(id, tenantId).then(() => this.connService.getStatus(id));
  }

  @Post(':id/testar')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Tenta abrir a conexão por 2s' })
  testar(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.connService.testar(id, tenantId, 2000);
  }

  @Post(':id/conectar')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Inicia conexão contínua (daemon)' })
  async conectar(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    const status = await this.connService.conectar(id, tenantId);
    return status;
  }

  @Post(':id/desconectar')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Encerra a conexão contínua' })
  async desconectar(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    await this.balancaService.findOne(id, tenantId);
    await this.connService.desconectar(id);
    return { ok: true };
  }

  // ==========================================================
  // Calibracao (Onda 5.2) — historico por balanca
  // ==========================================================

  @Post(':id/calibracoes')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Registra calibracao (ZERO/SPAN/MULTIPONTO) com peso conhecido' })
  registrarCalibracao(
    @Param('id') id: string,
    @Body() dto: RegistrarCalibracaoDto,
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.calibracaoService.registrar(
      id,
      {
        tipo: dto.tipo,
        pesoReferencia: dto.pesoReferencia,
        pesoLido: dto.pesoLido,
        observacao: dto.observacao,
        usuarioId,
      },
      tenantId,
    );
  }

  @Get(':id/calibracoes')
  @ApiOperation({ summary: 'Historico de calibracoes da balanca' })
  listarCalibracoes(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('limite') limite?: string,
  ) {
    return this.calibracaoService.listar(id, tenantId, limite ? parseInt(limite, 10) : 50);
  }

  @Get(':id/calibracoes/status')
  @ApiOperation({ summary: 'Status de vencimento da ultima calibracao' })
  statusCalibracao(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('diasMaximo') diasMaximo?: string,
  ) {
    return this.calibracaoService.statusVencimento(
      id,
      tenantId,
      diasMaximo ? parseInt(diasMaximo, 10) : 180,
    );
  }
}
