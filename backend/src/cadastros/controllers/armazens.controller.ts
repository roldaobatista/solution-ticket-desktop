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
import { ArmazensService } from '../services/armazens.service';
import { CreateArmazemDto } from '../dto/create-armazem.dto';
import { UpdateArmazemDto } from '../dto/update-armazem.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Armazéns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('armazens')
export class ArmazensController {
  constructor(private readonly service: ArmazensService) {}

  @Post()
  @ApiOperation({ summary: 'Criar armazém' })
  create(@Body() dto: CreateArmazemDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar armazéns' })
  findAll(@Query() filter: BaseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar armazém por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar armazém' })
  update(@Param('id') id: string, @Body() dto: UpdateArmazemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover armazém' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
