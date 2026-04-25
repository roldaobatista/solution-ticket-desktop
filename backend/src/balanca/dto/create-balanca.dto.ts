import { IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBalancaDto {
  @ApiProperty()
  @IsUUID()
  empresaId!: string;

  @ApiProperty()
  @IsUUID()
  unidadeId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  protocolo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  porta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  baudRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enderecoIp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  portaTcp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoEntradaSaida?: string;

  @ApiPropertyOptional({ description: 'ID do IndicadorPesagem (modelo de hardware)' })
  @IsOptional()
  @IsUUID()
  indicadorId?: string;
}
