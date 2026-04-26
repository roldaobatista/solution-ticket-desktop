'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RotateCcw, Save } from 'lucide-react';

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

export function ConfigSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </CardTitle>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ConfigToolbar({
  titulo,
  descricao,
  dirty,
  salvouEm,
  salvando,
  onRestaurar,
  onSalvar,
}: {
  titulo: string;
  descricao?: string;
  dirty: boolean;
  salvouEm: number | null;
  salvando: boolean;
  onRestaurar: () => void;
  onSalvar: () => void;
}) {
  const recemSalvo = salvouEm !== null && Date.now() - salvouEm < 3000;
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
        {descricao && <p className="text-sm text-slate-500 mt-0.5">{descricao}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {recemSalvo && (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Salvo
          </Badge>
        )}
        {dirty && !recemSalvo && (
          <Badge variant="warning" className="flex items-center gap-1">
            Alterações pendentes
          </Badge>
        )}
        <Button variant="secondary" onClick={onRestaurar} disabled={!dirty || salvando}>
          <RotateCcw className="w-4 h-4 mr-2" /> Restaurar
        </Button>
        <Button
          variant="primary"
          onClick={onSalvar}
          disabled={!dirty || salvando}
          isLoading={salvando}
        >
          <Save className="w-4 h-4 mr-2" /> Salvar
        </Button>
      </div>
    </div>
  );
}
