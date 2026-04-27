import { Module } from '@nestjs/common';
import { LicencaService } from './licenca.service';
import { LicencaController } from './licenca.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CrlService } from './crl.service';

@Module({
  imports: [PrismaModule],
  controllers: [LicencaController],
  providers: [LicencaService, CrlService],
  exports: [LicencaService, CrlService],
})
export class LicencaModule {}
