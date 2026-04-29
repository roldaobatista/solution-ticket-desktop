import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { ConnectorRegistryService } from './connectors/connector-registry.service';
import { EnqueueMockEventDto } from './outbox/dto/enqueue-mock-event.dto';
import { OutboxProcessorService } from './outbox/outbox-processor.service';
import { OutboxService } from './outbox/outbox.service';
import { CreateIntegracaoProfileDto } from './profiles/dto/create-integracao-profile.dto';
import { UpdateIntegracaoProfileDto } from './profiles/dto/update-integracao-profile.dto';
import { IntegracaoProfileService } from './profiles/integracao-profile.service';
import { UpsertProfileSecretDto } from './secrets/dto/upsert-profile-secret.dto';
import { ProfileSecretService } from './secrets/profile-secret.service';

@ApiTags('Integracao ERP')
@ApiBearerAuth()
@Controller('v1/integration')
export class IntegracaoController {
  constructor(
    private readonly profiles: IntegracaoProfileService,
    private readonly registry: ConnectorRegistryService,
    private readonly outbox: OutboxService,
    private readonly processor: OutboxProcessorService,
    private readonly secrets: ProfileSecretService,
  ) {}

  @Get('health')
  @Roles(Permissao.INTEGRACAO_VER)
  @ApiOperation({ summary: 'Status do modulo de integracao' })
  health() {
    return {
      status: 'up',
      module: 'integracao',
      mode: 'local-first',
    };
  }

  @Get('capabilities')
  @Roles(Permissao.INTEGRACAO_VER)
  @ApiOperation({ summary: 'Capacidades suportadas pelo hub de integracao' })
  capabilities() {
    return {
      version: 'v1',
      connectors: this.registry.list(),
      directions: ['inbound', 'outbound', 'bidirectional'],
      features: [
        'profiles',
        'profile-config',
        'outbox',
        'retry',
        'dlq',
        'masked-logs',
        'mock-connector',
        'generic-rest-connector',
      ],
    };
  }

  @Get('profiles')
  @Roles(Permissao.INTEGRACAO_VER)
  @ApiOperation({ summary: 'Listar perfis de integracao' })
  findProfiles(@CurrentUser('tenantId') tenantId: string) {
    return this.profiles.findAll(tenantId);
  }

  @Post('profiles')
  @Roles(Permissao.INTEGRACAO_CRIAR)
  @ApiOperation({ summary: 'Criar perfil de integracao' })
  createProfile(
    @Body() dto: CreateIntegracaoProfileDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.profiles.create(dto, tenantId, userId);
  }

  @Patch('profiles/:id')
  @Roles(Permissao.INTEGRACAO_EDITAR)
  @ApiOperation({ summary: 'Atualizar perfil de integracao' })
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateIntegracaoProfileDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.profiles.update(id, dto, tenantId, userId);
  }

  @Delete('profiles/:id')
  @Roles(Permissao.INTEGRACAO_EDITAR)
  @ApiOperation({ summary: 'Desativar perfil de integracao' })
  removeProfile(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.profiles.disable(id, tenantId);
  }

  @Post('profiles/:id/test-connection')
  @Roles(Permissao.INTEGRACAO_TESTAR_CONEXAO)
  @ApiOperation({ summary: 'Testar conexao do perfil de integracao' })
  testConnection(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.profiles.testConnection(id, tenantId);
  }

  @Get('profiles/:id/secrets')
  @Roles(Permissao.INTEGRACAO_ALTERAR_CREDENCIAL)
  @ApiOperation({ summary: 'Listar metadados de credenciais do perfil' })
  listSecrets(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.secrets.list(id, tenantId);
  }

  @Post('profiles/:id/secrets/:secretKey')
  @Roles(Permissao.INTEGRACAO_ALTERAR_CREDENCIAL)
  @ApiOperation({ summary: 'Cadastrar ou rotacionar credencial do perfil' })
  upsertSecret(
    @Param('id') id: string,
    @Param('secretKey') secretKey: string,
    @Body() dto: UpsertProfileSecretDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.secrets.upsert(id, tenantId, secretKey, dto.value);
  }

  @Get('events')
  @Roles(Permissao.INTEGRACAO_VER)
  @ApiOperation({ summary: 'Listar eventos da outbox de integracao' })
  events(@CurrentUser('tenantId') tenantId: string, @Query('status') status?: string) {
    return this.outbox.listEvents(tenantId, status);
  }

  @Get('outbox')
  @Roles(Permissao.INTEGRACAO_VER)
  @ApiOperation({ summary: 'Listar outbox de integracao' })
  outboxEvents(@CurrentUser('tenantId') tenantId: string, @Query('status') status?: string) {
    return this.outbox.listEvents(tenantId, status);
  }

  @Post('outbox/:id/retry')
  @Roles(Permissao.INTEGRACAO_REPROCESSAR)
  @ApiOperation({ summary: 'Reprocessar evento da outbox' })
  async retryOutbox(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    const event = await this.outbox.retry(id, tenantId);
    if (!event) throw new NotFoundException('Evento de outbox nao encontrado');
    return event;
  }

  @Post('profiles/:id/mock-events')
  @Roles(Permissao.INTEGRACAO_REPROCESSAR)
  @ApiOperation({ summary: 'Enfileirar evento canonico para teste do Mock Connector' })
  enqueueMockEvent(
    @Param('id') profileId: string,
    @Body() dto: EnqueueMockEventDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const revision = dto.revision ?? 1;
    const payload = {
      ...(dto.payload ?? {}),
      ...(dto.mockScenario ? { mockScenario: dto.mockScenario } : {}),
      entityId: dto.entityId,
      entityType: dto.entityType,
      revision,
    };

    return this.outbox.enqueueForTenant({
      tenantId,
      profileId,
      eventType: dto.eventType,
      entityType: dto.entityType,
      entityId: dto.entityId,
      revision,
      payloadCanonical: payload,
    });
  }

  @Post('outbox/process-next')
  @Roles(Permissao.INTEGRACAO_REPROCESSAR)
  @ApiOperation({ summary: 'Processar proximo evento pendente da outbox' })
  processNext(@CurrentUser('tenantId') tenantId: string) {
    return this.processor.processNext(tenantId);
  }
}
