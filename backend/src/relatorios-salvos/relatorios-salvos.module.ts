import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RelatoriosSalvosController } from './relatorios-salvos.controller';
import { RelatoriosSalvosService } from './relatorios-salvos.service';

@Module({
  imports: [PrismaModule],
  controllers: [RelatoriosSalvosController],
  providers: [RelatoriosSalvosService],
  exports: [RelatoriosSalvosService],
})
export class RelatoriosSalvosModule {}
