import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaFilterDto } from './dto/auditoria-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Auditoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros de auditoria' })
  findAll(@Query() filter: AuditoriaFilterDto) {
    return this.auditoriaService.findAll(filter);
  }

  @Get('recentes')
  @ApiOperation({ summary: 'Ultimas N entries de auditoria (feed)' })
  recentes(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 20;
    return this.auditoriaService.recentes(Number.isFinite(n) ? n : 20);
  }

  @Get(':entidade/:entidadeId')
  @ApiOperation({ summary: 'Buscar auditoria por entidade' })
  findByEntidade(@Param('entidade') entidade: string, @Param('entidadeId') entidadeId: string) {
    return this.auditoriaService.findByEntidade(entidade, entidadeId);
  }
}
