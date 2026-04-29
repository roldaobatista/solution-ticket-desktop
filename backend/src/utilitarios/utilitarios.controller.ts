import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UtilitariosService } from './utilitarios.service';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Body, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Utilitarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('utilitarios')
export class UtilitariosController {
  constructor(
    private readonly service: UtilitariosService,
    private readonly documentosService: DocumentosService,
  ) {}

  @Get('diagnostico')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Informacoes de diagnostico do sistema, banco e licenca' })
  diagnostico() {
    return this.service.diagnostico();
  }

  @Get('logs/recentes')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Ultimas N linhas do log do Electron' })
  logs(@Query('n') n?: string) {
    const num = n ? parseInt(n, 10) : 50;
    return this.service.logsRecentes(Number.isFinite(num) ? num : 50);
  }
}

@ApiTags('Documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post('parse-xml')
  @ApiOperation({ summary: 'Parse de XML de NFe/CTe e extracao de campos relevantes' })
  parseXml(@Body() body: { xml: string }) {
    return this.documentosService.parseXml(body?.xml || '');
  }

  @Post('vincular-ticket')
  @ApiOperation({ summary: 'Vincula documento fiscal analisado a um ticket' })
  vincularTicket(
    @Body() body: { ticketId?: string; numeroTicket?: string; chave: string; tipo: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.documentosService.vincularTicket(body, tenantId);
  }
}
