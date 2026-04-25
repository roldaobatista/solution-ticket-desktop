import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { RecibosService } from './recibos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Recibos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recibos')
export class RecibosController {
  constructor(private readonly service: RecibosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar recibo' })
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar recibos' })
  findAll(@Query('tenantId') tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar recibo por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar recibo' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir recibo' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Gerar PDF do recibo' })
  async gerarPdf(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.service.gerarPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recibo-${id}.pdf"`);
    res.end(buf);
  }
}
