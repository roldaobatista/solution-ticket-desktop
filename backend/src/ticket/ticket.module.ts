import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { PassagemService } from './passagem.service';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';

@Module({
  controllers: [TicketController, DocumentosController],
  providers: [TicketService, PassagemService, DocumentosService],
  exports: [TicketService],
})
export class TicketModule {}
