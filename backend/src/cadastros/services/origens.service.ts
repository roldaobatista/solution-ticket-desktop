import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrudConfig, GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateOrigemDto } from '../dto/create-origem.dto';
import { UpdateOrigemDto } from '../dto/update-origem.dto';

@Injectable()
export class OrigensService extends GenericCrudService<
  Prisma.OrigemWhereInput,
  CreateOrigemDto,
  UpdateOrigemDto
> {
  protected config: CrudConfig<Prisma.OrigemWhereInput, CreateOrigemDto, UpdateOrigemDto> = {
    prismaModel: 'origem' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Origem não encontrada',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
