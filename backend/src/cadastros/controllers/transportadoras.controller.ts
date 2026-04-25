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
import { TransportadorasService } from '../services/transportadoras.service';
import { CreateTransportadoraDto } from '../dto/create-transportadora.dto';
import { UpdateTransportadoraDto } from '../dto/update-transportadora.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Transportadoras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transportadoras')
export class TransportadorasController {
  constructor(private readonly service: TransportadorasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar transportadora' })
  create(@Body() dto: CreateTransportadoraDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transportadoras' })
  findAll(@Query() filter: BaseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transportadora por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar transportadora' })
  update(@Param('id') id: string, @Body() dto: UpdateTransportadoraDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover transportadora' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
