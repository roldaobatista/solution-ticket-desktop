import { Module } from '@nestjs/common';
import { PerfisService } from './perfis.service';
import { PerfisController } from './perfis.controller';

@Module({
  controllers: [PerfisController],
  providers: [PerfisService],
})
export class PerfisModule {}
