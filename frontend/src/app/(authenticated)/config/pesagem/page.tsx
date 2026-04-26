'use client';

import { Scale } from 'lucide-react';
import { useConfiguracaoForm } from '@/hooks/useConfiguracaoForm';
import { ConfigSection, ConfigToolbar, ToggleRow } from '@/components/config/ConfigShared';

export default function ConfigPesagemPage() {
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
        titulo="Pesagem"
        descricao="Fluxos de pesagem, tara e cálculos."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={salvando}
        onRestaurar={restaurar}
        onSalvar={salvar}
      />

      <ConfigSection
        title="Fluxos habilitados"
        description="Define quais tipos de pesagem o operador pode iniciar."
        icon={<Scale className="w-5 h-5 text-slate-500" />}
      >
        <ToggleRow
          label="Pesagem de entrada"
          description="Habilita fluxo de pesagem de entrada (1ª passagem do veículo)."
          checked={!!local.pesagem_entrada}
          onChange={() => toggle('pesagem_entrada')}
        />
        <ToggleRow
          label="Pesagem de saída"
          description="Habilita fluxo de pesagem de saída (2ª passagem)."
          checked={!!local.pesagem_saida}
          onChange={() => toggle('pesagem_saida')}
        />
        <ToggleRow
          label="Pesagem com tara"
          description="Permite ticket usando tara (cadastrada ou referenciada)."
          checked={!!local.pesagem_com_tara}
          onChange={() => toggle('pesagem_com_tara')}
        />
        <ToggleRow
          label="Manter tara cadastrada"
          description="Quando o veículo tem tara cadastrada, o sistema usa automaticamente."
          checked={!!local.manter_tara_cadastrada}
          onChange={() => toggle('manter_tara_cadastrada')}
        />
      </ConfigSection>

      <ConfigSection title="Cálculo do peso líquido">
        <ToggleRow
          label="Descontos por umidade/quebra"
          description="Aplica descontos sobre o peso líquido do ticket."
          checked={!!local.descontos}
          onChange={() => toggle('descontos')}
        />
        <ToggleRow
          label="Conversão de unidade"
          description="Permite converter entre kg, t e sacos no fechamento."
          checked={!!local.conversao_unidade}
          onChange={() => toggle('conversao_unidade')}
        />
      </ConfigSection>
    </div>
  );
}
