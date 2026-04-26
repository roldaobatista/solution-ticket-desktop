import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class InvalidarPassagemDto {
  @ApiProperty({ description: 'Motivo da invalidação da passagem' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo!: string;
}
