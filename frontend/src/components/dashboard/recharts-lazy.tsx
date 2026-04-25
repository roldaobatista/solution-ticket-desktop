'use client';

/**
 * F6: re-exporta os componentes do recharts via next/dynamic.
 *
 * Recharts e ~110 KB minificado e so e usado no dashboard. Importar via
 * dynamic() coloca tudo num chunk separado carregado apenas quando a
 * pagina (authenticated)/page.tsx renderiza, livrando o bundle inicial
 * (login, listagens, pesagem) do peso.
 *
 * `ssr: false` porque os charts dependem de window/canvas e nao
 * renderizam server-side.
 *
 * O cast para ComponentType<unknown> e necessario porque os tipos do
 * recharts usam string em defaultProps onde next/dynamic espera union
 * literal — incompativel sem perda de inferencia. JSX consumer mantem
 * os props certos via posicionamento + props-types do recharts em
 * runtime (recharts ainda valida via PropTypes).
 */

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Props sao permissivos por design — recharts valida em runtime via PropTypes.
// Usar Record<string, unknown> permite passar dataKey, stroke, fill etc.
type AnyChartProps = Record<string, unknown> & { children?: React.ReactNode };

function lazyChart<K extends keyof typeof import('recharts')>(name: K) {
  return dynamic(
    () => import('recharts').then((m) => m[name] as unknown as ComponentType<AnyChartProps>),
    { ssr: false },
  );
}

export const LineChart = lazyChart('LineChart');
export const Line = lazyChart('Line');
export const BarChart = lazyChart('BarChart');
export const Bar = lazyChart('Bar');
export const XAxis = lazyChart('XAxis');
export const YAxis = lazyChart('YAxis');
export const CartesianGrid = lazyChart('CartesianGrid');
export const Tooltip = lazyChart('Tooltip');
export const ResponsiveContainer = lazyChart('ResponsiveContainer');
export const PieChart = lazyChart('PieChart');
export const Pie = lazyChart('Pie');
export const Cell = lazyChart('Cell');
export const Legend = lazyChart('Legend');
