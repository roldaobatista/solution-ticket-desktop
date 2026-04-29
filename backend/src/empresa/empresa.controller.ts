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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Empresa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar empresa' })
  create(@Body() dto: CreateEmpresaDto, @CurrentUser('tenantId') tenantId: string) {
    return this.empresaService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.empresaService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.empresaService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar empresa' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmpresaDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.empresaService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Remover empresa' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.empresaService.remove(id, tenantId);
  }

  // Unidades
  @Post('unidades')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar unidade' })
  createUnidade(@Body() dto: CreateUnidadeDto, @CurrentUser('tenantId') tenantId: string) {
    return this.empresaService.createUnidade(dto, tenantId);
  }

  @Get('unidades/list')
  @ApiOperation({ summary: 'Listar unidades' })
  findAllUnidades(
    @Query('empresaId') empresaId: string | undefined,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.empresaService.findAllUnidades(tenantId, empresaId);
  }

  @Get('unidades/:id')
  @ApiOperation({ summary: 'Buscar unidade por ID' })
  findOneUnidade(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.empresaService.findOneUnidade(id, tenantId);
  }

  @Patch('unidades/:id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar unidade' })
  updateUnidade(
    @Param('id') id: string,
    @Body() dto: UpdateUnidadeDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.empresaService.updateUnidade(id, dto, tenantId);
  }

  @Delete('unidades/:id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Remover unidade' })
  removeUnidade(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.empresaService.removeUnidade(id, tenantId);
  }
}
