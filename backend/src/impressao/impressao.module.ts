import { Module } from '@nestjs/common';
import { ImpressaoService } from './impressao.service';
import { ImpressaoController } from './impressao.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImpressaoController],
  providers: [ImpressaoService],
})
export class ImpressaoModule {}
