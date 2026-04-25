import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GenericCrudController } from '../../common/generic-crud/generic-crud.controller';
import { ArmazensService } from '../services/armazens.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Armazéns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('armazens')
export class ArmazensController extends GenericCrudController<ArmazensService> {
  constructor(protected readonly service: ArmazensService) {
    super();
  }
}
