import { IntegrationLogService } from './integration-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PayloadMaskerService } from '../payload/payload-masker.service';

describe('IntegrationLogService', () => {
  const prisma = {
    integracaoLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const masker = {
    stringifyMasked: jest.fn((payload: unknown) =>
      payload === undefined ? undefined : JSON.stringify(payload),
    ),
  };

  beforeEach(() => jest.clearAllMocks());

  it('persiste payloads mascarados serializados', async () => {
    prisma.integracaoLog.create.mockResolvedValue({ id: 'log-1' });
    const service = new IntegrationLogService(
      prisma as unknown as PrismaService,
      masker as unknown as PayloadMaskerService,
    );

    await service.log({
      direction: 'outbound',
      operation: 'pushTicket',
      status: 'sent',
      correlationId: 'corr-1',
      requestPayloadMasked: { token: '[REDACTED]' },
    });

    expect(prisma.integracaoLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestPayloadMasked: JSON.stringify({ token: '[REDACTED]' }),
        responsePayloadMasked: undefined,
      }),
    });
  });

  it('consulta logs por correlation id em ordem cronologica', async () => {
    prisma.integracaoLog.findMany.mockResolvedValue([]);
    const service = new IntegrationLogService(
      prisma as unknown as PrismaService,
      masker as unknown as PayloadMaskerService,
    );

    await service.getByCorrelationId('corr-1');

    expect(prisma.integracaoLog.findMany).toHaveBeenCalledWith({
      where: { correlationId: 'corr-1' },
      orderBy: { criadoEm: 'asc' },
    });
  });
});
