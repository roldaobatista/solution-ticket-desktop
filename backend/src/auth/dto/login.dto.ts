import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@solutionticket.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SuaSenhaSegura2024!' })
  @IsString()
  @IsNotEmpty()
  senha!: string;

  @ApiPropertyOptional({
    description: 'Obrigatorio quando o mesmo e-mail existe em mais de um tenant',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
