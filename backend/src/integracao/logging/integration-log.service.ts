import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayloadMaskerService } from '../payload/payload-masker.service';

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

@Injectable()
export class IntegrationLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masker: PayloadMaskerService,
  ) {}

  log(input: IntegrationLogInput) {
    return this.prisma.integracaoLog.create({
      data: {
        profileId: input.profileId,
        direction: input.direction,
        operation: input.operation,
        status: input.status,
        correlationId: input.correlationId,
        requestPayloadMasked: this.masker.stringifyMasked(input.requestPayloadMasked),
        responsePayloadMasked: this.masker.stringifyMasked(input.responsePayloadMasked),
        httpStatus: input.httpStatus,
        durationMs: input.durationMs,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
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
