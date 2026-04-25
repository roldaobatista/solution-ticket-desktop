import { isValidCPF, isValidCNPJ } from '@brazilian-utils/brazilian-utils';
import { BadRequestException } from '@nestjs/common';

/**
 * Tipos de pessoa suportados em Empresa e Cliente.
 *  - PJ: Pessoa Juridica (CNPJ obrigatorio)
 *  - PF: Pessoa Fisica (CPF obrigatorio)
 *  - PRODUTOR_RURAL: Inscricao Estadual obrigatoria; CPF opcional
 */
export type TipoPessoa = 'PJ' | 'PF' | 'PRODUTOR_RURAL';

export interface DadosFiscaisPessoa {
  tipoPessoa: TipoPessoa;
  documento?: string | null;
  inscricaoEstadual?: string | null;
  inscricaoMunicipal?: string | null;
}

const TIPOS_VALIDOS: TipoPessoa[] = ['PJ', 'PF', 'PRODUTOR_RURAL'];

/**
 * Valida coerencia entre tipoPessoa e os documentos. Lanca BadRequestException
 * em caso de violacao. Use no DTO/Service antes de gravar.
 */
export function validarPessoaFiscal(d: DadosFiscaisPessoa): void {
  if (!TIPOS_VALIDOS.includes(d.tipoPessoa)) {
    throw new BadRequestException(
      `tipoPessoa invalido: "${d.tipoPessoa}". Use PJ | PF | PRODUTOR_RURAL.`,
    );
  }

  const doc = (d.documento ?? '').replace(/\D/g, '');
  const ie = (d.inscricaoEstadual ?? '').trim();

  switch (d.tipoPessoa) {
    case 'PJ':
      if (!doc) throw new BadRequestException('CNPJ obrigatorio para Pessoa Juridica.');
      if (!isValidCNPJ(doc)) throw new BadRequestException(`CNPJ invalido: ${d.documento}`);
      break;
    case 'PF':
      if (!doc) throw new BadRequestException('CPF obrigatorio para Pessoa Fisica.');
      if (!isValidCPF(doc)) throw new BadRequestException(`CPF invalido: ${d.documento}`);
      break;
    case 'PRODUTOR_RURAL':
      if (!ie) {
        throw new BadRequestException('Inscricao Estadual obrigatoria para Produtor Rural.');
      }
      // CPF opcional, mas se informado deve ser valido.
      if (doc && !isValidCPF(doc)) {
        throw new BadRequestException(`CPF do produtor invalido: ${d.documento}`);
      }
      break;
  }
}

/** Normaliza documento (so digitos) antes de gravar. */
export function normalizarDocumento(doc?: string | null): string | null {
  if (!doc) return null;
  const digits = doc.replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}
