import { OutboxService } from './outbox.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RetryPolicyService } from '../retry/retry-policy.service';

describe('OutboxService', () => {
  const prisma = {
    integracaoOutbox: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const retryPolicy = {
    shouldRetry: jest.fn().mockReturnValue(true),
    nextRetryAt: jest.fn().mockReturnValue(new Date('2026-04-29T12:00:00Z')),
  };

  beforeEach(() => jest.clearAllMocks());

  it('serializa payload canonico ao enfileirar evento', async () => {
    prisma.integracaoOutbox.upsert.mockResolvedValue({ id: 'evt-1' });
    const service = new OutboxService(
      prisma as unknown as PrismaService,
      retryPolicy as unknown as RetryPolicyService,
    );

    await service.enqueue({
      profileId: 'profile-1',
      eventType: 'weighing.ticket.closed',
      entityType: 'weighing_ticket',
      entityId: 'ticket-1',
      revision: 1,
      idempotencyKey: 'tenant:ticket-1:1',
      payloadCanonical: { ticketId: 'ticket-1' },
      correlationId: 'corr-1',
    });

    expect(prisma.integracaoOutbox.upsert).toHaveBeenCalledWith({
      where: { idempotencyKey: 'tenant:ticket-1:1' },
      update: expect.objectContaining({
        payloadCanonical: expect.stringMatching(/^enc:v1:/),
      }),
      create: expect.objectContaining({
        payloadCanonical: expect.stringMatching(/^enc:v1:/),
      }),
    });
    const encrypted = prisma.integracaoOutbox.upsert.mock.calls[0][0].create.payloadCanonical;
    expect(service.parsePayload(encrypted)).toEqual({ ticketId: 'ticket-1' });
  });

  it('marca evento como enviado', async () => {
    prisma.integracaoOutbox.update.mockResolvedValue({ id: 'evt-1', status: 'sent' });
    const service = new OutboxService(
      prisma as unknown as PrismaService,
      retryPolicy as unknown as RetryPolicyService,
    );

    await service.markSent('evt-1');

    expect(prisma.integracaoOutbox.update).toHaveBeenCalledWith({
      where: { id: 'evt-1' },
      data: expect.objectContaining({
        status: 'sent',
        lastError: null,
      }),
    });
  });
});
