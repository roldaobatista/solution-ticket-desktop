import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AuditoriaFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entidadeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

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
