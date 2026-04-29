import { Module } from '@nestjs/common';
import { ClientesController } from './controllers/clientes.controller';
import { TransportadorasController } from './controllers/transportadoras.controller';
import { MotoristasController } from './controllers/motoristas.controller';
import { ProdutosController } from './controllers/produtos.controller';
import { VeiculosController } from './controllers/veiculos.controller';
import { DestinosController } from './controllers/destinos.controller';
import { OrigensController } from './controllers/origens.controller';
import { ArmazensController } from './controllers/armazens.controller';
import { FormasPagamentoController } from './controllers/formas-pagamento.controller';
import { ClientesService } from './services/clientes.service';
import { TransportadorasService } from './services/transportadoras.service';
import { MotoristasService } from './services/motoristas.service';
import { ProdutosService } from './services/produtos.service';
import { VeiculosService } from './services/veiculos.service';
import { DestinosService } from './services/destinos.service';
import { OrigensService } from './services/origens.service';
import { ArmazensService } from './services/armazens.service';
import { FormasPagamentoService } from './services/formas-pagamento.service';

@Module({
  controllers: [
    ClientesController,
    TransportadorasController,
    MotoristasController,
    ProdutosController,
    VeiculosController,
    DestinosController,
    OrigensController,
    ArmazensController,
    FormasPagamentoController,
  ],
  providers: [
    ClientesService,
    TransportadorasService,
    MotoristasService,
    ProdutosService,
    VeiculosService,
    DestinosService,
    OrigensService,
    ArmazensService,
    FormasPagamentoService,
  ],
})
export class CadastrosModule {}
