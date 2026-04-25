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
import { TiposVeiculoService } from './tipos-veiculo.service';
import { CreateTipoVeiculoDto } from './dto/create-tipo-veiculo.dto';
import { UpdateTipoVeiculoDto } from './dto/update-tipo-veiculo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tipos de Veiculo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tipos-veiculo')
export class TiposVeiculoController {
  constructor(private readonly service: TiposVeiculoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tipos de veiculo' })
  findAll(@Query('tenantId') tenantId?: string, @Query('search') search?: string) {
    return this.service.findAll(tenantId, search);
  }

  @Post()
  @ApiOperation({ summary: 'Criar tipo de veiculo' })
  create(@Body() dto: CreateTipoVeiculoDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar tipo de veiculo' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tipo de veiculo' })
  update(@Param('id') id: string, @Body() dto: UpdateTipoVeiculoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar tipo de veiculo' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
