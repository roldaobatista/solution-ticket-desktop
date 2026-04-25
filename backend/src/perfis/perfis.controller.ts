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
import { PerfisService } from './perfis.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Perfis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('perfis')
export class PerfisController {
  constructor(private readonly service: PerfisService) {}

  @Get()
  @ApiOperation({ summary: 'Listar perfis' })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.service.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar perfil' })
  create(@Body() dto: CreatePerfilDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar perfil' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar perfil' })
  update(@Param('id') id: string, @Body() dto: UpdatePerfilDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar perfil' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
