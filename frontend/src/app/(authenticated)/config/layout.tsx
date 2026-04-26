'use client';

import { ReactNode } from 'react';
import { ConfigSidebar } from '@/components/config/ConfigSidebar';

/**
 * Layout shell para /config — sidebar fixa de áreas + container principal.
 * Cada subpágina renderiza sua própria toolbar/forms; o hook
 * useConfiguracaoForm garante que o save persista entre navegações.
 */
export default function ConfigLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl">
      <aside className="md:w-72 flex-shrink-0 md:sticky md:top-4 self-start">
        <div className="mb-3 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Configurações
          </h2>
        </div>
        <ConfigSidebar />
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
