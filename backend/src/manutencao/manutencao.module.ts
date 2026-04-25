import { Module } from '@nestjs/common';
import { ManutencaoService } from './manutencao.service';
import { ManutencaoController } from './manutencao.controller';

@Module({
  controllers: [ManutencaoController],
  providers: [ManutencaoService],
})
export class ManutencaoModule {}
