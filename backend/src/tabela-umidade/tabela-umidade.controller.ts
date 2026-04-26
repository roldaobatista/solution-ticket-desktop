import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TabelaUmidadeService } from './tabela-umidade.service';
import {
  CreateTabelaUmidadeDto,
  UpdateTabelaUmidadeDto,
} from '../comercial/dto/create-tabela-umidade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

// Onda 2.6: JwtAuthGuard adicionado.
@ApiTags('Tabela de Umidade')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tabela-umidade')
export class TabelaUmidadeController {
  constructor(private readonly service: TabelaUmidadeService) {}

  @Get(':produtoId')
  @ApiOperation({ summary: 'Buscar tabela de umidade por produto' })
  findByProduto(@Param('produtoId') produtoId: string) {
    return this.service.findByProduto(produtoId);
  }

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar faixa de umidade' })
  create(@Body() dto: CreateTabelaUmidadeDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Put(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar faixa' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTabelaUmidadeDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Remover faixa' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.remove(id, tenantId);
  }

  @Post('calcular')
  @ApiOperation({ summary: 'Calcular desconto por umidade' })
  calcularDesconto(@Body() dto: { produtoId: string; umidadeMedida: number; pesoLiquido: number }) {
    return this.service.calcularDesconto(dto.produtoId, dto.umidadeMedida, dto.pesoLiquido);
  }
}
