import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFormaPagamentoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipo!: string;
}
