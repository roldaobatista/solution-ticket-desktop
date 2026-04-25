import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdicionarDescontoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty()
  @IsNumber()
  valor!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  percentual?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  origem?: string;
}
