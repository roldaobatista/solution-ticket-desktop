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
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Empresa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar empresa' })
  create(@Body() dto: CreateEmpresaDto) {
    return this.empresaService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.empresaService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  findOne(@Param('id') id: string) {
    return this.empresaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar empresa' })
  update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresaService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover empresa' })
  remove(@Param('id') id: string) {
    return this.empresaService.remove(id);
  }

  // Unidades
  @Post('unidades')
  @ApiOperation({ summary: 'Criar unidade' })
  createUnidade(@Body() dto: CreateUnidadeDto) {
    return this.empresaService.createUnidade(dto);
  }

  @Get('unidades/list')
  @ApiOperation({ summary: 'Listar unidades' })
  findAllUnidades(@Query('empresaId') empresaId?: string) {
    return this.empresaService.findAllUnidades(empresaId);
  }

  @Get('unidades/:id')
  @ApiOperation({ summary: 'Buscar unidade por ID' })
  findOneUnidade(@Param('id') id: string) {
    return this.empresaService.findOneUnidade(id);
  }

  @Patch('unidades/:id')
  @ApiOperation({ summary: 'Atualizar unidade' })
  updateUnidade(@Param('id') id: string, @Body() dto: UpdateUnidadeDto) {
    return this.empresaService.updateUnidade(id, dto);
  }

  @Delete('unidades/:id')
  @ApiOperation({ summary: 'Remover unidade' })
  removeUnidade(@Param('id') id: string) {
    return this.empresaService.removeUnidade(id);
  }
}
