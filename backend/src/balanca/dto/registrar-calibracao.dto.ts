import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum TipoCalibracaoEnum {
  ZERO = 'ZERO',
  SPAN = 'SPAN',
  MULTIPONTO = 'MULTIPONTO',
}

export class RegistrarCalibracaoDto {
  @ApiProperty({ enum: TipoCalibracaoEnum })
  @IsEnum(TipoCalibracaoEnum)
  tipo!: TipoCalibracaoEnum;

  @ApiProperty({ description: 'Peso real conhecido (kg). Para ZERO use 0.' })
  @IsNumber()
  @Min(0)
  pesoReferencia!: number;

  @ApiProperty({ description: 'Peso lido pelo indicador antes do ajuste (kg).' })
  @IsNumber()
  pesoLido!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}
