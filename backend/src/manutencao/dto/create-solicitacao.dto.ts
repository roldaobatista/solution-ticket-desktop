import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSolicitacaoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipoSolicitacao!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entidadeAlvo!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entidadeId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  solicitanteId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motivo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  aprovadorPrimarioId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  aprovadorSecundarioId?: string;
}
