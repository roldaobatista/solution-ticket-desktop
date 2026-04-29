'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useUnidadeStore } from '@/stores/unidade.store';
import { getUnidades } from '@/lib/api';
import { LogOut, Building2, KeyRound, ChevronDown } from 'lucide-react';
import { BalancaStatusGlobal } from '@/components/balanca/BalancaStatusGlobal';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { unidadeId, setUnidadeId } = useUnidadeStore();
  const [menuAberto, setMenuAberto] = useState(false);
  const { data: unidades = [] } = useQuery({
    queryKey: ['header-unidades'],
    queryFn: getUnidades,
    staleTime: 5 * 60_000,
  });
  const unidadeAtiva = unidades.find((u) => u.id === unidadeId);
  const unidadeNome = unidadeAtiva?.nome || user?.unidadeNome || 'Unidade não selecionada';
  const unidadeLocal =
    unidadeAtiva?.cidade && unidadeAtiva?.uf
      ? `${unidadeAtiva.cidade} / ${unidadeAtiva.uf}`
      : user?.unidadeCidade && user?.unidadeUf
        ? `${user.unidadeCidade} / ${user.unidadeUf}`
        : '';

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-6">
      {/* Left: Unit info */}
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-slate-500" />
        <div>
          <select
            className="text-sm font-medium text-slate-800 bg-transparent border-0 p-0 focus:ring-0"
            value={unidadeId || unidadeAtiva?.id || ''}
            onChange={(e) => setUnidadeId(e.target.value)}
            title="Unidade ativa"
          >
            {!unidadeId && <option value="">{unidadeNome}</option>}
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
          {unidadeLocal && <div className="text-xs text-slate-500">{unidadeLocal}</div>}
        </div>
      </div>

      {/* Center: Scale status (dinamico) */}
      <div className="flex items-center gap-3">
        <BalancaStatusGlobal />
      </div>

      {/* Right: User menu */}
      <div className="flex items-center gap-4 relative">
        <button
          onClick={() => setMenuAberto((v) => !v)}
          className="flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 py-1"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-medium">
            {user?.nome?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-slate-800">{user?.nome || 'Usuario'}</div>
            <div className="text-xs text-slate-500">{user?.perfil || 'Operador'}</div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>

        {menuAberto && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)} />
            <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
              <Link
                href="/perfil/senha"
                onClick={() => setMenuAberto(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <KeyRound className="w-4 h-4" /> Alterar senha
              </Link>
              <button
                onClick={() => {
                  setMenuAberto(false);
                  void logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
