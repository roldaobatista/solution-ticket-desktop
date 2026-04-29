import { Controller, Get, Post, Patch, Delete, Body, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { RecibosService } from './recibos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { CreateReciboDto, UpdateReciboDto } from './dto/create-recibo.dto';

@ApiTags('Recibos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recibos')
export class RecibosController {
  constructor(private readonly service: RecibosService) {}

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar recibo' })
  create(@Body() dto: CreateReciboDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar recibos' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar recibo por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar recibo' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReciboDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Excluir recibo' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.remove(id, tenantId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Gerar PDF do recibo' })
  async gerarPdf(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const buf = await this.service.gerarPdf(id, tenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recibo-${id}.pdf"`);
    res.end(buf);
  }
}
