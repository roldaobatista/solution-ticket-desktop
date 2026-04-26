import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateTabelaFreteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  faixaPesoInicial?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  faixaPesoFinal?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor!: number;

  @ApiProperty({ description: 'Inicio da vigencia (ISO)' })
  @IsDateString()
  vigenciaInicio!: string;

  @ApiPropertyOptional({ description: 'Fim da vigencia (ISO)' })
  @IsOptional()
  @IsDateString()
  vigenciaFim?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prioridadeResolucao?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateTabelaFreteDto extends PartialType(CreateTabelaFreteDto) {}
