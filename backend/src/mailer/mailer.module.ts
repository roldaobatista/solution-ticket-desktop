import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { MailerController } from './mailer.controller';
import { NotificacaoService } from './notificacao.service';
import { NotificacaoController } from './notificacao.controller';

@Module({
  providers: [MailerService, NotificacaoService],
  controllers: [MailerController, NotificacaoController],
  exports: [MailerService, NotificacaoService],
})
export class MailerModule {}
