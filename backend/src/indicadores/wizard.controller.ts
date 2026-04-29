import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createParser } from '../balanca/parsers/parser.factory';
import { IndicadorService } from './indicador.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

interface TestarConfigBody {
  bytes: string; // hex
  parserTipo: string;
  inicioPeso?: number;
  tamanhoPeso?: number;
  tamanhoString?: number;
  marcador?: number;
  fator?: number;
  invertePeso?: boolean;
  readMode?: 'continuous' | 'polling' | 'manual';
  readCommandHex?: string | null;
  readIntervalMs?: number | null;
  readTimeoutMs?: number | null;
}

interface AnnotateBody {
  bytes: string; // hex
}

interface CriarFromCaptureBody {
  tenantId?: string;
  fabricante: string;
  modelo: string;
  descricao?: string;
  protocolo: 'serial' | 'tcp' | 'modbus';
  serial: {
    baudRate: number;
    dataBits: 7 | 8;
    parity: string;
    stopBits: 1 | 2;
    flowControl: string;
  };
  parserTipo: string;
  inicioPeso?: number;
  tamanhoPeso?: number;
  tamanhoString?: number;
  marcador?: number;
  fator?: number;
  invertePeso?: boolean;
  atraso?: number;
  readMode?: 'continuous' | 'polling' | 'manual';
  readCommandHex?: string | null;
  readIntervalMs?: number | null;
  readTimeoutMs?: number | null;
  bytesCapturados?: string;
  notas?: string;
}

@ApiTags('Indicadores Wizard')
@ApiBearerAuth()
@Controller('indicadores/wizard')
@UseGuards(JwtAuthGuard)
export class IndicadorWizardController {
  constructor(private readonly service: IndicadorService) {}

  @Post('annotate-bytes')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({
    summary: 'Recebe bytes em hex e retorna anotação byte-a-byte (offset, hex, char, role)',
  })
  annotate(@Body() body: AnnotateBody) {
    if (!body.bytes) throw new BadRequestException('bytes obrigatório');
    const buf = Buffer.from(body.bytes.replace(/\s+/g, ''), 'hex');
    return {
      total: buf.length,
      bytes: Array.from(buf).map((b, i) => ({
        offset: i,
        hex: b.toString(16).padStart(2, '0').toUpperCase(),
        decimal: b,
        char: b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : null,
        role: this.classify(b),
      })),
    };
  }

  @Post('test-config')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({
    summary: 'Testa uma configuração de parser sobre bytes capturados antes de salvar',
  })
  testar(@Body() body: TestarConfigBody) {
    if (!body.bytes) throw new BadRequestException('bytes obrigatório');
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
    for (let i = 0; i < 20; i++) {
      const r = parser.parse(buf);
      if (!r.leitura) break;
      leituras.push(r.leitura);
      buf = r.restante;
    }
    return {
      parserTipo: body.parserTipo,
      bytesAnalisados: Buffer.from(body.bytes.replace(/\s+/g, ''), 'hex').length,
      bytesRestantes: buf.length,
      leituras,
      sucesso: leituras.length > 0,
      diagnostico:
        leituras.length === 0
          ? 'Nenhuma trama válida extraída. Ajuste inicioPeso/tamanhoPeso/marcador.'
          : `${leituras.length} trama(s) válida(s).`,
    };
  }

  @Post('criar')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Cria novo indicador a partir do wizard (após teste OK)' })
  async criar(@Body() body: CriarFromCaptureBody, @CurrentUser('tenantId') tenantId: string) {
    const descricao = body.descricao || `${body.fabricante} - ${body.modelo}`;
    return this.service.create(
      {
        fabricante: body.fabricante,
        modelo: body.modelo,
        descricao,
        protocolo: body.protocolo,
        parserTipo: body.parserTipo,
        baudrate: body.serial.baudRate,
        databits: body.serial.dataBits,
        stopbits: body.serial.stopBits,
        parity: body.serial.parity,
        flowControl: body.serial.flowControl,
        inicioPeso: body.inicioPeso,
        tamanhoPeso: body.tamanhoPeso,
        tamanhoString: body.tamanhoString,
        marcador: body.marcador,
        fator: body.fator,
        invertePeso: body.invertePeso,
        atraso: body.atraso,
        readMode: body.readMode,
        readCommandHex: body.readCommandHex,
        readIntervalMs: body.readIntervalMs,
        readTimeoutMs: body.readTimeoutMs,
        exemploTrama: body.bytesCapturados,
        notas: body.notas,
      },
      tenantId,
    );
  }

  private classify(b: number): string {
    switch (b) {
      case 0x02:
        return 'STX';
      case 0x03:
        return 'ETX';
      case 0x05:
        return 'ENQ';
      case 0x06:
        return 'ACK';
      case 0x0d:
        return 'CR';
      case 0x0a:
        return 'LF';
      case 0x09:
        return 'TAB';
      case 0x20:
        return 'SP';
      default:
        if (b >= 0x30 && b <= 0x39) return 'digit';
        if (b >= 0x41 && b <= 0x5a) return 'letter';
        if (b >= 0x61 && b <= 0x7a) return 'letter';
        if (b < 0x20) return 'control';
        if (b >= 0x80) return 'high-byte';
        return 'printable';
    }
  }
}
