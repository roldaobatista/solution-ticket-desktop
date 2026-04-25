import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO base para paginacao em endpoints de listagem.
 *
 * Defaults: page=1, limit=20. Cap: limit<=200 para impedir DoS por
 * cliente solicitando 1M registros. Use `extends PaginationDto` em
 * filter DTOs especificos.
 */
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Resolve page/limit aplicando defaults e cap. Use no inicio do
 * findAll() para padronizar o calculo de skip.
 */
export function resolvePaging(input: { page?: number; limit?: number }): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(200, Math.max(1, input.limit ?? 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
