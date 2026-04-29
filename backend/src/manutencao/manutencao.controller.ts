import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ManutencaoService } from './manutencao.service';
import { CreateSolicitacaoDto } from './dto/create-solicitacao.dto';
import { AprovarSolicitacaoDto } from './dto/aprovar-solicitacao.dto';
import { SolicitacaoFilterDto } from './dto/solicitacao-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Manutencao e Aprovacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('manutencao')
export class ManutencaoController {
  constructor(private readonly manutencaoService: ManutencaoService) {}

  @Post('solicitacoes')
  @Roles(Permissao.TICKET_MANUTENCAO)
  @ApiOperation({ summary: 'Criar solicitacao de aprovacao' })
  criarSolicitacao(
    @Body() dto: CreateSolicitacaoDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.manutencaoService.criarSolicitacao(dto, tenantId, usuarioId);
  }

  @Get('solicitacoes')
  @Roles(Permissao.TICKET_MANUTENCAO)
  @ApiOperation({ summary: 'Listar solicitacoes' })
  findAll(@Query() filter: SolicitacaoFilterDto, @CurrentUser('tenantId') tenantId: string) {
    return this.manutencaoService.findAll(filter, tenantId);
  }

  @Get('solicitacoes/:id')
  @Roles(Permissao.TICKET_MANUTENCAO)
  @ApiOperation({ summary: 'Buscar solicitacao por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.manutencaoService.findOne(id, tenantId);
  }

  @Post('solicitacoes/:id/aprovar')
  @Roles(Permissao.TICKET_MANUTENCAO)
  @ApiOperation({ summary: 'Aprovar solicitacao' })
  aprovar(
    @Param('id') id: string,
    @Body() dto: AprovarSolicitacaoDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.manutencaoService.aprovar(id, dto, tenantId, usuarioId);
  }

  @Post('solicitacoes/:id/recusar')
  @Roles(Permissao.TICKET_MANUTENCAO)
  @ApiOperation({ summary: 'Recusar solicitacao' })
  recusar(
    @Param('id') id: string,
    @Body() dto: AprovarSolicitacaoDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.manutencaoService.recusar(id, dto, tenantId, usuarioId);
  }
}
