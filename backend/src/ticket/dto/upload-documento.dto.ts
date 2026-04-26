import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadDocumentoMetaDto {
  @ApiPropertyOptional({ description: 'Tipo do documento (NFe, CTe, MDFe, OUTRO)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tipo?: string;

  @ApiPropertyOptional({ description: 'Número do documento fiscal' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  numero?: string;

  @ApiPropertyOptional({ description: 'Observação livre' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}
