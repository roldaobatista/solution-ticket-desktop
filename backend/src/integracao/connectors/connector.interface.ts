export interface ConnectorCapabilities {
  authMethods: string[];
  entities: string[];
  supportsInbound: boolean;
  supportsOutbound: boolean;
}

export interface ConnectorConfig {
  baseUrl?: string;
  authMethod: string;
  secretRef?: string;
  options?: Record<string, unknown>;
}

export interface IntegrationContext {
  tenantId: string;
  empresaId: string;
  unidadeId?: string;
  profileId: string;
  correlationId: string;
}

export interface CanonicalIntegrationEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  revision: number;
  payload: unknown;
  idempotencyKey: string;
}

export interface PushResult {
  ok: boolean;
  externalId?: string;
  externalCode?: string;
  remoteVersion?: string;
  retryable?: boolean;
  errorCategory?: 'technical' | 'business';
  errorCode?: string;
  errorMessage?: string;
}

export interface PullResult {
  events: CanonicalIntegrationEvent[];
  nextToken?: string;
}

export interface IErpConnector {
  readonly code: string;
  readonly name: string;
  readonly version: string;
  capabilities(): ConnectorCapabilities;
  testConnection(config: ConnectorConfig, context: IntegrationContext): Promise<PushResult>;
  push(
    event: CanonicalIntegrationEvent,
    config: ConnectorConfig,
    context: IntegrationContext,
  ): Promise<PushResult>;
  pull?(config: ConnectorConfig, context: IntegrationContext, cursor?: string): Promise<PullResult>;
}
