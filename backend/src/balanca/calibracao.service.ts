import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type TipoCalibracao = 'ZERO' | 'SPAN' | 'MULTIPONTO';

export interface RegistrarCalibracaoInput {
  tipo: TipoCalibracao;
  pesoReferencia: number;
  pesoLido: number;
  observacao?: string;
  usuarioId?: string;
}

/**
 * Onda 5.2 — registro de calibracoes por balanca.
 * Calculo de fator = pesoReferencia / pesoLido (com guarda contra divisao
 * por zero). Para tipo=ZERO, o fator e sempre 1 (apenas atestamos zero).
 *
 * Persiste historico mas NAO altera o fator do indicador automaticamente —
 * essa decisao continua com AjusteLeituraSection (que aciona a balanca-config
 * api). O historico da rastreabilidade exigida pela legislacao metrológica.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaWithCalibracao = PrismaService & { calibracaoBalanca: any };

@Injectable()
export class CalibracaoService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): PrismaWithCalibracao {
    // Casts ate o regenerate do Prisma client refletir o novo model
    // (DLL fica travada quando o app instalado esta rodando localmente).
    return this.prisma as PrismaWithCalibracao;
  }

  async registrar(balancaId: string, input: RegistrarCalibracaoInput) {
    const balanca = await this.prisma.balanca.findUnique({ where: { id: balancaId } });
    if (!balanca) throw new NotFoundException('Balanca nao encontrada');

    if (!['ZERO', 'SPAN', 'MULTIPONTO'].includes(input.tipo)) {
      throw new BadRequestException('tipo invalido (ZERO | SPAN | MULTIPONTO)');
    }

    let fatorCalculado = 1;
    if (input.tipo === 'ZERO') {
      // Aceita qualquer pesoLido proximo de zero como ZERO.
      if (Math.abs(input.pesoReferencia) > 0.001) {
        throw new BadRequestException('Calibracao ZERO exige pesoReferencia = 0');
      }
      fatorCalculado = 1;
    } else {
      if (input.pesoLido === 0) {
        throw new BadRequestException(
          'pesoLido nao pode ser 0 em SPAN/MULTIPONTO (divisao por zero)',
        );
      }
      if (input.pesoReferencia <= 0) {
        throw new BadRequestException('pesoReferencia deve ser > 0 em SPAN/MULTIPONTO');
      }
      fatorCalculado = input.pesoReferencia / input.pesoLido;
    }

    return this.db.calibracaoBalanca.create({
      data: {
        balancaId,
        tipo: input.tipo,
        pesoReferencia: input.pesoReferencia,
        pesoLido: input.pesoLido,
        fatorCalculado,
        observacao: input.observacao ?? null,
        usuarioId: input.usuarioId ?? null,
      },
    });
  }

  async listar(balancaId: string, limite = 50) {
    return this.db.calibracaoBalanca.findMany({
      where: { balancaId },
      orderBy: { realizadoEm: 'desc' },
      take: Math.min(Math.max(limite, 1), 200),
    });
  }

  async ultimaCalibracao(balancaId: string) {
    return this.db.calibracaoBalanca.findFirst({
      where: { balancaId },
      orderBy: { realizadoEm: 'desc' },
    });
  }

  /**
   * Alerta se a ultima calibracao foi ha mais de N dias (default 180).
   * Util para a UI mostrar badge "calibracao vencida".
   */
  async statusVencimento(balancaId: string, diasMaximo = 180) {
    const ultima = await this.ultimaCalibracao(balancaId);
    if (!ultima) return { temCalibracao: false, vencida: true, ultimaEm: null };
    const diasDesde = (Date.now() - ultima.realizadoEm.getTime()) / (1000 * 60 * 60 * 24);
    return {
      temCalibracao: true,
      vencida: diasDesde > diasMaximo,
      ultimaEm: ultima.realizadoEm,
      diasDesde: Math.floor(diasDesde),
    };
  }
}
