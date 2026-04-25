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
import { TiposDescontoService } from './tipos-desconto.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateTipoDescontoDto,
  SeedTiposDescontoDto,
  UpdateTipoDescontoDto,
} from './dto/create-tipo-desconto.dto';

@ApiTags('Tipos de Desconto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tipos-desconto')
export class TiposDescontoController {
  constructor(private readonly service: TiposDescontoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar tipo de desconto' })
  create(@Body() dto: CreateTipoDescontoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de desconto' })
  findAll(@Query('tenantId') tenantId: string, @Query('ativos') ativos?: string) {
    return this.service.findAll(tenantId, ativos === 'true' || ativos === '1');
  }

  @Post('seed')
  @ApiOperation({ summary: 'Criar tipos de desconto padrao' })
  seed(@Body() dto: SeedTiposDescontoDto) {
    return this.service.seedPadrao(dto.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTipoDescontoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
