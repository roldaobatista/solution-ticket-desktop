import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis/:unidadeId')
  @ApiOperation({ summary: 'KPIs do dashboard' })
  kpis(@Param('unidadeId') unidadeId: string) {
    return this.dashboardService.kpis(unidadeId);
  }

  @Get('tickets-por-status/:unidadeId')
  @ApiOperation({ summary: 'Distribuicao de tickets por status' })
  ticketsPorStatus(@Param('unidadeId') unidadeId: string) {
    return this.dashboardService.ticketsPorStatus(unidadeId);
  }

  @Get('pesagens-por-produto/:unidadeId')
  @ApiOperation({ summary: 'Pesagens por produto' })
  pesagensPorProduto(@Param('unidadeId') unidadeId: string, @Query('dias') dias?: string) {
    return this.dashboardService.pesagensPorProduto(unidadeId, dias ? parseInt(dias) : 30);
  }

  @Get('pesagens-por-cliente/:unidadeId')
  @ApiOperation({ summary: 'Pesagens por cliente' })
  pesagensPorCliente(@Param('unidadeId') unidadeId: string, @Query('dias') dias?: string) {
    return this.dashboardService.pesagensPorCliente(unidadeId, dias ? parseInt(dias) : 30);
  }

  @Get('status-balancas/:unidadeId')
  @ApiOperation({ summary: 'Status das balancas' })
  statusBalancas(@Param('unidadeId') unidadeId: string) {
    return this.dashboardService.statusBalancas(unidadeId);
  }

  @Get('top-clientes/:unidadeId')
  @ApiOperation({ summary: 'Top clientes por volume no mes' })
  topClientes(@Param('unidadeId') unidadeId: string, @Query('mes') mes?: string) {
    return this.dashboardService.topClientes(unidadeId, mes);
  }

  @Get('distribuicao-produto/:unidadeId')
  @ApiOperation({ summary: 'Distribuicao de pesagens por produto no mes' })
  distribuicaoProduto(@Param('unidadeId') unidadeId: string, @Query('mes') mes?: string) {
    return this.dashboardService.distribuicaoProduto(unidadeId, mes);
  }

  @Get('evolucao-diaria/:unidadeId')
  @ApiOperation({ summary: 'Evolucao diaria de pesagens' })
  evolucaoDiaria(@Param('unidadeId') unidadeId: string, @Query('dias') dias?: string) {
    return this.dashboardService.evolucaoDiaria(unidadeId, dias ? parseInt(dias) : 7);
  }
}
