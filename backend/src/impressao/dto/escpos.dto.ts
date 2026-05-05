import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export const ESC_POS_PORT_PATTERN =
  /^(((COM|LPT)\d{1,3}|USB\d{1,3})|\/dev\/usb\/lp\d+|\/dev\/lp\d+|\/dev\/tty(S|USB|ACM)\d+|\/dev\/(cu|tty)\.[A-Za-z0-9._-]+|\/dev\/serial\/by-id\/[A-Za-z0-9._:-]+)$/i;

export class ImprimirEscposDto {
  @ApiProperty({
    description: 'Porta fisica da impressora ESC/POS',
    examples: ['COM3', 'LPT1', 'USB001', '/dev/usb/lp0'],
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 120)
  @Matches(ESC_POS_PORT_PATTERN, {
    message: 'porta deve ser uma porta COM/LPT/USB ou device ESC/POS permitido em /dev',
  })
  porta!: string;
}

export class SalvarEscposDto {
  @ApiPropertyOptional({
    description: 'Nome do arquivo temporario, sem diretorios',
    example: 'ticket-123.bin',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Length(1, 120)
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: 'nome deve conter apenas letras, numeros, ponto, hifen ou underscore',
  })
  nome?: string;
}
