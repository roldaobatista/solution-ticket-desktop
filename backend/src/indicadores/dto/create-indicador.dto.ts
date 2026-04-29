import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIndicadorDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  descricao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fabricante?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelo?: string | null;

  @ApiPropertyOptional({ enum: ['serial', 'tcp', 'modbus'] })
  @IsOptional()
  @IsString()
  @IsIn(['serial', 'tcp', 'modbus'])
  protocolo?: 'serial' | 'tcp' | 'modbus';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parserTipo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(300)
  baudrate?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsIn([7, 8])
  databits?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsIn([1, 2])
  stopbits?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['N', 'E', 'O', 'none', 'even', 'odd'])
  parity?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['NONE', 'XON_XOFF', 'RTS_CTS', 'DTR_DSR', 'none', 'software', 'hardware'])
  flowControl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  inicioPeso?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  tamanhoPeso?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  tamanhoString?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(255)
  marcador?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  fator?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  invertePeso?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  atraso?: number | null;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exemploTrama?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cor?: string | null;
}
