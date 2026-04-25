import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type FiltrosPayload = Record<string, unknown> | string;

export class CreateRelatorioSalvoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ description: 'Modulo de origem do relatorio (ex: tickets, faturas)' })
  @IsString()
  @IsNotEmpty()
  modulo!: string;

  @ApiProperty({
    description: 'Filtros serializados (objeto ou string JSON)',
    type: 'object',
    additionalProperties: true,
  })
  filtros!: FiltrosPayload;
}

export class UpdateRelatorioSalvoDto extends PartialType(CreateRelatorioSalvoDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Filtros serializados', type: 'object' })
  @IsOptional()
  filtros?: FiltrosPayload;
}
