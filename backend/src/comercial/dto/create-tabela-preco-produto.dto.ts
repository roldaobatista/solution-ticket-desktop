import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTabelaPrecoProdutoDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty()
  @IsUUID()
  produtoId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor!: number;

  @ApiProperty()
  @IsString()
  unidade!: string;

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

export class UpdateTabelaPrecoProdutoDto extends PartialType(CreateTabelaPrecoProdutoDto) {
  @ApiPropertyOptional({ description: 'ID do usuario que efetuou a alteracao (auditoria)' })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;
}
