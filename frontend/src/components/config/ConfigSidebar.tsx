'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Activity,
  Archive,
  Bell,
  Building2,
  Camera,
  ClipboardList,
  Coins,
  Database,
  FileText,
  Hash,
  Palette,
  Printer,
  Scale,
  ShieldCheck,
  Sliders,
  Users,
} from 'lucide-react';

interface ConfigSection {
  href: string;
  label: string;
  icon: typeof Sliders;
  description: string;
}

interface ConfigGroup {
  label: string;
  sections: ConfigSection[];
}

export const CONFIG_GROUPS: ConfigGroup[] = [
  {
    label: 'Operação',
    sections: [
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
        href: '/config/numeracao',
        label: 'Numeração',
        icon: Hash,
        description: 'Formato dos números de ticket/romaneio/fatura',
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
    ],
  },
  {
    label: 'Sistema',
    sections: [
      {
        href: '/config/empresa',
        label: 'Empresa',
        icon: Building2,
        description: 'Dados cadastrais',
      },
      {
        href: '/config/aparencia',
        label: 'Aparência',
        icon: Palette,
        description: 'Tema, densidade, idioma',
      },
      {
        href: '/config/seguranca',
        label: 'Segurança',
        icon: ShieldCheck,
        description: 'Política de senha, sessões',
      },
      {
        href: '/config/notificacoes',
        label: 'Notificações',
        icon: Bell,
        description: 'E-mail, alertas, webhooks',
      },
    ],
  },
  {
    label: 'Manutenção',
    sections: [
      {
        href: '/config/backup',
        label: 'Backup e Restore',
        icon: Database,
        description: 'Backups locais do banco',
      },
      {
        href: '/config/auditoria',
        label: 'Auditoria',
        icon: Archive,
        description: 'Histórico de ações',
      },
      {
        href: '/config/diagnostico',
        label: 'Diagnóstico',
        icon: Activity,
        description: 'Saúde, logs, sistema',
      },
      {
        href: '/config/avancado',
        label: 'Avançado',
        icon: Sliders,
        description: 'Variáveis e info do sistema',
      },
    ],
  },
  {
    label: 'Acesso',
    sections: [
      {
        href: '/cadastros/usuarios',
        label: 'Usuários e Perfis',
        icon: Users,
        description: 'Gestão de acesso',
      },
      { href: '/licenca', label: 'Licença', icon: FileText, description: 'Status e ativação' },
    ],
  },
];

export const CONFIG_SECTIONS: ConfigSection[] = CONFIG_GROUPS.flatMap((g) => g.sections);

export function ConfigSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Áreas de configuração" className="space-y-4">
      {CONFIG_GROUPS.map((grupo) => (
        <div key={grupo.label}>
          <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {grupo.label}
          </div>
          <div className="space-y-1">
            {grupo.sections.map((s) => {
              const ativo =
                s.href === '/config' ? pathname === '/config' : pathname?.startsWith(s.href);
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className={cn(
                    'flex items-start gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
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
                      className={cn(
                        'font-medium leading-tight',
                        ativo ? 'text-white' : 'text-slate-800',
                      )}
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
          </div>
        </div>
      ))}
    </nav>
  );
}
