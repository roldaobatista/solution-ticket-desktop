import { IsOptional, IsString, IsUUID, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProdutoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoInterno?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  densidade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoOperacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  permiteFracionado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  armazemPadraoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
