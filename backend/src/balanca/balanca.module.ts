import { Module } from '@nestjs/common';
import { BalancaService } from './balanca.service';
import { BalancaController } from './balanca.controller';
import { BalancaConnectionService } from './balanca-connection.service';
import { BalancaRealtimeService } from './balanca-realtime.service';
import { AutoDetectService } from './auto-detect.service';
import { CaptureRawService } from './capture-raw.service';
import { CalibracaoService } from './calibracao.service';
import { NetworkDiscoveryService } from './diagnostics/network-discovery.service';
import { BalancaConfigController } from './presets.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BalancaController, BalancaConfigController],
  providers: [
    BalancaService,
    BalancaConnectionService,
    BalancaRealtimeService,
    AutoDetectService,
    CaptureRawService,
    CalibracaoService,
    NetworkDiscoveryService,
  ],
  exports: [
    BalancaService,
    BalancaConnectionService,
    BalancaRealtimeService,
    AutoDetectService,
    CaptureRawService,
    CalibracaoService,
    NetworkDiscoveryService,
  ],
})
export class BalancaModule {}
