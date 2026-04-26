'use client';

import { Coins } from 'lucide-react';
import { useConfiguracaoForm } from '@/hooks/useConfiguracaoForm';
import { ConfigSection, ConfigToolbar, ToggleRow } from '@/components/config/ConfigShared';

export default function ConfigFinanceiroPage() {
  const { local, isLoading, dirty, salvouEm, salvando, toggle, restaurar, salvar } =
    useConfiguracaoForm();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-700 rounded-full" />
      </div>
    );
  }

  const financeiroOff = !local.financeiro;

  return (
    <div className="space-y-4 pb-12">
      <ConfigToolbar
        titulo="Financeiro"
        descricao="Preço, frete, romaneios, faturamento e baixa."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={salvando}
        onRestaurar={restaurar}
        onSalvar={salvar}
      />

      <ConfigSection title="Módulo financeiro" icon={<Coins className="w-5 h-5 text-slate-500" />}>
        <ToggleRow
          label="Financeiro habilitado"
          description="Liga o módulo de faturamento, contas e baixas."
          checked={!!local.financeiro}
          onChange={() => toggle('financeiro')}
        />
        <ToggleRow
          label="Habilita baixa de fatura"
          description="Permite registrar pagamentos contra faturas abertas."
          checked={!!local.habilita_baixa}
          onChange={() => toggle('habilita_baixa')}
          disabled={financeiroOff}
        />
      </ConfigSection>

      <ConfigSection title="Comercial">
        <ToggleRow
          label="Preço de venda no ticket"
          description="Calcula valor unitário e total no fechamento."
          checked={!!local.preco_venda}
          onChange={() => toggle('preco_venda')}
        />
        <ToggleRow
          label="Cálculo de frete"
          description="Aplica tabela de frete ao snapshot comercial."
          checked={!!local.calculo_frete}
          onChange={() => toggle('calculo_frete')}
        />
        <ToggleRow
          label="Tabela de umidade"
          description="Desconto por umidade do produto durante o fechamento."
          checked={!!local.tabela_umidade}
          onChange={() => toggle('tabela_umidade')}
        />
      </ConfigSection>

      <ConfigSection title="Romaneios">
        <ToggleRow
          label="Emissão de romaneio"
          description="Permite agrupar tickets em romaneios."
          checked={!!local.emissao_romaneio}
          onChange={() => toggle('emissao_romaneio')}
        />
        <ToggleRow
          label="Edição de romaneio"
          description="Permite alterar romaneios já emitidos (com auditoria)."
          checked={!!local.edicao_romaneio}
          onChange={() => toggle('edicao_romaneio')}
          disabled={!local.emissao_romaneio}
        />
      </ConfigSection>
    </div>
  );
}
