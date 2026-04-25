import { IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConfigDto {
  @ApiProperty()
  @IsUUID()
  empresaId!: string;

  @ApiProperty()
  @IsUUID()
  unidadeId!: string;

  // Feature flags
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

  // Impressao
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
  @IsBoolean()
  manterPreviewAberto?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modeloTicketPadrao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logomarcaPadrao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logomarcaRelatorio?: string;

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
}
