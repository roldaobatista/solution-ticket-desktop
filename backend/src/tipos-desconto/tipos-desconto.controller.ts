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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { CreateTipoDescontoDto, UpdateTipoDescontoDto } from './dto/create-tipo-desconto.dto';

@ApiTags('Tipos de Desconto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tipos-desconto')
export class TiposDescontoController {
  constructor(private readonly service: TiposDescontoService) {}

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar tipo de desconto' })
  create(@Body() dto: CreateTipoDescontoDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de desconto' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query('ativos') ativos?: string) {
    return this.service.findAll(tenantId, ativos === 'true' || ativos === '1');
  }

  @Post('seed')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar tipos de desconto padrao' })
  seed(@CurrentUser('tenantId') tenantId: string) {
    return this.service.seedPadrao(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTipoDescontoDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}
