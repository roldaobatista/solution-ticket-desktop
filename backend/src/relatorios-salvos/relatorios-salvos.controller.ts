import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RelatoriosSalvosService } from './relatorios-salvos.service';
import { CreateRelatorioSalvoDto, UpdateRelatorioSalvoDto } from './dto/create-relatorio-salvo.dto';

interface AuthenticatedRequest {
  user?: { tenantId?: string };
}

@ApiTags('Relatorios Salvos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('relatorios-salvos')
export class RelatoriosSalvosController {
  constructor(private readonly service: RelatoriosSalvosService) {}

  private tenantId(req: AuthenticatedRequest): string {
    return req?.user?.tenantId || 'default';
  }

  @Get()
  @ApiOperation({ summary: 'Lista relatorios salvos do tenant (filtra por modulo se fornecido)' })
  list(@Request() req: AuthenticatedRequest, @Query('modulo') modulo?: string) {
    return this.service.list(this.tenantId(req), modulo);
  }

  @Get(':id')
  get(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.get(id, this.tenantId(req));
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() body: CreateRelatorioSalvoDto) {
    return this.service.create(this.tenantId(req), body);
  }

  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateRelatorioSalvoDto,
  ) {
    return this.service.update(id, this.tenantId(req), body);
  }

  @Delete(':id')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.remove(id, this.tenantId(req));
  }
}
