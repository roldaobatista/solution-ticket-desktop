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
import { VeiculosService } from '../services/veiculos.service';
import { CreateVeiculoDto } from '../dto/create-veiculo.dto';
import { UpdateVeiculoDto } from '../dto/update-veiculo.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissao } from '../../constants/permissoes';

@ApiTags('Veículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('veiculos')
export class VeiculosController {
  constructor(private readonly service: VeiculosService) {}

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar veículo' })
  create(@Body() dto: CreateVeiculoDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar veículos' })
  findAll(@Query() filter: BaseFilterDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findAll(filter, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar veículo' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVeiculoDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Remover veículo' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}
