import { Module } from '@nestjs/common';
import { AutomacaoService } from './automacao.service';
import { AutomacaoController } from './automacao.controller';

@Module({
  providers: [AutomacaoService],
  controllers: [AutomacaoController],
  exports: [AutomacaoService],
})
export class AutomacaoModule {}
