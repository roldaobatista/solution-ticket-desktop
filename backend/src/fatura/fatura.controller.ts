import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { FaturaService } from './fatura.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { CreateFaturaDto } from './dto/create-fatura.dto';
import { UpdateFaturaDto } from './dto/update-fatura.dto';
import { RegistrarPagamentoDto } from './dto/registrar-pagamento.dto';

interface AuthRequest extends ExpressRequest {
  user?: { id?: string; sub?: string };
}

@ApiTags('Faturas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('faturas')
export class FaturaController {
  constructor(private readonly faturaService: FaturaService) {}

  @Get('tipos')
  @ApiOperation({ summary: 'Listar tipos de fatura' })
  listarTipos(@CurrentUser('tenantId') tenantId: string) {
    return this.faturaService.listarTipos(tenantId);
  }

  @Post('pagamentos/:id/baixar')
  @Roles(Permissao.FATURA_GERENCIAR)
  @ApiOperation({ summary: 'Baixar pagamento' })
  baixarPagamento(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const usuarioId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.faturaService.baixarPagamento(id, tenantId, usuarioId);
  }

  @Post()
  @Roles(Permissao.FATURA_GERENCIAR)
  @ApiOperation({ summary: 'Criar fatura' })
  create(@Body() dto: CreateFaturaDto, @CurrentUser('tenantId') tenantId: string) {
    return this.faturaService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar faturas (paginado)' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('clienteId') clienteId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.faturaService.findAll(tenantId, clienteId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar fatura por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.faturaService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.FATURA_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar fatura' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFaturaDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.faturaService.update(id, tenantId, dto);
  }

  @Post(':id/pagamentos')
  @Roles(Permissao.FATURA_GERENCIAR)
  @ApiOperation({ summary: 'Registrar pagamento da fatura' })
  registrarPagamento(
    @Param('id') id: string,
    @Body() dto: RegistrarPagamentoDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.faturaService.registrarPagamento(id, tenantId, dto);
  }
}
