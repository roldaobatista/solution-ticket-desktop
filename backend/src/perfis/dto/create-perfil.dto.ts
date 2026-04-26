import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreatePerfilDto {
  @IsString()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsArray()
  permissoes?: Array<{ modulo: string; acao: string; concedido?: boolean }>;
}
