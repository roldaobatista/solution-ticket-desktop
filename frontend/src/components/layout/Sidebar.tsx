'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Scale,
  ClipboardList,
  Receipt,
  BarChart3,
  Settings,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  ChevronDown,
  Wrench,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  subItems?: { label: string; href: string }[];
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Operacional',
    items: [
      { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
      {
        label: 'Operacao',
        href: '/pesagem',
        icon: <Scale className="w-5 h-5" />,
        subItems: [
          { label: 'Pesagem (classica)', href: '/pesagem' },
          { label: 'Pesagem Entrada', href: '/pesagem/entrada' },
          { label: 'Pesagem Saida', href: '/pesagem/saida' },
          { label: 'Tickets', href: '/tickets' },
          { label: 'Manutencao de Ticket', href: '/manutencao' },
          { label: 'Erros de Impressao', href: '/impressao/erros' },
        ],
      },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      {
        label: 'Cadastros',
        href: '/cadastros',
        icon: <FolderKanban className="w-5 h-5" />,
        subItems: [
          { label: 'Clientes', href: '/cadastros/clientes' },
          { label: 'Transportadoras', href: '/cadastros/transportadoras' },
          { label: 'Motoristas', href: '/cadastros/motoristas' },
          { label: 'Produtos', href: '/cadastros/produtos' },
          { label: 'Veiculos', href: '/cadastros/veiculos' },
          { label: 'Balancas', href: '/cadastros/balancas' },
          { label: 'Origens', href: '/cadastros/origens' },
          { label: 'Destinos', href: '/cadastros/destinos' },
          { label: 'Tipos de Desconto', href: '/cadastros/tipos-desconto' },
        ],
      },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Romaneios', href: '/romaneios', icon: <ClipboardList className="w-5 h-5" /> },
      { label: 'Faturas', href: '/faturas', icon: <Receipt className="w-5 h-5" /> },
      {
        label: 'Financeiro',
        href: '/financeiro',
        icon: <Receipt className="w-5 h-5" />,
        subItems: [
          { label: 'Faturas / Pagamentos / Saldos', href: '/financeiro' },
          { label: 'Ajuste de Preco', href: '/financeiro/ajuste-preco' },
          { label: 'Recibos', href: '/financeiro/recibos' },
        ],
      },
    ],
  },
  {
    label: 'Relatorios',
    items: [
      {
        label: 'Relatorios',
        href: '/relatorios',
        icon: <BarChart3 className="w-5 h-5" />,
        subItems: [
          { label: 'Relatorios', href: '/relatorios' },
          { label: 'Relatorios Salvos', href: '/relatorios/salvos' },
        ],
      },
    ],
  },
  {
    label: 'Utilitarios',
    items: [
      {
        label: 'Utilitarios',
        href: '/utilitarios',
        icon: <Wrench className="w-5 h-5" />,
        subItems: [
          { label: 'Diagnostico', href: '/utilitarios/diagnostico' },
          { label: 'Consulta NFe', href: '/utilitarios/consulta-nfe' },
          { label: 'Terminal Serial', href: '/utilitarios/terminal-serial' },
        ],
      },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Configuracao', href: '/config', icon: <Settings className="w-5 h-5" /> },
      { label: 'Licenca', href: '/licenca', icon: <KeyRound className="w-5 h-5" /> },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Cadastros: true,
    Operacao: true,
    Utilitarios: false,
  });
  const pathname = usePathname();

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-slate-800 text-white transition-all duration-300 z-40 flex flex-col',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 bg-slate-900 border-b border-slate-700">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg tracking-tight">Solution Ticket</span>
          </Link>
        )}
        {collapsed && <Scale className="w-6 h-6 text-emerald-400 mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus[item.label];

              return (
                <div key={item.label}>
                  {hasSubItems ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-700',
                          isActive
                            ? 'bg-slate-700 text-emerald-400 border-r-2 border-emerald-400'
                            : 'text-slate-300',
                          collapsed && 'justify-center px-2',
                        )}
                      >
                        {item.icon}
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 transition-transform',
                                isExpanded && 'rotate-180',
                              )}
                            />
                          </>
                        )}
                      </button>
                      {isExpanded && !collapsed && (
                        <div className="ml-4 border-l border-slate-600">
                          {item.subItems?.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                className={cn(
                                  'flex items-center gap-2 pl-8 pr-4 py-2 text-sm transition-colors hover:bg-slate-700',
                                  isSubActive
                                    ? 'text-emerald-400 bg-slate-700/50'
                                    : 'text-slate-400',
                                )}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-700',
                        isActive
                          ? 'bg-slate-700 text-emerald-400 border-r-2 border-emerald-400'
                          : 'text-slate-300',
                        collapsed && 'justify-center px-2',
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
          Solution Ticket v1.0.0
        </div>
      )}
    </aside>
  );
}
