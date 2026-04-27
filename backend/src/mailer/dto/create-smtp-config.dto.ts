import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPort,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateSmtpConfigDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  host!: string;

  @ApiProperty({ default: 587 })
  @Type(() => Number)
  @IsInt()
  @IsPort()
  port!: number;

  @ApiProperty({ default: false })
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  secure!: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  senha!: string;

  @ApiProperty()
  @IsEmail()
  from!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fromName?: string;

  @ApiPropertyOptional({ default: true })
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
