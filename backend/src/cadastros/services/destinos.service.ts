import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrudConfig, GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateDestinoDto } from '../dto/create-destino.dto';
import { UpdateDestinoDto } from '../dto/update-destino.dto';

@Injectable()
export class DestinosService extends GenericCrudService<
  Prisma.DestinoWhereInput,
  CreateDestinoDto,
  UpdateDestinoDto
> {
  protected config: CrudConfig<Prisma.DestinoWhereInput, CreateDestinoDto, UpdateDestinoDto> = {
    prismaModel: 'destino' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Destino não encontrado',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
