/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateOrigemDto } from '../dto/create-origem.dto';
import { UpdateOrigemDto } from '../dto/update-origem.dto';

@Injectable()
export class OrigensService extends GenericCrudService<
  any /* eslint-disable-line @typescript-eslint/no-explicit-any */,
  CreateOrigemDto,
  UpdateOrigemDto
> {
  protected config = {
    prismaModel: 'origem' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Origem não encontrada',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
