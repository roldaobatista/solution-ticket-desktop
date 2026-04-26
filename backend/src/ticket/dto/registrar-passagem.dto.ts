import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const TIPO_PASSAGEM_VALUES = ['OFICIAL', 'CONTROLE'] as const;
type TipoPassagem = (typeof TIPO_PASSAGEM_VALUES)[number];

const DIRECAO_OPERACIONAL_VALUES = ['ENTRADA', 'SAIDA'] as const;
type DirecaoOperacional = (typeof DIRECAO_OPERACIONAL_VALUES)[number];

const PAPEL_CALCULO_VALUES = ['BRUTO_OFICIAL', 'TARA_OFICIAL', 'CONTROLE'] as const;
type PapelCalculo = (typeof PAPEL_CALCULO_VALUES)[number];

const CONDICAO_VEICULO_VALUES = ['NAO_INFORMADO', 'CARREGADO', 'VAZIO'] as const;
type CondicaoVeiculo = (typeof CONDICAO_VEICULO_VALUES)[number];

const ORIGEM_LEITURA_VALUES = ['BALANCA_SERIAL', 'BALANCA_TCP', 'MANUAL', 'DISPOSITIVO'] as const;
type OrigemLeitura = (typeof ORIGEM_LEITURA_VALUES)[number];

export class RegistrarPassagemDto {
  @ApiProperty({ enum: TIPO_PASSAGEM_VALUES })
  @IsString()
  @IsNotEmpty()
  @IsIn(TIPO_PASSAGEM_VALUES as unknown as string[])
  tipoPassagem!: TipoPassagem;

  @ApiProperty({ enum: DIRECAO_OPERACIONAL_VALUES })
  @IsString()
  @IsNotEmpty()
  @IsIn(DIRECAO_OPERACIONAL_VALUES as unknown as string[])
  direcaoOperacional!: DirecaoOperacional;

  @ApiProperty({ enum: PAPEL_CALCULO_VALUES })
  @IsString()
  @IsNotEmpty()
  @IsIn(PAPEL_CALCULO_VALUES as unknown as string[])
  papelCalculo!: PapelCalculo;

  @ApiProperty({ enum: CONDICAO_VEICULO_VALUES })
  @IsString()
  @IsNotEmpty()
  @IsIn(CONDICAO_VEICULO_VALUES as unknown as string[])
  condicaoVeiculo!: CondicaoVeiculo;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  pesoCapturado!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataHora?: string;

  @ApiProperty()
  @IsUUID()
  balancaId!: string;

  @ApiProperty({ enum: ORIGEM_LEITURA_VALUES })
  @IsString()
  @IsIn(ORIGEM_LEITURA_VALUES as unknown as string[])
  origemLeitura!: OrigemLeitura;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  indicadorEstabilidade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sequenceNoDispositivo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventIdOrigem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}
