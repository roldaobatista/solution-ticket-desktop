import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IndicadorService, IndicadorInput } from './indicador.service';

@ApiTags('Indicadores de Balança')
@ApiBearerAuth()
@Controller('indicadores')
@UseGuards(JwtAuthGuard)
export class IndicadorController {
  constructor(private readonly service: IndicadorService) {}

  @Get()
  @ApiOperation({ summary: 'Lista indicadores (presets builtin + customizados)' })
  list(@Query('tenantId') tenantId: string) {
    return this.service.list(tenantId);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria indicador customizado' })
  create(@Body() body: IndicadorInput) {
    return this.service.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza indicador (incluindo builtin — só campos)' })
  update(@Param('id') id: string, @Body() body: Partial<IndicadorInput>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete (rejeita builtin)' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post('seed-builtins')
  @ApiOperation({ summary: 'Seed dos 23 presets builtin (idempotente)' })
  seed(@Body() body: { tenantId: string }) {
    return this.service.seedBuiltins(body.tenantId);
  }
}
