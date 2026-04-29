'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import MainLayout from '@/components/layout/MainLayout';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.resolve(checkAuth()).finally(() => {
      if (mounted) setAuthChecked(true);
    });
    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authChecked, isAuthenticated, isLoading, router]);

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-slate-300 border-t-slate-700 rounded-full" />
          <p className="text-sm text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <MainLayout>{children}</MainLayout>;
}
