import { Module } from '@nestjs/common';
import { IndicadorService } from './indicador.service';
import { IndicadorController } from './indicador.controller';
import { IndicadorWizardController } from './wizard.controller';

@Module({
  providers: [IndicadorService],
  controllers: [IndicadorController, IndicadorWizardController],
  exports: [IndicadorService],
})
export class IndicadorModule {}
