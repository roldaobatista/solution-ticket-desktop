'use client';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BalancaTabProps, TipoConexao } from './types';

const tipoConexaoOptions: Array<{ value: TipoConexao; label: string }> = [
  { value: 'SERIAL', label: 'Serial RS-232/RS-485' },
  { value: 'TCP', label: 'TCP/IP' },
  { value: 'MODBUS_RTU', label: 'Modbus RTU' },
  { value: 'MODBUS_TCP', label: 'Modbus TCP' },
];

function numberOrUndefined(value: string) {
  return value === '' ? undefined : Number(value);
}

export function BalancaComunicacaoTab({ form, setForm, errors }: BalancaTabProps) {
  const tipo = form.tipoConexao || 'SERIAL';
  const usaSerial = tipo === 'SERIAL' || tipo === 'MODBUS_RTU';
  const usaTcp = tipo === 'TCP' || tipo === 'MODBUS_TCP';
  const usaModbus = tipo === 'MODBUS_RTU' || tipo === 'MODBUS_TCP';

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Tipo de Conexao *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {tipoConexaoOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm ${
                tipo === opt.value
                  ? 'border-slate-700 bg-slate-50 text-slate-900'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="tipoConexao"
                value={opt.value}
                checked={tipo === opt.value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tipoConexao: e.target.value as TipoConexao }))
                }
                className="accent-slate-700"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.tipoConexao && <p className="text-xs text-red-500 mt-1">{errors.tipoConexao}</p>}
      </div>

      <div className="rounded-lg border border-slate-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Comunicacao</h3>
        {usaSerial && (
          <Input
            label="Porta serial *"
            value={form.porta || ''}
            onChange={(e) => setForm((f) => ({ ...f, porta: e.target.value }))}
            placeholder="COM3"
            error={errors.porta}
          />
        )}
        {usaTcp && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                label="Host/IP *"
                value={form.host || form.enderecoIp || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, host: e.target.value, enderecoIp: e.target.value }))
                }
                placeholder="192.168.1.100"
                error={errors.host}
              />
            </div>
            <Input
              label="Porta TCP *"
              type="number"
              value={form.portaTcp ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, portaTcp: numberOrUndefined(e.target.value) }))
              }
              placeholder={tipo === 'MODBUS_TCP' ? '502' : '4001'}
              error={errors.portaTcp}
            />
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Input
            label="Baud"
            type="number"
            value={form.baudRate ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, baudRate: numberOrUndefined(e.target.value) }))
            }
            placeholder="9600"
          />
          <Select
            label="Data bits"
            value={String(form.ovrDataBits ?? '')}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                ovrDataBits: e.target.value ? Number(e.target.value) : null,
              }))
            }
            options={[
              { value: '', label: 'Indicador' },
              { value: '7', label: '7' },
              { value: '8', label: '8' },
            ]}
          />
          <Select
            label="Paridade"
            value={form.ovrParity ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ovrParity: e.target.value || null }))}
            options={[
              { value: '', label: 'Indicador' },
              { value: 'N', label: 'N' },
              { value: 'E', label: 'E' },
              { value: 'O', label: 'O' },
            ]}
          />
          <Select
            label="Stop"
            value={String(form.ovrStopBits ?? '')}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                ovrStopBits: e.target.value ? Number(e.target.value) : null,
              }))
            }
            options={[
              { value: '', label: 'Indicador' },
              { value: '1', label: '1' },
              { value: '2', label: '2' },
            ]}
          />
          <Select
            label="Fluxo"
            value={form.ovrFlowControl ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ovrFlowControl: e.target.value || null }))}
            options={[
              { value: '', label: 'Indicador' },
              { value: 'NONE', label: 'NONE' },
              { value: 'XON_XOFF', label: 'XON/XOFF' },
              { value: 'RTS_CTS', label: 'RTS/CTS' },
              { value: 'DTR_DSR', label: 'DTR/DSR' },
            ]}
          />
        </div>
      </div>

      {usaModbus && (
        <div className="rounded-lg border border-slate-200 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Modbus</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              label="Unit ID *"
              type="number"
              value={form.modbusUnitId ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, modbusUnitId: numberOrUndefined(e.target.value) }))
              }
              error={errors.modbusUnitId}
            />
            <Input
              label="Registrador *"
              type="number"
              value={form.modbusRegister ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, modbusRegister: numberOrUndefined(e.target.value) }))
              }
              error={errors.modbusRegister}
            />
            <Select
              label="Funcao"
              value={form.modbusFunction || 'holding'}
              onChange={(e) =>
                setForm((f) => ({ ...f, modbusFunction: e.target.value as 'holding' | 'input' }))
              }
              options={[
                { value: 'holding', label: 'Holding' },
                { value: 'input', label: 'Input' },
              ]}
            />
            <Select
              label="Byte order"
              value={form.modbusByteOrder || 'BE'}
              onChange={(e) =>
                setForm((f) => ({ ...f, modbusByteOrder: e.target.value as 'BE' | 'LE' }))
              }
              options={[
                { value: 'BE', label: 'BE' },
                { value: 'LE', label: 'LE' },
              ]}
            />
            <Select
              label="Word order"
              value={form.modbusWordOrder || 'BE'}
              onChange={(e) =>
                setForm((f) => ({ ...f, modbusWordOrder: e.target.value as 'BE' | 'LE' }))
              }
              options={[
                { value: 'BE', label: 'BE' },
                { value: 'LE', label: 'LE' },
              ]}
            />
            <Input
              label="Escala"
              type="number"
              value={form.modbusScale ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, modbusScale: numberOrUndefined(e.target.value) }))
              }
            />
            <Input
              label="Offset"
              type="number"
              value={form.modbusOffset ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, modbusOffset: numberOrUndefined(e.target.value) }))
              }
            />
            <div className="flex items-end gap-3 pb-2">
              <Switch
                checked={form.modbusSigned ?? false}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, modbusSigned: checked }))}
              />
              <span className="text-sm text-slate-700">Assinado</span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Leitura</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select
            label="Modo"
            value={form.readMode ?? 'continuous'}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                readMode: e.target.value as 'continuous' | 'polling' | 'manual',
              }))
            }
            options={[
              { value: 'continuous', label: 'Continuous' },
              { value: 'polling', label: 'Polling' },
              { value: 'manual', label: 'Manual' },
            ]}
          />
          <Input
            label="Comando hex"
            value={form.readCommandHex ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, readCommandHex: e.target.value || null }))}
            placeholder="05"
            error={errors.readCommandHex}
          />
          <Input
            label="Intervalo ms"
            type="number"
            value={form.readIntervalMs ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, readIntervalMs: numberOrUndefined(e.target.value) }))
            }
          />
          <Input
            label="Timeout ms"
            type="number"
            value={form.readTimeoutMs ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, readTimeoutMs: numberOrUndefined(e.target.value) }))
            }
          />
        </div>
      </div>
    </div>
  );
}
