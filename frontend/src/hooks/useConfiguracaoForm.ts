'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getConfiguracao, updateConfiguracao } from '@/lib/api';
import type { ConfiguracaoOperacional } from '@/types';

/**
 * Onda — config reorganizado em subpáginas.
 * Hook compartilhado: cada subpágina lê e modifica o mesmo objeto
 * `localConfig`, que é commitado via `salvar()`. React Query mantém
 * a fonte canônica em ['configuracao'] e invalida após salvar.
 */
export function useConfiguracaoForm() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracao'],
    queryFn: () => getConfiguracao(),
    staleTime: 60_000,
  });

  const [local, setLocal] = useState<Partial<ConfiguracaoOperacional>>({});
  const [salvouEm, setSalvouEm] = useState<number | null>(null);

  useEffect(() => {
    if (config) setLocal(config);
  }, [config]);

  const dirty = !!config && JSON.stringify({ ...config, ...local }) !== JSON.stringify(config);

  const mut = useMutation({
    mutationFn: (payload: Partial<ConfiguracaoOperacional>) => updateConfiguracao(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configuracao'] });
      setSalvouEm(Date.now());
    },
  });

  function set<K extends keyof ConfiguracaoOperacional>(key: K, value: ConfiguracaoOperacional[K]) {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setSalvouEm(null);
  }

  function toggle<K extends keyof ConfiguracaoOperacional>(key: K) {
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
    setSalvouEm(null);
  }

  function restaurar() {
    if (config) setLocal(config);
    setSalvouEm(null);
  }

  function salvar() {
    if (Object.keys(local).length === 0) return;
    mut.mutate(local);
  }

  return {
    config,
    local,
    isLoading,
    dirty,
    salvouEm,
    salvando: mut.isPending,
    set,
    toggle,
    restaurar,
    salvar,
  };
}
