import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LicencaService } from './licenca.service';
import { CrlService } from './crl.service';
import { AtivarLicencaDto, IniciarTrialDto } from './dto/ativar-licenca.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissao } from '../constants/permissoes';
import { IsString } from 'class-validator';

class UpsertCrlDto {
  @IsString()
  crl!: string;
}

@ApiTags('Licenciamento')
@Controller('licenca')
export class LicencaController {
  constructor(
    private readonly licencaService: LicencaService,
    private readonly crl: CrlService,
  ) {}

  // Public: leitura de fingerprint da maquina nao expoe nada sensivel
  // (e necessario para gerar a chave de licenca offline).
  @Public()
  @Get('fingerprint')
  @ApiOperation({ summary: 'Retorna fingerprint desta maquina' })
  fingerprint() {
    return { fingerprint: this.licencaService.getFingerprint() };
  }

  // Public: status e necessario para o splash decidir se app pode subir
  // (antes de qualquer login). Nao expoe nada alem de status, dataExpiracao,
  // pesagensRestantes.
  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Status da licenca para a unidade (aplica transicoes)' })
  status(@Query('unidadeId') unidadeId: string) {
    return this.licencaService.verificarStatus(unidadeId);
  }

  // Onda 1.3: ativacao de licenca exige admin autenticado.
  // Antes era @Public — qualquer processo local podia chamar e fraudar.
  @UseGuards(JwtAuthGuard)
  @Roles(Permissao.LICENCA_GERENCIAR)
  @Throttle({ short: { limit: 3, ttl: 60_000 } })
  @ApiBearerAuth()
  @Post('ativar')
  @ApiOperation({ summary: 'Ativa licenca a partir de chave JWT RSA (admin)' })
  ativar(
    @Body() dto: AtivarLicencaDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.licencaService.ativar({
      unidadeId: dto.unidadeId,
      tenantId,
      chave: dto.chave,
      usuarioId,
    });
  }

  // Onda 1.3: iniciar trial exige admin autenticado.
  // Antes era @Public — atacante local criava trials fraudulentos para
  // qualquer (unidadeId, tenantId).
  @UseGuards(JwtAuthGuard)
  @Roles(Permissao.LICENCA_GERENCIAR)
  @ApiBearerAuth()
  @Post('iniciar-trial')
  @ApiOperation({ summary: 'Inicia trial (idempotente, admin)' })
  iniciarTrial(@Body() dto: IniciarTrialDto, @CurrentUser('tenantId') tenantId: string) {
    return this.licencaService.iniciarTrial(dto.unidadeId, tenantId);
  }

  // F-029: status da CRL (admin).
  @UseGuards(JwtAuthGuard)
  @Roles(Permissao.LICENCA_GERENCIAR)
  @ApiBearerAuth()
  @Get('crl')
  @ApiOperation({ summary: 'Status da Certificate Revocation List atual (admin)' })
  crlStatus() {
    return this.crl.status();
  }

  // F-029: upload de CRL assinada (admin). Body: { crl: "<jwt assinado>" }.
  @UseGuards(JwtAuthGuard)
  @Roles(Permissao.LICENCA_GERENCIAR)
  @ApiBearerAuth()
  @Post('crl')
  @ApiOperation({ summary: 'Atualiza CRL offline (JWT RS256 assinado pela mesma chave)' })
  crlUpsert(@Body() dto: UpsertCrlDto) {
    return this.crl.upsertCrl(dto.crl);
  }

  // F-029: forca recarregar a CRL do disco (apos edicao manual).
  @UseGuards(JwtAuthGuard)
  @Roles(Permissao.LICENCA_GERENCIAR)
  @ApiBearerAuth()
  @Post('crl/reload')
  @ApiOperation({ summary: 'Recarrega CRL do disco' })
  crlReload() {
    return this.crl.recarregar();
  }

  // Onda 1.3: endpoint de decremento removido da superficie HTTP.
  // Era @Public e permitia esgotar contador de trial alheio.
  // Decremento agora ocorre apenas via TicketLicenseGuard dentro da
  // transacao de fecharTicket (uso interno do backend).
}
