import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const FLUXO_PESAGEM_VALUES = [
  'PF1_TARA_REFERENCIADA',
  'PF2_BRUTO_TARA',
  'PF3_COM_CONTROLE',
] as const;
type FluxoPesagem = (typeof FLUXO_PESAGEM_VALUES)[number];

const MODO_COMERCIAL_VALUES = ['DESABILITADO', 'HABILITADO', 'INFORMATIVO', 'OBRIGATORIO'] as const;
type ModoComercial = (typeof MODO_COMERCIAL_VALUES)[number];

const TARA_REFERENCIA_VALUES = ['CADASTRADA', 'MANUAL', 'PESADA', 'CAPTURADA_EM_BALANCA'] as const;
type TaraReferenciaTipo = (typeof TARA_REFERENCIA_VALUES)[number];

export class CreateTicketDto {
  @ApiProperty()
  @IsUUID()
  unidadeId!: string;

  @ApiProperty({ enum: FLUXO_PESAGEM_VALUES })
  @IsString()
  @IsNotEmpty()
  @IsIn(FLUXO_PESAGEM_VALUES as unknown as string[])
  fluxoPesagem!: FluxoPesagem;

  @ApiProperty()
  @IsUUID()
  clienteId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  transportadoraId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  motoristaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  veiculoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  veiculoPlaca?: string;

  @ApiProperty()
  @IsUUID()
  produtoId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  origemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  armazemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  indicadorPesagemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notaFiscal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoNf?: number;

  @ApiPropertyOptional({ enum: MODO_COMERCIAL_VALUES })
  @IsOptional()
  @IsIn(MODO_COMERCIAL_VALUES as unknown as string[])
  modoComercial?: ModoComercial;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(TARA_REFERENCIA_VALUES as unknown as string[])
  taraReferenciaTipo?: TaraReferenciaTipo;

  @ApiPropertyOptional({
    description: 'Tara manual em kg para PF1_TARA_REFERENCIADA quando taraReferenciaTipo=MANUAL',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taraManual?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campo1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campo2?: string;
}
