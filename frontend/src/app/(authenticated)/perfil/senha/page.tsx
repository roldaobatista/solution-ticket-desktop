'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AlterarSenhaPage() {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    if (novaSenha.length < 4) {
      setErro('Nova senha deve ter ao menos 4 caracteres');
      return;
    }
    if (novaSenha !== confirmar) {
      setErro('Confirmacao nao confere');
      return;
    }
    setLoading(true);
    try {
      await changePassword(senhaAtual, novaSenha);
      setSucesso(true);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
      setTimeout(() => router.push('/'), 1500);
    } catch (e: any) {
      setErro(e?.response?.data?.message || e?.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Alterar Senha</h1>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Senha atual"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            required
          />
          <Input
            label="Nova senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />

          {erro && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <AlertCircle className="w-4 h-4" /> {erro}
            </div>
          )}
          {sucesso && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Senha alterada com sucesso!
            </div>
          )}

          <Button type="submit" variant="primary" isLoading={loading} className="w-full">
            Alterar senha
          </Button>
        </form>
      </div>
    </div>
  );
}
