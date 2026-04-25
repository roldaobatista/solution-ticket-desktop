'use client';

import { useEffect, useState } from 'react';
import { listarRelatoriosSalvos, deletarRelatorioSalvo, type RelatorioSalvo } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function RelatoriosSalvosPage() {
  const [itens, setItens] = useState<RelatorioSalvo[]>([]);
  const [filtroModulo, setFiltroModulo] = useState('');
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const list = await listarRelatoriosSalvos(filtroModulo || undefined);
      setItens(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroModulo]);

  const excluir = async (id: string) => {
    if (!confirm('Excluir este relatorio salvo?')) return;
    await deletarRelatorioSalvo(id);
    carregar();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Relatorios Salvos</h1>
        <div className="flex items-center gap-2">
          <select
            className="border border-slate-300 rounded px-2 py-1.5 text-sm"
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
          >
            <option value="">Todos os modulos</option>
            <option value="movimento">Movimentacao</option>
            <option value="alteradas">Alteradas</option>
            <option value="canceladas">Canceladas</option>
            <option value="saldos">Saldos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Modulo</th>
              <th className="text-left px-4 py-2">Atualizado</th>
              <th className="text-right px-4 py-2 w-24">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-slate-400">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && itens.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-slate-400">
                  Nenhum relatorio salvo.
                </td>
              </tr>
            )}
            {itens.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{r.nome}</td>
                <td className="px-4 py-2">{r.modulo}</td>
                <td className="px-4 py-2 text-slate-500">
                  {new Date(r.atualizadoEm).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => excluir(r.id)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
