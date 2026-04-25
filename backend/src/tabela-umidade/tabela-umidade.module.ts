import { Module } from '@nestjs/common';
import { TabelaUmidadeService } from './tabela-umidade.service';
import { TabelaUmidadeController } from './tabela-umidade.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TabelaUmidadeController],
  providers: [TabelaUmidadeService],
  exports: [TabelaUmidadeService],
})
export class TabelaUmidadeModule {}
