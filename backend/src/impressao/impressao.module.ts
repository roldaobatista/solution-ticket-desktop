import { Module } from '@nestjs/common';
import { ImpressaoService } from './impressao.service';
import { ImpressaoController } from './impressao.controller';
import { ImpressaoListener } from './impressao.listener';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImpressaoController],
  providers: [ImpressaoService, ImpressaoListener],
})
export class ImpressaoModule {}
