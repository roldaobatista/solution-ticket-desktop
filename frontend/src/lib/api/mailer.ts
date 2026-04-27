import { apiClient } from './client';

export interface SmtpConfig {
  id?: string;
  tenantId?: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  senha?: string;
  from: string;
  fromName?: string;
  ativo?: boolean;
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const res = await apiClient.get('/mailer/config');
  return res.data ?? null;
}

export async function upsertSmtpConfig(data: SmtpConfig): Promise<SmtpConfig> {
  const res = await apiClient.post('/mailer/config', data);
  return res.data;
}

export async function patchSmtpConfig(data: Partial<SmtpConfig>): Promise<SmtpConfig> {
  const res = await apiClient.post('/mailer/config/patch', data);
  return res.data;
}

export async function deleteSmtpConfig(): Promise<void> {
  await apiClient.delete('/mailer/config');
}

export async function testSmtpConnection(): Promise<{ ok: boolean; message: string }> {
  const res = await apiClient.post('/mailer/test');
  return res.data;
}

export interface NotificacoesConfig {
  emailErrosImpressao: boolean;
  emailBackupFalha: boolean;
  emailEnderecos: string;
  webhookUrl: string;
}

export async function getNotificacoesConfig(): Promise<NotificacoesConfig> {
  const res = await apiClient.get('/notificacoes/config');
  return res.data;
}

export async function saveNotificacoesConfig(
  data: Partial<NotificacoesConfig>,
): Promise<NotificacoesConfig> {
  const res = await apiClient.put('/notificacoes/config', data);
  return res.data;
}
