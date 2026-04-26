import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CancelarTicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motivo!: string;
}
