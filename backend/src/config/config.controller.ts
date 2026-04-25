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

@ApiTags('Configuracao Operacional')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('configuracoes')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Criar configuracao operacional' })
  create(@Body() dto: CreateConfigDto) {
    return this.configService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar configuracoes' })
  findAll(@Query('empresaId') empresaId?: string, @Query('unidadeId') unidadeId?: string) {
    return this.configService.findAll(empresaId, unidadeId);
  }

  @Get('unidade/:unidadeId')
  @ApiOperation({ summary: 'Buscar configuracao por unidade' })
  findByUnidade(@Param('unidadeId') unidadeId: string) {
    return this.configService.findByUnidade(unidadeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar configuracao por ID' })
  findOne(@Param('id') id: string) {
    return this.configService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar configuracao' })
  update(@Param('id') id: string, @Body() dto: UpdateConfigDto) {
    return this.configService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover configuracao' })
  remove(@Param('id') id: string) {
    return this.configService.remove(id);
  }
}
