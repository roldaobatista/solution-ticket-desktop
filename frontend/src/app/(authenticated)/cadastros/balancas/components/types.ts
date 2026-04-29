import { Balanca, IndicadorPesagem, Unidade } from '@/types';
import type { Dispatch, SetStateAction } from 'react';

export type TipoConexao = 'SERIAL' | 'TCP' | 'MODBUS_RTU' | 'MODBUS_TCP';

export type BalancaForm = Partial<Balanca> & {
  unidadeId?: string;
  indicadorId?: string;
  tipoConexao?: TipoConexao;
  host?: string;
  ativa?: boolean;
};

export type BalancaFormErrors = Partial<Record<keyof BalancaForm, string>>;

export interface BalancaTabProps {
  form: BalancaForm;
  setForm: Dispatch<SetStateAction<BalancaForm>>;
  errors: BalancaFormErrors;
}

export interface BalancaCatalogos {
  unidades?: Unidade[];
  indicadores?: IndicadorPesagem[];
}
