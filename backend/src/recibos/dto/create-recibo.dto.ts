import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateReciboDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Data do recibo (ISO)' })
  @IsDateString()
  data!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cedente!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sacado!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  valorExtenso?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  usuarioId?: string;
}

export class UpdateReciboDto extends PartialType(CreateReciboDto) {}
