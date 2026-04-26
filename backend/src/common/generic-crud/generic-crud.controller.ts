import { Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GenericCrudService } from './generic-crud.service';
import { BaseFilterDto } from '../../cadastros/dto/base-filter.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissao } from '../../constants/permissoes';

/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class GenericCrudController<
  TService extends GenericCrudService<any, any, any, any>,
> {
  protected abstract readonly service: TService;

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar' })
  create(@Body() dto: any, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar' })
  findAll(@Query() filter: BaseFilterDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findAll(filter, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar' })
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('tenantId') tenantId: string) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Remover' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}
