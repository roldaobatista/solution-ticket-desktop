import { Module } from '@nestjs/common';
import { AutomacaoService } from './automacao.service';
import { AutomacaoController } from './automacao.controller';
import { ModbusAutomacaoAdapter } from './modbus-automacao.adapter';
import { NullAutomacaoAdapter } from './null-automacao.adapter';
import { AutomacaoAdapter } from './automacao.adapter';
import { AUTOMACAO_ADAPTER } from './automacao.tokens';

@Module({
  providers: [
    AutomacaoService,
    ModbusAutomacaoAdapter,
    NullAutomacaoAdapter,
    {
      provide: AUTOMACAO_ADAPTER,
      // Seleciona o adapter conforme env. Sem AUTOMACAO_MODBUS_HOST: no-op.
      useFactory: (
        modbus: ModbusAutomacaoAdapter,
        nulo: NullAutomacaoAdapter,
      ): AutomacaoAdapter => {
        return process.env.AUTOMACAO_MODBUS_HOST ? modbus : nulo;
      },
      inject: [ModbusAutomacaoAdapter, NullAutomacaoAdapter],
    },
  ],
  controllers: [AutomacaoController],
  exports: [AutomacaoService],
})
export class AutomacaoModule {}
