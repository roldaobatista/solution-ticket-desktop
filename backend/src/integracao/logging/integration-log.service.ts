import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PayloadMaskerService } from '../payload/payload-masker.service';
import { scrubPii } from '../../common/pii.util';

export interface IntegrationLogInput {
  profileId?: string;
  direction: 'inbound' | 'outbound';
  operation: string;
  status: string;
  correlationId: string;
  requestPayloadMasked?: unknown;
  responsePayloadMasked?: unknown;
  httpStatus?: number;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
}

function canonicalizar(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizar);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalizar((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function sha256(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalizar(value)))
    .digest('hex');
}

@Injectable()
export class IntegrationLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masker: PayloadMaskerService,
  ) {}

  async log(input: IntegrationLogInput) {
    const criadoEm = new Date();
    const requestPayloadMasked = this.masker.stringifyMasked(input.requestPayloadMasked);
    const responsePayloadMasked = this.masker.stringifyMasked(input.responsePayloadMasked);
    const errorMessage = input.errorMessage ? (scrubPii(input.errorMessage) as string) : undefined;
    const anterior = await this.prisma.integracaoLog.findFirst({
      where: { profileId: input.profileId ?? null },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
      select: { hash: true },
    });
    const prevHash = anterior?.hash ?? null;
    const hash = sha256({
      profileId: input.profileId ?? null,
      direction: input.direction,
      operation: input.operation,
      status: input.status,
      correlationId: input.correlationId,
      requestPayloadMasked,
      responsePayloadMasked,
      httpStatus: input.httpStatus ?? null,
      durationMs: input.durationMs ?? null,
      errorCode: input.errorCode ?? null,
      errorMessage: errorMessage ?? null,
      criadoEm: criadoEm.toISOString(),
      prevHash,
    });

    return this.prisma.integracaoLog.create({
      data: {
        profileId: input.profileId,
        direction: input.direction,
        operation: input.operation,
        status: input.status,
        correlationId: input.correlationId,
        requestPayloadMasked,
        responsePayloadMasked,
        httpStatus: input.httpStatus,
        durationMs: input.durationMs,
        errorCode: input.errorCode,
        errorMessage,
        criadoEm,
        prevHash,
        hash,
      },
    });
  }

  getByCorrelationId(correlationId: string) {
    return this.prisma.integracaoLog.findMany({
      where: { correlationId },
      orderBy: { criadoEm: 'asc' },
    });
  }
}
