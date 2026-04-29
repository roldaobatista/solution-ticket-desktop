import {
  CanonicalIntegrationEvent,
  ConnectorCapabilities,
  ConnectorConfig,
  IErpConnector,
  IntegrationContext,
  PushResult,
} from '../connector.interface';

type MockScenario =
  | 'success'
  | 'timeout'
  | 'server_error'
  | 'product_not_found'
  | 'order_closed'
  | 'duplicate';

export class MockErpConnector implements IErpConnector {
  readonly code = 'mock';
  readonly name = 'Mock ERP Connector';
  readonly version = '1.0.0';

  capabilities(): ConnectorCapabilities {
    return {
      authMethods: ['none'],
      entities: ['weighing_ticket', 'partner', 'product', 'vehicle'],
      supportsInbound: true,
      supportsOutbound: true,
    };
  }

  async testConnection(_config: ConnectorConfig, context: IntegrationContext): Promise<PushResult> {
    return {
      ok: true,
      externalCode: `mock:${context.profileId}`,
    };
  }

  async push(
    event: CanonicalIntegrationEvent,
    config: ConnectorConfig,
    _context: IntegrationContext,
  ): Promise<PushResult> {
    const scenario = this.resolveScenario(config, event);

    if (scenario === 'timeout') {
      return {
        ok: false,
        retryable: true,
        errorCategory: 'technical',
        errorCode: 'MOCK_TIMEOUT',
        errorMessage: 'Timeout simulado pelo Mock ERP',
      };
    }

    if (scenario === 'server_error') {
      return {
        ok: false,
        retryable: true,
        errorCategory: 'technical',
        errorCode: 'MOCK_500',
        errorMessage: 'Erro 500 simulado pelo Mock ERP',
      };
    }

    if (scenario === 'product_not_found') {
      return {
        ok: false,
        retryable: false,
        errorCategory: 'business',
        errorCode: 'PRODUCT_NOT_FOUND',
        errorMessage: 'Produto inexistente no ERP simulado',
      };
    }

    if (scenario === 'order_closed') {
      return {
        ok: false,
        retryable: false,
        errorCategory: 'business',
        errorCode: 'ORDER_CLOSED',
        errorMessage: 'Pedido encerrado no ERP simulado',
      };
    }

    return {
      ok: true,
      externalId: `mock-${event.entityType}-${event.entityId}`,
      externalCode: scenario === 'duplicate' ? event.idempotencyKey : undefined,
      remoteVersion: String(event.revision),
    };
  }

  private resolveScenario(config: ConnectorConfig, event: CanonicalIntegrationEvent): MockScenario {
    const configured = config.options?.scenario;
    if (this.isScenario(configured)) return configured;

    const payload = event.payload as { mockScenario?: unknown } | undefined;
    if (this.isScenario(payload?.mockScenario)) return payload.mockScenario;

    return 'success';
  }

  private isScenario(value: unknown): value is MockScenario {
    return (
      value === 'success' ||
      value === 'timeout' ||
      value === 'server_error' ||
      value === 'product_not_found' ||
      value === 'order_closed' ||
      value === 'duplicate'
    );
  }
}
