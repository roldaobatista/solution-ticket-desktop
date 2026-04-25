import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateTipoVeiculoDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  precoPesagem?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
