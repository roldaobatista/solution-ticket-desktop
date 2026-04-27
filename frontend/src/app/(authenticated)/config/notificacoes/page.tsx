'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Mail,
  Webhook,
  Info,
  Loader2,
  Save,
  RotateCcw,
  Trash2,
  TestTube,
} from 'lucide-react';
import {
  getSmtpConfig,
  upsertSmtpConfig,
  deleteSmtpConfig,
  testSmtpConnection,
  getNotificacoesConfig,
  saveNotificacoesConfig,
  type SmtpConfig,
  type NotificacoesConfig,
} from '@/lib/api/mailer';
import { extractMessage } from '@/lib/errors';
import { ConfigSection, ConfigToolbar, ToggleRow } from '@/components/config/ConfigShared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

function emptySmtp(): SmtpConfig {
  return {
    host: '',
    port: 587,
    secure: false,
    user: '',
    senha: '',
    from: '',
    fromName: '',
    ativo: true,
  };
}

const NOTIF_DEFAULT: NotificacoesConfig = {
  emailErrosImpressao: false,
  emailBackupFalha: false,
  emailEnderecos: '',
  webhookUrl: '',
};

export default function ConfigNotificacoesPage() {
  const qc = useQueryClient();
  const [orig, setOrig] = useState<NotificacoesConfig>(NOTIF_DEFAULT);
  const [form, setForm] = useState<NotificacoesConfig>(NOTIF_DEFAULT);
  const [salvouEm, setSalvouEm] = useState<number | null>(null);

  // SMTP state
  const [smtp, setSmtp] = useState<SmtpConfig>(emptySmtp());
  const [smtpDirty, setSmtpDirty] = useState(false);
  const [testando, setTestando] = useState(false);
  const [testeMsg, setTesteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const { data: notifServer } = useQuery({
    queryKey: ['notificacoes-config'],
    queryFn: getNotificacoesConfig,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (notifServer) {
      const merged = { ...NOTIF_DEFAULT, ...notifServer };
      setOrig(merged);
      setForm(merged);
    }
  }, [notifServer]);

  const notifMut = useMutation({
    mutationFn: saveNotificacoesConfig,
    onSuccess: (saved) => {
      const merged = { ...NOTIF_DEFAULT, ...saved };
      setOrig(merged);
      setForm(merged);
      setSalvouEm(Date.now());
      qc.invalidateQueries({ queryKey: ['notificacoes-config'] });
    },
  });

  const { data: smtpServer, isLoading: smtpLoading } = useQuery({
    queryKey: ['smtp-config'],
    queryFn: getSmtpConfig,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (smtpServer) {
      setSmtp({ ...emptySmtp(), ...smtpServer, senha: '' }); // nunca preenche senha de volta
    } else {
      setSmtp(emptySmtp());
    }
    setSmtpDirty(false);
    setTesteMsg(null);
  }, [smtpServer]);

  const smtpMut = useMutation({
    mutationFn: upsertSmtpConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['smtp-config'] });
      setSmtpDirty(false);
      setTesteMsg({ ok: true, text: 'Configuracao SMTP salva.' });
    },
    onError: (err: unknown) => {
      setTesteMsg({ ok: false, text: extractMessage(err, 'Erro ao salvar SMTP.') });
    },
  });

  const smtpDel = useMutation({
    mutationFn: deleteSmtpConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['smtp-config'] });
      setSmtp(emptySmtp());
      setSmtpDirty(false);
      setTesteMsg({ ok: true, text: 'Configuracao SMTP removida.' });
    },
    onError: (err: unknown) => {
      setTesteMsg({ ok: false, text: extractMessage(err, 'Erro ao remover SMTP.') });
    },
  });

  const dirty = JSON.stringify(form) !== JSON.stringify(orig);

  function set<K extends keyof NotificacoesConfig>(key: K, value: NotificacoesConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSalvouEm(null);
  }

  function salvarNotificacoes() {
    notifMut.mutate(form);
  }

  function salvarSmtp() {
    const payload: SmtpConfig = { ...smtp };
    if (!payload.senha || payload.senha.trim() === '') {
      // Se nao digitou senha e ja existe config no servidor,
      // envia patch parcial para nao sobrescrever senha.
      if (smtpServer?.id) {
        const { senha, ...rest } = payload;
        void senha;
        smtpMut.mutate(rest as SmtpConfig);
        return;
      }
    }
    smtpMut.mutate(payload);
  }

  async function testarSmtp() {
    setTestando(true);
    setTesteMsg(null);
    try {
      const r = await testSmtpConnection();
      setTesteMsg({ ok: r.ok, text: r.message });
    } catch (err: unknown) {
      setTesteMsg({ ok: false, text: extractMessage(err, 'Erro ao testar conexao.') });
    } finally {
      setTestando(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <ConfigToolbar
        titulo="Notificações"
        descricao="Eventos que disparam alertas externos (e-mail, webhook)."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={notifMut.isPending}
        onRestaurar={() => setForm(orig)}
        onSalvar={salvarNotificacoes}
      />

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium">Configuração de SMTP</p>
          <p className="mt-1 text-blue-800/90">
            Configure abaixo o servidor SMTP para envio de e-mails (recuperação de senha, alertas).
            A senha é criptografada no banco de dados.
          </p>
        </div>
      </div>

      <ConfigSection title="E-mail" icon={<Mail className="w-5 h-5 text-slate-500" />}>
        <ToggleRow
          label="Alertar erros de impressão"
          description="Envia e-mail quando o sistema falha ao gerar/enviar ticket para impressora."
          checked={form.emailErrosImpressao}
          onChange={(v) => set('emailErrosImpressao', v)}
        />
        <ToggleRow
          label="Alertar falha em backup automático"
          description="Notifica se o backup agendado não conseguir ser criado."
          checked={form.emailBackupFalha}
          onChange={(v) => set('emailBackupFalha', v)}
        />
        <div className="py-3">
          <label className="block text-xs text-slate-700 mb-1">
            Endereços (separados por vírgula)
          </label>
          <Input
            value={form.emailEnderecos}
            onChange={(e) => set('emailEnderecos', e.target.value)}
            placeholder="suporte@empresa.com, ti@empresa.com"
          />
        </div>
      </ConfigSection>

      <ConfigSection title="Servidor SMTP" icon={<Mail className="w-5 h-5 text-slate-500" />}>
        {smtpLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-700 mb-1">Host</label>
                <Input
                  value={smtp.host}
                  onChange={(e) => {
                    setSmtp((s) => ({ ...s, host: e.target.value }));
                    setSmtpDirty(true);
                  }}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 mb-1">Porta</label>
                <Input
                  type="number"
                  value={smtp.port}
                  onChange={(e) => {
                    setSmtp((s) => ({ ...s, port: Number(e.target.value) }));
                    setSmtpDirty(true);
                  }}
                  placeholder="587"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 mb-1">Usuário</label>
                <Input
                  value={smtp.user}
                  onChange={(e) => {
                    setSmtp((s) => ({ ...s, user: e.target.value }));
                    setSmtpDirty(true);
                  }}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 mb-1">
                  Senha {smtpServer?.id ? '(deixe em branco para manter)' : ''}
                </label>
                <Input
                  type="password"
                  value={smtp.senha}
                  onChange={(e) => {
                    setSmtp((s) => ({ ...s, senha: e.target.value }));
                    setSmtpDirty(true);
                  }}
                  placeholder="********"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 mb-1">De (e-mail)</label>
                <Input
                  value={smtp.from}
                  onChange={(e) => {
                    setSmtp((s) => ({ ...s, from: e.target.value }));
                    setSmtpDirty(true);
                  }}
                  placeholder="noreply@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 mb-1">Nome do remetente</label>
                <Input
                  value={smtp.fromName}
                  onChange={(e) => {
                    setSmtp((s) => ({ ...s, fromName: e.target.value }));
                    setSmtpDirty(true);
                  }}
                  placeholder="Solution Ticket"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={smtp.ativo ?? true}
                onCheckedChange={(v) => {
                  setSmtp((s) => ({ ...s, ativo: v }));
                  setSmtpDirty(true);
                }}
              />
              <span className="text-sm text-slate-700">Ativo</span>
              <Switch
                checked={smtp.secure}
                onCheckedChange={(v) => {
                  setSmtp((s) => ({ ...s, secure: v }));
                  setSmtpDirty(true);
                }}
              />
              <span className="text-sm text-slate-700">TLS/SSL (secure)</span>
            </div>

            {testeMsg && (
              <div
                className={`rounded-md px-3 py-2 text-sm ${testeMsg.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
              >
                {testeMsg.text}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" onClick={salvarSmtp} disabled={!smtpDirty || smtpMut.isPending}>
                {smtpMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Salvar SMTP
              </Button>
              <Button size="sm" variant="outline" onClick={testarSmtp} disabled={testando}>
                {testando ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <TestTube className="w-4 h-4 mr-1" />
                )}
                Testar conexão
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSmtp(smtpServer ? { ...emptySmtp(), ...smtpServer, senha: '' } : emptySmtp());
                  setSmtpDirty(false);
                  setTesteMsg(null);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Restaurar
              </Button>
              {smtpServer?.id && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => smtpDel.mutate()}
                  disabled={smtpDel.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Remover
                </Button>
              )}
            </div>
          </div>
        )}
      </ConfigSection>

      <ConfigSection title="Webhook" icon={<Bell className="w-5 h-5 text-slate-500" />}>
        <div className="py-3">
          <label className="block text-xs text-slate-700 mb-1 flex items-center gap-2">
            <Webhook className="w-3.5 h-3.5" /> URL do webhook
          </label>
          <Input
            type="url"
            value={form.webhookUrl}
            onChange={(e) => set('webhookUrl', e.target.value)}
            placeholder="https://exemplo.com/api/solution-ticket-events"
          />
          <p className="text-xs text-slate-500 mt-2">
            POST com payload JSON{' '}
            <code className="px-1 bg-slate-100 rounded">{'{ evento, dados, timestamp }'}</code> será
            disparado nos mesmos eventos selecionados acima.
          </p>
        </div>
      </ConfigSection>
    </div>
  );
}
