import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilaService } from './fila.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Onda 2.6: JwtAuthGuard adicionado — antes nenhum guard explicito,
// e o TenantGuard global bloqueava silenciosamente sem JwtStrategy popular request.user.
@ApiTags('Fila de Veículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fila')
export class FilaController {
  constructor(private readonly service: FilaService) {}

  @Get(':unidadeId')
  @ApiOperation({ summary: 'Listar fila da unidade' })
  findByUnidade(@Param('unidadeId') unidadeId: string) {
    return this.service.findByUnidade(unidadeId);
  }

  @Post()
  @ApiOperation({ summary: 'Adicionar veículo à fila' })
  create(@Body() dto: Record<string, unknown>) {
    return this.service.create(dto);
  }

  @Put(':id/chamar')
  @ApiOperation({ summary: 'Chamar veículo para pesagem' })
  chamar(@Param('id') id: string) {
    return this.service.chamar(id);
  }

  @Put(':id/concluir')
  @ApiOperation({ summary: 'Concluir atendimento' })
  concluir(@Param('id') id: string) {
    return this.service.concluir(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover da fila' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
