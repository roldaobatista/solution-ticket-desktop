import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVeiculoDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, {
    message: 'Placa deve estar no formato antigo (ABC1234) ou Mercosul (ABC1D23)',
  })
  placa!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  transportadoraId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taraCadastrada?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}
