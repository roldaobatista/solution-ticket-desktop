import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export const TIPO_DESCONTO_TIPOS = ['PERCENTUAL', 'VALOR_KG', 'MANUAL'] as const;
export type TipoDescontoTipo = (typeof TIPO_DESCONTO_TIPOS)[number];

export class CreateTipoDescontoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiPropertyOptional({ enum: TIPO_DESCONTO_TIPOS, default: 'PERCENTUAL' })
  @IsOptional()
  @IsIn(TIPO_DESCONTO_TIPOS as unknown as string[])
  tipo?: TipoDescontoTipo;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  teto?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carencia?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  mantem?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  calcula?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  visivelPE?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  visivelPS?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  visivelPortaria?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  visivelApontamento?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  visivelPosApontamento?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valor?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  original?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateTipoDescontoDto extends PartialType(CreateTipoDescontoDto) {}

export class SeedTiposDescontoDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;
}
