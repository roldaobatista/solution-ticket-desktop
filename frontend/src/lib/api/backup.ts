import { apiClient, USE_MOCK } from './client';

export interface BackupItem {
  filename: string;
  path: string;
  sizeBytes: number;
  criadoEm: string;
  tipo: 'manual' | 'auto' | string;
  sha256?: string;
}

export async function listarBackups(): Promise<BackupItem[]> {
  if (USE_MOCK) return [];
  const res = await apiClient.get('/backup');
  return Array.isArray(res.data) ? res.data : [];
}

export async function criarBackup(): Promise<BackupItem> {
  const res = await apiClient.post('/backup/create');
  return res.data;
}

export async function verificarBackup(filename: string): Promise<{ ok: boolean; sha256: string }> {
  const res = await apiClient.post('/backup/verify', { filename });
  return res.data;
}

export async function restaurarBackup(filename: string): Promise<{ ok: true }> {
  const res = await apiClient.post('/backup/restore', { filename });
  return res.data;
}
