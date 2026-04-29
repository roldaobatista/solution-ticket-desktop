import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProdutoDto {
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
