import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GenericCrudController } from '../../common/generic-crud/generic-crud.controller';
import { IndicadoresService } from '../services/indicadores.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Indicadores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('indicadores')
export class IndicadoresController extends GenericCrudController<IndicadoresService> {
  constructor(protected readonly service: IndicadoresService) {
    super();
  }
}
