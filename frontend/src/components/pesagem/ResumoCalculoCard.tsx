'use client';

import { Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatWeight } from '@/lib/utils';

interface Props {
  pesoBruto: number;
  pesoTara: number;
  pesoLiquidoBruto: number;
  descontos: number;
  pesoLiquidoFinal: number;
  taraReferenciada?: boolean;
}

export function ResumoCalculoCard({
  pesoBruto,
  pesoTara,
  pesoLiquidoBruto,
  descontos,
  pesoLiquidoFinal,
  taraReferenciada = false,
}: Props) {
  return (
    <Card className="border-2 border-slate-300">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="w-5 h-5 text-slate-500" />
          Resumo do Calculo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">Peso Bruto Apurado</p>
            <p className="text-xl font-bold text-blue-800 font-mono">{formatWeight(pesoBruto)}</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-600 font-medium">Peso Tara Apurada</p>
            <p className="text-xl font-bold text-amber-800 font-mono">{formatWeight(pesoTara)}</p>
            {taraReferenciada && <p className="text-xs text-amber-500">Referenciada</p>}
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-600 font-medium">Peso Liquido Bruto</p>
            <p className="text-xl font-bold text-purple-800 font-mono">
              {formatWeight(pesoLiquidoBruto)}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-600 font-medium">Total Descontos</p>
            <p className="text-xl font-bold text-orange-800 font-mono">{formatWeight(descontos)}</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-300">
            <p className="text-xs text-emerald-600 font-medium">PESO LIQUIDO FINAL</p>
            <p className="text-2xl font-bold text-emerald-800 font-mono">
              {formatWeight(pesoLiquidoFinal)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
