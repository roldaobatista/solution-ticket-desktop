'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scale, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const emailRef = useRef<HTMLInputElement>(null);
  const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? '';
  const DEMO_SENHA = process.env.NEXT_PUBLIC_DEMO_SENHA ?? '';
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [senha, setSenha] = useState(DEMO_SENHA);

  // Onda 5: Acessibilidade — focar campo email quando há erro de autenticação
  useEffect(() => {
    if (error && emailRef.current) {
      emailRef.current.focus();
    }
  }, [error]);

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
              ref={emailRef}
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              aria-label="Endereço de email"
            />
            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              required
              autoComplete="current-password"
              aria-label="Senha"
            />

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              aria-busy={isLoading}
            >
              Entrar
            </Button>

            <div className="text-center">
              <Link href="/login/esqueci" className="text-sm text-slate-500 hover:text-slate-800">
                Esqueci minha senha
              </Link>
            </div>
          </form>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Solution Ticket v{process.env.NEXT_PUBLIC_APP_VERSION || 'dev'}
        </p>
      </div>
    </div>
  );
}
