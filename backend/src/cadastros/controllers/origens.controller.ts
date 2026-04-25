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
import { OrigensService } from '../services/origens.service';
import { CreateOrigemDto } from '../dto/create-origem.dto';
import { UpdateOrigemDto } from '../dto/update-origem.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Origens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('origens')
export class OrigensController {
  constructor(private readonly service: OrigensService) {}

  @Post()
  @ApiOperation({ summary: 'Criar origem' })
  create(@Body() dto: CreateOrigemDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar origens' })
  findAll(@Query() filter: BaseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar origem por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar origem' })
  update(@Param('id') id: string, @Body() dto: UpdateOrigemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover origem' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
