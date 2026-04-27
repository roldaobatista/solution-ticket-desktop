'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getLicenca, getLicencaFingerprint, ativarLicenca, iniciarTrialLicenca } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { KeyRound, Copy, CheckCircle2, AlertTriangle, Clock, Shield, Play } from 'lucide-react';

export default function LicencaPage() {
  const queryClient = useQueryClient();
  const [licencaKey, setLicencaKey] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: licenca, isLoading } = useQuery({
    queryKey: ['licenca'],
    queryFn: () => getLicenca(),
  });

  const { data: fingerprintData } = useQuery({
    queryKey: ['fingerprint'],
    queryFn: () => getLicencaFingerprint(),
  });

  const ativarMut = useMutation({
    mutationFn: (chave: string) => ativarLicenca({ chave }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenca'] });
      setLicencaKey('');
    },
  });

  const trialMut = useMutation({
    mutationFn: iniciarTrialLicenca,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenca'] });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-700 rounded-full" />
      </div>
    );
  }

  const status = licenca?.status_licenca || 'SEM_LICENCA';
  const isSemLicenca = status === 'SEM_LICENCA';
  const isTrial = status === 'TRIAL';
  const isAtiva = status === 'ATIVA';
  const isExpired = status === 'EXPIRADA' || status === 'BLOQUEADA' || status === 'INVALIDA';

  type StatusEntry = {
    label: string;
    color: 'secondary' | 'warning' | 'success' | 'danger';
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
  };
  const statusConfig: Record<string, StatusEntry> = {
    SEM_LICENCA: {
      label: 'Sem Licença',
      color: 'secondary' as const,
      icon: <Shield className="w-8 h-8" />,
      bgColor: 'bg-slate-50 border-slate-200',
      textColor: 'text-slate-800',
    },
    TRIAL: {
      label: 'Modo Trial',
      color: 'warning' as const,
      icon: <Clock className="w-8 h-8" />,
      bgColor: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-800',
    },
    ATIVA: {
      label: 'Licença Ativa',
      color: 'success' as const,
      icon: <CheckCircle2 className="w-8 h-8" />,
      bgColor: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-800',
    },
    EXPIRADA: {
      label: 'Licença Expirada',
      color: 'danger' as const,
      icon: <AlertTriangle className="w-8 h-8" />,
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
    },
    BLOQUEADA: {
      label: 'Licença Bloqueada',
      color: 'danger' as const,
      icon: <Shield className="w-8 h-8" />,
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
    },
    INVALIDA: {
      label: 'Licença Inválida',
      color: 'danger' as const,
      icon: <AlertTriangle className="w-8 h-8" />,
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
    },
  };

  const config = statusConfig[status] || statusConfig.SEM_LICENCA;

  // Calculate days remaining
  let diasRestantes = 0;
  if (licenca?.expira_em) {
    const diff = new Date(licenca.expira_em).getTime() - new Date().getTime();
    diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  } else if (licenca?.trial_expira_em) {
    const diff = new Date(licenca.trial_expira_em).getTime() - new Date().getTime();
    diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Licenciamento</h1>
        <p className="text-sm text-slate-500 mt-1">Gerenciamento de licença da instalação</p>
      </div>

      {/* Status Card */}
      <Card className={`${config.bgColor} border-2`}>
        <CardContent className="flex flex-col items-center py-8">
          <div className={`${config.textColor} mb-3`}>{config.icon}</div>
          <h2 className={`text-xl font-bold ${config.textColor}`}>{config.label}</h2>

          {isSemLicenca && (
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-600">Você ainda não iniciou o período de testes.</p>
              <Button
                className="mt-3"
                variant="primary"
                onClick={() => trialMut.mutate(undefined)}
                isLoading={trialMut.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Teste Grátis (15 dias / 100 pesagens)
              </Button>
              {trialMut.isError && (
                <p className="text-sm text-red-600 mt-2">Erro ao iniciar trial. Tente novamente.</p>
              )}
            </div>
          )}

          {isTrial && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-700">{diasRestantes}</p>
                  <p className="text-xs text-amber-600">dias restantes</p>
                </div>
                <div className="w-px h-12 bg-amber-300" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-700">
                    {licenca?.pesagens_restantes_trial ?? 0}
                  </p>
                  <p className="text-xs text-amber-600">pesagens restantes</p>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-3">
                Trial iniciado em {formatDate(licenca?.trial_iniciado_em)} - Expira em{' '}
                {formatDate(licenca?.trial_expira_em)}
              </p>
            </div>
          )}

          {isAtiva && licenca?.ativado_em && (
            <p className="mt-3 text-sm text-emerald-600">
              Ativada em {formatDate(licenca.ativado_em)}
              {licenca?.expira_em && ` - Expira em ${formatDate(licenca.expira_em)}`}
            </p>
          )}

          {isExpired && (
            <p className="mt-3 text-sm text-red-600">
              {licenca?.motivo_bloqueio ||
                'A licença expirou. Ative uma nova licença para continuar.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Validation Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-slate-500" />
            Chave de Validação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-3">
            Envie esta chave ao suporte para obter sua chave de licenciamento:
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-100 rounded-lg px-4 py-3 font-mono text-sm text-slate-700 break-all">
              {fingerprintData?.fingerprint || licenca?.chave_validacao_hash || 'N/A'}
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                copyToClipboard(fingerprintData?.fingerprint || licenca?.chave_validacao_hash || '')
              }
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ativação da Licença</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-3">
            Insira a chave de licenciamento recebida do suporte:
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="Cole a chave de licenciamento aqui..."
              value={licencaKey}
              onChange={(e) => setLicencaKey(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={() => ativarMut.mutate(licencaKey)}
              isLoading={ativarMut.isPending}
              disabled={!licencaKey || licencaKey.length < 10}
            >
              <Shield className="w-4 h-4 mr-2" />
              Ativar
            </Button>
          </div>
          {ativarMut.isError && (
            <p className="text-sm text-red-600 mt-2">
              Erro ao ativar licença. Verifique a chave e tente novamente.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operações Permitidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: 'Abrir ticket produtivo', allowed: isTrial || isAtiva },
              { label: 'Capturar passagem produtiva', allowed: isTrial || isAtiva },
              { label: 'Fechar ticket produtivo', allowed: isTrial || isAtiva },
              { label: 'Consultar histórico', allowed: true },
              { label: 'Diagnosticar instalação', allowed: true },
              { label: 'Ativar licença', allowed: true },
            ].map((op, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <span className="text-sm text-slate-700">{op.label}</span>
                <Badge variant={op.allowed ? 'success' : 'danger'}>
                  {op.allowed ? 'Permitido' : 'Bloqueado'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
