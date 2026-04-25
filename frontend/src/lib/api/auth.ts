import { apiClient, USE_MOCK } from './client';
import { Usuario } from '@/types';
import { mockApi } from '../mock-api';

export async function login(
  email: string,
  senha: string,
): Promise<{ access_token: string; usuario: Usuario }> {
  if (USE_MOCK) return mockApi.login(email, senha);
  const res = await apiClient.post('/auth/login', { email, senha });
  const raw = res.data as {
    accessToken?: string;
    access_token?: string;
    usuario: Usuario & { unidadeId?: string; unidade_id?: string };
  };
  const usuario = raw.usuario;
  if (typeof window !== 'undefined' && usuario) {
    const uid =
      (usuario as { unidadeId?: string; unidade_id?: string }).unidadeId ||
      (usuario as { unidade_id?: string }).unidade_id;
    if (uid) {
      // RS4: store em memoria via dynamic import (evita ciclo).
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../../stores/unidade.store').setUnidadeId(uid);
    }
  }
  return {
    access_token: raw.access_token ?? raw.accessToken ?? '',
    usuario,
  };
}

export async function getMe(): Promise<Usuario> {
  if (USE_MOCK) return mockApi.getMe();
  const res = await apiClient.get('/auth/me');
  const usuario = res.data as Usuario & { unidadeId?: string; unidade_id?: string };
  if (typeof window !== 'undefined' && usuario) {
    const uid =
      (usuario as { unidadeId?: string; unidade_id?: string }).unidadeId ||
      (usuario as { unidade_id?: string }).unidade_id;
    if (uid) {
      // RS4: store em memoria via dynamic import (evita ciclo).
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../../stores/unidade.store').setUnidadeId(uid);
    }
  }
  return usuario;
}

export async function changePassword(
  senhaAtual: string,
  novaSenha: string,
): Promise<{ ok: boolean }> {
  const res = await apiClient.post('/auth/change-password', { senhaAtual, novaSenha });
  return res.data;
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  const res = await apiClient.post('/auth/request-password-reset', { email });
  return res.data;
}

export async function resetPassword(token: string, novaSenha: string): Promise<{ ok: boolean }> {
  const res = await apiClient.post('/auth/reset-password', { token, novaSenha });
  return res.data;
}
