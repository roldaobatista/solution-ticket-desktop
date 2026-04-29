import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpsertProfileSecretDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  value!: string;
}
