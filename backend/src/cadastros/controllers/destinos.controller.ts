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
import { DestinosService } from '../services/destinos.service';
import { CreateDestinoDto } from '../dto/create-destino.dto';
import { UpdateDestinoDto } from '../dto/update-destino.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Destinos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('destinos')
export class DestinosController {
  constructor(private readonly service: DestinosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar destino' })
  create(@Body() dto: CreateDestinoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar destinos' })
  findAll(@Query() filter: BaseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar destino por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar destino' })
  update(@Param('id') id: string, @Body() dto: UpdateDestinoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover destino' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
