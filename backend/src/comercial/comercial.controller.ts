import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComercialService } from './comercial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Comercial - Tabelas e Snapshot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comercial')
export class ComercialController {
  constructor(private readonly comercialService: ComercialService) {}

  // Preco Produto
  @Post('preco-produto')
  @ApiOperation({ summary: 'Criar tabela de preco por produto' })
  createPrecoProduto(@Body() data: any) {
    return this.comercialService.createTabelaPrecoProduto(data);
  }

  @Get('preco-produto')
  @ApiOperation({ summary: 'Listar tabelas de preco por produto' })
  findAllPrecoProduto(@Query('tenantId') tenantId: string, @Query('produtoId') produtoId?: string) {
    return this.comercialService.findAllTabelaPrecoProduto(tenantId, produtoId);
  }

  @Patch('preco-produto/:id')
  @ApiOperation({ summary: 'Atualizar tabela de preco' })
  updatePrecoProduto(@Param('id') id: string, @Body() data: any) {
    return this.comercialService.updateTabelaPrecoProduto(id, data);
  }

  // Preco Cliente
  @Post('preco-cliente')
  @ApiOperation({ summary: 'Criar tabela de preco por cliente' })
  createPrecoCliente(@Body() data: any) {
    return this.comercialService.createTabelaPrecoCliente(data);
  }

  @Get('preco-cliente')
  @ApiOperation({ summary: 'Listar tabelas de preco por cliente' })
  findAllPrecoCliente(@Query('tenantId') tenantId: string, @Query('clienteId') clienteId?: string) {
    return this.comercialService.findAllTabelaPrecoCliente(tenantId, clienteId);
  }

  @Patch('preco-cliente/:id')
  @ApiOperation({ summary: 'Atualizar tabela de preco cliente' })
  updatePrecoCliente(@Param('id') id: string, @Body() data: any) {
    return this.comercialService.updateTabelaPrecoCliente(id, data);
  }

  // Frete
  @Post('frete')
  @ApiOperation({ summary: 'Criar tabela de frete' })
  createFrete(@Body() data: any) {
    return this.comercialService.createTabelaFrete(data);
  }

  @Get('frete')
  @ApiOperation({ summary: 'Listar tabelas de frete' })
  findAllFrete(@Query('tenantId') tenantId: string) {
    return this.comercialService.findAllTabelaFrete(tenantId);
  }

  @Patch('frete/:id')
  @ApiOperation({ summary: 'Atualizar tabela de frete' })
  updateFrete(@Param('id') id: string, @Body() data: any) {
    return this.comercialService.updateTabelaFrete(id, data);
  }

  // Umidade
  @Post('umidade')
  @ApiOperation({ summary: 'Criar tabela de umidade' })
  createUmidade(@Body() data: any) {
    return this.comercialService.createTabelaUmidade(data);
  }

  @Get('umidade')
  @ApiOperation({ summary: 'Listar tabelas de umidade' })
  findAllUmidade(@Query('tenantId') tenantId: string, @Query('produtoId') produtoId?: string) {
    return this.comercialService.findAllTabelaUmidade(tenantId, produtoId);
  }

  @Patch('umidade/:id')
  @ApiOperation({ summary: 'Atualizar tabela de umidade' })
  updateUmidade(@Param('id') id: string, @Body() data: any) {
    return this.comercialService.updateTabelaUmidade(id, data);
  }

  // Saldos por cliente (credito - debito agregando faturas)
  @Get('saldos')
  @ApiOperation({ summary: 'Saldos por cliente' })
  getSaldos(@Query('clienteId') clienteId?: string, @Query('tenantId') tenantId?: string) {
    return this.comercialService.getSaldos(tenantId, clienteId);
  }

  @Get('extrato/:clienteId')
  @ApiOperation({ summary: 'Extrato do cliente' })
  getExtrato(
    @Param('clienteId') clienteId: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.comercialService.getExtrato(clienteId, inicio, fim);
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
