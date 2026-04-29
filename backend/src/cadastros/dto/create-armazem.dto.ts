import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArmazemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  localizacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacidadeKg?: number;
}
