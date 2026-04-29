import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrudConfig, GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateFormaPagamentoDto } from '../dto/create-forma-pagamento.dto';
import { UpdateFormaPagamentoDto } from '../dto/update-forma-pagamento.dto';

@Injectable()
export class FormasPagamentoService extends GenericCrudService<
  Prisma.FormaPagamentoWhereInput,
  CreateFormaPagamentoDto,
  UpdateFormaPagamentoDto
> {
  protected config: CrudConfig<
    Prisma.FormaPagamentoWhereInput,
    CreateFormaPagamentoDto,
    UpdateFormaPagamentoDto
  > = {
    prismaModel: 'formaPagamento' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Forma de pagamento não encontrada',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
