import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConnectorAuthService } from './connectors/auth/connector-auth.service';
import { ConnectorRegistryService } from './connectors/connector-registry.service';
import { GenericRestConnector } from './connectors/generic-rest/generic-rest.connector';
import { ConnectorHttpClientService } from './connectors/http/connector-http-client.service';
import { IntegracaoController } from './integracao.controller';
import { IntegracaoProfileService } from './profiles/integracao-profile.service';
import { IntegrationLogService } from './logging/integration-log.service';
import { OutboxProcessorService } from './outbox/outbox-processor.service';
import { OutboxService } from './outbox/outbox.service';
import { PayloadMaskerService } from './payload/payload-masker.service';
import { RetryPolicyService } from './retry/retry-policy.service';
import { ProfileSecretService } from './secrets/profile-secret.service';

@Module({
  imports: [PrismaModule],
  controllers: [IntegracaoController],
  providers: [
    ConnectorRegistryService,
    ConnectorAuthService,
    ConnectorHttpClientService,
    GenericRestConnector,
    IntegracaoProfileService,
    IntegrationLogService,
    OutboxProcessorService,
    OutboxService,
    PayloadMaskerService,
    ProfileSecretService,
    RetryPolicyService,
  ],
  exports: [
    ConnectorRegistryService,
    GenericRestConnector,
    IntegracaoProfileService,
    IntegrationLogService,
    OutboxProcessorService,
    OutboxService,
  ],
})
export class IntegracaoModule {}
