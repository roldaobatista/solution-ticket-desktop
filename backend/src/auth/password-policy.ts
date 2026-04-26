import { UnauthorizedException } from '@nestjs/common';

/**
 * Onda 2.7 — politica de senha minima.
 * - 10+ caracteres
 * - ao menos 1 letra
 * - ao menos 1 numero
 *
 * Mantida intencionalmente moderada para nao atritar com fluxo desktop;
 * upgrade para complexidade adicional (caractere especial, blocklist) pode
 * vir em wave futura conforme demanda do cliente.
 */
export function validarPoliticaSenha(senha: string): void {
  if (!senha || senha.length < 10) {
    throw new UnauthorizedException('Senha invalida (minimo 10 caracteres)');
  }
  if (!/[A-Za-z]/.test(senha)) {
    throw new UnauthorizedException('Senha invalida (deve conter ao menos 1 letra)');
  }
  if (!/[0-9]/.test(senha)) {
    throw new UnauthorizedException('Senha invalida (deve conter ao menos 1 numero)');
  }
}
