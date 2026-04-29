import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelarTicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motivo!: string;
}
