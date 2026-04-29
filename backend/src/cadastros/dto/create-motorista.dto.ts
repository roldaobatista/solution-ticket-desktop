import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMotoristaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empresaId?: string;

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
  cnh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  transportadoraId?: string;
}
