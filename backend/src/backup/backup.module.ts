import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [MailerModule],
  providers: [BackupService],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
