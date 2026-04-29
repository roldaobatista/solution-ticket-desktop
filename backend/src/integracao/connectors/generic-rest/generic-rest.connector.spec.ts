import { GenericRestConnector } from './generic-rest.connector';
import { ConnectorAuthService } from '../auth/connector-auth.service';
import { ConnectorHttpClientService } from '../http/connector-http-client.service';

describe('GenericRestConnector', () => {
  const http = {
    request: jest.fn(),
  };
  const auth = {
    applyAuth: jest.fn(async (headers: Record<string, string>) => headers),
  };
  const context = {
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    profileId: 'profile-1',
    correlationId: 'corr-1',
  };
  const event = {
    eventType: 'weighing.ticket.closed',
    entityType: 'weighing_ticket',
    entityId: 'ticket-1',
    revision: 1,
    idempotencyKey: 'tenant:profile:ticket-1:1',
    payload: { numero: 'TK-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    auth.applyAuth.mockImplementation(async (headers: Record<string, string>) => headers);
  });

  function makeConnector() {
    return new GenericRestConnector(
      http as unknown as ConnectorHttpClientService,
      auth as unknown as ConnectorAuthService,
    );
  }

  it('envia evento canonico para endpoint configurado por entidade', async () => {
    http.request.mockResolvedValue({
      status: 201,
      ok: true,
      headers: { etag: 'v1' },
      body: { data: { id: 'remote-1', code: 'ERP-1' } },
    });

    const result = await makeConnector().push(
      event,
      {
        baseUrl: 'https://erp.example.test',
        authMethod: 'api_key',
        secretRef: 'erp-token',
        options: {
          entityPaths: { weighing_ticket: '/api/tickets' },
          externalIdPath: 'data.id',
          externalCodePath: 'data.code',
          headers: { 'X-Tenant': 'tenant-1' },
        },
      },
      context,
    );

    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        baseUrl: 'https://erp.example.test',
        path: '/api/tickets',
        headers: expect.objectContaining({
          'X-Tenant': 'tenant-1',
          'Idempotency-Key': event.idempotencyKey,
          'X-Correlation-Id': 'corr-1',
        }),
        body: expect.objectContaining({
          eventType: event.eventType,
          payload: event.payload,
        }),
      }),
    );
    expect(auth.applyAuth).toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      externalId: 'remote-1',
      externalCode: 'ERP-1',
      remoteVersion: 'v1',
    });
  });

  it('classifica 500 como falha tecnica retryable', async () => {
    http.request.mockResolvedValue({
      status: 500,
      ok: false,
      headers: {},
      body: { message: 'ERP indisponivel' },
    });

    const result = await makeConnector().push(
      event,
      { baseUrl: 'https://erp.example.test', authMethod: 'none' },
      context,
    );

    expect(result).toEqual({
      ok: false,
      retryable: true,
      errorCategory: 'technical',
      errorCode: 'HTTP_500',
      errorMessage: 'ERP indisponivel',
    });
  });

  it('testa conexao usando healthPath configurado', async () => {
    http.request.mockResolvedValue({ status: 204, ok: true, headers: {}, body: null });

    const result = await makeConnector().testConnection(
      {
        baseUrl: 'https://erp.example.test',
        authMethod: 'none',
        options: { healthPath: '/status', successStatus: [200, 204] },
      },
      context,
    );

    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/status' }),
    );
    expect(result.ok).toBe(true);
  });
});
