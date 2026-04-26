import { Controller, Get, Param, Post, Query, Res, Body, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ImpressaoService } from './impressao.service';
import { errorMessage } from '../common/error-message.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

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
  ) {
    const tpl = template || layoutLegado;
    try {
      const buffer = await this.service.gerarTicketPdf(ticketId, tpl);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="ticket-${ticketId}.pdf"`);
      res.send(buffer);
    } catch (err: unknown) {
      res.status(500).json({ erro: errorMessage(err, 'Falha ao gerar PDF') });
    }
  }

  // Erros de impressão (Gap 9)
  @Get('erros')
  @ApiOperation({ summary: 'Lista erros de impressão' })
  @ApiQuery({ name: 'resolvido', required: false, type: Boolean })
  listarErros(@Query('resolvido') resolvido?: string) {
    const flag = resolvido === undefined ? undefined : resolvido === 'true';
    return this.service.listarErros(flag);
  }

  @Post('erros/:id/reimprimir')
  @Roles(Permissao.TICKET_REIMPRIMIR)
  @ApiOperation({ summary: 'Reimprime o ticket associado ao erro' })
  reimprimir(@Param('id') id: string) {
    return this.service.reimprimirErro(id);
  }

  @Post('erros/:id/resolver')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Marca erro como resolvido' })
  marcarResolvido(@Param('id') id: string) {
    return this.service.marcarResolvido(id);
  }

  // ESC/POS endpoints (Onda 3)
  @Get('ticket/:ticketId/escpos')
  @ApiOperation({ summary: 'Gera buffer ESC/POS do ticket (base64)' })
  async gerarEscpos(@Param('ticketId') ticketId: string, @Res() res: Response) {
    try {
      const buffer = await this.service.gerarTicketEscposBuffer(ticketId);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.bin"`);
      res.send(buffer);
    } catch (err: unknown) {
      res.status(500).json({ erro: errorMessage(err, 'Falha ao gerar ESC/POS') });
    }
  }

  @Post('ticket/:ticketId/escpos/imprimir')
  @Roles(Permissao.TICKET_REIMPRIMIR)
  @ApiOperation({ summary: 'Imprime ticket ESC/POS diretamente na porta' })
  async imprimirEscpos(
    @Param('ticketId') ticketId: string,
    @Body() body: { porta: string },
    @Res() res: Response,
  ) {
    try {
      const ok = await this.service.imprimirTicketEscpos(ticketId, body.porta);
      res.json({ sucesso: ok });
    } catch (err: unknown) {
      res.status(500).json({ erro: errorMessage(err, 'Falha ao imprimir ESC/POS') });
    }
  }

  @Post('ticket/:ticketId/escpos/salvar')
  @Roles(Permissao.TICKET_REIMPRIMIR)
  @ApiOperation({ summary: 'Salva buffer ESC/POS em arquivo temporário' })
  async salvarEscpos(
    @Param('ticketId') ticketId: string,
    @Body() body: { nome?: string },
    @Res() res: Response,
  ) {
    try {
      const filePath = await this.service.salvarTicketEscpos(ticketId, body.nome);
      res.json({ sucesso: true, arquivo: filePath });
    } catch (err: unknown) {
      res.status(500).json({ erro: errorMessage(err, 'Falha ao salvar ESC/POS') });
    }
  }
}
