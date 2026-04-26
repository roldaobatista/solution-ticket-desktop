'use client';

import Link from 'next/link';
import { Camera, Wifi, ArrowUpRight } from 'lucide-react';
import { useConfiguracaoForm } from '@/hooks/useConfiguracaoForm';
import { ConfigSection, ConfigToolbar, ToggleRow } from '@/components/config/ConfigShared';

export default function ConfigIntegracoesPage() {
  const { local, isLoading, dirty, salvouEm, salvando, toggle, restaurar, salvar } =
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
        titulo="Integrações"
        descricao="Câmeras, bilhetagem e outras integrações externas."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={salvando}
        onRestaurar={restaurar}
        onSalvar={salvar}
      />

      <ConfigSection
        title="Câmeras"
        description="A captura de fotos por webcam ou câmera IP fica disponível na aba 'Fotos' do ticket."
        icon={<Camera className="w-5 h-5 text-slate-500" />}
      >
        <ToggleRow
          label="Câmeras habilitadas"
          description="Mostra a aba 'Fotos' no detalhe do ticket."
          checked={!!local.cameras}
          onChange={() => toggle('cameras')}
        />
      </ConfigSection>

      <ConfigSection title="Bilhetagem (etiqueta)">
        <ToggleRow
          label="Bilhetagem habilitada"
          description="Imprime etiqueta auxiliar na primeira passagem (ESC/POS)."
          checked={!!local.bilhetagem}
          onChange={() => toggle('bilhetagem')}
        />
      </ConfigSection>

      <ConfigSection
        title="Hardware (balanças)"
        description="Configurações por equipamento ficam no cadastro de balanças."
      >
        <Link
          href="/cadastros/balancas"
          className="flex items-center justify-between py-3 hover:bg-slate-50 rounded -mx-2 px-2"
        >
          <div className="flex items-center gap-3">
            <Wifi className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-800">Cadastro de balanças</p>
              <p className="text-xs text-slate-500">
                Porta, protocolo, ajuste de leitura e calibração por balança.
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Link>
      </ConfigSection>
    </div>
  );
}
