import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIndicadorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cor?: string;
}
