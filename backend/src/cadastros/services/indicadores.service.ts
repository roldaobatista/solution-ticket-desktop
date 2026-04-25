/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateIndicadorDto } from '../dto/create-indicador.dto';
import { UpdateIndicadorDto } from '../dto/update-indicador.dto';

@Injectable()
export class IndicadoresService extends GenericCrudService<
  any /* eslint-disable-line @typescript-eslint/no-explicit-any */,
  CreateIndicadorDto,
  UpdateIndicadorDto
> {
  protected config = {
    prismaModel: 'indicadorPesagem' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Indicador não encontrado',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
