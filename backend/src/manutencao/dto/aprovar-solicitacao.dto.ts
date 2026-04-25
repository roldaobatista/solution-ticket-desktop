import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AprovarSolicitacaoDto {
  @ApiProperty()
  @IsUUID()
  aprovadorId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  justificativa?: string;
}
