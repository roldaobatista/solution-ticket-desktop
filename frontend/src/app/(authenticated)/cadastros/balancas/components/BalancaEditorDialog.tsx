'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Tabs } from '@/components/ui/tabs';
import { AjusteLeituraSection } from '@/components/balanca/AjusteLeituraSection';
import { CalibracaoSection } from '@/components/balanca/CalibracaoSection';
import { Save, Zap } from 'lucide-react';
import { BalancaDiagnosticoTab } from './BalancaDiagnosticoTab';
import { BalancaGeralTab } from './BalancaGeralTab';
import { BalancaComunicacaoTab } from './BalancaComunicacaoTab';
import { BalancaProtocoloTab } from './BalancaProtocoloTab';
import { IndicadorWizardDialog } from './IndicadorWizardDialog';
import { BalancaCatalogos, BalancaForm, BalancaFormErrors } from './types';
import { IndicadorPesagem } from '@/types';

interface Props extends BalancaCatalogos {
  open: boolean;
  editingId: string | null;
  form: BalancaForm;
  errors: BalancaFormErrors;
  isSaving: boolean;
  testing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onTestar: () => void;
  setForm: Dispatch<SetStateAction<BalancaForm>>;
  onMessage: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function BalancaEditorDialog({
  open,
  editingId,
  form,
  errors,
  unidades,
  indicadores,
  isSaving,
  testing,
  onClose,
  onSubmit,
  onTestar,
  setForm,
  onMessage,
}: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);

  const aplicarIndicador = (indicador: IndicadorPesagem) => {
    setForm((f) => ({
      ...f,
      indicadorId: indicador.id,
      indicador,
      tipoConexao:
        indicador.protocolo === 'tcp'
          ? 'TCP'
          : indicador.protocolo === 'modbus'
            ? 'MODBUS_RTU'
            : f.tipoConexao || 'SERIAL',
    }));
  };

  const tabProps = { form, setForm, errors };
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={editingId ? 'Editar Balanca' : 'Nova Balanca'}
        maxWidth="max-w-5xl"
      >
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <Tabs
            tabs={[
              {
                value: 'geral',
                label: 'Geral',
                content: (
                  <BalancaGeralTab {...tabProps} unidades={unidades} indicadores={indicadores} />
                ),
              },
              {
                value: 'comunicacao',
                label: 'Comunicacao',
                content: <BalancaComunicacaoTab {...tabProps} />,
              },
              {
                value: 'protocolo',
                label: 'Protocolo',
                content: (
                  <BalancaProtocoloTab
                    {...tabProps}
                    balancaId={editingId}
                    onOpenWizard={() => setWizardOpen(true)}
                  />
                ),
              },
              {
                value: 'diagnostico',
                label: 'Diagnostico',
                content: (
                  <BalancaDiagnosticoTab
                    {...tabProps}
                    balancaId={editingId}
                    onMessage={onMessage}
                  />
                ),
              },
              {
                value: 'calibracao',
                label: 'Calibracao',
                content: editingId ? (
                  <div className="space-y-4">
                    <AjusteLeituraSection
                      balancaId={editingId}
                      indicadorId={form.indicadorId || ''}
                      onApplied={() => onMessage('Ajuste aplicado com sucesso', 'success')}
                      onError={(m) => onMessage(m, 'error')}
                    />
                    <CalibracaoSection
                      balancaId={editingId}
                      onError={(m) => onMessage(m, 'error')}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
                    Salve a balanca para liberar calibracao.
                  </div>
                ),
              },
            ]}
          />
        </div>

        <div className="flex justify-between gap-3 pt-4 mt-4 border-t border-slate-200">
          <Button
            variant="secondary"
            onClick={onTestar}
            disabled={!editingId || testing}
            title={!editingId ? 'Salve a balanca primeiro' : 'Testar conexao'}
          >
            <Zap className="w-4 h-4 mr-2" />
            {testing ? 'Testando...' : 'Testar Conexao'}
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={onSubmit} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </Dialog>
      <IndicadorWizardDialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        form={form}
        onCreated={(indicador) => {
          aplicarIndicador(indicador);
          onMessage('Indicador criado e aplicado', 'success');
          setWizardOpen(false);
        }}
        onMessage={onMessage}
      />
    </>
  );
}
