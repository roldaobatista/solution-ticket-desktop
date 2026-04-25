import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateTipoVeiculoDto {
  @IsString()
  tenantId!: string;

  @IsString()
  descricao!: string;

  @IsOptional()
  @IsNumber()
  precoPesagem?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
