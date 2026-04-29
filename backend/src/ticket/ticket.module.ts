import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { PassagemService } from './passagem.service';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { IntegracaoModule } from '../integracao/integracao.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [IntegracaoModule, AuditoriaModule],
  controllers: [TicketController, DocumentosController],
  providers: [TicketService, PassagemService, DocumentosService],
  exports: [TicketService],
})
export class TicketModule {}
