import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// NOTA: O modelo FilaVeiculo nao existe no schema.prisma atual.
// Este service esta implementado como stub ate que o modelo seja adicionado.
// Veja DECISOES-PENDENTES.md na raiz do projeto.
@Injectable()
export class FilaService {
  constructor(private readonly prisma: PrismaService) {}

  private unavailable(): never {
    throw new NotImplementedException('Fila de veiculos indisponivel: modelo FilaVeiculo ausente');
  }

  async findByUnidade(_unidadeId: string) {
    return [];
  }

  async create(dto: Record<string, unknown>) {
    void dto;
    this.unavailable();
  }

  async chamar(id: string) {
    void id;
    this.unavailable();
  }

  async concluir(id: string) {
    void id;
    this.unavailable();
  }

  async remove(id: string) {
    void id;
    this.unavailable();
  }
}
