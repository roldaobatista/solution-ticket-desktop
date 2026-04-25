import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// NOTA: O modelo FilaVeiculo nao existe no schema.prisma atual.
// Este service esta implementado como stub ate que o modelo seja adicionado.
// Veja DECISOES-PENDENTES.md na raiz do projeto.
@Injectable()
export class FilaService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUnidade(_unidadeId: string) {
    return [];
  }

  async create(dto: any) {
    return { id: null, ...dto, ordemChegada: 1, status: 'AGUARDANDO' };
  }

  async chamar(id: string) {
    return { id, status: 'EM_ATENDIMENTO', dataChamada: new Date() };
  }

  async concluir(id: string) {
    return { id, status: 'CONCLUIDO', dataSaida: new Date() };
  }

  async remove(id: string) {
    return { id, removido: true };
  }
}
