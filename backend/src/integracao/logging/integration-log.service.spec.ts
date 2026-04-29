import { IntegrationLogService } from './integration-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PayloadMaskerService } from '../payload/payload-masker.service';

describe('IntegrationLogService', () => {
  const prisma = {
    integracaoLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const masker = {
    stringifyMasked: jest.fn((payload: unknown) =>
      payload === undefined ? undefined : JSON.stringify(payload),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.integracaoLog.findFirst.mockResolvedValue(null);
  });

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
        prevHash: null,
        hash: expect.any(String),
      }),
    });
  });

  it('mascara PII em mensagens de erro antes de persistir', async () => {
    prisma.integracaoLog.create.mockResolvedValue({ id: 'log-1' });
    const service = new IntegrationLogService(
      prisma as unknown as PrismaService,
      masker as unknown as PayloadMaskerService,
    );

    await service.log({
      direction: 'outbound',
      operation: 'pushTicket',
      status: 'error',
      correlationId: 'corr-1',
      errorMessage: 'ERP retornou CPF 123.456.789-09 e access_token=segredo',
    });

    expect(prisma.integracaoLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        errorMessage: 'ERP retornou CPF [REDACTED] e access_token=[REDACTED]',
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
