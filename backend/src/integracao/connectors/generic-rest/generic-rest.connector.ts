import { Injectable } from '@nestjs/common';
import {
  CanonicalIntegrationEvent,
  ConnectorCapabilities,
  ConnectorConfig,
  IErpConnector,
  IntegrationContext,
  PushResult,
} from '../connector.interface';
import { ConnectorAuthService } from '../auth/connector-auth.service';
import {
  ConnectorHttpClientService,
  ConnectorHttpResponse,
} from '../http/connector-http-client.service';

@Injectable()
export class GenericRestConnector implements IErpConnector {
  readonly code = 'generic-rest';
  readonly name = 'Generic REST ERP Connector';
  readonly version = '1.0.0';

  constructor(
    private readonly http: ConnectorHttpClientService,
    private readonly auth: ConnectorAuthService,
  ) {}

  capabilities(): ConnectorCapabilities {
    return {
      authMethods: ['none', 'api_key', 'basic'],
      entities: ['weighing_ticket', 'partner', 'product', 'vehicle'],
      supportsInbound: false,
      supportsOutbound: true,
    };
  }

  async testConnection(config: ConnectorConfig, context: IntegrationContext): Promise<PushResult> {
    if (!config.baseUrl) return this.businessError('BASE_URL_REQUIRED', 'baseUrl obrigatoria');

    try {
      const response = await this.http.request({
        method: 'GET',
        baseUrl: config.baseUrl,
        path: this.optionString(config.options?.healthPath) ?? '/health',
        headers: await this.auth.applyAuth(this.configuredHeaders(config), config, context),
        timeoutMs: this.timeoutMs(config),
      });

      return this.responseToResult(response, config, 'Conexao validada');
    } catch (error) {
      return this.technicalError('CONNECTION_FAILED', (error as Error).message);
    }
  }

  async push(
    event: CanonicalIntegrationEvent,
    config: ConnectorConfig,
    context: IntegrationContext,
  ): Promise<PushResult> {
    if (!config.baseUrl) return this.businessError('BASE_URL_REQUIRED', 'baseUrl obrigatoria');

    try {
      const response = await this.http.request({
        method: 'POST',
        baseUrl: config.baseUrl,
        path: this.pushPath(event, config),
        headers: await this.auth.applyAuth(
          {
            ...this.configuredHeaders(config),
            'Idempotency-Key': event.idempotencyKey,
            'X-Correlation-Id': context.correlationId,
          },
          config,
          context,
        ),
        body: {
          eventType: event.eventType,
          entityType: event.entityType,
          entityId: event.entityId,
          revision: event.revision,
          idempotencyKey: event.idempotencyKey,
          payload: event.payload,
        },
        timeoutMs: this.timeoutMs(config),
      });

      return this.responseToResult(response, config, 'Evento enviado');
    } catch (error) {
      return this.technicalError('REQUEST_FAILED', (error as Error).message);
    }
  }

  private responseToResult(
    response: ConnectorHttpResponse,
    config: ConnectorConfig,
    defaultMessage: string,
  ): PushResult {
    if (this.isSuccessStatus(response.status, config)) {
      return {
        ok: true,
        externalId: this.pathString(
          response.body,
          this.optionString(config.options?.externalIdPath),
        ),
        externalCode: this.pathString(
          response.body,
          this.optionString(config.options?.externalCodePath),
        ),
        remoteVersion:
          this.pathString(response.body, this.optionString(config.options?.remoteVersionPath)) ??
          response.headers.etag,
      };
    }

    const retryable = response.status >= 500 || response.status === 408 || response.status === 429;
    return {
      ok: false,
      retryable,
      errorCategory: retryable ? 'technical' : 'business',
      errorCode: `HTTP_${response.status}`,
      errorMessage: this.errorMessage(response.body) ?? defaultMessage,
    };
  }

  private configuredHeaders(config: ConnectorConfig): Record<string, string> {
    const headers = config.options?.headers;
    if (!headers || typeof headers !== 'object' || Array.isArray(headers)) return {};
    return Object.fromEntries(
      Object.entries(headers).filter((entry): entry is [string, string] => {
        const [, value] = entry;
        return typeof value === 'string';
      }),
    );
  }

  private pushPath(event: CanonicalIntegrationEvent, config: ConnectorConfig): string {
    const entityPaths = config.options?.entityPaths;
    if (entityPaths && typeof entityPaths === 'object' && !Array.isArray(entityPaths)) {
      const path = (entityPaths as Record<string, unknown>)[event.entityType];
      if (typeof path === 'string' && path.trim()) return path;
    }
    return this.optionString(config.options?.pushPath) ?? `/events/${event.entityType}`;
  }

  private timeoutMs(config: ConnectorConfig): number {
    const value = config.options?.timeoutMs;
    return typeof value === 'number' && value >= 1000 ? value : 15000;
  }

  private isSuccessStatus(status: number, config: ConnectorConfig): boolean {
    const configured = config.options?.successStatus;
    if (Array.isArray(configured)) return configured.includes(status);
    if (typeof configured === 'number') return status === configured;
    return status >= 200 && status < 300;
  }

  private pathString(body: unknown, path?: string): string | undefined {
    if (!path) return undefined;
    const value = path.split('.').reduce<unknown>((current, segment) => {
      if (!current || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[segment];
    }, body);
    return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
  }

  private errorMessage(body: unknown): string | undefined {
    if (typeof body === 'string') return body;
    if (!body || typeof body !== 'object') return undefined;
    const record = body as Record<string, unknown>;
    return this.optionString(record.message) ?? this.optionString(record.error);
  }

  private optionString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private technicalError(errorCode: string, errorMessage: string): PushResult {
    return { ok: false, retryable: true, errorCategory: 'technical', errorCode, errorMessage };
  }

  private businessError(errorCode: string, errorMessage: string): PushResult {
    return { ok: false, retryable: false, errorCategory: 'business', errorCode, errorMessage };
  }
}
