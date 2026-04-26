import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SolicitarManutencaoDto {
  @ApiProperty({ description: 'Motivo da solicitação de manutenção' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo!: string;
}
