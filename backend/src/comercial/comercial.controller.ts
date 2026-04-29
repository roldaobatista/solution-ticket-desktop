import { Controller, Get, Post, Patch, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComercialService } from './comercial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import {
  CreateTabelaPrecoProdutoDto,
  UpdateTabelaPrecoProdutoDto,
} from './dto/create-tabela-preco-produto.dto';
import {
  CreateTabelaPrecoClienteDto,
  UpdateTabelaPrecoClienteDto,
} from './dto/create-tabela-preco-cliente.dto';
import { CreateTabelaFreteDto, UpdateTabelaFreteDto } from './dto/create-tabela-frete.dto';
import { CreateTabelaUmidadeDto, UpdateTabelaUmidadeDto } from './dto/create-tabela-umidade.dto';

@ApiTags('Comercial - Tabelas e Snapshot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comercial')
export class ComercialController {
  constructor(private readonly comercialService: ComercialService) {}

  // Preco Produto
  @Post('preco-produto')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar tabela de preco por produto' })
  createPrecoProduto(
    @Body() dto: CreateTabelaPrecoProdutoDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.comercialService.createTabelaPrecoProduto(dto, tenantId);
  }

  @Get('preco-produto')
  @ApiOperation({ summary: 'Listar tabelas de preco por produto' })
  findAllPrecoProduto(
    @CurrentUser('tenantId') tenantId: string,
    @Query('produtoId') produtoId?: string,
  ) {
    return this.comercialService.findAllTabelaPrecoProduto(tenantId, produtoId);
  }

  @Patch('preco-produto/:id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar tabela de preco' })
  updatePrecoProduto(
    @Param('id') id: string,
    @Body() dto: UpdateTabelaPrecoProdutoDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.comercialService.updateTabelaPrecoProduto(id, dto, tenantId);
  }

  // Preco Cliente
  @Post('preco-cliente')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar tabela de preco por cliente' })
  createPrecoCliente(
    @Body() dto: CreateTabelaPrecoClienteDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.comercialService.createTabelaPrecoCliente(dto, tenantId);
  }

  @Get('preco-cliente')
  @ApiOperation({ summary: 'Listar tabelas de preco por cliente' })
  findAllPrecoCliente(
    @CurrentUser('tenantId') tenantId: string,
    @Query('clienteId') clienteId?: string,
  ) {
    return this.comercialService.findAllTabelaPrecoCliente(tenantId, clienteId);
  }

  @Patch('preco-cliente/:id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar tabela de preco cliente' })
  updatePrecoCliente(
    @Param('id') id: string,
    @Body() dto: UpdateTabelaPrecoClienteDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.comercialService.updateTabelaPrecoCliente(id, dto, tenantId);
  }

  // Frete
  @Post('frete')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar tabela de frete' })
  createFrete(@Body() dto: CreateTabelaFreteDto, @CurrentUser('tenantId') tenantId: string) {
    return this.comercialService.createTabelaFrete(dto, tenantId);
  }

  @Get('frete')
  @ApiOperation({ summary: 'Listar tabelas de frete' })
  findAllFrete(@CurrentUser('tenantId') tenantId: string) {
    return this.comercialService.findAllTabelaFrete(tenantId);
  }

  @Patch('frete/:id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar tabela de frete' })
  updateFrete(
    @Param('id') id: string,
    @Body() dto: UpdateTabelaFreteDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.comercialService.updateTabelaFrete(id, dto, tenantId);
  }

  // Umidade
  @Post('umidade')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar tabela de umidade' })
  createUmidade(@Body() dto: CreateTabelaUmidadeDto, @CurrentUser('tenantId') tenantId: string) {
    return this.comercialService.createTabelaUmidade(dto, tenantId);
  }

  @Get('umidade')
  @ApiOperation({ summary: 'Listar tabelas de umidade' })
  findAllUmidade(
    @CurrentUser('tenantId') tenantId: string,
    @Query('produtoId') produtoId?: string,
  ) {
    return this.comercialService.findAllTabelaUmidade(tenantId, produtoId);
  }

  @Patch('umidade/:id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar tabela de umidade' })
  updateUmidade(
    @Param('id') id: string,
    @Body() dto: UpdateTabelaUmidadeDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.comercialService.updateTabelaUmidade(id, dto, tenantId);
  }

  // Saldos por cliente (credito - debito agregando faturas)
  @Get('saldos')
  @ApiOperation({ summary: 'Saldos por cliente' })
  getSaldos(@CurrentUser('tenantId') tenantId: string, @Query('clienteId') clienteId?: string) {
    return this.comercialService.getSaldos(tenantId, clienteId);
  }

  @Get('extrato/:clienteId')
  @ApiOperation({ summary: 'Extrato do cliente (JSON)' })
  getExtrato(
    @Param('clienteId') clienteId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.comercialService.getExtrato(clienteId, tenantId, inicio, fim);
  }

  // Onda 5.4: extrato em PDF (paridade PesoLog).
  @Get('extrato/:clienteId/pdf')
  @ApiOperation({ summary: 'Extrato do cliente em PDF' })
  async getExtratoPdf(
    @Param('clienteId') clienteId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Res() res: Response,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    const buffer = await this.comercialService.gerarExtratoPdf(clienteId, tenantId, inicio, fim);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="extrato-${clienteId}.pdf"`);
    res.send(buffer);
  }

  @Get('precos/historico')
  @ApiOperation({ summary: 'Historico de alteracoes de preco' })
  getHistoricoPreco(
    @CurrentUser('tenantId') tenantId: string,
    @Query('produtoId') produtoId?: string,
    @Query('clienteId') clienteId?: string,
  ) {
    return this.comercialService.getHistoricoPreco(tenantId, produtoId, clienteId);
  }

  // Snapshot
  @Get('snapshot/:ticketId')
  @ApiOperation({ summary: 'Buscar snapshot comercial do ticket' })
  getSnapshot(@Param('ticketId') ticketId: string, @CurrentUser('tenantId') tenantId: string) {
    return this.comercialService.getSnapshot(ticketId, tenantId);
  }
}
