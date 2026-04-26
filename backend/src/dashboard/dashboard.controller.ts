import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis/:unidadeId')
  @Roles(Permissao.DASHBOARD_VISUALIZAR)
  @ApiOperation({ summary: 'KPIs do dashboard' })
  kpis(@Param('unidadeId') unidadeId: string, @CurrentUser('tenantId') tenantId: string) {
    return this.dashboardService.kpis(unidadeId, tenantId);
  }

  @Get('tickets-por-status/:unidadeId')
  @Roles(Permissao.DASHBOARD_VISUALIZAR)
  @ApiOperation({ summary: 'Distribuicao de tickets por status' })
  ticketsPorStatus(
    @Param('unidadeId') unidadeId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.dashboardService.ticketsPorStatus(unidadeId, tenantId);
  }

  @Get('pesagens-por-produto/:unidadeId')
  @Roles(Permissao.DASHBOARD_VISUALIZAR)
  @ApiOperation({ summary: 'Pesagens por produto' })
  pesagensPorProduto(
    @Param('unidadeId') unidadeId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('dias') dias?: string,
  ) {
    return this.dashboardService.pesagensPorProduto(
      unidadeId,
      tenantId,
      dias ? parseInt(dias) : 30,
    );
  }

  @Get('pesagens-por-cliente/:unidadeId')
  @Roles(Permissao.DASHBOARD_VISUALIZAR)
  @ApiOperation({ summary: 'Pesagens por cliente' })
  pesagensPorCliente(
    @Param('unidadeId') unidadeId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('dias') dias?: string,
  ) {
    return this.dashboardService.pesagensPorCliente(
      unidadeId,
      tenantId,
      dias ? parseInt(dias) : 30,
    );
  }

  @Get('status-balancas/:unidadeId')
  @Roles(Permissao.DASHBOARD_VISUALIZAR)
  @ApiOperation({ summary: 'Status das balancas' })
  statusBalancas(@Param('unidadeId') unidadeId: string, @CurrentUser('tenantId') tenantId: string) {
    return this.dashboardService.statusBalancas(unidadeId, tenantId);
  }

  @Get('top-clientes/:unidadeId')
  @Roles(Permissao.DASHBOARD_VISUALIZAR)
  @ApiOperation({ summary: 'Top clientes por volume no mes' })
  topClientes(
    @Param('unidadeId') unidadeId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('mes') mes?: string,
  ) {
    return this.dashboardService.topClientes(unidadeId, tenantId, mes);
  }

  @Get('distribuicao-produto/:unidadeId')
  @Roles(Permissao.DASHBOARD_VISUALIZAR)
  @ApiOperation({ summary: 'Distribuicao de pesagens por produto no mes' })
  distribuicaoProduto(
    @Param('unidadeId') unidadeId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('mes') mes?: string,
  ) {
    return this.dashboardService.distribuicaoProduto(unidadeId, tenantId, mes);
  }

  @Get('evolucao-diaria/:unidadeId')
  @Roles(Permissao.DASHBOARD_VISUALIZAR)
  @ApiOperation({ summary: 'Evolucao diaria de pesagens' })
  evolucaoDiaria(
    @Param('unidadeId') unidadeId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('dias') dias?: string,
  ) {
    return this.dashboardService.evolucaoDiaria(unidadeId, tenantId, dias ? parseInt(dias) : 7);
  }
}
