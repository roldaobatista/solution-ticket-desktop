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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Tipos de Veiculo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tipos-veiculo')
export class TiposVeiculoController {
  constructor(private readonly service: TiposVeiculoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tipos de veiculo' })
  findAll(@CurrentUser('tenantId') tenantId: string | undefined, @Query('search') search?: string) {
    return this.service.findAll(tenantId, search);
  }

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar tipo de veiculo' })
  create(@Body() dto: CreateTipoVeiculoDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar tipo de veiculo' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar tipo de veiculo' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTipoVeiculoDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Desativar tipo de veiculo' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}
