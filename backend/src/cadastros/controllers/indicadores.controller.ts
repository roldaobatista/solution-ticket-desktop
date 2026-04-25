import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IndicadoresService } from '../services/indicadores.service';
import { CreateIndicadorDto } from '../dto/create-indicador.dto';
import { UpdateIndicadorDto } from '../dto/update-indicador.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Indicadores de Pesagem')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('indicadores')
export class IndicadoresController {
  constructor(private readonly service: IndicadoresService) {}

  @Post()
  @ApiOperation({ summary: 'Criar indicador' })
  create(@Body() dto: CreateIndicadorDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar indicadores' })
  findAll(@Query() filter: BaseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar indicador por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar indicador' })
  update(@Param('id') id: string, @Body() dto: UpdateIndicadorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover indicador' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
