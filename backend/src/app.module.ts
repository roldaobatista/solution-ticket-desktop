import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TenantGuard } from './common/guards/tenant.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmpresaModule } from './empresa/empresa.module';
import { CadastrosModule } from './cadastros/cadastros.module';
import { BalancaModule } from './balanca/balanca.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { TicketModule } from './ticket/ticket.module';
import { ManutencaoModule } from './manutencao/manutencao.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { LicencaModule } from './licenca/licenca.module';
import { ComercialModule } from './comercial/comercial.module';
import { RomaneioModule } from './romaneio/romaneio.module';
import { FaturaModule } from './fatura/fatura.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CommonModule } from './common/common.module';
import { TabelaUmidadeModule } from './tabela-umidade/tabela-umidade.module';
import { FilaModule } from './fila/fila.module';
import { ImpressaoModule } from './impressao/impressao.module';
import { PerfisModule } from './perfis/perfis.module';
import { TiposVeiculoModule } from './tipos-veiculo/tipos-veiculo.module';
import { UtilitariosModule } from './utilitarios/utilitarios.module';
import { RelatoriosSalvosModule } from './relatorios-salvos/relatorios-salvos.module';
import { BackupModule } from './backup/backup.module';
import { CameraModule } from './camera/camera.module';
import { HealthModule } from './health/health.module';
import { AutomacaoModule } from './automacao/automacao.module';
import { IndicadorModule } from './indicadores/indicador.module';
import { MailerModule } from './mailer/mailer.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Onda 2.8: variavel dedicada DISABLE_THROTTLER em vez de NODE_ENV.
    // Antes um deploy com NODE_ENV=test por engano abria brute-force.
    ...(process.env.DISABLE_THROTTLER !== '1'
      ? [
          ThrottlerModule.forRoot([
            { name: 'short', ttl: 60_000, limit: 60 },
            { name: 'auth', ttl: 60_000, limit: 5 },
          ]),
        ]
      : []),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    EmpresaModule,
    CadastrosModule,
    BalancaModule,
    AppConfigModule,
    TicketModule,
    ManutencaoModule,
    AuditoriaModule,
    LicencaModule,
    ComercialModule,
    RomaneioModule,
    FaturaModule,
    RelatoriosModule,
    DashboardModule,
    TabelaUmidadeModule,
    FilaModule,
    ImpressaoModule,
    PerfisModule,
    TiposVeiculoModule,
    UtilitariosModule,
    RelatoriosSalvosModule,
    BackupModule,
    CameraModule,
    HealthModule,
    AutomacaoModule,
    IndicadorModule,
    MailerModule,
  ],
  controllers: [AppController],
  providers: [
    ...(process.env.DISABLE_THROTTLER !== '1'
      ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
      : []),
    // Ordem dos guards globais e CRITICA: JwtAuthGuard precisa popular
    // request.user ANTES do TenantGuard checar tenantId. Antes apenas
    // TenantGuard era global, e endpoints com @UseGuards(JwtAuthGuard)
    // local rodavam o Jwt depois do Tenant — TenantGuard via user=null
    // e devolvia 403 mesmo com Bearer valido. Endpoints @Public() pulam
    // o JwtAuthGuard via reflection (IS_PUBLIC_KEY).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
