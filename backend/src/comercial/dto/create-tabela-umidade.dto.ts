import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateTabelaUmidadeDto {
  @ApiProperty()
  @IsUUID()
  produtoId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  faixaInicial!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  faixaFinal!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  descontoPercentual!: number;

  @ApiProperty({ description: 'Inicio da vigencia (ISO)' })
  @IsDateString()
  vigenciaInicio!: string;

  @ApiPropertyOptional({ description: 'Fim da vigencia (ISO)' })
  @IsOptional()
  @IsDateString()
  vigenciaFim?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateTabelaUmidadeDto extends PartialType(CreateTabelaUmidadeDto) {}
