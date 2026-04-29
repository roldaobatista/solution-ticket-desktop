import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AprovarSolicitacaoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  aprovadorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  justificativa?: string;
}
