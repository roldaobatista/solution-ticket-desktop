import { Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { BaseFilterDto } from '../../cadastros/dto/base-filter.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissao } from '../../constants/permissoes';

interface GenericCrudRuntimeService {
  create(dto: unknown, tenantId?: string): unknown;
  findAll(filter: BaseFilterDto, tenantId?: string): unknown;
  findOne(id: string, tenantId?: string): unknown;
  update(id: string, dto: unknown, tenantId?: string): unknown;
  remove(id: string, tenantId?: string): unknown;
}

export abstract class GenericCrudController<TService extends object> {
  protected abstract readonly service: TService;

  private get runtimeService(): GenericCrudRuntimeService {
    return this.service as unknown as GenericCrudRuntimeService;
  }

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar' })
  create(@Body() dto: unknown, @CurrentUser('tenantId') tenantId: string) {
    return this.runtimeService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar' })
  findAll(@Query() filter: BaseFilterDto, @CurrentUser('tenantId') tenantId: string) {
    return this.runtimeService.findAll(filter, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.runtimeService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar' })
  update(@Param('id') id: string, @Body() dto: unknown, @CurrentUser('tenantId') tenantId: string) {
    return this.runtimeService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Remover' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.runtimeService.remove(id, tenantId);
  }
}
