import { Module } from '@nestjs/common';
import { ImpressaoService } from './impressao.service';
import { ImpressaoController } from './impressao.controller';
import { ImpressaoListener } from './impressao.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { EscposPrinterService } from './escpos/escpos-printer.service';

@Module({
  imports: [PrismaModule],
  controllers: [ImpressaoController],
  providers: [ImpressaoService, ImpressaoListener, EscposPrinterService],
  exports: [ImpressaoService, EscposPrinterService],
})
export class ImpressaoModule {}
