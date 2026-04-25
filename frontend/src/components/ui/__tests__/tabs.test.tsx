import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from '../tabs';

describe('Tabs (Radix)', () => {
  it('renderiza abas e mostra conteúdo ativo por padrão', () => {
    render(
      <Tabs
        tabs={[
          { label: 'Aba 1', value: '1', content: <div>Conteúdo 1</div> },
          { label: 'Aba 2', value: '2', content: <div>Conteúdo 2</div> },
        ]}
        defaultValue="1"
      />,
    );

    expect(screen.getByRole('tab', { name: 'Aba 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Aba 2' })).toBeInTheDocument();
    expect(screen.getByText('Conteúdo 1')).toBeInTheDocument();
  });

  it('troca de aba ao clicar', async () => {
    render(
      <Tabs
        tabs={[
          { label: 'Aba 1', value: '1', content: <div>Conteúdo 1</div> },
          { label: 'Aba 2', value: '2', content: <div>Conteúdo 2</div> },
        ]}
        defaultValue="1"
      />,
    );

    await userEvent.click(screen.getByRole('tab', { name: 'Aba 2' }));
    expect(screen.getByText('Conteúdo 2')).toBeInTheDocument();
  });
});
