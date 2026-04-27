import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  senhaAtual!: string;

  @ApiProperty({ description: 'Nova senha (10+ caracteres, ao menos 1 letra e 1 numero)' })
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  novaSenha!: string;
}

export class RequestPasswordResetDto {
  @ApiProperty()
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  token!: string;

  @ApiProperty({ description: 'Nova senha (10+ caracteres, ao menos 1 letra e 1 numero)' })
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  novaSenha!: string;
}
