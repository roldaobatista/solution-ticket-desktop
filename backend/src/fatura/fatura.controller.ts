import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaturaService } from './fatura.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  baixarPagamento(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user?.id || req.user?.sub || null;
    return this.faturaService.baixarPagamento(id, usuarioId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar fatura' })
  create(@Body() data: any) {
    return this.faturaService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar faturas' })
  findAll(@Query('tenantId') tenantId: string, @Query('clienteId') clienteId?: string) {
    return this.faturaService.findAll(tenantId, clienteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar fatura por ID' })
  findOne(@Param('id') id: string) {
    return this.faturaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar fatura' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.faturaService.update(id, data);
  }

  @Post(':id/pagamentos')
  @ApiOperation({ summary: 'Registrar pagamento da fatura' })
  registrarPagamento(@Param('id') id: string, @Body() data: any) {
    return this.faturaService.registrarPagamento(id, data);
  }
}
