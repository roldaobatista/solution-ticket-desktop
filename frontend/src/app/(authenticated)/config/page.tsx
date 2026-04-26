'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { CONFIG_GROUPS } from '@/components/config/ConfigSidebar';

export default function ConfigHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500 mt-1">
          Selecione uma área para ajustar o comportamento do sistema. Mudanças salvam por área.
        </p>
      </div>

      {CONFIG_GROUPS.map((grupo) => (
        <section key={grupo.label} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {grupo.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grupo.sections
              .filter((s) => s.href !== '/config')
              .map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.href} href={s.href}>
                    <Card className="hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer h-full">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-slate-700" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900">{s.label}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
