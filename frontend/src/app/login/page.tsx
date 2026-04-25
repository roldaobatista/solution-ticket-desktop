'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scale, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('admin@solutionticket.com');
  const [senha, setSenha] = useState('123456');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, senha);
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl mb-4">
            <Scale className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Solution Ticket</h1>
          <p className="text-sm text-slate-500 mt-1">Sistema de Pesagem Veicular</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Login</h2>
          <p className="text-sm text-slate-500 mb-6">Entre com suas credenciais para acessar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              required
            />

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Entrar
            </Button>

            <div className="text-center">
              <Link href="/login/esqueci" className="text-sm text-slate-500 hover:text-slate-800">
                Esqueci minha senha
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              <strong>Credenciais demo:</strong>
              <br />
              admin@solutionticket.com / 123456
              <br />
              operador@solutionticket.com / 123456
              <br />
              supervisor@solutionticket.com / 123456
            </p>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-slate-400 mt-6">Solution Ticket v1.0.0 - 2024</p>
      </div>
    </div>
  );
}
