import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { errorMessage } from '../common/error-message.util';
import { getUserDataDir } from '../common/desktop-paths';

/**
 * F-029: Certificate Revocation List offline.
 *
 * Formato do arquivo CRL: JWT RS256 assinado pela MESMA chave privada que
 * emite as licencas. Payload:
 *   {
 *     iat: number,
 *     issued_at: ISOString,
 *     version: number,
 *     revoked: string[],   // lista de "jti" de licencas revogadas
 *   }
 *
 * Local default: ${userData}/licenca-crl.jwt
 * Override por env: LICENSE_CRL_PATH
 *
 * Recarregamento: chamar reload() depois de POST /licenca/crl ou no boot.
 * Em primeiro boot sem arquivo, a CRL inicia vazia. Depois que uma CRL valida
 * foi carregada, arquivo ausente/corrompido preserva a ultima lista valida.
 */

interface CrlPayload {
  iat: number;
  version: number;
  revoked: string[];
  issued_at?: string;
}

@Injectable()
export class CrlService implements OnModuleInit {
  private readonly logger = new Logger(CrlService.name);
  private revogados = new Set<string>();
  private versao = 0;
  private emitidaEm: Date | null = null;
  private publicKey = '';

  setPublicKey(key: string) {
    this.publicKey = key;
    this.recarregar();
  }

  onModuleInit() {
    // chave pode ainda nao estar disponivel; LicencaService chama setPublicKey()
    // assim que carrega a sua. Mantemos best-effort caso ja exista.
  }

  private get crlPath(): string {
    return process.env.LICENSE_CRL_PATH || path.join(getUserDataDir(), 'licenca-crl.jwt');
  }

  /** Recarrega o arquivo CRL do disco e valida assinatura. */
  recarregar(): { ok: boolean; total: number; versao: number; motivo?: string } {
    if (!this.publicKey) {
      return { ok: false, total: 0, versao: 0, motivo: 'chave_publica_indisponivel' };
    }
    const p = this.crlPath;
    if (!fs.existsSync(p)) {
      if (this.versao > 0 || this.revogados.size > 0) {
        this.logger.warn(`CRL ausente em ${p}; mantendo ultima CRL valida em memoria.`);
        return {
          ok: false,
          total: this.revogados.size,
          versao: this.versao,
          motivo: 'crl_ausente_ultima_valida_mantida',
        };
      }
      this.revogados = new Set();
      this.versao = 0;
      this.emitidaEm = null;
      return { ok: true, total: 0, versao: 0, motivo: 'crl_ausente' };
    }
    try {
      const raw = fs.readFileSync(p, 'utf8').trim();
      const payload = jwt.verify(raw, this.publicKey, { algorithms: ['RS256'] }) as CrlPayload;
      if (!payload || !Array.isArray(payload.revoked)) {
        throw new Error('payload sem campo revoked[]');
      }
      this.revogados = new Set(payload.revoked.filter((s) => typeof s === 'string'));
      this.versao = Number(payload.version ?? 0);
      this.emitidaEm = payload.issued_at
        ? new Date(payload.issued_at)
        : new Date(payload.iat * 1000);
      this.logger.log(`CRL carregada: ${this.revogados.size} jti(s), versao=${this.versao}`);
      return { ok: true, total: this.revogados.size, versao: this.versao };
    } catch (e) {
      this.logger.warn(`CRL invalida em ${p}: ${errorMessage(e)}`);
      return {
        ok: false,
        total: this.revogados.size,
        versao: this.versao,
        motivo: errorMessage(e),
      };
    }
  }

  /** Verifica se um jti esta revogado. */
  isRevogado(jti: string | undefined): boolean {
    if (!jti) return false;
    return this.revogados.has(jti);
  }

  /** Substitui o arquivo CRL. valida antes de gravar. */
  upsertCrl(crlJwt: string): { ok: boolean; total: number; versao: number } {
    if (!this.publicKey) {
      throw new BadRequestException('Sistema de licenciamento indisponivel.');
    }
    let payload: CrlPayload;
    try {
      payload = jwt.verify(crlJwt, this.publicKey, { algorithms: ['RS256'] }) as CrlPayload;
    } catch (e) {
      throw new BadRequestException(`CRL invalida: ${errorMessage(e)}`);
    }
    if (!payload || !Array.isArray(payload.revoked)) {
      throw new BadRequestException('CRL com payload invalido (revoked[] ausente).');
    }
    if (payload.version !== undefined && payload.version < this.versao) {
      throw new BadRequestException(
        `CRL recusada: versao ${payload.version} menor que a atual ${this.versao}.`,
      );
    }
    const p = this.crlPath;
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, crlJwt, 'utf8');
    return this.recarregar() as { ok: boolean; total: number; versao: number };
  }

  status() {
    return {
      total: this.revogados.size,
      versao: this.versao,
      emitidaEm: this.emitidaEm,
      arquivo: this.crlPath,
    };
  }
}
