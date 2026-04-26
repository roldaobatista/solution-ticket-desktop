'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Database,
  Download,
  HardDriveDownload,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { criarBackup, listarBackups, restaurarBackup, verificarBackup } from '@/lib/api/backup';
import { ConfigSection } from '@/components/config/ConfigShared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/dialog';

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function ConfigBackupPage() {
  const qc = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: listarBackups,
    staleTime: 30_000,
  });

  const criarMut = useMutation({
    mutationFn: () => criarBackup(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backups'] });
      setInfo('Backup criado com sucesso');
      setErro(null);
    },
    onError: (e) => setErro((e as Error).message),
  });

  const verificarMut = useMutation({
    mutationFn: (filename: string) => verificarBackup(filename),
    onSuccess: (r) => {
      setInfo(r.ok ? `Integridade OK · ${r.sha256.slice(0, 16)}...` : 'Backup CORROMPIDO');
      setErro(r.ok ? null : 'sha256 não confere');
    },
    onError: (e) => setErro((e as Error).message),
  });

  const restaurarMut = useMutation({
    mutationFn: (filename: string) => restaurarBackup(filename),
    onSuccess: () => {
      setInfo('Backup restaurado. Recomenda-se reiniciar o aplicativo.');
      setErro(null);
      setRestoreTarget(null);
    },
    onError: (e) => {
      setErro((e as Error).message);
      setRestoreTarget(null);
    },
  });

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Backup e Restauração</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cópia local do banco SQLite (
            <code className="px-1 bg-slate-100 rounded">solution-ticket.db</code>) com SHA-256 por
            arquivo.
          </p>
        </div>
        <Button variant="primary" onClick={() => criarMut.mutate()} isLoading={criarMut.isPending}>
          <Plus className="w-4 h-4 mr-2" /> Novo backup agora
        </Button>
      </div>

      {info && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
          {info}
        </div>
      )}
      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {erro}
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-medium">Restauração é destrutiva</p>
          <p className="mt-1 text-amber-800/90">
            Restaurar substitui o banco atual pelo arquivo selecionado. Tickets, faturas e cadastros
            criados após o backup são perdidos. Confirme antes de prosseguir e prefira criar um
            backup novo logo antes da restauração.
          </p>
        </div>
      </div>

      <ConfigSection
        title={`Backups disponíveis (${backups.length})`}
        icon={<Database className="w-5 h-5 text-slate-500" />}
      >
        {isLoading && <p className="text-sm text-slate-500 py-2">Carregando...</p>}
        {!isLoading && backups.length === 0 && (
          <p className="text-sm text-slate-500 py-2">Nenhum backup gerado ainda.</p>
        )}
        {backups.length > 0 && (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2">Arquivo</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2 text-right">Tamanho</th>
                  <th className="px-3 py-2">Criado em</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.filename} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs text-slate-800">{b.filename}</td>
                    <td className="px-3 py-2">
                      <Badge variant={b.tipo === 'manual' ? 'primary' : 'default'}>{b.tipo}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{formatBytes(b.sizeBytes)}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {new Date(b.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => verificarMut.mutate(b.filename)}
                          className="p-1.5 hover:bg-slate-100 rounded"
                          aria-label={`Verificar ${b.filename}`}
                          title="Verificar integridade"
                          disabled={verificarMut.isPending}
                        >
                          <ShieldCheck className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoreTarget(b.filename)}
                          className="p-1.5 hover:bg-amber-50 rounded text-amber-700"
                          aria-label={`Restaurar ${b.filename}`}
                          title="Restaurar"
                        >
                          <HardDriveDownload className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ConfigSection>

      <ConfigSection title="Sobre os backups">
        <ul className="text-sm text-slate-700 space-y-2 py-1 list-disc list-inside">
          <li>
            Backups manuais são marcados como{' '}
            <code className="px-1 bg-slate-100 rounded">manual</code>; agendados como{' '}
            <code className="px-1 bg-slate-100 rounded">auto</code>.
          </li>
          <li>
            Cada arquivo carrega seu próprio SHA-256 — a verificação confirma que o arquivo não foi
            alterado.
          </li>
          <li>
            Os arquivos ficam em{' '}
            <code className="px-1 bg-slate-100 rounded">
              %APPDATA%\@solution-ticket\electron\backups
            </code>
            .
          </li>
          <li>O diretório também é incluído na rotação automática (manter os últimos N).</li>
        </ul>
        <Button
          variant="secondary"
          onClick={() => qc.invalidateQueries({ queryKey: ['backups'] })}
          className="mt-2"
        >
          <Download className="w-4 h-4 mr-2" /> Atualizar lista
        </Button>
      </ConfigSection>

      <ConfirmDialog
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        title="Restaurar backup?"
        description={
          restoreTarget
            ? `O banco atual será substituído por "${restoreTarget}". Esta ação é irreversível. Confirma?`
            : ''
        }
        confirmText="Restaurar (irreversível)"
        variant="danger"
        onConfirm={() => restoreTarget && restaurarMut.mutate(restoreTarget)}
      />
    </div>
  );
}
