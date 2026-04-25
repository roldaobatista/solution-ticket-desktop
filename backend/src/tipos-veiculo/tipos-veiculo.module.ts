import { Module } from '@nestjs/common';
import { TiposVeiculoService } from './tipos-veiculo.service';
import { TiposVeiculoController } from './tipos-veiculo.controller';

@Module({
  controllers: [TiposVeiculoController],
  providers: [TiposVeiculoService],
})
export class TiposVeiculoModule {}
