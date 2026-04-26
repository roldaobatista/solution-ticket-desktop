'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { segurancaPrefs, type SegurancaPrefs } from '@/lib/config-prefs';
import { ConfigSection, ConfigToolbar, ToggleRow } from '@/components/config/ConfigShared';
import { Input } from '@/components/ui/input';

export default function ConfigSegurancaPage() {
  const [orig, setOrig] = useState<SegurancaPrefs>(segurancaPrefs.default);
  const [form, setForm] = useState<SegurancaPrefs>(segurancaPrefs.default);
  const [salvouEm, setSalvouEm] = useState<number | null>(null);

  useEffect(() => {
    const v = segurancaPrefs.load();
    setOrig(v);
    setForm(v);
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(orig);

  function set<K extends keyof SegurancaPrefs>(key: K, value: SegurancaPrefs[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSalvouEm(null);
  }

  function salvar() {
    segurancaPrefs.save(form);
    setOrig(form);
    setSalvouEm(Date.now());
  }

  return (
    <div className="space-y-4 pb-12">
      <ConfigToolbar
        titulo="Segurança"
        descricao="Política de acesso, sessão e comportamento defensivo."
        dirty={dirty}
        salvouEm={salvouEm}
        salvando={false}
        onRestaurar={() => setForm(orig)}
        onSalvar={salvar}
      />

      <ConfigSection
        title="Política de senha (servidor)"
        description="Aplicada em criação e troca de senha. Definida no backend."
        icon={<KeyRound className="w-5 h-5 text-slate-500" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
          <Stat label="Mínimo" value="10 caracteres" />
          <Stat label="Composição" value="≥1 letra + ≥1 número" />
          <Stat label="Bloqueio progressivo" value="5 falhas → 15 min" />
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Após mudança de senha ou logout, todos os JWTs anteriores são revogados via incremento de{' '}
          <code className="px-1 bg-slate-100 rounded">tokenVersion</code>.
        </p>
      </ConfigSection>

      <ConfigSection
        title="Sessão (este navegador)"
        icon={<ShieldCheck className="w-5 h-5 text-slate-500" />}
      >
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800">Bloqueio por inatividade</p>
            <p className="text-xs text-slate-500">
              Minutos sem atividade até pedir login novamente. 0 = desabilitado.
            </p>
          </div>
          <Input
            type="number"
            min={0}
            max={120}
            value={form.bloqueioInatividadeMin}
            onChange={(e) => set('bloqueioInatividadeMin', parseInt(e.target.value) || 0)}
            className="w-28"
          />
        </div>
        <ToggleRow
          label="Exigir confirmação ao cancelar ticket"
          description="Diálogo extra impede cliques acidentais em operações destrutivas."
          checked={form.exigirConfirmacaoCancelamento}
          onChange={(v) => set('exigirConfirmacaoCancelamento', v)}
        />
        <ToggleRow
          label="Ocultar campos sensíveis na impressão"
          description="Documento e e-mail do cliente são parcialmente mascarados em vias internas."
          checked={form.ocultarSenhasNaImpressao}
          onChange={(v) => set('ocultarSenhasNaImpressao', v)}
        />
      </ConfigSection>

      <ConfigSection title="Acessos">
        <Link
          href="/cadastros/usuarios"
          className="flex items-center justify-between py-3 hover:bg-slate-50 rounded -mx-2 px-2"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">Usuários e perfis</p>
            <p className="text-xs text-slate-500">
              Criar contas, atribuir perfis (Admin/Operador/Supervisor) e revogar acesso.
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Link>
        <Link
          href="/perfil/senha"
          className="flex items-center justify-between py-3 hover:bg-slate-50 rounded -mx-2 px-2"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">Trocar minha senha</p>
            <p className="text-xs text-slate-500">
              Sua senha atual continua válida até a troca; novos JWTs invalidam os antigos.
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Link>
      </ConfigSection>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
