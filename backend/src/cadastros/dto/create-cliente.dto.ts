import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razaoSocial!: string;

  // RD3: tipo de pessoa — produtor rural muito comum em balanca de cooperativa.
  @ApiProperty({ enum: ['PJ', 'PF', 'PRODUTOR_RURAL'], default: 'PJ' })
  @IsOptional()
  @IsIn(['PJ', 'PF', 'PRODUTOR_RURAL'])
  tipoPessoa?: 'PJ' | 'PF' | 'PRODUTOR_RURAL';

  @ApiPropertyOptional({ description: 'CNPJ (PJ) ou CPF (PF/Produtor Rural)' })
  @IsOptional()
  @IsString()
  documento?: string;

  @ApiPropertyOptional({ description: 'Inscricao Estadual (obrigatoria para PRODUTOR_RURAL)' })
  @IsOptional()
  @IsString()
  inscricaoEstadual?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inscricaoMunicipal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoIntegracao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  saldoFinanceiro?: number;
}
