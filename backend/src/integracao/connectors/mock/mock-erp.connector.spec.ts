import { MockErpConnector } from './mock-erp.connector';

describe('MockErpConnector', () => {
  const connector = new MockErpConnector();
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
    idempotencyKey: 'tenant:ticket-1:1',
    payload: {},
  };

  it('retorna sucesso no cenario padrao', async () => {
    const result = await connector.push({ ...event }, { authMethod: 'none' }, context);

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        externalId: 'mock-weighing_ticket-ticket-1',
      }),
    );
  });

  it('classifica timeout como erro tecnico retentavel', async () => {
    const result = await connector.push(
      { ...event },
      { authMethod: 'none', options: { scenario: 'timeout' } },
      context,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        retryable: true,
        errorCategory: 'technical',
        errorCode: 'MOCK_TIMEOUT',
      }),
    );
  });

  it('classifica produto inexistente como erro de negocio sem retry', async () => {
    const result = await connector.push(
      { ...event },
      { authMethod: 'none', options: { scenario: 'product_not_found' } },
      context,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        retryable: false,
        errorCategory: 'business',
        errorCode: 'PRODUCT_NOT_FOUND',
      }),
    );
  });
});
