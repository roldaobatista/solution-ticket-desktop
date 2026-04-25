'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { FiltroRelatorio } from '@/components/relatorios/FiltroRelatorio';
import {
  getRelatorioMovimentacao,
  exportarRelatorioMovimentacaoPdf,
  exportarRelatorioAlteradasPdf,
  exportarRelatorioCanceladasPdf,
  getPesagensAlteradas,
  getPesagensExcluidas,
  listarRelatoriosSalvos,
  criarRelatorioSalvo,
  type RelatorioSalvo,
} from '@/lib/api';
import { FiltroRelatorioValues } from '@/types';
import { formatWeight, formatDate, formatNumber } from '@/lib/utils';
import { BarChart3, FileDown, Save, FolderOpen } from 'lucide-react';
import { useEffect } from 'react';

function MovimentacaoTab() {
  const [filtros, setFiltros] = useState<FiltroRelatorioValues>({});
  const [applied, setApplied] = useState<FiltroRelatorioValues | null>(null);
  const [salvos, setSalvos] = useState<RelatorioSalvo[]>([]);
  const [mostrarSalvar, setMostrarSalvar] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');

  const recarregarSalvos = async () => {
    try {
      setSalvos(await listarRelatoriosSalvos('movimento'));
    } catch {}
  };

  useEffect(() => {
    recarregarSalvos();
  }, []);

  const salvarFiltros = async () => {
    if (!nomeNovo.trim()) return;
    await criarRelatorioSalvo(nomeNovo.trim(), 'movimento', filtros);
    setNomeNovo('');
    setMostrarSalvar(false);
    recarregarSalvos();
  };

  const carregarFiltros = (id: string) => {
    const r = salvos.find((x) => x.id === id);
    if (!r) return;
    try {
      const f = JSON.parse(r.filtros) as FiltroRelatorioValues;
      setFiltros(f);
      setApplied(f);
    } catch {}
  };

  const { data, isFetching } = useQuery({
    queryKey: ['rel-movimentacao', applied],
    queryFn: () => getRelatorioMovimentacao(applied || {}),
    enabled: applied !== null,
  });

  const total = data || [];
  const totals = total.reduce(
    (acc, r) => ({
      qtd: acc.qtd + 1,
      bruto: acc.bruto + (r.peso_bruto || 0),
      tara: acc.tara + (r.peso_tara || 0),
      liquido: acc.liquido + (r.peso_liquido || 0),
    }),
    { qtd: 0, bruto: 0, tara: 0, liquido: 0 },
  );

  const [variantePdf, setVariantePdf] = useState<'001' | '002'>('001');

  async function exportarPdf(variante: '001' | '002' = variantePdf) {
    const blob = await exportarRelatorioMovimentacaoPdf(applied || {}, variante);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-movimentacao-${variante}-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="secondary" size="sm" onClick={() => setMostrarSalvar((v) => !v)}>
          <Save className="w-4 h-4 mr-1" /> Salvar filtros
        </Button>
        <div className="flex items-center gap-1">
          <FolderOpen className="w-4 h-4 text-slate-500" />
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
            onChange={(e) => e.target.value && carregarFiltros(e.target.value)}
            value=""
          >
            <option value="">Carregar filtros salvos...</option>
            {salvos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        {mostrarSalvar && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2 py-1">
            <input
              className="border border-slate-300 rounded px-2 py-1 text-sm"
              placeholder="Nome do filtro"
              value={nomeNovo}
              onChange={(e) => setNomeNovo(e.target.value)}
            />
            <Button size="sm" onClick={salvarFiltros} disabled={!nomeNovo.trim()}>
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMostrarSalvar(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <FiltroRelatorio
        value={filtros}
        onChange={setFiltros}
        onApply={() => setApplied(filtros)}
        onClear={() => {
          setFiltros({});
          setApplied(null);
        }}
        showFields={{
          dataInicio: true,
          dataFim: true,
          cliente: true,
          produto: true,
          motorista: true,
          transportadora: true,
          veiculo: true,
          armazem: true,
        }}
        extraActions={
          applied && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => exportarPdf()}>
                <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
              </Button>
              <select
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={variantePdf}
                onChange={(e) => setVariantePdf(e.target.value as '001' | '002')}
                title="Variante do relatorio"
              >
                <option value="001">Original (001)</option>
                <option value="002">Com motorista (002)</option>
              </select>
            </div>
          )
        }
      />

      {applied && (
        <>
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Totalizador label="Quantidade" value={formatNumber(totals.qtd)} />
                <Totalizador label="Peso Bruto" value={formatWeight(totals.bruto)} />
                <Totalizador label="Peso Tara" value={formatWeight(totals.tara)} />
                <Totalizador label="Peso Liquido" value={formatWeight(totals.liquido)} accent />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-500" />
                Resultados
                <Badge variant="info" className="ml-2">
                  {total.length} registros
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Ticket</TableHeader>
                    <TableHeader>Data</TableHeader>
                    <TableHeader>Cliente</TableHeader>
                    <TableHeader>Produto</TableHeader>
                    <TableHeader>Placa</TableHeader>
                    <TableHeader>Motorista</TableHeader>
                    <TableHeader>Bruto</TableHeader>
                    <TableHeader>Tara</TableHeader>
                    <TableHeader>Liquido</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isFetching && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                        Gerando...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isFetching && total.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                        Nenhum registro
                      </TableCell>
                    </TableRow>
                  )}
                  {total.map((r) => (
                    <TableRow key={r.ticket_id}>
                      <TableCell className="font-medium">{r.ticket_numero}</TableCell>
                      <TableCell>{formatDate(r.data)}</TableCell>
                      <TableCell>{r.cliente_nome}</TableCell>
                      <TableCell>{r.produto_nome}</TableCell>
                      <TableCell className="font-mono">{r.veiculo_placa}</TableCell>
                      <TableCell>{r.motorista_nome || '-'}</TableCell>
                      <TableCell>{formatWeight(r.peso_bruto)}</TableCell>
                      <TableCell>{formatWeight(r.peso_tara)}</TableCell>
                      <TableCell className="font-medium">{formatWeight(r.peso_liquido)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function AlteradasTab() {
  const [filtros, setFiltros] = useState<FiltroRelatorioValues>({});
  const [applied, setApplied] = useState<FiltroRelatorioValues | null>(null);
  const { data } = useQuery({
    queryKey: ['rel-alteradas', applied],
    queryFn: () => getPesagensAlteradas(applied || {}),
    enabled: applied !== null,
  });

  async function exportarPdf() {
    const blob = await exportarRelatorioAlteradasPdf(applied || {});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-alteradas-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <FiltroRelatorio
        value={filtros}
        onChange={setFiltros}
        onApply={() => setApplied(filtros)}
        onClear={() => {
          setFiltros({});
          setApplied(null);
        }}
        showFields={{ dataInicio: true, dataFim: true, cliente: false, produto: false }}
        extraActions={
          applied && (
            <Button variant="secondary" onClick={exportarPdf}>
              <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
          )
        }
      />

      {applied && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pesagens Alteradas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Ticket</TableHeader>
                  <TableHeader>Data Alteracao</TableHeader>
                  <TableHeader>Usuario</TableHeader>
                  <TableHeader>Campo</TableHeader>
                  <TableHeader>Valor Anterior</TableHeader>
                  <TableHeader>Valor Novo</TableHeader>
                  <TableHeader>Motivo</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      Nenhum registro
                    </TableCell>
                  </TableRow>
                ) : (
                  (data || []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.ticket_numero}</TableCell>
                      <TableCell>{formatDate(r.data_alteracao)}</TableCell>
                      <TableCell>{r.usuario_nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.campo_alterado}</Badge>
                      </TableCell>
                      <TableCell className="text-red-600 font-mono text-xs">
                        {r.valor_anterior}
                      </TableCell>
                      <TableCell className="text-emerald-600 font-mono text-xs">
                        {r.valor_novo}
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">{r.motivo}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExcluidasTab() {
  const [filtros, setFiltros] = useState<FiltroRelatorioValues>({});
  const [applied, setApplied] = useState<FiltroRelatorioValues | null>(null);
  const { data } = useQuery({
    queryKey: ['rel-excluidas', applied],
    queryFn: () => getPesagensExcluidas(applied || {}),
    enabled: applied !== null,
  });

  async function exportarPdf() {
    const blob = await exportarRelatorioCanceladasPdf(applied || {});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-canceladas-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <FiltroRelatorio
        value={filtros}
        onChange={setFiltros}
        onApply={() => setApplied(filtros)}
        onClear={() => {
          setFiltros({});
          setApplied(null);
        }}
        showFields={{ dataInicio: true, dataFim: true, cliente: false, produto: false }}
        extraActions={
          applied && (
            <Button variant="secondary" onClick={exportarPdf}>
              <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
          )
        }
      />

      {applied && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pesagens Excluidas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Numero</TableHeader>
                  <TableHeader>Data Exclusao</TableHeader>
                  <TableHeader>Motivo</TableHeader>
                  <TableHeader>Usuario</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                      Nenhum registro
                    </TableCell>
                  </TableRow>
                ) : (
                  (data || []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.ticket_numero}</TableCell>
                      <TableCell>{formatDate(r.data_exclusao)}</TableCell>
                      <TableCell className="text-slate-600">{r.motivo}</TableCell>
                      <TableCell>{r.usuario_nome}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Totalizador({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={accent ? 'bg-emerald-50 rounded-lg px-4 py-3' : ''}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-emerald-700' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Relatorios</h1>
        <p className="text-sm text-slate-500 mt-1">Movimentacao, alteracoes e exclusoes</p>
      </div>

      <Tabs
        tabs={[
          { value: 'mov', label: 'Movimentacao', content: <MovimentacaoTab /> },
          { value: 'alt', label: 'Pesagens Alteradas', content: <AlteradasTab /> },
          { value: 'exc', label: 'Pesagens Excluidas', content: <ExcluidasTab /> },
        ]}
        defaultValue="mov"
      />
    </div>
  );
}
