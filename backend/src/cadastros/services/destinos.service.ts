/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateDestinoDto } from '../dto/create-destino.dto';
import { UpdateDestinoDto } from '../dto/update-destino.dto';

@Injectable()
export class DestinosService extends GenericCrudService<
  any /* eslint-disable-line @typescript-eslint/no-explicit-any */,
  CreateDestinoDto,
  UpdateDestinoDto
> {
  protected config = {
    prismaModel: 'destino' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Destino não encontrado',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
