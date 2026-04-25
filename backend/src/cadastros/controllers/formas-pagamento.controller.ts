import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GenericCrudController } from '../../common/generic-crud/generic-crud.controller';
import { FormasPagamentoService } from '../services/formas-pagamento.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Formas de Pagamento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('formas-pagamento')
export class FormasPagamentoController extends GenericCrudController<FormasPagamentoService> {
  constructor(protected readonly service: FormasPagamentoService) {
    super();
  }
}
