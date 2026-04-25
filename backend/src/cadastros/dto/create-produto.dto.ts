import { IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProdutoDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoInterno?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unidade!: string;

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
}
