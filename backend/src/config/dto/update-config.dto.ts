import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pesagemComTara?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pesagemEntrada?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pesagemSaida?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  financeiro?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cameras?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  transportadoraHabilitada?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  motoristaHabilitado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  armazemHabilitado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  manutencaoTicket?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  conversaoUnidade?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  precoVenda?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  bilhetagem?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  origemDestino?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  calculoFrete?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tabelaUmidade?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  descontos?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emissaoRomaneio?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  edicaoRomaneio?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  habilitaBaixa?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  listaDocumentos?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  previewImpressao?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  numeroCopias?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modeloTicketPadrao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  labelAdicional1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  labelAdicional2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  observacaoHabilitada?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rodapeTexto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  manterTaraCadastrada?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  balancaPadraoEntrada?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  balancaPadraoSaida?: string | null;
}
