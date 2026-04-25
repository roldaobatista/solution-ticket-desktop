import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AtivarLicencaDto {
  @ApiProperty({ description: 'Id da unidade que recebera a licenca' })
  @IsUUID()
  unidadeId!: string;

  @ApiProperty({ description: 'Id do tenant proprietario da unidade' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Chave de licenca (JWT RS256)' })
  @IsString()
  @IsNotEmpty()
  chave!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  usuarioId?: string;
}

export class IniciarTrialDto {
  @ApiProperty()
  @IsUUID()
  unidadeId!: string;

  @ApiProperty()
  @IsUUID()
  tenantId!: string;
}
