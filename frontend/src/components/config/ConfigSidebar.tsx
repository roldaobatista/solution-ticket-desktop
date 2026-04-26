'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  Camera,
  ClipboardList,
  Coins,
  FileText,
  Printer,
  Scale,
  Sliders,
  Users,
} from 'lucide-react';

interface ConfigSection {
  href: string;
  label: string;
  icon: typeof Sliders;
  description: string;
}

export const CONFIG_SECTIONS: ConfigSection[] = [
  {
    href: '/config',
    label: 'Visão geral',
    icon: Sliders,
    description: 'Atalhos para todas as áreas',
  },
  {
    href: '/config/pesagem',
    label: 'Pesagem',
    icon: Scale,
    description: 'Fluxos, tara, descontos',
  },
  {
    href: '/config/ticket',
    label: 'Ticket — Campos',
    icon: ClipboardList,
    description: 'Campos exibidos no ticket',
  },
  {
    href: '/config/financeiro',
    label: 'Financeiro',
    icon: Coins,
    description: 'Preço, frete, romaneios, baixa',
  },
  {
    href: '/config/impressao',
    label: 'Impressão',
    icon: Printer,
    description: 'Templates, cópias, logomarca',
  },
  {
    href: '/config/integracoes',
    label: 'Integrações',
    icon: Camera,
    description: 'Câmeras, bilhetagem, manutenção',
  },
  {
    href: '/config/empresa',
    label: 'Empresa',
    icon: Building2,
    description: 'Dados cadastrais',
  },
  {
    href: '/cadastros/usuarios',
    label: 'Usuários e Perfis',
    icon: Users,
    description: 'Gestão de acesso',
  },
  {
    href: '/licenca',
    label: 'Licença',
    icon: FileText,
    description: 'Status e ativação',
  },
];

export function ConfigSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Áreas de configuração" className="space-y-1">
      {CONFIG_SECTIONS.map((s) => {
        // /config é ativo apenas em match exato; demais usam startsWith
        const ativo = s.href === '/config' ? pathname === '/config' : pathname?.startsWith(s.href);
        const Icon = s.icon;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              'flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              ativo ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 mt-0.5 flex-shrink-0',
                ativo ? 'text-white' : 'text-slate-400',
              )}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div
                className={cn('font-medium leading-tight', ativo ? 'text-white' : 'text-slate-800')}
              >
                {s.label}
              </div>
              <div
                className={cn(
                  'text-xs leading-tight mt-0.5',
                  ativo ? 'text-slate-300' : 'text-slate-500',
                )}
              >
                {s.description}
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
