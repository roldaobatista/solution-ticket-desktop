import { Module } from '@nestjs/common';
import { RecibosService } from './recibos.service';
import { RecibosController } from './recibos.controller';

@Module({
  controllers: [RecibosController],
  providers: [RecibosService],
  exports: [RecibosService],
})
export class RecibosModule {}
