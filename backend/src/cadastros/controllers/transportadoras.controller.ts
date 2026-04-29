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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissao } from '../../constants/permissoes';

@ApiTags('Transportadoras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transportadoras')
export class TransportadorasController {
  constructor(private readonly service: TransportadorasService) {}

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar transportadora' })
  create(@Body() dto: CreateTransportadoraDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transportadoras' })
  findAll(@Query() filter: BaseFilterDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findAll(filter, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transportadora por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar transportadora' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTransportadoraDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Remover transportadora' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}
