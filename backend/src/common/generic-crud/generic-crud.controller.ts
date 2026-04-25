import { Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GenericCrudService } from './generic-crud.service';
import { BaseFilterDto } from '../../cadastros/dto/base-filter.dto';

/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class GenericCrudController<
  TService extends GenericCrudService<any, any, any, any>,
> {
  protected abstract readonly service: TService;

  @Post()
  @ApiOperation({ summary: 'Criar' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar' })
  findAll(@Query() filter: BaseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
