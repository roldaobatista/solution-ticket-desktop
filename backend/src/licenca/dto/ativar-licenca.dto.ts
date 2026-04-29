import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AtivarLicencaDto {
  @ApiProperty({ description: 'Id da unidade que recebera a licenca' })
  @IsUUID()
  unidadeId!: string;

  @ApiProperty({ description: 'Chave de licenca (JWT RS256)' })
  @IsString()
  @IsNotEmpty()
  chave!: string;
}

export class IniciarTrialDto {
  @ApiProperty()
  @IsUUID()
  unidadeId!: string;
}
