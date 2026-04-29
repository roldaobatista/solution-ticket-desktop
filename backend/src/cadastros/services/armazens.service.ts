import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrudConfig, GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateArmazemDto } from '../dto/create-armazem.dto';
import { UpdateArmazemDto } from '../dto/update-armazem.dto';

@Injectable()
export class ArmazensService extends GenericCrudService<
  Prisma.ArmazemWhereInput,
  CreateArmazemDto,
  UpdateArmazemDto
> {
  protected config: CrudConfig<Prisma.ArmazemWhereInput, CreateArmazemDto, UpdateArmazemDto> = {
    prismaModel: 'armazem' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Armazém não encontrado',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
