import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nomeEmpresarial!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  // RD3: tipo de pessoa — orienta validacao de documento/IE.
  @ApiProperty({ enum: ['PJ', 'PF', 'PRODUTOR_RURAL'], default: 'PJ' })
  @IsOptional()
  @IsIn(['PJ', 'PF', 'PRODUTOR_RURAL'])
  tipoPessoa?: 'PJ' | 'PF' | 'PRODUTOR_RURAL';

  @ApiProperty({ description: 'CNPJ (PJ) ou CPF (PF/Produtor Rural)' })
  @IsNotEmpty()
  @IsString()
  documento!: string;

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
  site?: string;
}
