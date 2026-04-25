import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTicketDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  transportadoraId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  motoristaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  veiculoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  veiculoPlaca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  origemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  armazemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notaFiscal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  pesoNf?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campo1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campo2?: string;
}
