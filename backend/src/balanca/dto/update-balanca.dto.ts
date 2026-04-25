import { IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBalancaDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  protocolo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  porta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  baudRate?: number;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
