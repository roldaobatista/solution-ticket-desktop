import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsIn,
  IsNumber,
  IsUUID,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBalancaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unidadeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional({
    enum: [
      'serial',
      'rs232',
      'rs485',
      'tcp',
      'tcpip',
      'tcp/ip',
      'ethernet',
      'modbus',
      'modbus-rtu',
      'modbus-tcp',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'serial',
    'rs232',
    'rs485',
    'tcp',
    'tcpip',
    'tcp/ip',
    'ethernet',
    'modbus',
    'modbus-rtu',
    'modbus-tcp',
  ])
  protocolo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  porta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(300)
  baudRate?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enderecoIp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  portaTcp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  statusOnline?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoEntradaSaida?: string;

  @ApiPropertyOptional({ description: 'ID do IndicadorPesagem (modelo de hardware)' })
  @IsOptional()
  @IsUUID()
  indicadorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  modbusUnitId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  modbusRegister?: number;

  @ApiPropertyOptional({ enum: ['holding', 'input'] })
  @IsOptional()
  @IsIn(['holding', 'input'])
  modbusFunction?: 'holding' | 'input';

  @ApiPropertyOptional({ enum: ['BE', 'LE'] })
  @IsOptional()
  @IsIn(['BE', 'LE'])
  modbusByteOrder?: 'BE' | 'LE';

  @ApiPropertyOptional({ enum: ['BE', 'LE'] })
  @IsOptional()
  @IsIn(['BE', 'LE'])
  modbusWordOrder?: 'BE' | 'LE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  modbusSigned?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  modbusScale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  modbusOffset?: number;

  @ApiPropertyOptional({ description: 'Override de fator/divisor do parser nesta balanca' })
  @IsOptional()
  @IsInt()
  @Min(1)
  ovrFator?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsIn([7, 8])
  ovrDataBits?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['N', 'E', 'O', 'none', 'even', 'odd'])
  ovrParity?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsIn([1, 2])
  ovrStopBits?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['NONE', 'XON_XOFF', 'RTS_CTS', 'DTR_DSR', 'none', 'software', 'hardware'])
  ovrFlowControl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ovrParserTipo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  ovrInicioPeso?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  ovrTamanhoPeso?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  ovrTamanhoString?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(255)
  ovrMarcador?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ovrInvertePeso?: boolean | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  ovrAtraso?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  toleranciaEstabilidade?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  janelaEstabilidade?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  debugMode?: boolean | null;

  @ApiPropertyOptional({ enum: ['continuous', 'polling', 'manual'] })
  @IsOptional()
  @IsString()
  @IsIn(['continuous', 'polling', 'manual'])
  readMode?: 'continuous' | 'polling' | 'manual' | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^(?:[0-9a-fA-F]{2}\s*)+$/, {
    message: 'readCommandHex deve conter bytes hexadecimais pares',
  })
  readCommandHex?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(200)
  readIntervalMs?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(200)
  readTimeoutMs?: number | null;
}
