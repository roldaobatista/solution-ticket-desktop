import { IsOptional, IsString, IsInt, IsBoolean, IsIn, IsNumber, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBalancaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unidadeId?: string;

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

  @ApiPropertyOptional({ description: 'ID do IndicadorPesagem (modelo de hardware)' })
  @IsOptional()
  @IsUUID()
  indicadorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  modbusUnitId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  modbusRegister?: number;

  @ApiPropertyOptional({ enum: ['holding', 'input'] })
  @IsOptional()
  @IsIn(['holding', 'input'])
  modbusFunction?: 'holding' | 'input';

  @ApiPropertyOptional({ enum: ['BE', 'LE'] })
  @IsOptional()
  @IsIn(['BE', 'LE'])
  modbusByteOrder?: 'BE' | 'LE';

  @ApiPropertyOptional({ enum: ['BE', 'LE'] })
  @IsOptional()
  @IsIn(['BE', 'LE'])
  modbusWordOrder?: 'BE' | 'LE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  modbusSigned?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  modbusScale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  modbusOffset?: number;

  @ApiPropertyOptional({ description: 'Override de fator/divisor do parser nesta balanca' })
  @IsOptional()
  @IsInt()
  ovrFator?: number;
}
