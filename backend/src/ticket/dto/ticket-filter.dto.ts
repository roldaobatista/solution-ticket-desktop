import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TicketFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unidadeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statusOperacional?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statusComercial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fluxoPesagem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataFim?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
