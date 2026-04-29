import { OutboxProcessorService } from './outbox-processor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxService } from './outbox.service';
import { ConnectorRegistryService } from '../connectors/connector-registry.service';
import { IntegrationLogService } from '../logging/integration-log.service';

describe('OutboxProcessorService', () => {
  const baseEvent = {
    id: 'evt-1',
    profileId: 'profile-1',
    eventType: 'weighing.ticket.closed',
    entityType: 'weighing_ticket',
    entityId: 'ticket-1',
    revision: 1,
    idempotencyKey: 'tenant:profile:weighing_ticket:ticket-1:1',
    payloadCanonical: JSON.stringify({ ticketId: 'ticket-1' }),
    payloadRemote: null,
    status: 'processing',
    attempts: 1,
    nextRetryAt: null,
    lastError: null,
    lastErrorCategory: null,
    correlationId: 'corr-1',
    criadoEm: new Date('2026-04-29T12:00:00Z'),
    processedAt: null,
    profile: {
      id: 'profile-1',
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      unidadeId: null,
      baseUrl: null,
      authMethod: 'none',
      secretRef: null,
      configJson: JSON.stringify({ pushPath: '/erp/events' }),
      enabled: true,
      connector: { code: 'mock' },
    },
  };

  const prisma = {
    integracaoOutbox: {
      findUnique: jest.fn(),
    },
    integracaoExternalLink: {
      upsert: jest.fn(),
    },
  };
  const outbox = {
    dequeue: jest.fn(),
    markSent: jest.fn(),
    markFailed: jest.fn(),
    parsePayload: jest.fn((payload: string) => JSON.parse(payload)),
  };
  const connector = {
    push: jest.fn(),
  };
  const registry = {
    get: jest.fn(() => connector),
  };
  const logs = {
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeService() {
    return new OutboxProcessorService(
      prisma as unknown as PrismaService,
      outbox as unknown as OutboxService,
      registry as unknown as ConnectorRegistryService,
      logs as unknown as IntegrationLogService,
    );
  }

  it('processa evento com sucesso, cria external link e marca como sent', async () => {
    outbox.dequeue.mockResolvedValue({ id: 'evt-1' });
    prisma.integracaoOutbox.findUnique.mockResolvedValue(baseEvent);
    connector.push.mockResolvedValue({
      ok: true,
      externalId: 'remote-1',
      externalCode: 'R-1',
      remoteVersion: '1',
    });
    outbox.markSent.mockResolvedValue({ id: 'evt-1', status: 'sent' });

    const result = await makeService().processNext();

    expect(connector.push).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ options: { pushPath: '/erp/events' } }),
      expect.any(Object),
    );
    expect(result).toEqual({ processed: true, eventId: 'evt-1', status: 'sent' });
    expect(prisma.integracaoExternalLink.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          profileId: 'profile-1',
          entityType: 'weighing_ticket',
          localId: 'ticket-1',
          externalId: 'remote-1',
        }),
      }),
    );
    expect(logs.log).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent' }));
  });

  it('classifica falha de negocio sem retry tecnico', async () => {
    outbox.dequeue.mockResolvedValue({ id: 'evt-1' });
    prisma.integracaoOutbox.findUnique.mockResolvedValue(baseEvent);
    connector.push.mockResolvedValue({
      ok: false,
      retryable: false,
      errorCategory: 'business',
      errorCode: 'PRODUCT_NOT_FOUND',
      errorMessage: 'Produto inexistente',
    });
    outbox.markFailed.mockResolvedValue({
      id: 'evt-1',
      status: 'error',
      lastErrorCategory: 'business',
    });

    const result = await makeService().processNext();

    expect(outbox.markFailed).toHaveBeenCalledWith('evt-1', expect.any(Error), 'business');
    expect(result).toEqual({
      processed: true,
      eventId: 'evt-1',
      status: 'error',
      errorCategory: 'business',
      errorCode: 'PRODUCT_NOT_FOUND',
    });
  });
});
