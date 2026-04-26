'use client';

import { ClipboardList } from 'lucide-react';
import { useConfiguracaoForm } from '@/hooks/useConfiguracaoForm';
import { ConfigSection, ConfigToolbar, ToggleRow } from '@/components/config/ConfigShared';
import { Input } from '@/components/ui/input';

export default function ConfigTicketPage() {
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
        titulo="Ticket — Campos exibidos"
        descricao="Liga e desliga seções e campos da tela de pesagem."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={salvando}
        onRestaurar={restaurar}
        onSalvar={salvar}
      />

      <ConfigSection
        title="Cadastros opcionais"
        icon={<ClipboardList className="w-5 h-5 text-slate-500" />}
      >
        <ToggleRow
          label="Transportadora"
          description="Exibe o campo transportadora no ticket."
          checked={!!local.transportadora_habilitada}
          onChange={() => toggle('transportadora_habilitada')}
        />
        <ToggleRow
          label="Motorista"
          description="Exibe o campo motorista no ticket."
          checked={!!local.motorista_habilitado}
          onChange={() => toggle('motorista_habilitado')}
        />
        <ToggleRow
          label="Armazém"
          description="Exibe o campo armazém de destino interno."
          checked={!!local.armazem_habilitado}
          onChange={() => toggle('armazem_habilitado')}
        />
        <ToggleRow
          label="Origem / Destino"
          description="Exibe campos de origem e destino externos."
          checked={!!local.origem_destino}
          onChange={() => toggle('origem_destino')}
        />
      </ConfigSection>

      <ConfigSection title="Conteúdo livre">
        <ToggleRow
          label="Observação"
          description="Exibe campo de observação livre no ticket."
          checked={!!local.observacao_habilitada}
          onChange={() => toggle('observacao_habilitada')}
        />
        <ToggleRow
          label="Lista de documentos"
          description="Habilita aba de anexos fiscais (NFe/CTe/etc)."
          checked={!!local.lista_documentos}
          onChange={() => toggle('lista_documentos')}
        />
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800">Label do campo adicional 1</p>
            <p className="text-xs text-slate-500">Texto exibido como rótulo do campo extra 1.</p>
          </div>
          <Input
            value={local.label_adicional_1 ?? ''}
            onChange={(e) => set('label_adicional_1', e.target.value)}
            placeholder="Ex: Lote, Talão, NF-e..."
            className="w-56"
          />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Label do campo adicional 2</p>
            <p className="text-xs text-slate-500">Texto exibido como rótulo do campo extra 2.</p>
          </div>
          <Input
            value={local.label_adicional_2 ?? ''}
            onChange={(e) => set('label_adicional_2', e.target.value)}
            placeholder="Opcional"
            className="w-56"
          />
        </div>
      </ConfigSection>

      <ConfigSection title="Manutenção pós-fechamento">
        <ToggleRow
          label="Manutenção de ticket"
          description="Permite reabrir ticket fechado para correção (com auditoria)."
          checked={!!local.manutencao_ticket}
          onChange={() => toggle('manutencao_ticket')}
        />
      </ConfigSection>
    </div>
  );
}
