import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GenericCrudController } from '../../common/generic-crud/generic-crud.controller';
import { OrigensService } from '../services/origens.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Origens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('origens')
export class OrigensController extends GenericCrudController<OrigensService> {
  constructor(protected readonly service: OrigensService) {
    super();
  }
}
