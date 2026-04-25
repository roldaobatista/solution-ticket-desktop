/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenericCrudService } from '../../common/generic-crud/generic-crud.service';
import { CreateArmazemDto } from '../dto/create-armazem.dto';
import { UpdateArmazemDto } from '../dto/update-armazem.dto';

@Injectable()
export class ArmazensService extends GenericCrudService<any, CreateArmazemDto, UpdateArmazemDto> {
  protected config = {
    prismaModel: 'armazem' as const,
    searchFields: ['descricao'],
    orderByField: 'descricao',
    notFoundMessage: 'Armazém não encontrado',
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
