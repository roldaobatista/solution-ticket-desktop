import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RegistrarPagamentoDto {
  @ApiProperty()
  @IsUUID()
  formaPagamentoId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor!: number;

  @ApiProperty({ description: 'Data de emissao do pagamento (ISO)' })
  @IsDateString()
  dataEmissao!: string;

  @ApiPropertyOptional({ description: 'Vencimento (ISO) — opcional' })
  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numeroDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}
