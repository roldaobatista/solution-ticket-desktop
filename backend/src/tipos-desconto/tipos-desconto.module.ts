import { Module } from '@nestjs/common';
import { TiposDescontoService } from './tipos-desconto.service';
import { TiposDescontoController } from './tipos-desconto.controller';

@Module({
  controllers: [TiposDescontoController],
  providers: [TiposDescontoService],
  exports: [TiposDescontoService],
})
export class TiposDescontoModule {}
