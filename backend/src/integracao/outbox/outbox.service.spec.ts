import { OutboxService } from './outbox.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RetryPolicyService } from '../retry/retry-policy.service';
import { ConflictException } from '@nestjs/common';

describe('OutboxService', () => {
  const originalSecret = process.env.JWT_SECRET;
  const prisma = {
    integracaoOutbox: {
      upsert: jest.fn(),
      create: jest.fn(),
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

  beforeEach(() => {
    process.env.JWT_SECRET = 'o'.repeat(48);
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('serializa payload canonico ao enfileirar evento', async () => {
    prisma.integracaoOutbox.findUnique.mockResolvedValue(null);
    prisma.integracaoOutbox.create.mockResolvedValue({ id: 'evt-1' });
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

    expect(prisma.integracaoOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        payloadCanonical: expect.stringMatching(/^enc:v1:/),
      }),
    });
    const encrypted = prisma.integracaoOutbox.create.mock.calls[0][0].data.payloadCanonical;
    expect(service.parsePayload(encrypted)).toEqual({ ticketId: 'ticket-1' });
  });

  it('retorna evento existente sem mutar payload nem correlationId em idempotencyKey repetida', async () => {
    prisma.integracaoOutbox.findUnique.mockResolvedValue({
      id: 'evt-1',
      payloadCanonical: JSON.stringify({ ticketId: 'ticket-1' }),
    });
    const service = new OutboxService(
      prisma as unknown as PrismaService,
      retryPolicy as unknown as RetryPolicyService,
    );

    const result = await service.enqueue({
      profileId: 'profile-1',
      eventType: 'weighing.ticket.closed',
      entityType: 'weighing_ticket',
      entityId: 'ticket-1',
      revision: 1,
      idempotencyKey: 'tenant:ticket-1:1',
      payloadCanonical: { ticketId: 'ticket-1' },
      correlationId: 'corr-new',
    });

    expect(result).toEqual(expect.objectContaining({ id: 'evt-1' }));
    expect(prisma.integracaoOutbox.create).not.toHaveBeenCalled();
    expect(prisma.integracaoOutbox.upsert).not.toHaveBeenCalled();
    expect(prisma.integracaoOutbox.update).not.toHaveBeenCalled();
  });

  it('rejeita idempotencyKey repetida com payload divergente', async () => {
    prisma.integracaoOutbox.findUnique.mockResolvedValue({
      id: 'evt-1',
      payloadCanonical: JSON.stringify({ ticketId: 'ticket-1', total: 10 }),
    });
    const service = new OutboxService(
      prisma as unknown as PrismaService,
      retryPolicy as unknown as RetryPolicyService,
    );

    await expect(
      service.enqueue({
        profileId: 'profile-1',
        eventType: 'weighing.ticket.closed',
        entityType: 'weighing_ticket',
        entityId: 'ticket-1',
        revision: 1,
        idempotencyKey: 'tenant:ticket-1:1',
        payloadCanonical: { ticketId: 'ticket-1', total: 99 },
        correlationId: 'corr-new',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
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

  it('usa retryAfterAt explicito ao marcar falha retryable mascarando PII no erro', async () => {
    prisma.integracaoOutbox.findUnique.mockResolvedValue({ id: 'evt-1', attempts: 1 });
    prisma.integracaoOutbox.update.mockResolvedValue({
      id: 'evt-1',
      status: 'awaiting_retry',
    });
    const retryAfterAt = new Date('2026-04-29T12:30:00Z');
    const service = new OutboxService(
      prisma as unknown as PrismaService,
      retryPolicy as unknown as RetryPolicyService,
    );

    await service.markFailed(
      'evt-1',
      new Error('Falha CPF 123.456.789-09 token access_token=segredo'),
      'technical',
      retryAfterAt,
    );

    expect(prisma.integracaoOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'awaiting_retry',
          nextRetryAt: retryAfterAt,
          lastError: 'Falha CPF [REDACTED] token access_token=[REDACTED]',
        }),
      }),
    );
    expect(retryPolicy.nextRetryAt).not.toHaveBeenCalled();
  });
});
