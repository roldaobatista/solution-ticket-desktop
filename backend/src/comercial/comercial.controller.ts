import { Controller, Get, Post, Patch, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComercialService } from './comercial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  @ApiOperation({ summary: 'Criar tabela de preco por produto' })
  createPrecoProduto(@Body() dto: CreateTabelaPrecoProdutoDto) {
    return this.comercialService.createTabelaPrecoProduto(dto);
  }

  @Get('preco-produto')
  @ApiOperation({ summary: 'Listar tabelas de preco por produto' })
  findAllPrecoProduto(@Query('tenantId') tenantId: string, @Query('produtoId') produtoId?: string) {
    return this.comercialService.findAllTabelaPrecoProduto(tenantId, produtoId);
  }

  @Patch('preco-produto/:id')
  @ApiOperation({ summary: 'Atualizar tabela de preco' })
  updatePrecoProduto(@Param('id') id: string, @Body() dto: UpdateTabelaPrecoProdutoDto) {
    return this.comercialService.updateTabelaPrecoProduto(id, dto);
  }

  // Preco Cliente
  @Post('preco-cliente')
  @ApiOperation({ summary: 'Criar tabela de preco por cliente' })
  createPrecoCliente(@Body() dto: CreateTabelaPrecoClienteDto) {
    return this.comercialService.createTabelaPrecoCliente(dto);
  }

  @Get('preco-cliente')
  @ApiOperation({ summary: 'Listar tabelas de preco por cliente' })
  findAllPrecoCliente(@Query('tenantId') tenantId: string, @Query('clienteId') clienteId?: string) {
    return this.comercialService.findAllTabelaPrecoCliente(tenantId, clienteId);
  }

  @Patch('preco-cliente/:id')
  @ApiOperation({ summary: 'Atualizar tabela de preco cliente' })
  updatePrecoCliente(@Param('id') id: string, @Body() dto: UpdateTabelaPrecoClienteDto) {
    return this.comercialService.updateTabelaPrecoCliente(id, dto);
  }

  // Frete
  @Post('frete')
  @ApiOperation({ summary: 'Criar tabela de frete' })
  createFrete(@Body() dto: CreateTabelaFreteDto) {
    return this.comercialService.createTabelaFrete(dto);
  }

  @Get('frete')
  @ApiOperation({ summary: 'Listar tabelas de frete' })
  findAllFrete(@Query('tenantId') tenantId: string) {
    return this.comercialService.findAllTabelaFrete(tenantId);
  }

  @Patch('frete/:id')
  @ApiOperation({ summary: 'Atualizar tabela de frete' })
  updateFrete(@Param('id') id: string, @Body() dto: UpdateTabelaFreteDto) {
    return this.comercialService.updateTabelaFrete(id, dto);
  }

  // Umidade
  @Post('umidade')
  @ApiOperation({ summary: 'Criar tabela de umidade' })
  createUmidade(@Body() dto: CreateTabelaUmidadeDto) {
    return this.comercialService.createTabelaUmidade(dto);
  }

  @Get('umidade')
  @ApiOperation({ summary: 'Listar tabelas de umidade' })
  findAllUmidade(@Query('tenantId') tenantId: string, @Query('produtoId') produtoId?: string) {
    return this.comercialService.findAllTabelaUmidade(tenantId, produtoId);
  }

  @Patch('umidade/:id')
  @ApiOperation({ summary: 'Atualizar tabela de umidade' })
  updateUmidade(@Param('id') id: string, @Body() dto: UpdateTabelaUmidadeDto) {
    return this.comercialService.updateTabelaUmidade(id, dto);
  }

  // Saldos por cliente (credito - debito agregando faturas)
  @Get('saldos')
  @ApiOperation({ summary: 'Saldos por cliente' })
  getSaldos(@Query('clienteId') clienteId?: string, @Query('tenantId') tenantId?: string) {
    return this.comercialService.getSaldos(tenantId, clienteId);
  }

  @Get('extrato/:clienteId')
  @ApiOperation({ summary: 'Extrato do cliente (JSON)' })
  getExtrato(
    @Param('clienteId') clienteId: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.comercialService.getExtrato(clienteId, inicio, fim);
  }

  // Onda 5.4: extrato em PDF (paridade PesoLog).
  @Get('extrato/:clienteId/pdf')
  @ApiOperation({ summary: 'Extrato do cliente em PDF' })
  async getExtratoPdf(
    @Param('clienteId') clienteId: string,
    @Res() res: Response,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    const buffer = await this.comercialService.gerarExtratoPdf(clienteId, inicio, fim);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="extrato-${clienteId}.pdf"`);
    res.send(buffer);
  }

  @Get('precos/historico')
  @ApiOperation({ summary: 'Historico de alteracoes de preco' })
  getHistoricoPreco(
    @Query('produtoId') produtoId?: string,
    @Query('clienteId') clienteId?: string,
  ) {
    return this.comercialService.getHistoricoPreco(produtoId, clienteId);
  }

  // Snapshot
  @Get('snapshot/:ticketId')
  @ApiOperation({ summary: 'Buscar snapshot comercial do ticket' })
  getSnapshot(@Param('ticketId') ticketId: string) {
    return this.comercialService.getSnapshot(ticketId);
  }
}
