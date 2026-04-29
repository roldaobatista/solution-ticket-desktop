import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { gerarXlsx, XLSX_MIME, ColunaXlsx } from './xlsx.helper';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

const COLUNAS_MOVIMENTO: ColunaXlsx[] = [
  { header: 'Ticket', key: 'numero' },
  { header: 'Data', key: 'fechadoEm', format: 'datetime', width: 22 },
  { header: 'Cliente', key: 'clienteNome', width: 30 },
  { header: 'Produto', key: 'produtoDescricao', width: 26 },
  { header: 'Veículo', key: 'veiculoPlaca' },
  { header: 'Bruto (kg)', key: 'pesoBrutoApurado', format: 'weight' },
  { header: 'Tara (kg)', key: 'pesoTaraApurada', format: 'weight' },
  { header: 'Líquido (kg)', key: 'pesoLiquidoFinal', format: 'weight' },
  { header: 'Status', key: 'statusOperacional' },
];

@ApiTags('Relatorios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get('movimento')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Relatorio de movimento de pesagem' })
  movimento(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId?: string,
  ) {
    return this.relatoriosService.movimento(dataInicio, dataFim, tenantId, unidadeId);
  }

  @Get('movimento/pdf')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Relatorio de movimento em PDF' })
  async movimentoPdf(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId: string | undefined,
    @Query('variante') variante: string | undefined,
    @Res() res: Response,
  ) {
    const v = variante === '002' ? '002' : '001';
    const buffer = await this.relatoriosService.movimentoPdf(
      dataInicio,
      dataFim,
      tenantId,
      unidadeId,
      v,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="movimento-${v}-${dataInicio}-${dataFim}.pdf"`,
    );
    res.send(buffer);
  }

  @Get('alteradas')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Relatorio de pesagens alteradas' })
  pesagensAlteradas(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId?: string,
  ) {
    return this.relatoriosService.pesagensAlteradas(dataInicio, dataFim, tenantId, unidadeId);
  }

  @Get('alteradas/pdf')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Relatorio de pesagens alteradas em PDF' })
  async alteradasPdf(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId: string | undefined,
    @Res() res: Response,
  ) {
    const buffer = await this.relatoriosService.alteradasPdf(
      dataInicio,
      dataFim,
      tenantId,
      unidadeId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="alteradas-${dataInicio}-${dataFim}.pdf"`,
    );
    res.send(buffer);
  }

  @Get('canceladas')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Relatorio de pesagens canceladas' })
  pesagensCanceladas(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId?: string,
  ) {
    return this.relatoriosService.pesagensCanceladas(dataInicio, dataFim, tenantId, unidadeId);
  }

  @Get('canceladas/pdf')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Relatorio de pesagens canceladas em PDF' })
  async canceladasPdf(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId: string | undefined,
    @Res() res: Response,
  ) {
    const buffer = await this.relatoriosService.canceladasPdf(
      dataInicio,
      dataFim,
      tenantId,
      unidadeId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="canceladas-${dataInicio}-${dataFim}.pdf"`,
    );
    res.send(buffer);
  }

  @Get('movimento/xlsx')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Relatório de movimento em Excel (.xlsx)' })
  async movimentoXlsx(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId: string | undefined,
    @Res() res: Response,
  ) {
    const result = (await this.relatoriosService.movimento(
      dataInicio,
      dataFim,
      tenantId,
      unidadeId,
    )) as {
      tickets?: Record<string, unknown>[];
    } & Record<string, unknown>;
    const dados = (result.tickets ?? []) as Record<string, unknown>[];
    const buffer = await gerarXlsx('Movimento', COLUNAS_MOVIMENTO, dados);
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="movimento-${dataInicio}-${dataFim}.xlsx"`,
    );
    res.send(buffer);
  }

  @Get('alteradas/xlsx')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Pesagens alteradas em Excel' })
  async alteradasXlsx(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId: string | undefined,
    @Res() res: Response,
  ) {
    const result = (await this.relatoriosService.pesagensAlteradas(
      dataInicio,
      dataFim,
      tenantId,
      unidadeId,
    )) as { tickets?: Record<string, unknown>[] } & Record<string, unknown>;
    const dados = (result.tickets ?? []) as Record<string, unknown>[];
    const buffer = await gerarXlsx('Pesagens alteradas', COLUNAS_MOVIMENTO, dados);
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="alteradas-${dataInicio}-${dataFim}.xlsx"`,
    );
    res.send(buffer);
  }

  @Get('canceladas/xlsx')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Pesagens canceladas em Excel' })
  async canceladasXlsx(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId: string | undefined,
    @Res() res: Response,
  ) {
    const result = (await this.relatoriosService.pesagensCanceladas(
      dataInicio,
      dataFim,
      tenantId,
      unidadeId,
    )) as { tickets?: Record<string, unknown>[] } & Record<string, unknown>;
    const dados = (result.tickets ?? []) as Record<string, unknown>[];
    const buffer = await gerarXlsx('Pesagens canceladas', COLUNAS_MOVIMENTO, dados);
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="canceladas-${dataInicio}-${dataFim}.xlsx"`,
    );
    res.send(buffer);
  }

  @Get('passagens-por-balanca')
  @Roles(Permissao.RELATORIO_VISUALIZAR)
  @ApiOperation({ summary: 'Analise de passagens por balanca' })
  passagensPorBalanca(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unidadeId') unidadeId?: string,
  ) {
    return this.relatoriosService.passagensPorBalanca(dataInicio, dataFim, tenantId, unidadeId);
  }
}
