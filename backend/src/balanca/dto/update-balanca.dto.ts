import { IsOptional, IsString, IsInt, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBalancaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional({
    enum: [
      'serial',
      'rs232',
      'rs485',
      'tcp',
      'tcpip',
      'tcp/ip',
      'ethernet',
      'modbus',
      'modbus-rtu',
      'modbus-tcp',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'serial',
    'rs232',
    'rs485',
    'tcp',
    'tcpip',
    'tcp/ip',
    'ethernet',
    'modbus',
    'modbus-rtu',
    'modbus-tcp',
  ])
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
  @IsBoolean()
  statusOnline?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoEntradaSaida?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
