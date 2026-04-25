import { Module } from '@nestjs/common';
import { UtilitariosController, DocumentosController } from './utilitarios.controller';
import { UtilitariosService } from './utilitarios.service';
import { DocumentosService } from './documentos.service';
import { SerialTerminalController } from './serial-terminal.controller';
import { SerialTerminalService } from './serial-terminal.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LicencaModule } from '../licenca/licenca.module';

@Module({
  imports: [PrismaModule, LicencaModule],
  controllers: [UtilitariosController, DocumentosController, SerialTerminalController],
  providers: [UtilitariosService, DocumentosService, SerialTerminalService],
  exports: [UtilitariosService, DocumentosService, SerialTerminalService],
})
export class UtilitariosModule {}
