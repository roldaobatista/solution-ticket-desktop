import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LicencaService } from './licenca.service';
import { AtivarLicencaDto, IniciarTrialDto } from './dto/ativar-licenca.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Licenciamento')
@Controller('licenca')
export class LicencaController {
  constructor(private readonly licencaService: LicencaService) {}

  @Public()
  @Get('fingerprint')
  @ApiOperation({ summary: 'Retorna fingerprint desta maquina' })
  fingerprint() {
    return { fingerprint: this.licencaService.getFingerprint() };
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Status da licenca para a unidade (aplica transicoes)' })
  status(@Query('unidadeId') unidadeId: string) {
    return this.licencaService.verificarStatus(unidadeId);
  }

  @Public()
  @Post('ativar')
  @ApiOperation({ summary: 'Ativa licenca a partir de chave JWT RSA' })
  ativar(@Body() dto: AtivarLicencaDto) {
    return this.licencaService.ativar({
      unidadeId: dto.unidadeId,
      tenantId: dto.tenantId,
      chave: dto.chave,
      usuarioId: dto.usuarioId,
    });
  }

  @Public()
  @Post('iniciar-trial')
  @ApiOperation({ summary: 'Inicia trial (idempotente)' })
  iniciarTrial(@Body() dto: IniciarTrialDto) {
    return this.licencaService.iniciarTrial(dto.unidadeId, dto.tenantId);
  }

  @Public()
  @Post('decrementar-pesagem')
  @ApiOperation({ summary: 'Decrementa contador de pesagens do trial (uso interno)' })
  decrementar(@Body('unidadeId') unidadeId: string) {
    return this.licencaService.decrementarPesagemTrial(unidadeId);
  }
}
