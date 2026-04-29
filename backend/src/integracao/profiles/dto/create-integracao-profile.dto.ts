import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

const environments = ['homologacao', 'producao'] as const;
const authMethods = ['none', 'api_key', 'oauth2', 'basic', 'mtls'] as const;
const syncDirections = ['inbound', 'outbound', 'bidirectional'] as const;

export class CreateIntegracaoProfileDto {
  @ApiProperty()
  @IsString()
  empresaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidadeId?: string;

  @ApiProperty()
  @IsString()
  connectorId!: string;

  @ApiProperty({ enum: environments })
  @IsIn(environments)
  environment!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  baseUrl?: string;

  @ApiProperty({ enum: authMethods })
  @IsIn(authMethods)
  authMethod!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secretRef?: string;

  @ApiPropertyOptional({
    description: 'Configuracao operacional do conector. Armazenada como JSON serializado.',
    example: {
      healthPath: '/health',
      pushPath: '/api/events',
      timeoutMs: 15000,
      apiKeyHeader: 'X-API-Key',
    },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiProperty({ enum: syncDirections })
  @IsIn(syncDirections)
  syncDirection!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
