import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FecharTicketDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}
