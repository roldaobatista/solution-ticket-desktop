import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { PassagemService } from './passagem.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { RegistrarPassagemDto } from './dto/registrar-passagem.dto';
import { FecharTicketDto } from './dto/fechar-ticket.dto';
import { CancelarTicketDto } from './dto/cancelar-ticket.dto';
import { AdicionarDescontoDto } from './dto/adicionar-desconto.dto';
import { SolicitarManutencaoDto } from './dto/manutencao.dto';
import { InvalidarPassagemDto } from './dto/invalidar-passagem.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Tickets de Pesagem')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly passagemService: PassagemService,
  ) {}

  @Post()
  @Roles(Permissao.TICKET_CRIAR)
  @ApiOperation({ summary: 'Abrir novo ticket' })
  create(@Body() dto: CreateTicketDto, @CurrentUser('tenantId') tenantId: string) {
    return this.ticketService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets com filtros' })
  findAll(@Query() filter: TicketFilterDto, @CurrentUser('tenantId') tenantId: string) {
    return this.ticketService.findAll(filter, tenantId);
  }

  @Get('estatisticas/:unidadeId')
  @ApiOperation({ summary: 'Estatísticas do dia por unidade' })
  getEstatisticas(@Param('unidadeId') unidadeId: string) {
    return this.ticketService.getEstatisticas(unidadeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ticket por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.ticketService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.TICKET_EDITAR)
  @ApiOperation({ summary: 'Atualizar ticket (dados básicos)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.ticketService.update(id, dto, tenantId);
  }

  // Passagens
  @Post(':id/passagens')
  @Roles(Permissao.TICKET_CRIAR)
  @ApiOperation({ summary: 'Registrar passagem no ticket' })
  registrarPassagem(
    @Param('id') id: string,
    @Body() dto: RegistrarPassagemDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.ticketService.registrarPassagem(id, dto, tenantId);
  }

  @Get(':id/passagens')
  @ApiOperation({ summary: 'Listar passagens do ticket' })
  listarPassagens(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.passagemService.findByTicket(id, tenantId);
  }

  @Patch(':ticketId/passagens/:passagemId/invalidar')
  @Roles(Permissao.PASSAGEM_INVALIDAR)
  @ApiOperation({ summary: 'Invalidar passagem' })
  invalidarPassagem(
    @Param('ticketId') ticketId: string,
    @Param('passagemId') passagemId: string,
    @Body() dto: InvalidarPassagemDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.passagemService.invalidar(ticketId, passagemId, dto.motivo, tenantId);
  }

  // Fechamento
  @Post(':id/fechar')
  @Roles(Permissao.TICKET_FECHAR)
  @ApiOperation({ summary: 'Fechar ticket com cálculo oficial' })
  fecharTicket(
    @Param('id') id: string,
    @Body() dto: FecharTicketDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.ticketService.fecharTicket(id, dto, tenantId);
  }

  // Cancelamento
  @Post(':id/cancelar')
  @Roles(Permissao.TICKET_CANCELAR)
  @ApiOperation({ summary: 'Cancelar ticket' })
  cancelarTicket(
    @Param('id') id: string,
    @Body() dto: CancelarTicketDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.ticketService.cancelarTicket(id, dto, tenantId);
  }

  // Manutencao — usuarioId vem do JWT (Onda 2.1, ALTO seguranca)
  @Post(':id/manutencao/solicitar')
  @Roles(Permissao.TICKET_MANUTENCAO)
  @ApiOperation({ summary: 'Solicitar manutencao pos-fechamento' })
  solicitarManutencao(
    @Param('id') id: string,
    @Body() dto: SolicitarManutencaoDto,
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.ticketService.solicitarManutencao(id, dto.motivo, usuarioId, tenantId);
  }

  @Post(':id/manutencao/concluir')
  @Roles(Permissao.TICKET_MANUTENCAO)
  @ApiOperation({ summary: 'Concluir manutencao' })
  concluirManutencao(
    @Param('id') id: string,
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.ticketService.concluirManutencao(id, usuarioId, tenantId);
  }

  // Descontos
  @Post(':id/descontos')
  @Roles(Permissao.TICKET_EDITAR)
  @ApiOperation({ summary: 'Adicionar desconto ao ticket' })
  adicionarDesconto(
    @Param('id') id: string,
    @Body() dto: AdicionarDescontoDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.passagemService.adicionarDesconto(id, dto, tenantId);
  }

  @Get(':id/descontos')
  @ApiOperation({ summary: 'Listar descontos do ticket' })
  listarDescontos(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.passagemService.listarDescontos(id, tenantId);
  }

  // Historico
  @Get(':id/historico')
  @ApiOperation({ summary: 'Historico de auditoria do ticket' })
  getHistorico(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.ticketService.getHistorico(id, tenantId);
  }

  // Reimpressao — usuarioId vem do JWT (Onda 2.1)
  @Post(':id/reimprimir')
  @Roles(Permissao.TICKET_REIMPRIMIR)
  @ApiOperation({ summary: 'Reimprimir ticket' })
  reimprimirTicket(
    @Param('id') id: string,
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.ticketService.reimprimir(id, tenantId, usuarioId);
  }
}
