'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Truck,
  UserCircle,
  Package,
  Car,
  Cpu,
  Warehouse,
  Building2,
  CarFront,
  MapPin,
  UserCog,
  Gauge,
} from 'lucide-react';

const cadastroModules = [
  {
    label: 'Clientes',
    href: '/cadastros/clientes',
    icon: <Users className="w-8 h-8" />,
    description: 'Cadastro de clientes e fornecedores',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    label: 'Transportadoras',
    href: '/cadastros/transportadoras',
    icon: <Truck className="w-8 h-8" />,
    description: 'Empresas de transporte',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    label: 'Motoristas',
    href: '/cadastros/motoristas',
    icon: <UserCircle className="w-8 h-8" />,
    description: 'Condutores e motoristas',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    label: 'Produtos',
    href: '/cadastros/produtos',
    icon: <Package className="w-8 h-8" />,
    description: 'Mercadorias e produtos',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    label: 'Veiculos',
    href: '/cadastros/veiculos',
    icon: <Car className="w-8 h-8" />,
    description: 'Frota e dados de veiculos',
    color: 'text-red-600 bg-red-50',
  },
  {
    label: 'Tipos de Veiculo',
    href: '/cadastros/tipos-veiculo',
    icon: <CarFront className="w-8 h-8" />,
    description: 'Categorias de veiculos e precos',
    color: 'text-rose-600 bg-rose-50',
  },
  {
    label: 'Balancas',
    href: '/cadastros/balancas',
    icon: <Cpu className="w-8 h-8" />,
    description: 'Equipamentos de pesagem',
    color: 'text-slate-600 bg-slate-50',
  },
  {
    label: 'Indicadores',
    href: '/cadastros/indicadores',
    icon: <Gauge className="w-8 h-8" />,
    description: 'Indicadores de pesagem disponiveis',
    color: 'text-cyan-600 bg-cyan-50',
  },
  {
    label: 'Armazens',
    href: '/cadastros/armazens',
    icon: <Warehouse className="w-8 h-8" />,
    description: 'Locais de estocagem e saldos',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    label: 'Empresas',
    href: '/cadastros/empresas',
    icon: <Building2 className="w-8 h-8" />,
    description: 'Dados das empresas',
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    label: 'Unidades',
    href: '/cadastros/unidades',
    icon: <MapPin className="w-8 h-8" />,
    description: 'Unidades e filiais',
    color: 'text-teal-600 bg-teal-50',
  },
  {
    label: 'Usuarios',
    href: '/cadastros/usuarios',
    icon: <UserCog className="w-8 h-8" />,
    description: 'Usuarios e permissoes',
    color: 'text-fuchsia-600 bg-fuchsia-50',
  },
];

export default function CadastrosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cadastros</h1>
        <p className="text-sm text-slate-500 mt-1">Gerenciamento de cadastros do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cadastroModules.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <Card className="hover:shadow-lg transition-all cursor-pointer group h-full">
              <CardContent className="flex items-start gap-4 py-6">
                <div
                  className={`p-3 rounded-xl ${mod.color} group-hover:scale-110 transition-transform`}
                >
                  {mod.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {mod.label}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
