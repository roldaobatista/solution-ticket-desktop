import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFaturaDto {
  @ApiProperty()
  @IsUUID()
  clienteId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  romaneioId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tickets fechados para gerar romaneio e fatura',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ticketIds?: string[];

  @ApiProperty({ description: 'Data de emissao (ISO)' })
  @IsDateString()
  dataEmissao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notaFiscal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalGeral!: number;
}
