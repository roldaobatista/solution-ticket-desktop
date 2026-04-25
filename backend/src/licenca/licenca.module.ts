import { Module } from '@nestjs/common';
import { LicencaService } from './licenca.service';
import { LicencaController } from './licenca.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LicencaController],
  providers: [LicencaService],
  exports: [LicencaService],
})
export class LicencaModule {}
