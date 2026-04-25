import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TabelaUmidadeService } from './tabela-umidade.service';

@ApiTags('Tabela de Umidade')
@Controller('tabela-umidade')
export class TabelaUmidadeController {
  constructor(private readonly service: TabelaUmidadeService) {}

  @Get(':produtoId')
  @ApiOperation({ summary: 'Buscar tabela de umidade por produto' })
  findByProduto(@Param('produtoId') produtoId: string) {
    return this.service.findByProduto(produtoId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar faixa de umidade' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar faixa' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover faixa' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('calcular')
  @ApiOperation({ summary: 'Calcular desconto por umidade' })
  calcularDesconto(@Body() dto: { produtoId: string; umidadeMedida: number; pesoLiquido: number }) {
    return this.service.calcularDesconto(dto.produtoId, dto.umidadeMedida, dto.pesoLiquido);
  }
}
