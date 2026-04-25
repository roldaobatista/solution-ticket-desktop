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
import { MotoristasService } from '../services/motoristas.service';
import { CreateMotoristaDto } from '../dto/create-motorista.dto';
import { UpdateMotoristaDto } from '../dto/update-motorista.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Motoristas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('motoristas')
export class MotoristasController {
  constructor(private readonly service: MotoristasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar motorista' })
  create(@Body() dto: CreateMotoristaDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar motoristas' })
  findAll(@Query() filter: BaseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar motorista por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar motorista' })
  update(@Param('id') id: string, @Body() dto: UpdateMotoristaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover motorista' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
