import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IndicadorService, IndicadorInput } from './indicador.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Indicadores de Balança')
@ApiBearerAuth()
@Controller('indicadores')
@UseGuards(JwtAuthGuard)
export class IndicadorController {
  constructor(private readonly service: IndicadorService) {}

  @Get()
  @ApiOperation({ summary: 'Lista indicadores (presets builtin + customizados)' })
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.service.list(tenantId);
  }

  @Get(':id')
  byId(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findById(id, tenantId);
  }

  @Post()
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Cria indicador customizado' })
  create(@Body() body: IndicadorInput, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(body, tenantId);
  }

  @Put(':id')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Atualiza indicador (incluindo builtin — só campos)' })
  update(
    @Param('id') id: string,
    @Body() body: Partial<IndicadorInput>,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, body, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Soft-delete (rejeita builtin)' })
  delete(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.delete(id, tenantId);
  }

  @Post('seed-builtins')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Seed dos 23 presets builtin (idempotente)' })
  seed(@CurrentUser('tenantId') tenantId: string) {
    return this.service.seedBuiltins(tenantId);
  }
}
