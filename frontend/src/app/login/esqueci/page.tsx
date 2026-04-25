'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { requestPasswordReset, resetPassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import { extractMessage } from '@/lib/errors';

export default function EsqueciSenhaPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<'email' | 'token'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const solicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setInfo(
        'Se o e-mail existir, um token foi gerado. Verifique os logs do sistema ou entre em contato com o administrador.',
      );
      setEtapa('token');
    } catch (e: unknown) {
      setErro(extractMessage(e, 'Erro ao solicitar reset'));
    } finally {
      setLoading(false);
    }
  };

  const resetar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (novaSenha.length < 4) {
      setErro('Nova senha deve ter ao menos 4 caracteres');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token.trim(), novaSenha);
      setInfo('Senha redefinida com sucesso! Redirecionando para login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (e: unknown) {
      setErro(extractMessage(e, 'Token invalido ou expirado'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl mb-4">
            <Scale className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          {etapa === 'email' ? (
            <form onSubmit={solicitar} className="space-y-4">
              <p className="text-sm text-slate-600">
                Informe seu e-mail para receber um token de reset.
              </p>
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {erro && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <AlertCircle className="w-4 h-4" /> {erro}
                </div>
              )}
              <Button type="submit" variant="primary" isLoading={loading} className="w-full">
                Solicitar token
              </Button>
            </form>
          ) : (
            <form onSubmit={resetar} className="space-y-4">
              {info && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> {info}
                </div>
              )}
              <Input
                label="Token (6 digitos)"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                maxLength={6}
              />
              <Input
                label="Nova senha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
              {erro && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <AlertCircle className="w-4 h-4" /> {erro}
                </div>
              )}
              <Button type="submit" variant="primary" isLoading={loading} className="w-full">
                Redefinir senha
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
