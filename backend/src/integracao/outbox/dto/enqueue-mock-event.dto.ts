import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

const mockScenarios = [
  'success',
  'timeout',
  'server_error',
  'product_not_found',
  'order_closed',
  'duplicate',
] as const;

export class EnqueueMockEventDto {
  @ApiProperty({ default: 'weighing.ticket.closed' })
  @IsString()
  eventType!: string;

  @ApiProperty({ default: 'weighing_ticket' })
  @IsString()
  entityType!: string;

  @ApiProperty()
  @IsString()
  entityId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  revision?: number;

  @ApiPropertyOptional({ enum: mockScenarios })
  @IsOptional()
  @IsIn(mockScenarios)
  mockScenario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
