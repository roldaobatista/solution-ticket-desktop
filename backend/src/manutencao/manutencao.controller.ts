import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ManutencaoService } from './manutencao.service';
import { CreateSolicitacaoDto } from './dto/create-solicitacao.dto';
import { AprovarSolicitacaoDto } from './dto/aprovar-solicitacao.dto';
import { SolicitacaoFilterDto } from './dto/solicitacao-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Manutencao e Aprovacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('manutencao')
export class ManutencaoController {
  constructor(private readonly manutencaoService: ManutencaoService) {}

  @Post('solicitacoes')
  @ApiOperation({ summary: 'Criar solicitacao de aprovacao' })
  criarSolicitacao(@Body() dto: CreateSolicitacaoDto) {
    return this.manutencaoService.criarSolicitacao(dto);
  }

  @Get('solicitacoes')
  @ApiOperation({ summary: 'Listar solicitacoes' })
  findAll(@Query() filter: SolicitacaoFilterDto) {
    return this.manutencaoService.findAll(filter);
  }

  @Get('solicitacoes/:id')
  @ApiOperation({ summary: 'Buscar solicitacao por ID' })
  findOne(@Param('id') id: string) {
    return this.manutencaoService.findOne(id);
  }

  @Post('solicitacoes/:id/aprovar')
  @ApiOperation({ summary: 'Aprovar solicitacao' })
  aprovar(@Param('id') id: string, @Body() dto: AprovarSolicitacaoDto) {
    return this.manutencaoService.aprovar(id, dto);
  }

  @Post('solicitacoes/:id/recusar')
  @ApiOperation({ summary: 'Recusar solicitacao' })
  recusar(@Param('id') id: string, @Body() dto: AprovarSolicitacaoDto) {
    return this.manutencaoService.recusar(id, dto);
  }
}
