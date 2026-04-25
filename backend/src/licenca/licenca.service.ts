import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { obterFingerprint } from './fingerprint.util';

export const StatusLicenca = {
  TRIAL: 'TRIAL',
  ATIVA: 'ATIVA',
  EXPIRADA: 'EXPIRADA',
  BLOQUEADA: 'BLOQUEADA',
  INVALIDA: 'INVALIDA',
} as const;
export type StatusLicenca = (typeof StatusLicenca)[keyof typeof StatusLicenca];

export const TipoEventoLicenciamento = {
  TRIAL_INICIADO: 'TRIAL_INICIADO',
  TRIAL_EXPIRADA: 'TRIAL_EXPIRADA',
  ATIVADA: 'ATIVADA',
  ATIVACAO_INVALIDA: 'ATIVACAO_INVALIDA',
  BLOQUEADA: 'BLOQUEADA',
  RENOVADA: 'RENOVADA',
} as const;

interface LicencaPayload {
  fingerprints: string[];
  plan: 'PADRAO' | 'PRO';
  maxMaquinas?: number;
  exp?: number;
  iat: number;
  version: number;
}

@Injectable()
export class LicencaService implements OnModuleInit {
  private readonly logger = new Logger(LicencaService.name);
  private publicKey!: string;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const p = path.join(__dirname, 'public.key');
    if (!fs.existsSync(p)) {
      this.logger.error(`public.key nao encontrada em ${p}. Licenciamento nao funcionara.`);
      this.publicKey = '';
      return;
    }
    this.publicKey = fs.readFileSync(p, 'utf8');
    this.logger.log('Chave publica de licenciamento carregada.');
  }

  getFingerprint(): string {
    return obterFingerprint();
  }

  async findByUnidade(unidadeId: string) {
    return this.prisma.licencaInstalacao.findFirst({
      where: { unidadeId },
      include: { eventos: { orderBy: { ocorridoEm: 'desc' }, take: 20 } },
    });
  }

  async findAtivaPorFingerprint(fingerprint: string) {
    return this.prisma.licencaInstalacao.findFirst({
      where: { fingerprintDispositivo: fingerprint },
    });
  }

  /**
   * Inicia trial idempotente para a unidade.
   * Se ja existe licenca para essa unidade+fingerprint, retorna a existente.
   * Se existe em fingerprint diferente (mesma unidade), cria nova (por maquina).
   */
  async iniciarTrial(unidadeId: string, tenantId: string, fingerprintOverride?: string) {
    const fingerprint = fingerprintOverride || this.getFingerprint();

    const existente = await this.prisma.licencaInstalacao.findFirst({
      where: { unidadeId, fingerprintDispositivo: fingerprint },
    });
    if (existente) {
      return existente;
    }

    const trialExpira = new Date();
    trialExpira.setDate(trialExpira.getDate() + 15);

    const licenca = await this.prisma.licencaInstalacao.create({
      data: {
        unidadeId,
        tenantId,
        tipoLicenca: 'PADRAO',
        statusLicenca: StatusLicenca.TRIAL,
        fingerprintDispositivo: fingerprint,
        trialIniciadoEm: new Date(),
        trialExpiraEm: trialExpira,
        limitePesagensTrial: 100,
        pesagensRestantesTrial: 100,
      },
    });

    await this.prisma.eventoLicenciamento.create({
      data: {
        licencaInstalacaoId: licenca.id,
        tipoEvento: TipoEventoLicenciamento.TRIAL_INICIADO,
        statusAnterior: null,
        statusNovo: StatusLicenca.TRIAL,
        payloadResumido: JSON.stringify({
          fingerprint,
          trialExpiraEm: trialExpira.toISOString(),
          limitePesagens: 100,
        }),
      },
    });

    return licenca;
  }

  /**
   * Valida JWT RSA offline e ativa a licenca para a unidade+fingerprint.
   */
  async ativar(params: { unidadeId: string; tenantId: string; chave: string; usuarioId?: string }) {
    if (!this.publicKey) {
      throw new BadRequestException(
        'Sistema de licenciamento indisponivel (chave publica ausente).',
      );
    }

    const fingerprint = this.getFingerprint();

    let payload: LicencaPayload;
    try {
      payload = jwt.verify(params.chave, this.publicKey, {
        algorithms: ['RS256'],
      }) as LicencaPayload;
    } catch (e: any) {
      await this.registrarAtivacaoInvalida(
        params.unidadeId,
        fingerprint,
        'assinatura_invalida',
        e?.message,
      );
      const reason = e?.name === 'TokenExpiredError' ? 'EXPIRADA' : 'INVALIDA';
      throw new BadRequestException(
        reason === 'EXPIRADA' ? 'Chave expirada.' : 'Chave invalida (assinatura).',
      );
    }

    if (!payload || !Array.isArray(payload.fingerprints) || !payload.plan) {
      await this.registrarAtivacaoInvalida(params.unidadeId, fingerprint, 'payload_malformado');
      throw new BadRequestException('Chave com payload invalido.');
    }

    if (!payload.fingerprints.includes(fingerprint)) {
      await this.registrarAtivacaoInvalida(params.unidadeId, fingerprint, 'fingerprint_divergente');
      throw new BadRequestException(
        'Chave nao autoriza esta maquina (fingerprint divergente). Gere nova chave com a fingerprint correta.',
      );
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      await this.registrarAtivacaoInvalida(params.unidadeId, fingerprint, 'expirada');
      throw new BadRequestException('Chave expirada.');
    }

    const existente = await this.prisma.licencaInstalacao.findFirst({
      where: { unidadeId: params.unidadeId, fingerprintDispositivo: fingerprint },
    });

    const chaveHash = this.hashChave(params.chave);
    const expiraEm = payload.exp ? new Date(payload.exp * 1000) : null;

    let licenca;
    const statusAnterior = existente?.statusLicenca ?? null;

    if (existente) {
      licenca = await this.prisma.licencaInstalacao.update({
        where: { id: existente.id },
        data: {
          statusLicenca: StatusLicenca.ATIVA,
          tipoLicenca: payload.plan,
          chaveLicenciamentoHash: chaveHash,
          ativadoEm: new Date(),
          expiraEm: expiraEm ?? undefined,
        },
      });
    } else {
      licenca = await this.prisma.licencaInstalacao.create({
        data: {
          unidadeId: params.unidadeId,
          tenantId: params.tenantId,
          tipoLicenca: payload.plan,
          statusLicenca: StatusLicenca.ATIVA,
          fingerprintDispositivo: fingerprint,
          chaveLicenciamentoHash: chaveHash,
          ativadoEm: new Date(),
          expiraEm: expiraEm ?? undefined,
        },
      });
    }

    await this.prisma.eventoLicenciamento.create({
      data: {
        licencaInstalacaoId: licenca.id,
        tipoEvento: statusAnterior
          ? TipoEventoLicenciamento.RENOVADA
          : TipoEventoLicenciamento.ATIVADA,
        statusAnterior,
        statusNovo: StatusLicenca.ATIVA,
        payloadResumido: JSON.stringify({
          plan: payload.plan,
          fingerprint,
          exp: payload.exp ?? null,
          version: payload.version,
        }),
        usuarioResponsavel: params.usuarioId,
      },
    });

    return { status: StatusLicenca.ATIVA, plan: payload.plan, expira: expiraEm, licenca };
  }

  private async registrarAtivacaoInvalida(
    unidadeId: string,
    fingerprint: string,
    motivo: string,
    detalhe?: string,
  ) {
    try {
      const existente = await this.prisma.licencaInstalacao.findFirst({
        where: { unidadeId, fingerprintDispositivo: fingerprint },
      });
      if (!existente) return;
      await this.prisma.eventoLicenciamento.create({
        data: {
          licencaInstalacaoId: existente.id,
          tipoEvento: TipoEventoLicenciamento.ATIVACAO_INVALIDA,
          statusAnterior: existente.statusLicenca,
          statusNovo: existente.statusLicenca,
          payloadResumido: JSON.stringify({ motivo, detalhe }),
        },
      });
    } catch (e) {
      this.logger.warn('Falha ao registrar ativacao invalida: ' + (e as Error).message);
    }
  }

  private hashChave(chave: string): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const c = require('crypto');
    return c.createHash('sha256').update(chave).digest('hex');
  }

  /**
   * Retorna status atual, aplicando transicao TRIAL -> EXPIRADA se aplicavel.
   */
  async verificarStatus(unidadeId: string) {
    const fingerprint = this.getFingerprint();
    const licenca = await this.prisma.licencaInstalacao.findFirst({
      where: { unidadeId, fingerprintDispositivo: fingerprint },
    });

    if (!licenca) {
      return {
        status: 'SEM_LICENCA',
        fingerprint,
        plan: null,
        diasRestantes: null,
        pesagensRestantes: null,
        ativadoEm: null,
        expira: null,
      };
    }

    // Expiracao por data (ATIVA com exp)
    if (
      licenca.statusLicenca === StatusLicenca.ATIVA &&
      licenca.expiraEm &&
      new Date() > licenca.expiraEm
    ) {
      await this.prisma.licencaInstalacao.update({
        where: { id: licenca.id },
        data: { statusLicenca: StatusLicenca.EXPIRADA },
      });
      licenca.statusLicenca = StatusLicenca.EXPIRADA;
    }

    // Expiracao de trial por data ou pesagens
    if (licenca.statusLicenca === StatusLicenca.TRIAL) {
      const trialExpirouData = licenca.trialExpiraEm && new Date() > licenca.trialExpiraEm;
      const trialExpirouPesagens =
        licenca.pesagensRestantesTrial !== null && licenca.pesagensRestantesTrial <= 0;

      if (trialExpirouData || trialExpirouPesagens) {
        await this.prisma.licencaInstalacao.update({
          where: { id: licenca.id },
          data: { statusLicenca: StatusLicenca.EXPIRADA },
        });
        await this.prisma.eventoLicenciamento.create({
          data: {
            licencaInstalacaoId: licenca.id,
            tipoEvento: TipoEventoLicenciamento.TRIAL_EXPIRADA,
            statusAnterior: StatusLicenca.TRIAL,
            statusNovo: StatusLicenca.EXPIRADA,
            payloadResumido: JSON.stringify({
              motivo: trialExpirouData ? 'tempo' : 'pesagens',
            }),
          },
        });
        licenca.statusLicenca = StatusLicenca.EXPIRADA;
      }
    }

    const diasRestantes =
      licenca.statusLicenca === StatusLicenca.TRIAL && licenca.trialExpiraEm
        ? Math.max(
            0,
            Math.ceil((licenca.trialExpiraEm.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          )
        : licenca.expiraEm
          ? Math.max(
              0,
              Math.ceil((licenca.expiraEm.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            )
          : null;

    return {
      status: licenca.statusLicenca,
      plan: licenca.tipoLicenca,
      fingerprint,
      diasRestantes,
      pesagensRestantes: licenca.pesagensRestantesTrial,
      ativadoEm: licenca.ativadoEm,
      expira: licenca.expiraEm,
    };
  }

  /**
   * Decrementa pesagens do trial. Chamado pelo TicketService ao fechar pesagem.
   */
  async decrementarPesagemTrial(unidadeId: string) {
    const fingerprint = this.getFingerprint();
    const licenca = await this.prisma.licencaInstalacao.findFirst({
      where: { unidadeId, fingerprintDispositivo: fingerprint },
    });
    if (!licenca) return { ok: false, motivo: 'sem_licenca' };

    if (
      licenca.statusLicenca === StatusLicenca.TRIAL &&
      licenca.pesagensRestantesTrial !== null &&
      licenca.pesagensRestantesTrial > 0
    ) {
      await this.prisma.licencaInstalacao.update({
        where: { id: licenca.id },
        data: { pesagensRestantesTrial: { decrement: 1 } },
      });
      return { ok: true };
    }
    return { ok: false, motivo: 'nao_trial_ou_esgotado' };
  }
}
