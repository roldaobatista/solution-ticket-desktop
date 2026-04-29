import { render, screen } from '@testing-library/react';
import { IndicadorEditorDialog } from '../components/IndicadorEditorDialog';

describe('IndicadorEditorDialog', () => {
  it('renderiza campos de comunicacao, parser e leitura', () => {
    render(
      <IndicadorEditorDialog open onClose={jest.fn()} onSubmit={jest.fn()} indicador={null} />,
    );

    expect(screen.getByRole('dialog', { name: 'Novo Indicador' })).toBeInTheDocument();
    expect(screen.getByLabelText('Descricao')).toBeInTheDocument();
    expect(screen.getByLabelText('Baud')).toBeInTheDocument();
    expect(screen.getByLabelText('Parser')).toBeInTheDocument();
    expect(screen.getByLabelText('Comando')).toBeInTheDocument();
  });
});
