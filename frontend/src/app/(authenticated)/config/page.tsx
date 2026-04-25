'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { getConfiguracao, updateConfiguracao } from '@/lib/api';
import { ConfiguracaoOperacional } from '@/types';
import { Save, Settings, RotateCcw, CheckCircle2 } from 'lucide-react';

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function ConfigPage() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracao'],
    queryFn: () => getConfiguracao(),
  });

  const [localConfig, setLocalConfig] = useState<Partial<ConfiguracaoOperacional>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) setLocalConfig(config);
  }, [config]);

  const updateMut = useMutation({
    mutationFn: updateConfiguracao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const toggle = (key: keyof ConfiguracaoOperacional) => {
    setLocalConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    updateMut.mutate(localConfig);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-700 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuracao</h1>
          <p className="text-sm text-slate-500 mt-1">Parametros operacionais do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Salvo com sucesso
            </Badge>
          )}
          <Button variant="secondary" onClick={() => setLocalConfig(config || {})}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={updateMut.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alteracoes
          </Button>
        </div>
      </div>

      {/* Pesagem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            Pesagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleRow
            label="Pesagem com Tara"
            description="Habilita pesagem utilizando tara cadastrada"
            checked={!!localConfig.pesagem_com_tara}
            onChange={() => toggle('pesagem_com_tara')}
          />
          <ToggleRow
            label="Pesagem de Entrada"
            description="Habilita fluxo de pesagem de entrada"
            checked={!!localConfig.pesagem_entrada}
            onChange={() => toggle('pesagem_entrada')}
          />
          <ToggleRow
            label="Pesagem de Saida"
            description="Habilita fluxo de pesagem de saida"
            checked={!!localConfig.pesagem_saida}
            onChange={() => toggle('pesagem_saida')}
          />
          <ToggleRow
            label="Manter Tara Cadastrada"
            description="Usa tara do veiculo quando disponivel"
            checked={!!localConfig.manter_tara_cadastrada}
            onChange={() => toggle('manter_tara_cadastrada')}
          />
          <ToggleRow
            label="Descontos"
            description="Habilita calculo de descontos no ticket"
            checked={!!localConfig.descontos}
            onChange={() => toggle('descontos')}
          />
          <ToggleRow
            label="Conversao de Unidade"
            description="Permite converter entre unidades de peso"
            checked={!!localConfig.conversao_unidade}
            onChange={() => toggle('conversao_unidade')}
          />
        </CardContent>
      </Card>

      {/* Cadastros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cadastros e Campos</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleRow
            label="Transportadora"
            description="Exibe campo transportadora no ticket"
            checked={!!localConfig.transportadora_habilitada}
            onChange={() => toggle('transportadora_habilitada')}
          />
          <ToggleRow
            label="Motorista"
            description="Exibe campo motorista no ticket"
            checked={!!localConfig.motorista_habilitado}
            onChange={() => toggle('motorista_habilitado')}
          />
          <ToggleRow
            label="Armazem"
            description="Exibe campo armazem no ticket"
            checked={!!localConfig.armazem_habilitado}
            onChange={() => toggle('armazem_habilitado')}
          />
          <ToggleRow
            label="Origem/Destino"
            description="Exibe campos origem e destino"
            checked={!!localConfig.origem_destino}
            onChange={() => toggle('origem_destino')}
          />
          <ToggleRow
            label="Observacao"
            description="Exibe campo de observacao no ticket"
            checked={!!localConfig.observacao_habilitada}
            onChange={() => toggle('observacao_habilitada')}
          />
          <ToggleRow
            label="Lista de Documentos"
            description="Habilita controle de documentos"
            checked={!!localConfig.lista_documentos}
            onChange={() => toggle('lista_documentos')}
          />
        </CardContent>
      </Card>

      {/* Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleRow
            label="Financeiro"
            description="Habilita modulos financeiros"
            checked={!!localConfig.financeiro}
            onChange={() => toggle('financeiro')}
          />
          <ToggleRow
            label="Preco de Venda"
            description="Habilita precificacao no ticket"
            checked={!!localConfig.preco_venda}
            onChange={() => toggle('preco_venda')}
          />
          <ToggleRow
            label="Calculo de Frete"
            description="Habilita calculo automatico de frete"
            checked={!!localConfig.calculo_frete}
            onChange={() => toggle('calculo_frete')}
          />
          <ToggleRow
            label="Tabela de Umidade"
            description="Habilita descontos por umidade"
            checked={!!localConfig.tabela_umidade}
            onChange={() => toggle('tabela_umidade')}
          />
          <ToggleRow
            label="Emissao de Romaneio"
            description="Permite emitir romaneios"
            checked={!!localConfig.emissao_romaneio}
            onChange={() => toggle('emissao_romaneio')}
          />
          <ToggleRow
            label="Edicao de Romaneio"
            description="Permite editar romaneios"
            checked={!!localConfig.edicao_romaneio}
            onChange={() => toggle('edicao_romaneio')}
          />
          <ToggleRow
            label="Habilita Baixa"
            description="Habilita baixa de faturas"
            checked={!!localConfig.habilita_baixa}
            onChange={() => toggle('habilita_baixa')}
          />
        </CardContent>
      </Card>

      {/* Impressao */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Impressao</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleRow
            label="Preview de Impressao"
            description="Exibe preview antes de imprimir"
            checked={!!localConfig.preview_impressao}
            onChange={() => toggle('preview_impressao')}
          />
          <ToggleRow
            label="Manter Preview Aberto"
            description="Nao fecha preview apos impressao"
            checked={!!localConfig.manter_preview_aberto}
            onChange={() => toggle('manter_preview_aberto')}
          />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Numero de Copias</p>
              <p className="text-xs text-slate-500">Quantidade de copias impressas</p>
            </div>
            <Input
              type="number"
              min={1}
              max={10}
              value={localConfig.numero_copias || 1}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  numero_copias: parseInt(e.target.value) || 1,
                }))
              }
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Outros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outros</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleRow
            label="Cameras"
            description="Habilita integracao com cameras"
            checked={!!localConfig.cameras}
            onChange={() => toggle('cameras')}
          />
          <ToggleRow
            label="Bilhetagem"
            description="Habilita emissao de bilhetes"
            checked={!!localConfig.bilhetagem}
            onChange={() => toggle('bilhetagem')}
          />
          <ToggleRow
            label="Manutencao de Ticket"
            description="Permite manutencao em tickets fechados"
            checked={!!localConfig.manutencao_ticket}
            onChange={() => toggle('manutencao_ticket')}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pb-6">
        <Button variant="primary" size="lg" onClick={handleSave} isLoading={updateMut.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Todas as Alteracoes
        </Button>
      </div>
    </div>
  );
}
