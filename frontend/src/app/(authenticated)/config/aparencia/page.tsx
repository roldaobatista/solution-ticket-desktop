'use client';

import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { uiPrefs, type UiPrefs } from '@/lib/config-prefs';
import { ConfigSection, ConfigToolbar, ToggleRow } from '@/components/config/ConfigShared';
import { Select } from '@/components/ui/select';

export default function ConfigAparenciaPage() {
  const [orig, setOrig] = useState<UiPrefs>(uiPrefs.default);
  const [form, setForm] = useState<UiPrefs>(uiPrefs.default);
  const [salvouEm, setSalvouEm] = useState<number | null>(null);

  useEffect(() => {
    const v = uiPrefs.load();
    setOrig(v);
    setForm(v);
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(orig);

  function set<K extends keyof UiPrefs>(key: K, value: UiPrefs[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSalvouEm(null);
  }

  function salvar() {
    uiPrefs.save(form);
    setOrig(form);
    setSalvouEm(Date.now());
  }

  return (
    <div className="space-y-4 pb-12">
      <ConfigToolbar
        titulo="Aparência"
        descricao="Tema, densidade e idioma. Preferências locais deste navegador."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={false}
        onRestaurar={() => setForm(orig)}
        onSalvar={salvar}
      />

      <ConfigSection title="Tema" icon={<Palette className="w-5 h-5 text-slate-500" />}>
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800">Esquema de cores</p>
            <p className="text-xs text-slate-500">
              &quot;Auto&quot; segue a preferência do sistema operacional.
            </p>
          </div>
          <Select
            value={form.tema}
            onChange={(e) => set('tema', e.target.value as UiPrefs['tema'])}
            options={[
              { value: 'claro', label: 'Claro' },
              { value: 'escuro', label: 'Escuro (em desenvolvimento)' },
              { value: 'auto', label: 'Auto (sistema)' },
            ]}
            className="w-56"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800">Densidade</p>
            <p className="text-xs text-slate-500">Espaçamento de tabelas e listas.</p>
          </div>
          <Select
            value={form.densidade}
            onChange={(e) => set('densidade', e.target.value as UiPrefs['densidade'])}
            options={[
              { value: 'compacta', label: 'Compacta' },
              { value: 'normal', label: 'Normal' },
              { value: 'confortavel', label: 'Confortável' },
            ]}
            className="w-56"
          />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Idioma</p>
            <p className="text-xs text-slate-500">Apenas pt-BR está completo no momento.</p>
          </div>
          <Select
            value={form.idioma}
            onChange={(e) => set('idioma', e.target.value as UiPrefs['idioma'])}
            options={[
              { value: 'pt-BR', label: 'Português (Brasil)' },
              { value: 'en-US', label: 'English (em desenvolvimento)' },
              { value: 'es-AR', label: 'Español (em desenvolvimento)' },
            ]}
            className="w-56"
          />
        </div>
      </ConfigSection>

      <ConfigSection title="Tela de pesagem">
        <ToggleRow
          label="Cor verde para peso estável"
          description="Mostra peso em verde quando estabilizado pela balança."
          checked={form.pesoComCor}
          onChange={(v) => set('pesoComCor', v)}
        />
        <ToggleRow
          label="Som ao registrar passagem"
          description="Toca um beep curto na captura de peso."
          checked={form.somNotificacao}
          onChange={(v) => set('somNotificacao', v)}
        />
        <ToggleRow
          label="Atalho F1 abre ajuda"
          description="Tecla F1 mostra cheatsheet de atalhos da tela atual."
          checked={form.atalhoF1Ajuda}
          onChange={(v) => set('atalhoF1Ajuda', v)}
        />
      </ConfigSection>
    </div>
  );
}
