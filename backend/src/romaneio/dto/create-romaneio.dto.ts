import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRomaneioDto {
  @ApiProperty()
  @IsUUID()
  clienteId!: string;

  @ApiProperty({ description: 'Inicio do periodo (ISO)' })
  @IsDateString()
  periodoInicio!: string;

  @ApiProperty({ description: 'Fim do periodo (ISO)' })
  @IsDateString()
  periodoFim!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs de tickets a vincular' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ticketIds?: string[];
}
