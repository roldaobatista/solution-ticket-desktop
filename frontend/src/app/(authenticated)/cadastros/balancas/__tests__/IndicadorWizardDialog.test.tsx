import { render, screen } from '@testing-library/react';
import { IndicadorWizardDialog } from '../components/IndicadorWizardDialog';

jest.mock('@/lib/api/indicador', () => ({
  criarFromWizard: jest.fn(),
  testarConfig: jest.fn(),
}));

describe('IndicadorWizardDialog', () => {
  it('renderiza fluxo de criacao sem tenantId manual', () => {
    render(
      <IndicadorWizardDialog
        open
        form={{ tipoConexao: 'SERIAL', baudRate: 9600 }}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        onMessage={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('dialog', { name: 'Criar protocolo desconhecido' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Fabricante')).toBeInTheDocument();
    expect(screen.getByLabelText('Modelo')).toBeInTheDocument();
    expect(screen.getByLabelText('Comando hex')).toBeInTheDocument();
  });
});
