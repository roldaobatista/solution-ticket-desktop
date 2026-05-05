import { Controller, Get, Param, Post, Query, Res, Body, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ImpressaoService } from './impressao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ImprimirEscposDto, SalvarEscposDto } from './dto/escpos.dto';

// Onda 2.6: JwtAuthGuard adicionado.
@ApiTags('Impressão')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('impressao')
export class ImpressaoController {
  constructor(private readonly service: ImpressaoService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Listar templates de ticket disponíveis' })
  listarTemplates() {
    return this.service.listarTemplates();
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Gerar PDF do ticket para impressão' })
  @ApiQuery({ name: 'template', required: false })
  @ApiQuery({ name: 'layout', required: false, description: 'Alias legado de template' })
  async gerarTicket(
    @Param('ticketId') ticketId: string,
    @Query('template') template: string,
    @Query('layout') layoutLegado: string,
    @Res() res: Response,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const tpl = template || layoutLegado;
    const buffer = await this.service.gerarTicketPdf(ticketId, tenantId, tpl);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ticket-${ticketId}.pdf"`);
    res.send(buffer);
  }

  // Erros de impressão (Gap 9)
  @Get('erros')
  @ApiOperation({ summary: 'Lista erros de impressão' })
  @ApiQuery({ name: 'resolvido', required: false, type: Boolean })
  listarErros(@CurrentUser('tenantId') tenantId: string, @Query('resolvido') resolvido?: string) {
    const flag = resolvido === undefined ? undefined : resolvido === 'true';
    return this.service.listarErros(tenantId, flag);
  }

  @Post('erros/:id/reimprimir')
  @Roles(Permissao.TICKET_REIMPRIMIR)
  @ApiOperation({ summary: 'Reimprime o ticket associado ao erro' })
  reimprimir(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.reimprimirErro(id, tenantId);
  }

  @Post('erros/:id/resolver')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Marca erro como resolvido' })
  marcarResolvido(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.marcarResolvido(id, tenantId);
  }

  // ESC/POS endpoints (Onda 3)
  @Get('ticket/:ticketId/escpos')
  @ApiOperation({ summary: 'Gera buffer ESC/POS do ticket (base64)' })
  async gerarEscpos(
    @Param('ticketId') ticketId: string,
    @Res() res: Response,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const buffer = await this.service.gerarTicketEscposBuffer(ticketId, tenantId);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.bin"`);
    res.send(buffer);
  }

  @Post('ticket/:ticketId/escpos/imprimir')
  @Roles(Permissao.TICKET_REIMPRIMIR)
  @ApiOperation({ summary: 'Imprime ticket ESC/POS diretamente na porta' })
  async imprimirEscpos(
    @Param('ticketId') ticketId: string,
    @Body() body: ImprimirEscposDto,
    @Res() res: Response,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const ok = await this.service.imprimirTicketEscpos(ticketId, tenantId, body.porta);
    res.json({ sucesso: ok });
  }

  @Post('ticket/:ticketId/escpos/salvar')
  @Roles(Permissao.TICKET_REIMPRIMIR)
  @ApiOperation({ summary: 'Salva buffer ESC/POS em arquivo temporário' })
  async salvarEscpos(
    @Param('ticketId') ticketId: string,
    @Body() body: SalvarEscposDto,
    @Res() res: Response,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const filePath = await this.service.salvarTicketEscpos(ticketId, tenantId, body.nome);
    res.json({ sucesso: true, arquivo: filePath });
  }
}
