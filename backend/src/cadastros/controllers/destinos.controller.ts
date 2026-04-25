import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GenericCrudController } from '../../common/generic-crud/generic-crud.controller';
import { DestinosService } from '../services/destinos.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Destinos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('destinos')
export class DestinosController extends GenericCrudController<DestinosService> {
  constructor(protected readonly service: DestinosService) {
    super();
  }
}
