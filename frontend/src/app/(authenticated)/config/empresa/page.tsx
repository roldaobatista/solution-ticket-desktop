'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { getEmpresas, updateEmpresa } from '@/lib/api';
import { ConfigSection, ConfigToolbar } from '@/components/config/ConfigShared';
import { Input } from '@/components/ui/input';
import type { Empresa } from '@/types';

/**
 * Onda — empresa do tenant atual.
 * Para multi-empresa por tenant, gerencie em /cadastros/empresas. Aqui editamos
 * apenas a primeira (matriz) — caso típico de instalações single-tenant.
 */
export default function ConfigEmpresaPage() {
  const qc = useQueryClient();
  const { data: page, isLoading } = useQuery({
    queryKey: ['empresas-config'],
    queryFn: () => getEmpresas(1, 1),
    staleTime: 60_000,
  });
  const empresa = page?.data[0];

  const [form, setForm] = useState<Partial<Empresa>>({});
  const [salvouEm, setSalvouEm] = useState<number | null>(null);

  useEffect(() => {
    if (empresa) setForm(empresa);
  }, [empresa]);

  const dirty = !!empresa && JSON.stringify({ ...empresa, ...form }) !== JSON.stringify(empresa);

  const mut = useMutation({
    mutationFn: () => {
      if (!empresa) throw new Error('Sem empresa');
      return updateEmpresa(empresa.id, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresas-config'] });
      qc.invalidateQueries({ queryKey: ['empresas'] });
      setSalvouEm(Date.now());
    },
  });

  function set<K extends keyof Empresa>(key: K, value: Empresa[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSalvouEm(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-700 rounded-full" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Empresa</h1>
        <p className="text-sm text-slate-600">
          Nenhuma empresa cadastrada. Cadastre em{' '}
          <a href="/cadastros/empresas" className="text-emerald-600 hover:underline">
            Cadastros → Empresas
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      <ConfigToolbar
        titulo="Empresa"
        descricao="Dados cadastrais da empresa principal — usados no cabeçalho de tickets e relatórios."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={mut.isPending}
        onRestaurar={() => setForm(empresa)}
        onSalvar={() => mut.mutate()}
      />

      <ConfigSection title="Identificação" icon={<Building2 className="w-5 h-5 text-slate-500" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <Field label="Razão social" required>
            <Input
              value={form.nomeEmpresarial ?? ''}
              onChange={(e) => set('nomeEmpresarial', e.target.value)}
            />
          </Field>
          <Field label="Nome fantasia">
            <Input
              value={form.nomeFantasia ?? ''}
              onChange={(e) => set('nomeFantasia', e.target.value)}
            />
          </Field>
          <Field label="Documento (CNPJ/CPF)" required>
            <Input
              value={form.documento ?? ''}
              onChange={(e) => set('documento', e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </Field>
          <Field label="Telefone">
            <Input
              value={form.telefone ?? ''}
              onChange={(e) => set('telefone', e.target.value)}
              placeholder="(00) 0000-0000"
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>
          <Field label="Site">
            <Input
              type="url"
              value={form.site ?? ''}
              onChange={(e) => set('site', e.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>
      </ConfigSection>

      <ConfigSection title="Endereço">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
          <div className="md:col-span-3">
            <Field label="Logradouro completo">
              <Input
                value={form.endereco ?? ''}
                onChange={(e) => set('endereco', e.target.value)}
                placeholder="Rua, número, bairro, complemento"
              />
            </Field>
          </div>
          <Field label="Cidade">
            <Input value={form.cidade ?? ''} onChange={(e) => set('cidade', e.target.value)} />
          </Field>
          <Field label="UF">
            <Input
              value={form.uf ?? ''}
              onChange={(e) => set('uf', e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              className="w-20"
            />
          </Field>
        </div>
      </ConfigSection>

      <ConfigSection title="Logomarcas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <Field label="Logo principal (caminho ou URL)">
            <Input
              value={form.logoPrincipal ?? ''}
              onChange={(e) => set('logoPrincipal', e.target.value)}
              placeholder="C:\caminho\logo.png"
            />
          </Field>
          <Field label="Logo para relatórios">
            <Input
              value={form.logoRelatorios ?? ''}
              onChange={(e) => set('logoRelatorios', e.target.value)}
              placeholder="Opcional"
            />
          </Field>
        </div>
      </ConfigSection>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
