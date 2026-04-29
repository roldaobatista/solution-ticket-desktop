import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationErrorCategory, RetryPolicyService } from '../retry/retry-policy.service';
import { decrypt, encrypt } from '../../common/crypto.util';

export interface EnqueueIntegrationEventInput {
  profileId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  revision: number;
  idempotencyKey: string;
  payloadCanonical: unknown;
  correlationId: string;
}

export interface EnqueueForTenantInput {
  tenantId: string;
  profileId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  revision: number;
  payloadCanonical: unknown;
}

@Injectable()
export class OutboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retryPolicy: RetryPolicyService,
  ) {}

  private serializePayload(payload: unknown): string {
    return `enc:v1:${encrypt(JSON.stringify(payload))}`;
  }

  parsePayload(payload: string): unknown {
    if (payload.startsWith('enc:v1:')) return JSON.parse(decrypt(payload.slice('enc:v1:'.length)));
    return JSON.parse(payload);
  }

  enqueue(input: EnqueueIntegrationEventInput) {
    const data = {
      profileId: input.profileId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      revision: input.revision,
      idempotencyKey: input.idempotencyKey,
      payloadCanonical: this.serializePayload(input.payloadCanonical),
      correlationId: input.correlationId,
    };

    return this.prisma.integracaoOutbox.upsert({
      where: { idempotencyKey: input.idempotencyKey },
      update: {
        payloadCanonical: data.payloadCanonical,
        correlationId: data.correlationId,
      },
      create: data,
    });
  }

  async enqueueForTenant(input: EnqueueForTenantInput) {
    const profile = await this.prisma.integracaoProfile.findFirst({
      where: { id: input.profileId, tenantId: input.tenantId, enabled: true },
    });
    if (!profile) throw new NotFoundException('Perfil de integracao nao encontrado');

    return this.enqueue({
      profileId: input.profileId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      revision: input.revision,
      idempotencyKey: this.makeIdempotencyKey(
        input.tenantId,
        input.profileId,
        input.entityType,
        input.entityId,
        input.revision,
      ),
      payloadCanonical: input.payloadCanonical,
      correlationId: randomUUID(),
    });
  }

  listEvents(tenantId: string, status?: string) {
    return this.prisma.integracaoOutbox.findMany({
      where: {
        status,
        profile: { tenantId },
      },
      include: { profile: { include: { connector: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
  }

  async retry(id: string, tenantId: string) {
    const event = await this.prisma.integracaoOutbox.findFirst({
      where: { id, profile: { tenantId } },
    });

    if (!event) return null;

    return this.prisma.integracaoOutbox.update({
      where: { id },
      data: {
        status: 'pending',
        nextRetryAt: null,
        lastError: null,
        lastErrorCategory: null,
      },
    });
  }

  async enqueueInTransaction(tx: Prisma.TransactionClient, input: EnqueueIntegrationEventInput) {
    return tx.integracaoOutbox.upsert({
      where: { idempotencyKey: input.idempotencyKey },
      update: {
        payloadCanonical: this.serializePayload(input.payloadCanonical),
        correlationId: input.correlationId,
      },
      create: {
        profileId: input.profileId,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        revision: input.revision,
        idempotencyKey: input.idempotencyKey,
        payloadCanonical: this.serializePayload(input.payloadCanonical),
        correlationId: input.correlationId,
      },
    });
  }

  async dequeue(tenantId?: string) {
    const leaseExpiredAt = new Date(Date.now() - 10 * 60 * 1000);
    const event = await this.prisma.integracaoOutbox.findFirst({
      where: {
        ...(tenantId ? { profile: { tenantId } } : {}),
        OR: [
          {
            status: { in: ['pending', 'awaiting_retry'] },
            OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
          },
          { status: 'processing', processedAt: { lte: leaseExpiredAt } },
        ],
      },
      orderBy: { criadoEm: 'asc' },
    });

    if (!event) return null;

    const claimed = await this.prisma.integracaoOutbox.updateMany({
      where: {
        id: event.id,
        OR: [
          { status: { in: ['pending', 'awaiting_retry'] } },
          { status: 'processing', processedAt: { lte: leaseExpiredAt } },
        ],
      },
      data: {
        status: 'processing',
        processedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    if (claimed.count !== 1) return null;
    return this.prisma.integracaoOutbox.findUnique({ where: { id: event.id } });
  }

  markSent(id: string) {
    return this.prisma.integracaoOutbox.update({
      where: { id },
      data: {
        status: 'sent',
        processedAt: new Date(),
        lastError: null,
        lastErrorCategory: null,
      },
    });
  }

  async markFailed(id: string, error: Error, category: IntegrationErrorCategory = 'technical') {
    const current = await this.prisma.integracaoOutbox.findUnique({ where: { id } });
    const attempts = current?.attempts ?? 0;
    const shouldRetry = this.retryPolicy.shouldRetry(category, attempts);

    return this.prisma.integracaoOutbox.update({
      where: { id },
      data: {
        status: shouldRetry ? 'awaiting_retry' : category === 'business' ? 'error' : 'dead',
        processedAt: null,
        nextRetryAt: shouldRetry ? this.retryPolicy.nextRetryAt(attempts) : null,
        lastError: error.message,
        lastErrorCategory: category,
      },
    });
  }

  getPending(profileId?: string) {
    return this.prisma.integracaoOutbox.findMany({
      where: {
        profileId,
        status: { in: ['pending', 'awaiting_retry', 'processing', 'error'] },
      },
      orderBy: { criadoEm: 'asc' },
    });
  }

  makeIdempotencyKey(
    tenantId: string,
    profileId: string,
    entityType: string,
    entityId: string,
    revision: number,
  ) {
    return `${tenantId}:${profileId}:${entityType}:${entityId}:${revision}`;
  }
}
