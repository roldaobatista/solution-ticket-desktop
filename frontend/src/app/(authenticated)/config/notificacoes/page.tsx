'use client';

import { useEffect, useState } from 'react';
import { Bell, Mail, Webhook, Info } from 'lucide-react';
import { notificacoesPrefs, type NotificacoesPrefs } from '@/lib/config-prefs';
import { ConfigSection, ConfigToolbar, ToggleRow } from '@/components/config/ConfigShared';
import { Input } from '@/components/ui/input';

export default function ConfigNotificacoesPage() {
  const [orig, setOrig] = useState<NotificacoesPrefs>(notificacoesPrefs.default);
  const [form, setForm] = useState<NotificacoesPrefs>(notificacoesPrefs.default);
  const [salvouEm, setSalvouEm] = useState<number | null>(null);

  useEffect(() => {
    const v = notificacoesPrefs.load();
    setOrig(v);
    setForm(v);
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(orig);

  function set<K extends keyof NotificacoesPrefs>(key: K, value: NotificacoesPrefs[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSalvouEm(null);
  }

  function salvar() {
    notificacoesPrefs.save(form);
    setOrig(form);
    setSalvouEm(Date.now());
  }

  return (
    <div className="space-y-4 pb-12">
      <ConfigToolbar
        titulo="Notificações"
        descricao="Eventos que disparam alertas externos (e-mail, webhook)."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={false}
        onRestaurar={() => setForm(orig)}
        onSalvar={salvar}
      />

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium">Configuração de SMTP/webhook ainda não implementada</p>
          <p className="mt-1 text-blue-800/90">
            Os toggles abaixo definem QUAIS eventos devem notificar. O envio efetivo depende de SMTP
            configurado em variáveis de ambiente do backend (próxima iteração) ou webhook HTTP
            genérico.
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
