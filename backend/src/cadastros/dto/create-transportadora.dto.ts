import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransportadoraDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contatos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}
