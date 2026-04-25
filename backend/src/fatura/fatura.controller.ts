import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { FaturaService } from './fatura.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  listarTipos(@Query('tenantId') tenantId?: string) {
    return this.faturaService.listarTipos(tenantId);
  }

  @Post('pagamentos/:id/baixar')
  @ApiOperation({ summary: 'Baixar pagamento' })
  baixarPagamento(@Param('id') id: string, @Req() req: AuthRequest) {
    const usuarioId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.faturaService.baixarPagamento(id, usuarioId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar fatura' })
  create(@Body() dto: CreateFaturaDto) {
    return this.faturaService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar faturas (paginado)' })
  findAll(
    @Query('tenantId') tenantId: string,
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
  findOne(@Param('id') id: string) {
    return this.faturaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar fatura' })
  update(@Param('id') id: string, @Body() dto: UpdateFaturaDto) {
    return this.faturaService.update(id, dto);
  }

  @Post(':id/pagamentos')
  @ApiOperation({ summary: 'Registrar pagamento da fatura' })
  registrarPagamento(@Param('id') id: string, @Body() dto: RegistrarPagamentoDto) {
    return this.faturaService.registrarPagamento(id, dto);
  }
}
