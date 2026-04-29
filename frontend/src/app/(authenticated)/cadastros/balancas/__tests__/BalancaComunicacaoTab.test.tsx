import { render, screen } from '@testing-library/react';
import { BalancaComunicacaoTab } from '../components/BalancaComunicacaoTab';

describe('BalancaComunicacaoTab', () => {
  it('exibe campos seriais persistentes e modo de leitura', () => {
    render(
      <BalancaComunicacaoTab
        form={{ tipoConexao: 'SERIAL', porta: 'COM3', readMode: 'polling', readCommandHex: '05' }}
        setForm={jest.fn()}
        errors={{}}
      />,
    );

    expect(screen.getByLabelText('Porta serial *')).toHaveValue('COM3');
    expect(screen.getByLabelText('Baud')).toBeInTheDocument();
    expect(screen.getByLabelText('Data bits')).toBeInTheDocument();
    expect(screen.getByLabelText('Paridade')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop')).toBeInTheDocument();
    expect(screen.getByLabelText('Comando hex')).toHaveValue('05');
  });
});
