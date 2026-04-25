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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  @ApiOperation({ summary: 'Abrir novo ticket' })
  create(@Body() dto: CreateTicketDto) {
    return this.ticketService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets com filtros' })
  findAll(@Query() filter: TicketFilterDto) {
    return this.ticketService.findAll(filter);
  }

  @Get('estatisticas/:unidadeId')
  @ApiOperation({ summary: 'Estatísticas do dia por unidade' })
  getEstatisticas(@Param('unidadeId') unidadeId: string) {
    return this.ticketService.getEstatisticas(unidadeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ticket por ID' })
  findOne(@Param('id') id: string) {
    return this.ticketService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar ticket (dados básicos)' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketService.update(id, dto);
  }

  // Passagens
  @Post(':id/passagens')
  @ApiOperation({ summary: 'Registrar passagem no ticket' })
  registrarPassagem(@Param('id') id: string, @Body() dto: RegistrarPassagemDto) {
    return this.ticketService.registrarPassagem(id, dto);
  }

  @Get(':id/passagens')
  @ApiOperation({ summary: 'Listar passagens do ticket' })
  listarPassagens(@Param('id') id: string) {
    return this.passagemService.findByTicket(id);
  }

  @Patch(':ticketId/passagens/:passagemId/invalidar')
  @ApiOperation({ summary: 'Invalidar passagem' })
  invalidarPassagem(
    @Param('ticketId') ticketId: string,
    @Param('passagemId') passagemId: string,
    @Body('motivo') motivo: string,
  ) {
    return this.passagemService.invalidar(ticketId, passagemId, motivo);
  }

  // Fechamento
  @Post(':id/fechar')
  @ApiOperation({ summary: 'Fechar ticket com cálculo oficial' })
  fecharTicket(@Param('id') id: string, @Body() dto: FecharTicketDto) {
    return this.ticketService.fecharTicket(id, dto);
  }

  // Cancelamento
  @Post(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar ticket' })
  cancelarTicket(@Param('id') id: string, @Body() dto: CancelarTicketDto) {
    return this.ticketService.cancelarTicket(id, dto);
  }

  // Manutencao
  @Post(':id/manutencao/solicitar')
  @ApiOperation({ summary: 'Solicitar manutencao pos-fechamento' })
  solicitarManutencao(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @Body('usuarioId') usuarioId: string,
  ) {
    return this.ticketService.solicitarManutencao(id, motivo, usuarioId);
  }

  @Post(':id/manutencao/concluir')
  @ApiOperation({ summary: 'Concluir manutencao' })
  concluirManutencao(@Param('id') id: string, @Body('usuarioId') usuarioId: string) {
    return this.ticketService.concluirManutencao(id, usuarioId);
  }

  // Descontos
  @Post(':id/descontos')
  @ApiOperation({ summary: 'Adicionar desconto ao ticket' })
  adicionarDesconto(@Param('id') id: string, @Body() dto: AdicionarDescontoDto) {
    return this.passagemService.adicionarDesconto(id, dto);
  }

  @Get(':id/descontos')
  @ApiOperation({ summary: 'Listar descontos do ticket' })
  listarDescontos(@Param('id') id: string) {
    return this.passagemService.listarDescontos(id);
  }

  // Historico
  @Get(':id/historico')
  @ApiOperation({ summary: 'Historico de auditoria do ticket' })
  getHistorico(@Param('id') id: string) {
    return this.ticketService.getHistorico(id);
  }

  // Reimpressao
  @Post(':id/reimprimir')
  @ApiOperation({ summary: 'Reimprimir ticket' })
  reimprimirTicket(@Param('id') id: string, @Body('usuarioId') usuarioId: string) {
    return this.ticketService.reimprimir(id, usuarioId);
  }
}
