import { Module } from '@nestjs/common';
import { BalancaService } from './balanca.service';
import { BalancaController } from './balanca.controller';
import { BalancaConnectionService } from './balanca-connection.service';
import { BalancaRealtimeService } from './balanca-realtime.service';
import { AutoDetectService } from './auto-detect.service';
import { CaptureRawService } from './capture-raw.service';
import { NetworkDiscoveryService } from './diagnostics/network-discovery.service';
import { BalancaConfigController } from './presets.controller';

@Module({
  controllers: [BalancaController, BalancaConfigController],
  providers: [
    BalancaService,
    BalancaConnectionService,
    BalancaRealtimeService,
    AutoDetectService,
    CaptureRawService,
    NetworkDiscoveryService,
  ],
  exports: [
    BalancaService,
    BalancaConnectionService,
    BalancaRealtimeService,
    AutoDetectService,
    CaptureRawService,
    NetworkDiscoveryService,
  ],
})
export class BalancaModule {}
