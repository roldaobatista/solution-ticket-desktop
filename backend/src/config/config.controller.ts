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
import { ConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Configuracao Operacional')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('configuracoes')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Criar configuracao operacional' })
  create(@Body() dto: CreateConfigDto, @CurrentUser('tenantId') tenantId: string) {
    return this.configService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar configuracoes' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('empresaId') empresaId?: string,
    @Query('unidadeId') unidadeId?: string,
  ) {
    return this.configService.findAll(tenantId, empresaId, unidadeId);
  }

  @Get('unidade/:unidadeId')
  @ApiOperation({ summary: 'Buscar configuracao por unidade' })
  findByUnidade(@Param('unidadeId') unidadeId: string, @CurrentUser('tenantId') tenantId: string) {
    return this.configService.findByUnidade(unidadeId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar configuracao por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.configService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar configuracao' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateConfigDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.configService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Remover configuracao' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.configService.remove(id, tenantId);
  }
}
