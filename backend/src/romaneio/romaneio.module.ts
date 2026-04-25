import { Module } from '@nestjs/common';
import { RomaneioService } from './romaneio.service';
import { RomaneioController } from './romaneio.controller';

@Module({
  controllers: [RomaneioController],
  providers: [RomaneioService],
})
export class RomaneioModule {}
