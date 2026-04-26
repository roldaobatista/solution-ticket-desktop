import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseFilterDto } from '../../cadastros/dto/base-filter.dto';

export interface CrudConfig<TWhere, TCreate, TUpdate, TInclude = undefined> {
  prismaModel: keyof PrismaService & string;
  searchFields: (keyof TWhere & string)[];
  orderByField: string;
  defaultInclude?: TInclude;
  notFoundMessage: string;
  beforeCreate?: (dto: TCreate) => TCreate | Promise<TCreate>;
  beforeUpdate?: (id: string, dto: TUpdate) => TUpdate | Promise<TUpdate>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable()
export abstract class GenericCrudService<TWhere, TCreate, TUpdate, TInclude = undefined> {
  protected abstract config: CrudConfig<TWhere, TCreate, TUpdate, TInclude>;

  constructor(protected readonly prisma: PrismaService) {}

  private getModel() {
    return this.prisma[this.config.prismaModel] as any;
  }

  async create(dto: TCreate, tenantId?: string) {
    const data = this.config.beforeCreate ? await this.config.beforeCreate(dto) : dto;
    return this.getModel().create({ data: tenantId ? { ...data, tenantId } : data });
  }

  async findAll(filter: BaseFilterDto, tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    else if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.search && this.config.searchFields.length) {
      if (this.config.searchFields.length === 1) {
        where[this.config.searchFields[0]] = { contains: filter.search };
      } else {
        where.OR = this.config.searchFields.map((field) => ({
          [field]: { contains: filter.search },
        }));
      }
    }
    where.ativo = filter.ativo !== undefined ? filter.ativo : true;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const findManyArgs: any = {
      where,
      skip,
      take: limit,
      orderBy: { [this.config.orderByField]: 'asc' },
    };
    if (this.config.defaultInclude) {
      findManyArgs.include = this.config.defaultInclude;
    }

    const [data, total] = await Promise.all([
      this.getModel().findMany(findManyArgs),
      this.getModel().count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId?: string) {
    const args: any = { where: tenantId ? { id, tenantId } : { id } };
    if (this.config.defaultInclude) {
      args.include = this.config.defaultInclude;
    }
    const entity = await this.getModel().findUnique(args);
    if (!entity) throw new NotFoundException(this.config.notFoundMessage);
    return entity;
  }

  async update(id: string, dto: TUpdate, tenantId?: string) {
    await this.findOne(id, tenantId);
    const data = this.config.beforeUpdate ? await this.config.beforeUpdate(id, dto) : dto;
    return this.getModel().update({ where: tenantId ? { id, tenantId } : { id }, data });
  }

  async remove(id: string, tenantId?: string) {
    await this.findOne(id, tenantId);
    return this.getModel().update({
      where: tenantId ? { id, tenantId } : { id },
      data: { ativo: false },
    });
  }
}
