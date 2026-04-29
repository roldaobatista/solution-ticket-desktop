import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PRESETS_BALANCA, SERIAL_OPTIONS } from './presets';
import { AutoDetectService } from './auto-detect.service';
import { CaptureRawService, CaptureRequest } from './capture-raw.service';
import { NetworkDiscoveryService } from './diagnostics/network-discovery.service';
import { createParser } from './parsers/parser.factory';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

@ApiTags('Balanca Configuração')
@ApiBearerAuth()
@Controller('balanca/config')
@UseGuards(JwtAuthGuard)
export class BalancaConfigController {
  constructor(
    private readonly autoDetect: AutoDetectService,
    private readonly capture: CaptureRawService,
    private readonly discovery: NetworkDiscoveryService,
  ) {}

  @Post('test-parser-on-bytes')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({
    summary: 'Aplica parser+config sobre bytes em hex e retorna leituras (calibração ao vivo)',
  })
  testParserOnBytes(
    @Body()
    body: {
      bytes: string;
      parserTipo: string;
      inicioPeso?: number;
      tamanhoPeso?: number;
      tamanhoString?: number;
      marcador?: number;
      fator?: number;
      invertePeso?: boolean;
    },
  ) {
    const parser = createParser({
      parserTipo: body.parserTipo,
      inicioPeso: body.inicioPeso,
      tamanhoPeso: body.tamanhoPeso,
      tamanhoString: body.tamanhoString,
      marcador: body.marcador,
      fator: body.fator,
      invertePeso: body.invertePeso,
    });
    let buf: Buffer = Buffer.from(body.bytes.replace(/\s+/g, ''), 'hex');
    const leituras: Array<{ peso: number; estavel: boolean; bruto: string }> = [];
    for (let i = 0; i < 30; i++) {
      const r = parser.parse(buf);
      if (!r.leitura) break;
      leituras.push(r.leitura);
      buf = r.restante;
    }
    return { leituras, bytesRestantes: buf.length };
  }

  // S5: network discovery gera tráfego — limita a 1 scan/minuto por usuário
  @Throttle({ default: { limit: 1, ttl: 60_000 } })
  @Post('discover')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({
    summary:
      'Faz scan TCP no segmento local em portas comuns de balanças (4001, 9999, 23, 8000, 10001)',
  })
  async discover(@Body() body: { cidr?: string; portas?: number[]; timeoutMs?: number }) {
    return this.discovery.scan(body);
  }

  @Get('presets')
  @ApiOperation({
    summary: 'Lista presets de balança (modelo + serial + parser pré-configurados)',
  })
  presets() {
    return PRESETS_BALANCA;
  }

  @Get('serial-options')
  @ApiOperation({ summary: 'Combinações disponíveis de baud/data/parity/stop/flow' })
  serialOptions() {
    return SERIAL_OPTIONS;
  }

  // S5: captura abre porta serial/TCP — protege contra flood de abertura/fechamento
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('capture-raw')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({
    summary: 'Abre porta serial/TCP, captura bytes brutos por N ms e fecha',
  })
  async captureRaw(@Body() body: CaptureRequest) {
    return this.capture.capturar(body);
  }

  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('capture-and-detect')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({
    summary: 'Captura bytes da porta + roda auto-detect (one-shot)',
  })
  async captureAndDetect(@Body() body: CaptureRequest) {
    const cap = await this.capture.capturar(body);
    if (cap.count === 0) {
      return {
        ...cap,
        candidatos: [],
        aviso:
          'Nenhum byte recebido — verifique se balança envia em modo contínuo ou use enviarEnq=true.',
      };
    }
    const bytes = Buffer.from(cap.bytes, 'hex');
    const candidatos = this.autoDetect.detectar(bytes);
    return {
      bytesAnalisados: cap.count,
      durationMs: cap.durationMs,
      candidatos: candidatos.map((c) => ({
        presetId: c.preset.id,
        fabricante: c.preset.fabricante,
        modelo: c.preset.modelo,
        parserTipo: c.preset.parserTipo,
        serial: c.preset.serial,
        confianca: Number(c.confianca.toFixed(3)),
        leituraExemplo: c.leitura,
      })),
    };
  }

  @Post('auto-detect')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({
    summary: 'Detecta protocolo a partir de bytes capturados (hex ou base64)',
  })
  detect(@Body() body: { bytes: string; encoding?: 'hex' | 'base64' }) {
    const enc = body.encoding ?? 'hex';
    const bytes = Buffer.from(body.bytes.replace(/\s+/g, ''), enc);
    const candidatos = this.autoDetect.detectar(bytes);
    return {
      bytesAnalisados: bytes.length,
      candidatos: candidatos.map((c) => ({
        presetId: c.preset.id,
        fabricante: c.preset.fabricante,
        modelo: c.preset.modelo,
        parserTipo: c.preset.parserTipo,
        serial: c.preset.serial,
        confianca: Number(c.confianca.toFixed(3)),
        leituraExemplo: {
          peso: c.leitura.peso,
          estavel: c.leitura.estavel,
          bruto: c.leitura.bruto,
        },
      })),
    };
  }
}
