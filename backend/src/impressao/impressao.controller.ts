import { Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ImpressaoService } from './impressao.service';

@ApiTags('Impressão')
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
    } catch (err: any) {
      res.status(500).json({ erro: err?.message || 'Falha ao gerar PDF' });
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
  @ApiOperation({ summary: 'Reimprime o ticket associado ao erro' })
  reimprimir(@Param('id') id: string) {
    return this.service.reimprimirErro(id);
  }

  @Post('erros/:id/resolver')
  @ApiOperation({ summary: 'Marca erro como resolvido' })
  marcarResolvido(@Param('id') id: string) {
    return this.service.marcarResolvido(id);
  }
}
