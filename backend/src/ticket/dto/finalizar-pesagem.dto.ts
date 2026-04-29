import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTicketDto } from './create-ticket.dto';
import { RegistrarPassagemDto } from './registrar-passagem.dto';
import { AdicionarDescontoDto } from './adicionar-desconto.dto';

export class FinalizarPesagemDto {
  @ApiPropertyOptional({
    description: 'Ticket existente. Ausente quando a operação deve abrir ticket.',
  })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiPropertyOptional({ description: 'Dados para abrir ticket dentro da mesma transação.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTicketDto)
  ticket?: CreateTicketDto;

  @ValidateNested()
  @Type(() => RegistrarPassagemDto)
  passagem!: RegistrarPassagemDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => AdicionarDescontoDto)
  desconto?: AdicionarDescontoDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  fechar?: boolean;

  @ApiPropertyOptional({ description: 'Chave idempotente gerada pelo terminal para retry seguro.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  idempotencyKey?: string;
}
