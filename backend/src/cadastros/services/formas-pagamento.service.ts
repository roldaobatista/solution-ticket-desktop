/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateFormaPagamentoDto } from '../dto/create-forma-pagamento.dto';
import { UpdateFormaPagamentoDto } from '../dto/update-forma-pagamento.dto';

@Injectable()
export class FormasPagamentoService extends GenericCrudService<
  any /* eslint-disable-line @typescript-eslint/no-explicit-any */,
  CreateFormaPagamentoDto,
  UpdateFormaPagamentoDto
> {
  protected config = {
    prismaModel: 'formaPagamento' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Forma de pagamento não encontrada',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
