'use client';

import { Printer } from 'lucide-react';
import { useConfiguracaoForm } from '@/hooks/useConfiguracaoForm';
import { ConfigSection, ConfigToolbar, ToggleRow } from '@/components/config/ConfigShared';
import { Input } from '@/components/ui/input';

export default function ConfigImpressaoPage() {
  const { local, isLoading, dirty, salvouEm, salvando, toggle, set, restaurar, salvar } =
    useConfiguracaoForm();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-700 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      <ConfigToolbar
        titulo="Impressão"
        descricao="Templates, cópias, logomarca e rodapé."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={salvando}
        onRestaurar={restaurar}
        onSalvar={salvar}
      />

      <ConfigSection
        title="Comportamento da impressão"
        icon={<Printer className="w-5 h-5 text-slate-500" />}
      >
        <ToggleRow
          label="Preview antes de imprimir"
          description="Mostra o ticket em PDF para conferência antes de enviar à impressora."
          checked={!!local.preview_impressao}
          onChange={() => toggle('preview_impressao')}
        />
        <ToggleRow
          label="Manter preview aberto"
          description="Não fecha o preview automaticamente após imprimir."
          checked={!!local.manter_preview_aberto}
          onChange={() => toggle('manter_preview_aberto')}
          disabled={!local.preview_impressao}
        />
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Número de cópias</p>
            <p className="text-xs text-slate-500">Quantas vias do ticket serão impressas.</p>
          </div>
          <Input
            type="number"
            min={1}
            max={10}
            value={local.numero_copias ?? 1}
            onChange={(e) => set('numero_copias', parseInt(e.target.value) || 1)}
            className="w-24"
          />
        </div>
      </ConfigSection>

      <ConfigSection title="Templates e marca">
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800">Modelo de ticket padrão</p>
            <p className="text-xs text-slate-500">
              ID do template usado quando o ticket não especifica um (ex: TICKET002_PADRAO).
            </p>
          </div>
          <Input
            value={local.modelo_ticket_padrao ?? ''}
            onChange={(e) => set('modelo_ticket_padrao', e.target.value)}
            placeholder="TICKET002_PADRAO"
            className="w-56"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800">Logomarca padrão (caminho)</p>
            <p className="text-xs text-slate-500">Imagem usada nos tickets impressos.</p>
          </div>
          <Input
            value={local.logomarca_padrao ?? ''}
            onChange={(e) => set('logomarca_padrao', e.target.value)}
            placeholder="C:\caminho\logo.png"
            className="w-72"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800">Logomarca para relatórios</p>
            <p className="text-xs text-slate-500">Imagem usada no cabeçalho dos relatórios.</p>
          </div>
          <Input
            value={local.logomarca_relatorio ?? ''}
            onChange={(e) => set('logomarca_relatorio', e.target.value)}
            placeholder="Opcional — usa logomarca padrão se vazio"
            className="w-72"
          />
        </div>
        <div className="py-3">
          <p className="text-sm font-medium text-slate-800 mb-2">Texto do rodapé do ticket</p>
          <textarea
            value={local.rodape_texto ?? ''}
            onChange={(e) => set('rodape_texto', e.target.value)}
            placeholder="Ex: Pesagem regida pelo INMETRO. Reclamações em até 24h."
            rows={3}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </div>
      </ConfigSection>
    </div>
  );
}
