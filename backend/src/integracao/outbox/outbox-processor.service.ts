import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntegracaoOutbox } from '@prisma/client';
import { ConnectorRegistryService } from '../connectors/connector-registry.service';
import { CanonicalIntegrationEvent } from '../connectors/connector.interface';
import { IntegrationLogService } from '../logging/integration-log.service';
import { OutboxService } from './outbox.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProcessOutboxResult {
  processed: boolean;
  eventId?: string;
  status?: string;
  errorCategory?: string | null;
  errorCode?: string;
}

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private processing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly registry: ConnectorRegistryService,
    private readonly logs: IntegrationLogService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processScheduled() {
    if (process.env.INTEGRACAO_WORKER_DISABLED === '1') return;
    if (this.processing) return;

    this.processing = true;
    try {
      for (let i = 0; i < 20; i++) {
        const result = await this.processNext();
        if (!result.processed) break;
      }
    } catch (error) {
      this.logger.error(`Falha no worker de integracao: ${(error as Error).message}`);
    } finally {
      this.processing = false;
    }
  }

  async processNext(tenantId?: string): Promise<ProcessOutboxResult> {
    const event = await this.outbox.dequeue(tenantId);
    if (!event) return { processed: false };

    const loaded = await this.prisma.integracaoOutbox.findUnique({
      where: { id: event.id },
      include: { profile: { include: { connector: true } } },
    });

    if (!loaded) return { processed: false };

    return this.processEvent(loaded);
  }

  private async processEvent(
    event: IntegracaoOutbox & {
      profile: {
        id: string;
        tenantId: string;
        empresaId: string;
        unidadeId: string | null;
        baseUrl: string | null;
        authMethod: string;
        secretRef: string | null;
        configJson: string | null;
        enabled: boolean;
        connector: { code: string };
      };
    },
  ): Promise<ProcessOutboxResult> {
    const startedAt = Date.now();
    const canonicalEvent = this.toCanonicalEvent(event);

    if (!event.profile.enabled) {
      const error = new Error('Perfil de integracao desativado');
      await this.outbox.markFailed(event.id, error, 'business');
      await this.logs.log({
        profileId: event.profileId,
        direction: 'outbound',
        operation: event.eventType,
        status: 'error',
        correlationId: event.correlationId,
        requestPayloadMasked: canonicalEvent.payload,
        durationMs: Date.now() - startedAt,
        errorCode: 'PROFILE_DISABLED',
        errorMessage: error.message,
      });
      return { processed: true, eventId: event.id, status: 'error', errorCategory: 'business' };
    }

    const connector = this.registry.get(event.profile.connector.code);
    const result = await connector.push(
      canonicalEvent,
      {
        baseUrl: event.profile.baseUrl ?? undefined,
        authMethod: event.profile.authMethod,
        secretRef: event.profile.secretRef ?? undefined,
        options: this.parseConfig(event.profile.configJson),
      },
      {
        tenantId: event.profile.tenantId,
        empresaId: event.profile.empresaId,
        unidadeId: event.profile.unidadeId ?? undefined,
        profileId: event.profileId,
        correlationId: event.correlationId,
      },
    );

    if (result.ok) {
      const sent = await this.outbox.markSent(event.id);
      await this.tryPersistExternalLink(
        event,
        result.externalId,
        result.externalCode,
        result.remoteVersion,
      );
      await this.tryLog({
        profileId: event.profileId,
        direction: 'outbound',
        operation: event.eventType,
        status: 'sent',
        correlationId: event.correlationId,
        requestPayloadMasked: canonicalEvent.payload,
        responsePayloadMasked: result,
        durationMs: Date.now() - startedAt,
      });
      return { processed: true, eventId: event.id, status: sent.status };
    }

    const category = result.errorCategory ?? (result.retryable ? 'technical' : 'business');
    const retryAfterAt = result.retryAfterMs
      ? new Date(Date.now() + result.retryAfterMs)
      : undefined;
    const failed = await this.outbox.markFailed(
      event.id,
      new Error(result.errorMessage ?? result.errorCode ?? 'Falha no conector'),
      category,
      retryAfterAt,
    );

    await this.tryLog({
      profileId: event.profileId,
      direction: 'outbound',
      operation: event.eventType,
      status: 'error',
      correlationId: event.correlationId,
      requestPayloadMasked: canonicalEvent.payload,
      responsePayloadMasked: result,
      durationMs: Date.now() - startedAt,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    });

    return {
      processed: true,
      eventId: event.id,
      status: failed.status,
      errorCategory: failed.lastErrorCategory,
      errorCode: result.errorCode,
    };
  }

  private toCanonicalEvent(event: IntegracaoOutbox): CanonicalIntegrationEvent {
    return {
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      revision: event.revision,
      idempotencyKey: event.idempotencyKey,
      payload: this.outbox.parsePayload(event.payloadCanonical),
    };
  }

  private parseConfig(configJson: string | null): Record<string, unknown> | undefined {
    if (!configJson) return undefined;
    try {
      const parsed = JSON.parse(configJson);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  private async persistExternalLink(
    event: IntegracaoOutbox,
    externalId?: string,
    externalCode?: string,
    remoteVersion?: string,
  ) {
    if (!externalId) return;

    await this.prisma.integracaoExternalLink.upsert({
      where: {
        integracao_external_link_local_unique: {
          profileId: event.profileId,
          entityType: event.entityType,
          localId: event.entityId,
        },
      },
      update: {
        externalId,
        externalCode,
        externalVersion: remoteVersion,
        lastSyncedAt: new Date(),
      },
      create: {
        profileId: event.profileId,
        entityType: event.entityType,
        localId: event.entityId,
        externalId,
        externalCode,
        externalVersion: remoteVersion,
        lastSyncedAt: new Date(),
      },
    });
  }

  private async tryPersistExternalLink(
    event: IntegracaoOutbox,
    externalId?: string,
    externalCode?: string,
    remoteVersion?: string,
  ) {
    try {
      await this.persistExternalLink(event, externalId, externalCode, remoteVersion);
    } catch (error) {
      this.logger.error(`Falha ao persistir link externo: ${(error as Error).message}`);
    }
  }

  private async tryLog(input: Parameters<IntegrationLogService['log']>[0]) {
    try {
      await this.logs.log(input);
    } catch (error) {
      this.logger.error(`Falha ao registrar log de integracao: ${(error as Error).message}`);
    }
  }
}
