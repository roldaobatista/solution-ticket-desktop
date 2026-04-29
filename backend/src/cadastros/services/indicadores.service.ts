import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrudConfig, GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateIndicadorDto } from '../dto/create-indicador.dto';
import { UpdateIndicadorDto } from '../dto/update-indicador.dto';

@Injectable()
export class IndicadoresService extends GenericCrudService<
  Prisma.IndicadorPesagemWhereInput,
  CreateIndicadorDto,
  UpdateIndicadorDto
> {
  protected config: CrudConfig<
    Prisma.IndicadorPesagemWhereInput,
    CreateIndicadorDto,
    UpdateIndicadorDto
  > = {
    prismaModel: 'indicadorPesagem' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Indicador não encontrado',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
