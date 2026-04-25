// Solution Ticket v4.2
const e = React.createElement,
  u = React.useState,
  m = React.useMemo,
  c = React.useContext,
  cc = React.createContext,
  ue = React.useEffect;
const fmt = {
  weight: (v) => (v ? Number(v).toLocaleString('pt-BR') + ' kg' : '-'),
  currency: (v) =>
    v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-',
  date: (d) => (d ? new Date(d).toLocaleString('pt-BR') : '-'),
  dateShort: (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '-'),
};
function expCSV(filename, headers, rows) {
  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
const API_BASE = '/api';
function apiCall(method, endpoint, body) {
  const token = localStorage.getItem('token');
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body) opts.body = JSON.stringify(body);
  return fetch(API_BASE + endpoint, opts)
    .then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .catch((err) => {
      console.warn('API Error:', err.message);
      return { __error: true, message: err.message };
    });
}
const apiGet = (ep) => apiCall('GET', ep);
const apiPost = (ep, body) => apiCall('POST', ep, body);
function beep(freq, dur, type) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq || 800;
  gain.gain.value = 0.1;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.2));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + (dur || 0.2));
}
function playSuccess() {
  beep(523, 0.15);
  setTimeout(() => beep(659, 0.15), 120);
  setTimeout(() => beep(784, 0.2), 240);
}
function playError() {
  beep(200, 0.3, 'sawtooth');
}
function printTicket(tk, mode) {
  const emp = 'Agropecuaria Santa Fe Ltda';
  const end = 'Rod. BR-163, KM 512 - Rondonopolis/MT';
  if (mode === 'termica') {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{margin:0}body{font-family:'Courier New',monospace;font-size:11px;width:80mm;margin:0;padding:4mm;line-height:1.4}.c{text-align:center}.b{font-weight:bold}.l{border-top:1px dashed #000;margin:6px 0}.f{font-size:8px;text-align:center;margin-top:10px;color:#666}</style></head><body><div class="c"><div class="b" style="font-size:13px">${emp}</div><div style="font-size:9px;color:#333">${end}</div><div class="l"></div><div class="b">TICKET ${tk.numero}</div></div><div class="l"></div><div><span>Data:</span><span class="b">${fmt.date(tk.criadoEm)}</span></div><div class="l"></div><div><span>Cliente:</span><span class="b">${(tk.cliente || '-').substring(0, 20)}</span></div><div><span>Placa:</span><span class="b">${tk.veiculoPlaca || '-'}</span></div><div class="l"></div><div style="font-size:18px"><span class="b">LIQUIDO:</span><span class="b">${fmt.weight(tk.pesoLiquidoFinal)}</span></div><div class="l"></div><div class="f">Solution Ticket v4.2<br>Impresso em ${new Date().toLocaleString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  } else {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:15mm}body{font-family:Arial,sans-serif;font-size:12px;color:#333}.h{text-align:center;border-bottom:3px solid #0c99eb;padding-bottom:15px;margin-bottom:20px}.h h1{color:#0c99eb;font-size:22px;margin:0}.b{background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;padding:15px;margin-bottom:15px}.w{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #22c55e;border-radius:8px;padding:20px;text-align:center;margin:15px 0}.g{display:grid;grid-template-columns:1fr 1fr;gap:10px}</style></head><body><div class="h"><h1>${emp}</h1><p>${end}</p><h2>TICKET ${tk.numero}</h2></div><div class="b"><div class="g"><div><strong>Data:</strong> ${fmt.date(tk.criadoEm)}</div><div><strong>Status:</strong> ${tk.statusOperacional}</div><div><strong>Cliente:</strong> ${tk.cliente || '-'}</div><div><strong>Produto:</strong> ${tk.produto || '-'}</div><div><strong>Placa:</strong> ${tk.veiculoPlaca || '-'}</div><div><strong>Motorista:</strong> ${tk.motorista || '-'}</div></div></div><div class="w"><div style="font-size:14px">PESO LIQUIDO</div><div style="font-size:36px;color:#15803d;font-weight:bold">${fmt.weight(tk.pesoLiquidoFinal)}</div></div><div class="b"><div class="g"><div>Peso Bruto: <strong>${fmt.weight(tk.pesoBrutoApurado)}</strong></div><div>Peso Tara: <strong>${fmt.weight(tk.pesoTaraApurada)}</strong></div></div></div><div style="text-align:center;font-size:10px;color:#999;margin-top:30px">Solution Ticket v4.2 - Documento gerado em ${new Date().toLocaleString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  }
}
function LEDDisplay({ value, stable, label }) {
  return e(
    'div',
    {
      className: 'bg-black rounded-2xl border-4 border-slate-700 p-6 text-center',
      style: { boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' },
    },
    e(
      'div',
      { className: 'flex items-center justify-center gap-3 mb-3' },
      e('div', {
        className: 'w-3 h-3 rounded-full ' + (stable ? 'bg-emerald-400' : 'bg-amber-400'),
      }),
      e(
        'span',
        { className: 'text-sm font-bold ' + (stable ? 'text-emerald-400' : 'text-amber-400') },
        stable ? 'ESTAVEL' : 'INSTAVEL',
      ),
    ),
    e(
      'div',
      {
        className: 'font-mono text-6xl font-bold tracking-wider',
        style: { color: '#00ff41', textShadow: '0 0 10px rgba(0,255,65,0.5)' },
      },
      fmt.weight(value),
    ),
    e('p', { className: 'text-slate-500 text-sm mt-2 font-mono' }, label || 'BALANCA-001'),
  );
}
function Badge({ status, text }) {
  const C = {
    ABERTO: 'bg-blue-100 text-blue-700',
    EM_PESAGEM: 'bg-amber-100 text-amber-700',
    FECHADO: 'bg-emerald-100 text-emerald-700',
    CANCELADO: 'bg-red-100 text-red-700',
    ONLINE: 'bg-emerald-100 text-emerald-700',
    OFFLINE: 'bg-red-100 text-red-700',
  };
  return e(
    'span',
    {
      className: `inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${C[status] || 'bg-slate-100 text-slate-600'}`,
    },
    text || status,
  );
}
function Toast({ toast }) {
  if (!toast) return null;
  const C = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };
  const I = {
    success: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2-2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    warning: 'M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  };
  ue(() => {
    if (toast.type === 'success') playSuccess();
    else if (toast.type === 'error') playError();
  }, [toast]);
  return e(
    'div',
    { className: 'fixed top-4 right-4 z-50 fade-in' },
    e(
      'div',
      {
        className: `${C[toast.type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]`,
      },
      e(
        'svg',
        {
          width: 18,
          height: 18,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'white',
          strokeWidth: 2,
        },
        e('path', { d: I[toast.type] }),
      ),
      e('span', { className: 'text-sm font-medium flex-1' }, toast.msg),
    ),
  );
}
function Modal({ title, msg, onConfirm, onCancel, confirmText, cancelText, type }) {
  if (!msg) return null;
  const C = {
    danger: 'bg-red-500 hover:bg-red-600',
    primary: 'bg-primary-500 hover:bg-primary-600',
  };
  return e(
    'div',
    { className: 'fixed inset-0 z-50 flex items-center justify-center fade-in' },
    e('div', { className: 'absolute inset-0 bg-black/40', onClick: onCancel }),
    e(
      'div',
      { className: 'relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 z-10' },
      e('h3', { className: 'text-lg font-bold text-slate-900 mb-4' }, title || 'Confirmacao'),
      e('p', { className: 'text-sm text-slate-600 mb-6' }, msg),
      e(
        'div',
        { className: 'flex gap-3 justify-end' },
        e(
          'button',
          {
            onClick: onCancel,
            className:
              'px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50',
          },
          cancelText || 'Cancelar',
        ),
        e(
          'button',
          {
            onClick: onConfirm,
            className: `px-4 py-2 rounded-lg text-sm font-medium text-white ${C[type || 'primary']}`,
          },
          confirmText || 'Confirmar',
        ),
      ),
    ),
  );
}
function Pagination({ page, setPage, totalPages }) {
  if (totalPages <= 1) return null;
  const btns = [];
  for (let i = 0; i < totalPages; i++)
    btns.push(
      e(
        'button',
        {
          key: i,
          onClick: () => setPage(i),
          className: `px-3 py-1 rounded text-sm font-medium ${i === page ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`,
        },
        i + 1,
      ),
    );
  return e(
    'div',
    { className: 'flex items-center gap-2 mt-4 justify-center' },
    e(
      'button',
      {
        onClick: () => setPage(Math.max(0, page - 1)),
        className: 'px-3 py-1 rounded text-sm bg-slate-100 text-slate-600',
      },
      '<',
    ),
    btns,
    e(
      'button',
      {
        onClick: () => setPage(Math.min(totalPages - 1, page + 1)),
        className: 'px-3 py-1 rounded text-sm bg-slate-100 text-slate-600',
      },
      '>',
    ),
  );
}
function DigitalClock() {
  const [time, setTime] = u(new Date());
  ue(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return e(
    'div',
    { className: 'text-right' },
    e('div', { className: 'text-xl font-bold text-slate-800' }, time.toLocaleTimeString('pt-BR')),
    e(
      'div',
      { className: 'text-xs text-slate-500' },
      time.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    ),
  );
}
function StatCard({ label, value, color, bg, onClick }) {
  return e(
    'div',
    {
      onClick,
      className: `${bg} rounded-2xl p-5 border border-slate-100 card-hover cursor-pointer`,
    },
    e(
      'div',
      { className: 'text-xs font-medium text-slate-500 uppercase tracking-wider mb-1' },
      label,
    ),
    e('div', { className: `text-2xl font-bold ${color} count-up` }, value),
  );
}
function DonutChart({ data, colors, size }) {
  const s = size || 120;
  const r = (s - 20) / 2;
  const c = 2 * Math.PI * r;
  let o = 0;
  const circles = data.map((d, i) => {
    const seg =
      (d.value /
        Math.max(
          data.reduce((a, b) => a + b.value, 0),
          1,
        )) *
      c;
    const el = e('circle', {
      key: i,
      cx: s / 2,
      cy: s / 2,
      r: r,
      fill: 'none',
      stroke: colors[i % colors.length],
      strokeWidth: 18,
      strokeDasharray: seg + ' ' + (c - seg),
      strokeDashoffset: -o,
      transform: 'rotate(-90 ' + s / 2 + ' ' + s / 2 + ')',
      style: { transition: 'stroke-dasharray 0.6s ease' },
    });
    o += seg;
    return el;
  });
  return e(
    'div',
    { className: 'flex items-center justify-center' },
    e('svg', { width: s, height: s, viewBox: '0 0 ' + s + ' ' + s }, circles),
  );
}
function GaugeCircular({ value, max, label, color }) {
  const pct = Math.min(value / Math.max(max, 1), 1);
  const r = 45;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  return e(
    'div',
    { className: 'flex flex-col items-center' },
    e(
      'svg',
      { width: 120, height: 120, viewBox: '0 0 120 120' },
      e('circle', { cx: 60, cy: 60, r: r, fill: 'none', stroke: '#e2e8f0', strokeWidth: 10 }),
      e('circle', {
        cx: 60,
        cy: 60,
        r: r,
        fill: 'none',
        stroke: color || '#0c99eb',
        strokeWidth: 10,
        strokeDasharray: c,
        strokeDashoffset: -off,
        strokeLinecap: 'round',
        transform: 'rotate(-90 60 60)',
        className: 'gauge-anim',
        style: { '--gd': c, '--go': c - off },
      }),
    ),
    e('div', { className: 'text-lg font-bold mt-1' }, value),
    e('div', { className: 'text-xs text-slate-500' }, label),
  );
}
const MOCK = {
  clientes: [
    {
      id: 'c1',
      razaoSocial: 'Agropecuaria Santa Fe Ltda',
      nomeFantasia: 'Santa Fe',
      documento: '12.345.678/0001-90',
      cidade: 'Rondonopolis',
    },
    {
      id: 'c2',
      razaoSocial: 'Transcol Transportes Ltda',
      nomeFantasia: 'Transcol',
      documento: '23.456.789/0001-01',
      cidade: 'Rondonopolis',
    },
    {
      id: 'c3',
      razaoSocial: 'Comercial Agro Soja Ltda',
      nomeFantasia: 'Agro Soja',
      documento: '34.567.890/0001-12',
      cidade: 'Primavera do Leste',
    },
    {
      id: 'c4',
      razaoSocial: 'Fazenda Boa Vista',
      nomeFantasia: 'Boa Vista',
      documento: '45.678.901/0001-23',
      cidade: 'Campo Verde',
    },
    {
      id: 'c5',
      razaoSocial: 'Cooperativa Mato Grosso',
      nomeFantasia: 'COOMATRA',
      documento: '56.789.012/0001-34',
      cidade: 'Rondonopolis',
    },
  ],
  produtos: [
    { id: 'p1', descricao: 'Soja em Grao', unidade: 'kg', ativo: true },
    { id: 'p2', descricao: 'Milho em Grao', unidade: 'kg', ativo: true },
    { id: 'p3', descricao: 'Semente de Soja', unidade: 'kg', ativo: true },
    { id: 'p4', descricao: 'Farelo de Soja', unidade: 'kg', ativo: true },
  ],
  veiculos: [
    { id: 'v1', placa: 'MTF-4I21', taraCadastrada: 15200, modelo: 'Volvo FH 540' },
    { id: 'v2', placa: 'MTA-9B76', taraCadastrada: 14800, modelo: 'Scania R450' },
    { id: 'v3', placa: 'MTE-2C45', taraCadastrada: 15500, modelo: 'Mercedes Actros' },
    { id: 'v4', placa: 'MTI-7D33', taraCadastrada: 15000, modelo: 'Iveco Hi-Way' },
    { id: 'v5', placa: 'MTO-1E88', taraCadastrada: 16000, modelo: 'Volvo FM 460' },
  ],
  motoristas: [
    { id: 'm1', nome: 'Joao da Silva', documento: '456.789.123-00' },
    { id: 'm2', nome: 'Pedro Oliveira', documento: '567.890.234-11' },
    { id: 'm3', nome: 'Maria Santos', documento: '678.901.345-22' },
    { id: 'm4', nome: 'Carlos Ferreira', documento: '789.012.456-33' },
    { id: 'm5', nome: 'Ana Costa', documento: '890.123.567-44' },
  ],
  transportadoras: [
    { id: 't1', nome: 'Transcol Transportes Ltda', documento: '23.456.789/0001-01' },
    { id: 't2', nome: 'Rodo Norte Ltda', documento: '67.890.123/0001-45' },
    { id: 't3', nome: 'Trans Brasil S/A', documento: '78.901.234/0001-56' },
  ],
  balancas: [
    {
      id: 'b1',
      nome: 'TOLEDO-001',
      marca: 'Toledo',
      modelo: '9090 Plus',
      protocolo: 'TOLEDO/P00',
      statusOnline: true,
      tipoEntradaSaida: 'ENTRADA',
    },
    {
      id: 'b2',
      nome: 'TOLEDO-002',
      marca: 'Toledo',
      modelo: '9090 Plus',
      protocolo: 'TOLEDO/P00',
      statusOnline: true,
      tipoEntradaSaida: 'SAIDA',
    },
    {
      id: 'b3',
      nome: 'ALFA-001',
      marca: 'Alfa',
      modelo: 'Balmak',
      protocolo: 'ALFA/A00',
      statusOnline: true,
      tipoEntradaSaida: 'NEUTRO',
    },
    {
      id: 'b4',
      nome: 'DIGI-001',
      marca: 'Digi',
      modelo: 'DS-200',
      protocolo: 'DIGI/D00',
      statusOnline: false,
      tipoEntradaSaida: 'ENTRADA',
    },
  ],
  destinos: [
    { id: 'd1', descricao: 'Armazem Principal' },
    { id: 'd2', descricao: 'Silo 1 - Secagem' },
    { id: 'd3', descricao: 'Silo 2 - Armazenagem' },
  ],
  armazens: [
    { id: 'a1', descricao: 'Galpao A' },
    { id: 'a2', descricao: 'Galpao B' },
    { id: 'a3', descricao: 'Silo 1' },
  ],
  tickets: [
    {
      id: 'tk1',
      numero: 'TK-2024-0001',
      cliente: 'Agropecuaria Santa Fe',
      clienteId: 'c1',
      produto: 'Soja em Grao',
      produtoId: 'p1',
      veiculoPlaca: 'MTF-4I21',
      motorista: 'Joao da Silva',
      statusOperacional: 'FECHADO',
      pesoBrutoApurado: 48500,
      pesoTaraApurada: 15200,
      pesoLiquidoFinal: 33300,
      criadoEm: '2026-04-20T08:30:00',
    },
    {
      id: 'tk2',
      numero: 'TK-2024-0002',
      cliente: 'Transcol Transportes',
      clienteId: 'c2',
      produto: 'Milho em Grao',
      produtoId: 'p2',
      veiculoPlaca: 'MTA-9B76',
      motorista: 'Pedro Oliveira',
      statusOperacional: 'FECHADO',
      pesoBrutoApurado: 42100,
      pesoTaraApurada: 14800,
      pesoLiquidoFinal: 27300,
      criadoEm: '2026-04-20T09:15:00',
    },
    {
      id: 'tk3',
      numero: 'TK-2024-0003',
      cliente: 'Agropecuaria Santa Fe',
      clienteId: 'c1',
      produto: 'Soja em Grao',
      produtoId: 'p1',
      veiculoPlaca: 'MTE-2C45',
      motorista: 'Maria Santos',
      statusOperacional: 'FECHADO',
      pesoBrutoApurado: 51200,
      pesoTaraApurada: 15500,
      pesoLiquidoFinal: 35700,
      criadoEm: '2026-04-21T07:45:00',
    },
    {
      id: 'tk4',
      numero: 'TK-2024-0004',
      cliente: 'Fazenda Boa Vista',
      clienteId: 'c4',
      produto: 'Milho em Grao',
      produtoId: 'p2',
      veiculoPlaca: 'MTI-7D33',
      motorista: 'Carlos Ferreira',
      statusOperacional: 'FECHADO',
      pesoBrutoApurado: 39800,
      pesoTaraApurada: 15000,
      pesoLiquidoFinal: 24800,
      criadoEm: '2026-04-21T10:20:00',
    },
    {
      id: 'tk5',
      numero: 'TK-2024-0005',
      cliente: 'Cooperativa Mato Grosso',
      clienteId: 'c5',
      produto: 'Soja em Grao',
      produtoId: 'p1',
      veiculoPlaca: 'MTO-1E88',
      motorista: 'Ana Costa',
      statusOperacional: 'FECHADO',
      pesoBrutoApurado: 52400,
      pesoTaraApurada: 16000,
      pesoLiquidoFinal: 36400,
      criadoEm: '2026-04-22T06:10:00',
    },
    {
      id: 'tk6',
      numero: 'TK-2024-0006',
      cliente: 'Comercial Agro Soja',
      clienteId: 'c3',
      produto: 'Semente de Soja',
      produtoId: 'p3',
      veiculoPlaca: 'MTA-9B76',
      motorista: 'Pedro Oliveira',
      statusOperacional: 'FECHADO',
      pesoBrutoApurado: 38500,
      pesoTaraApurada: 14800,
      pesoLiquidoFinal: 23700,
      criadoEm: '2026-04-22T11:30:00',
    },
    {
      id: 'tk7',
      numero: 'TK-2024-0007',
      cliente: 'Agropecuaria Santa Fe',
      clienteId: 'c1',
      produto: 'Soja em Grao',
      produtoId: 'p1',
      veiculoPlaca: 'MTF-4I21',
      motorista: 'Joao da Silva',
      statusOperacional: 'ABERTO',
      criadoEm: '2026-04-23T08:00:00',
    },
    {
      id: 'tk8',
      numero: 'TK-2024-0008',
      cliente: 'Transcol Transportes',
      clienteId: 'c2',
      produto: 'Milho em Grao',
      produtoId: 'p2',
      veiculoPlaca: 'MTE-2C45',
      motorista: 'Maria Santos',
      statusOperacional: 'EM_PESAGEM',
      pesoBrutoApurado: 46700,
      criadoEm: '2026-04-23T09:30:00',
    },
  ],
};

const TABELA_UMIDADE = {
  soja: [
    { faixa: '13.0% - 13.5%', min: 13.0, max: 13.5, desc: 0.0 },
    { faixa: '13.6% - 14.0%', min: 13.6, max: 14.0, desc: 0.5 },
    { faixa: '14.1% - 14.5%', min: 14.1, max: 14.5, desc: 1.0 },
    { faixa: '14.6% - 15.0%', min: 14.6, max: 15.0, desc: 1.5 },
    { faixa: '15.1% - 15.5%', min: 15.1, max: 15.5, desc: 2.0 },
    { faixa: '15.6% - 16.0%', min: 15.6, max: 16.0, desc: 3.0 },
    { faixa: 'Acima 16.0%', min: 16.1, max: 99.0, desc: 5.0 },
  ],
  milho: [
    { faixa: '13.0% - 13.5%', min: 13.0, max: 13.5, desc: 0.0 },
    { faixa: '13.6% - 14.0%', min: 13.6, max: 14.0, desc: 0.5 },
    { faixa: '14.1% - 14.5%', min: 14.1, max: 14.5, desc: 1.0 },
    { faixa: '14.6% - 15.0%', min: 14.6, max: 15.0, desc: 2.0 },
    { faixa: 'Acima 15.0%', min: 15.1, max: 99.0, desc: 4.0 },
  ],
};
const StoreContext = cc(null);
function useStore() {
  return c(StoreContext);
}
function StoreProvider({ children }) {
  const [token, setToken] = u(localStorage.getItem('token'));
  const [user, setUser] = u(() => {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  });
  const [activePage, setActivePage] = u('dashboard');
  const [sidebarOpen, setSidebarOpen] = u(true);
  const [currentTicket, setCurrentTicket] = u(null);
  const [toast, setToast] = u(null);
  const [filaPesagem, setFilaPesagem] = u(
    MOCK.tickets.filter((t) => t.statusOperacional === 'EM_PESAGEM'),
  );
  const [darkMode, setDarkMode] = u(() => localStorage.getItem('darkMode') === 'true');
  const [tickets, setTickets] = u(() => {
    const s = localStorage.getItem('tickets');
    return s ? JSON.parse(s) : MOCK.tickets;
  });
  ue(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);
  ue(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const showToast = (msg, type = 'success') => setToast({ msg, type });
  const value = {
    token,
    setToken,
    user,
    setUser,
    activePage,
    setActivePage,
    sidebarOpen,
    setSidebarOpen,
    currentTicket,
    setCurrentTicket,
    toast,
    showToast,
    tickets,
    setTickets,
    addTicket: (t) => setTickets((p) => [t, ...p]),
    updateTicket: (t) => setTickets((p) => [t, ...p.filter((x) => x.id !== t.id)]),
    clientes: MOCK.clientes,
    produtos: MOCK.produtos,
    veiculos: MOCK.veiculos,
    motoristas: MOCK.motoristas,
    transportadoras: MOCK.transportadoras,
    balancas: MOCK.balancas,
    destinos: MOCK.destinos,
    armazens: MOCK.armazens,
    filaPesagem,
    setFilaPesagem,
    tabelaUmidade: TABELA_UMIDADE,
    darkMode,
    setDarkMode,
  };
  return e(StoreContext.Provider, { value }, children);
}
function Sidebar() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen, user, filaPesagem } = useStore();
  const nav = (id) => setActivePage(id);
  const menu = [
    { sep: true, label: 'PRINCIPAL' },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    },
    { sep: true, label: 'PESAGEM' },
    {
      id: 'pesagem',
      label: 'Pesagem',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z',
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    },
    {
      id: 'kanban',
      label: 'Kanban',
      icon: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-8v2h14V9H7z',
    },
    {
      id: 'cadastros',
      label: 'Cadastros',
      icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    },
    {
      id: 'balancas',
      label: 'Balancas',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
    },
    { sep: true, label: 'OPERACAO' },
    {
      id: 'tabelaUmidade',
      label: 'Umidade',
      icon: 'M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.15 0-6-2.38-6-6.2 0-2.34 1.78-5.27 6-9.14 4.22 3.87 6 6.8 6 9.14 0 3.82-2.85 6.2-6 6.2z',
    },
    { id: 'fila', label: 'Fila', icon: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z' },
    {
      id: 'auditoria',
      label: 'Auditoria',
      icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
    },
    { sep: true, label: 'FINANCEIRO' },
    {
      id: 'romaneios',
      label: 'Romaneios',
      icon: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z',
    },
    {
      id: 'faturas',
      label: 'Faturas',
      icon: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
    },
    { sep: true, label: 'SISTEMA' },
    {
      id: 'relatorios',
      label: 'Relatorios',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2v-4h2v4zm4 0h-2V7h2v10z',
    },
    {
      id: 'configuracoes',
      label: 'Config',
      icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84a.484.484 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.04.64.09.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    },
    {
      id: 'licenca',
      label: 'Licenca',
      icon: 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12.14l.76 1H5.12z',
    },
    {
      id: 'help',
      label: 'Ajuda',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
    },
  ];
  return e(
    'aside',
    {
      className:
        (sidebarOpen ? 'w-64' : 'w-20') +
        ' bg-slate-900 text-white flex flex-col transition-all duration-200 flex-shrink-0',
    },
    e(
      'div',
      { className: 'p-5 flex items-center gap-3 border-b border-slate-700' },
      e(
        'div',
        {
          className:
            'w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0',
        },
        e(
          'svg',
          {
            width: 22,
            height: 22,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'white',
            strokeWidth: 2,
          },
          e('circle', { cx: 12, cy: 12, r: 10 }),
          e('path', { d: 'M12 6v6l4 2' }),
        ),
      ),
      sidebarOpen &&
        e(
          'div',
          null,
          e('h2', { className: 'text-base font-bold tracking-tight' }, 'Solution'),
          e('p', { className: 'text-[10px] text-slate-400' }, 'Ticket v4.2'),
        ),
    ),
    e(
      'nav',
      { className: 'flex-1 p-3 space-y-1 overflow-y-auto' },
      menu.map((item, i) =>
        item.sep
          ? e(
              'div',
              {
                key: i,
                className:
                  'pt-4 pb-1 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider ' +
                  (sidebarOpen ? '' : 'hidden'),
              },
              item.label,
            )
          : e(
              'button',
              {
                key: i,
                onClick: () => nav(item.id),
                className:
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ' +
                  (activePage === item.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800'),
              },
              e(
                'svg',
                {
                  width: 18,
                  height: 18,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 1.5,
                },
                e('path', { d: item.icon }),
              ),
              sidebarOpen && e('span', { className: 'font-medium' }, item.label),
              item.id === 'fila' &&
                filaPesagem.length > 0 &&
                e(
                  'span',
                  {
                    className:
                      'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ' +
                      (activePage === 'fila'
                        ? 'bg-white text-primary-600'
                        : 'bg-amber-500 text-white'),
                  },
                  filaPesagem.length,
                ),
            ),
      ),
    ),
    e(
      'div',
      { className: 'p-4 border-t border-slate-700' },
      e(
        'button',
        {
          onClick: () => setSidebarOpen(!sidebarOpen),
          className:
            'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 transition-all',
        },
        e(
          'svg',
          {
            width: 16,
            height: 16,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2,
          },
          e('path', { d: sidebarOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7' }),
        ),
      ),
    ),
  );
}
function LoginPage() {
  const { setToken, setUser } = useStore();
  const [email, setEmail] = u('admin@solutionticket.com');
  const [password, setPassword] = u('admin123');
  const [error, setError] = u(null);
  const [loading, setLoading] = u(false);
  const handleLogin = (ev) => {
    ev.preventDefault();
    setLoading(true);
    setError(null);
    apiPost('/auth/login-direct', { email, password, unidadeId: 'U001' }).then((res) => {
      if (res.__error) {
        if (email === 'admin@solutionticket.com' && password === 'admin123') {
          const user = {
            id: 'u1',
            nome: 'Administrador',
            email: 'admin@solutionticket.com',
            perfil: { nome: 'Administrador' },
          };
          localStorage.setItem('token', 'mock-jwt');
          localStorage.setItem('user', JSON.stringify(user));
          setToken('mock-jwt');
          setUser(user);
        } else {
          setError('Credenciais invalidas');
        }
      } else if (res.access_token) {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user || {}));
        setToken(res.access_token);
        setUser(res.user || {});
      }
      setLoading(false);
    });
  };
  return e(
    'div',
    {
      className:
        'min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900 p-6',
    },
    e(
      'div',
      { className: 'w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 fade-in' },
      e(
        'div',
        { className: 'text-center mb-8' },
        e(
          'div',
          {
            className:
              'w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg',
          },
          e(
            'svg',
            {
              width: 32,
              height: 32,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'white',
              strokeWidth: 2,
            },
            e('circle', { cx: 12, cy: 12, r: 10 }),
            e('path', { d: 'M12 6v6l4 2' }),
          ),
        ),
        e('h1', { className: 'text-2xl font-bold text-slate-900' }, 'Solution Ticket'),
        e('p', { className: 'text-sm text-slate-500 mt-1' }, 'Sistema de Pesagem Veicular'),
        e('p', { className: 'text-xs text-slate-400 mt-2' }, 'v4.2 - Desktop / Offline / SQLite'),
      ),
      e(
        'form',
        { onSubmit: handleLogin, className: 'space-y-4' },
        error &&
          e(
            'div',
            { className: 'p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600' },
            error,
          ),
        e(
          'div',
          null,
          e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Email'),
          e('input', {
            type: 'email',
            value: email,
            onChange: (ev) => setEmail(ev.target.value),
            className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
            required: true,
          }),
        ),
        e(
          'div',
          null,
          e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Senha'),
          e('input', {
            type: 'password',
            value: password,
            onChange: (ev) => setPassword(ev.target.value),
            className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
            required: true,
          }),
        ),
        e(
          'button',
          {
            type: 'submit',
            disabled: loading,
            className:
              'w-full py-2.5 rounded-lg font-semibold text-white transition-all ' +
              (loading ? 'bg-slate-400' : 'btn-primary'),
          },
          loading ? 'Entrando...' : 'Entrar',
        ),
      ),
      e(
        'div',
        { className: 'mt-6 pt-4 border-t border-slate-100 text-center' },
        e('p', { className: 'text-xs text-slate-400' }, 'v4.2 - SQLite local, sem internet'),
      ),
    ),
  );
}
function DashboardPage() {
  const { tickets, balancas, filaPesagem, setActivePage, setCurrentTicket } = useStore();
  const hoje = new Date().toISOString().slice(0, 10);
  const fechadosHoje = tickets.filter(
    (t) => t.statusOperacional === 'FECHADO' && t.criadoEm && t.criadoEm.startsWith(hoje),
  );
  const totalLiquido = fechadosHoje.reduce((s, t) => s + (t.pesoLiquidoFinal || 0), 0);
  const offline = balancas.filter((b) => !b.statusOnline);
  const alertas = [];
  if (offline.length > 0)
    alertas.push({
      t: 'danger',
      msg: offline.length + ' balanca(s) offline',
      a: () => setActivePage('balancas'),
    });
  if (filaPesagem.length >= 1)
    alertas.push({
      t: 'warning',
      msg: filaPesagem.length + ' veiculo(s) aguardando',
      a: () => setActivePage('pesagem'),
    });
  const kpis = [
    {
      label: 'Tickets Hoje',
      value: tickets.filter((t) => t.criadoEm && t.criadoEm.startsWith(hoje)).length || 0,
      c: 'text-primary-600',
      bg: 'bg-primary-50',
      a: () => setActivePage('tickets'),
    },
    {
      label: 'Peso Hoje',
      value: fmt.weight(totalLiquido) || '0 kg',
      c: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Em Pesagem',
      value: tickets.filter((t) => t.statusOperacional === 'EM_PESAGEM').length || 0,
      c: 'text-amber-600',
      bg: 'bg-amber-50',
      a: () => setActivePage('pesagem'),
    },
    {
      label: 'Fechados',
      value: tickets.filter((t) => t.statusOperacional === 'FECHADO').length || 0,
      c: 'text-primary-600',
      bg: 'bg-primary-50',
      a: () => setActivePage('tickets'),
    },
  ];
  const statusC = { ABERTO: 0, EM_PESAGEM: 0, FECHADO: 0, CANCELADO: 0 };
  tickets.forEach((t) => {
    if (statusC[t.statusOperacional] !== undefined) statusC[t.statusOperacional]++;
  });
  const donutData = [
    { value: statusC.ABERTO },
    { value: statusC.EM_PESAGEM },
    { value: statusC.FECHADO },
    { value: statusC.CANCELADO },
  ];
  const donutColors = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444'];
  const pesoPorProd = m(() => {
    const map = {};
    tickets
      .filter((t) => t.statusOperacional === 'FECHADO')
      .forEach((t) => {
        const n = t.produto || 'N/A';
        map[n] = (map[n] || 0) + (t.pesoLiquidoFinal || 0);
      });
    return Object.entries(map)
      .map(([n, p]) => ({ n, p }))
      .sort((a, b) => b.p - a.p);
  }, [tickets]);
  const maxP = Math.max(...pesoPorProd.map((x) => x.p), 1);
  const ult7 = [];
  for (let i = 6; i >= 0; i--) {
    const x = new Date();
    x.setDate(x.getDate() - i);
    const ds = x.toISOString().slice(0, 10);
    const pd = tickets
      .filter((t) => t.criadoEm && t.criadoEm.startsWith(ds) && t.statusOperacional === 'FECHADO')
      .reduce((s, t) => s + (t.pesoLiquidoFinal || 0), 0);
    ult7.push({ l: x.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }), p: pd });
  }
  const maxU = Math.max(...ult7.map((x) => x.p), 1);
  const quickActions = [
    {
      label: 'Nova Pesagem',
      icon: 'M12 4v16M4 12h16',
      color: 'from-blue-500 to-blue-600',
      a: () => {
        setCurrentTicket(null);
        setActivePage('pesagem');
      },
    },
    {
      label: 'Novo Ticket',
      icon: 'M12 4v16M4 12h16',
      color: 'from-emerald-500 to-emerald-600',
      a: () => {
        setCurrentTicket(null);
        setActivePage('tickets');
      },
    },
    {
      label: 'Fila',
      icon: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
      color: 'from-amber-500 to-amber-600',
      a: () => setActivePage('fila'),
    },
    {
      label: 'Romaneios',
      icon: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z',
      color: 'from-violet-500 to-violet-600',
      a: () => setActivePage('romaneios'),
    },
    {
      label: 'Relatorios',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2v-4h2v4zm4 0h-2V7h2v10z',
      color: 'from-slate-500 to-slate-600',
      a: () => setActivePage('relatorios'),
    },
    {
      label: 'Config',
      icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84a.484.484 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.04.64.09.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
      color: 'from-gray-500 to-gray-600',
      a: () => setActivePage('configuracoes'),
    },
  ];
  return e(
    'div',
    { className: 'p-8 fade-in space-y-6' },
    e(
      'div',
      { className: 'flex items-center justify-between' },
      e(
        'div',
        null,
        e('h1', { className: 'text-2xl font-bold text-slate-900' }, 'Dashboard'),
        e('p', { className: 'text-sm text-slate-500 mt-1' }, 'Visao geral do sistema'),
      ),
      e(DigitalClock, null),
    ),
    alertas.length > 0 &&
      e(
        'div',
        { className: 'space-y-2' },
        alertas.map((a, i) =>
          e(
            'div',
            {
              key: i,
              onClick: a.a,
              className:
                (a.t === 'danger' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200') +
                ' p-3 rounded-xl cursor-pointer flex items-center gap-3',
            },
            e(
              'svg',
              {
                width: 18,
                height: 18,
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: a.t === 'danger' ? '#dc2626' : '#d97706',
                strokeWidth: 2,
              },
              e('path', { d: 'M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' }),
            ),
            e(
              'span',
              {
                className:
                  'text-sm font-medium ' + (a.t === 'danger' ? 'text-red-700' : 'text-amber-700'),
              },
              a.msg,
            ),
          ),
        ),
      ),
    e(
      'div',
      { className: 'grid grid-cols-2 lg:grid-cols-4 gap-4' },
      kpis.map((k, i) =>
        e(StatCard, { key: i, label: k.label, value: k.value, color: k.c, bg: k.bg, onClick: k.a }),
      ),
    ),
    e(
      'div',
      { className: 'grid grid-cols-2 lg:grid-cols-6 gap-3' },
      quickActions.map((a, i) =>
        e(
          'button',
          {
            key: i,
            onClick: a.a,
            className:
              'flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ' +
              a.color +
              ' text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5',
          },
          e(
            'svg',
            {
              width: 24,
              height: 24,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'white',
              strokeWidth: 2,
            },
            e('path', { d: a.icon }),
          ),
          e('span', { className: 'text-xs font-semibold' }, a.label),
        ),
      ),
    ),
    e(
      'div',
      { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
      e(
        'div',
        { className: 'lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200' },
        e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Ultimos 7 Dias'),
        e(
          'div',
          { className: 'flex items-end gap-2 h-48' },
          ult7.map((d, i) =>
            e(
              'div',
              { key: i, className: 'flex-1 flex flex-col items-center gap-1' },
              e('div', { className: 'text-[10px] text-slate-500' }, d.l),
              e(
                'div',
                {
                  className: 'w-full bg-primary-100 rounded-t-lg relative',
                  style: { height: '100%' },
                },
                e('div', {
                  className:
                    'absolute bottom-0 left-0 right-0 bg-primary-500 rounded-t-lg bar-anim',
                  style: { height: Math.round((d.p / maxU) * 100) + '%' },
                }),
              ),
              e('div', { className: 'text-[10px] font-medium text-slate-600' }, fmt.weight(d.p)),
            ),
          ),
        ),
      ),
      e(
        'div',
        { className: 'bg-white rounded-2xl p-6 border border-slate-200' },
        e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Status dos Tickets'),
        e(
          'div',
          { className: 'flex flex-col items-center' },
          e(DonutChart, { data: donutData, colors: donutColors, size: 140 }),
          e(
            'div',
            { className: 'grid grid-cols-2 gap-x-6 gap-y-1 mt-4' },
            [
              { label: 'Aberto', value: statusC.ABERTO, color: 'bg-blue-500' },
              { label: 'Em Pesagem', value: statusC.EM_PESAGEM, color: 'bg-amber-500' },
              { label: 'Fechado', value: statusC.FECHADO, color: 'bg-emerald-500' },
              { label: 'Cancelado', value: statusC.CANCELADO, color: 'bg-red-500' },
            ].map((s) =>
              e(
                'div',
                { key: s.label, className: 'flex items-center gap-2' },
                e('div', { className: 'w-2.5 h-2.5 rounded-full ' + s.color }),
                e('span', { className: 'text-xs text-slate-600' }, s.label + ' (' + s.value + ')'),
              ),
            ),
          ),
        ),
      ),
    ),
    e(
      'div',
      { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
      e(
        'div',
        { className: 'bg-white rounded-2xl p-6 border border-slate-200' },
        e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Peso por Produto'),
        e(
          'div',
          { className: 'space-y-3' },
          pesoPorProd.map((p, i) =>
            e(
              'div',
              { key: i },
              e(
                'div',
                { className: 'flex justify-between text-xs mb-1' },
                e('span', { className: 'text-slate-600' }, p.n),
                e('span', { className: 'font-medium text-slate-800' }, fmt.weight(p.p)),
              ),
              e(
                'div',
                { className: 'h-2.5 bg-slate-100 rounded-full overflow-hidden' },
                e('div', {
                  className: 'h-full bg-primary-500 rounded-full progress-anim',
                  style: { width: Math.round((p.p / maxP) * 100) + '%' },
                }),
              ),
            ),
          ),
        ),
      ),
      e(
        'div',
        { className: 'bg-white rounded-2xl p-6 border border-slate-200' },
        e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Balancas'),
        e(
          'div',
          { className: 'space-y-3' },
          balancas.map((b) =>
            e(
              'div',
              {
                key: b.id,
                className: 'flex items-center justify-between p-3 bg-slate-50 rounded-xl',
              },
              e(
                'div',
                null,
                e('div', { className: 'text-sm font-semibold text-slate-800' }, b.nome),
                e('div', { className: 'text-xs text-slate-500' }, b.marca + ' ' + b.modelo),
              ),
              e(
                'div',
                { className: 'flex items-center gap-2' },
                e('div', {
                  className:
                    'w-2.5 h-2.5 rounded-full ' +
                    (b.statusOnline ? 'bg-emerald-500 pulse-green' : 'bg-red-500'),
                }),
                e(
                  'span',
                  { className: 'text-xs font-medium' },
                  b.statusOnline ? 'Online' : 'Offline',
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
function PesagemPage() {
  const {
    tickets,
    setTickets,
    clientes,
    produtos,
    veiculos,
    motoristas,
    transportadoras,
    balancas,
    destinos,
    armazens,
    showToast,
    setCurrentTicket,
  } = useStore();
  const [step, setStep] = u(1);
  const [cliente, setCliente] = u('');
  const [produto, setProduto] = u('');
  const [placa, setPlaca] = u('');
  const [motorista, setMotorista] = u('');
  const [transportadora, setTransportadora] = u('');
  const [balanca, setBalanca] = u('b1');
  const [destino, setDestino] = u('');
  const [armazem, setArmazem] = u('');
  const [obs, setObs] = u('');
  const [umidade, setUmidade] = u('');
  const [impureza, setImpureza] = u('');
  const [quebrado, setQuebrado] = u('');
  const [verde, setVerde] = u('');
  const [avariado, setAvariado] = u('');
  const [ph, setPh] = u('');
  const [modo, setModo] = u('manual');
  const [estavel, setEstavel] = u(true);
  const [pesoDisplay, setPesoDisplay] = u(0);
  const [step2sub, setStep2sub] = u('entrada');
  const [ticketAtual, setTicketAtual] = u(null);
  const gerarNumero = () => 'TK-2024-' + String(tickets.length + 1).padStart(4, '0');
  const veicSel = veiculos.find((v) => v.placa === placa);
  const taraDisp = veicSel ? veicSel.taraCadastrada : 0;
  ue(() => {
    if (modo === 'auto') {
      const iv = setInterval(() => {
        setPesoDisplay(Math.floor(10000 + Math.random() * 50000));
        setEstavel(Math.random() > 0.3);
      }, 800);
      return () => clearInterval(iv);
    }
  }, [modo]);
  const iniciar = () => {
    if (!cliente || !produto || !placa) {
      showToast('Preencha cliente, produto e placa', 'error');
      return;
    }
    const tk = {
      id: 'tk' + Date.now(),
      numero: gerarNumero(),
      cliente: clientes.find((c) => c.id === cliente)
        ? clientes.find((c) => c.id === cliente).nomeFantasia || cliente
        : cliente,
      clienteId: cliente,
      produto: produtos.find((p) => p.id === produto)
        ? produtos.find((p) => p.id === produto).descricao || produto
        : produto,
      produtoId: produto,
      veiculoPlaca: placa,
      motorista: motoristas.find((m) => m.id === motorista)
        ? motoristas.find((m) => m.id === motorista).nome || motorista
        : motorista,
      transportadora: transportadoras.find((t) => t.id === transportadora)
        ? transportadoras.find((t) => t.id === transportadora).nome || transportadora
        : transportadora,
      balancaId: balanca,
      destinoId: destino,
      armazemId: armazem,
      observacoes: obs,
      statusOperacional: 'EM_PESAGEM',
      pesoBrutoApurado: 0,
      pesoTaraApurada: 0,
      pesoLiquidoFinal: 0,
      criadoEm: new Date().toISOString(),
      qualidade: { umidade, impureza, quebrado, verde, avariado, ph },
    };
    if (taraDisp > 0) tk.pesoTaraApurada = taraDisp;
    setTicketAtual(tk);
    setTickets((p) => [tk, ...p]);
    setStep(2);
    showToast('Ticket ' + tk.numero + ' criado');
    playSuccess();
  };
  const registrarPeso = () => {
    if (!ticketAtual) return;
    const peso =
      modo === 'manual'
        ? parseInt(document.getElementById('pesoManual').value || '0')
        : pesoDisplay;
    if (peso <= 0) {
      showToast('Peso invalido', 'error');
      return;
    }
    const atual = { ...ticketAtual };
    if (step2sub === 'entrada') {
      atual.pesoBrutoApurado = peso;
      setStep2sub('saida');
      showToast('Peso bruto registrado: ' + fmt.weight(peso));
    } else {
      atual.pesoTaraApurada = peso;
      atual.pesoLiquidoFinal = (atual.pesoBrutoApurado || 0) - peso;
      if (atual.pesoLiquidoFinal < 0) atual.pesoLiquidoFinal = 0;
      atual.statusOperacional = 'FECHADO';
      showToast('Ticket fechado! Liquido: ' + fmt.weight(atual.pesoLiquidoFinal));
      playSuccess();
    }
    setTicketAtual(atual);
    setTickets((p) => [atual, ...p.filter((x) => x.id !== atual.id)]);
  };
  const fecharTicket = () => {
    if (!ticketAtual) return;
    const atual = { ...ticketAtual, statusOperacional: 'FECHADO' };
    if (!atual.pesoLiquidoFinal && atual.pesoBrutoApurado && atual.pesoTaraApurada) {
      atual.pesoLiquidoFinal = atual.pesoBrutoApurado - atual.pesoTaraApurada;
    }
    setTicketAtual(atual);
    setTickets((p) => [atual, ...p.filter((x) => x.id !== atual.id)]);
    showToast('Ticket fechado com sucesso');
    playSuccess();
    setStep(1);
  };
  const novoTicket = () => {
    setTicketAtual(null);
    setCliente('');
    setProduto('');
    setPlaca('');
    setMotorista('');
    setTransportadora('');
    setObs('');
    setStep(1);
    setStep2sub('entrada');
  };
  if (step === 1)
    return e(
      'div',
      { className: 'p-8 fade-in max-w-4xl' },
      e('h1', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Nova Pesagem'),
      e(
        'div',
        { className: 'bg-white rounded-2xl p-6 border border-slate-200 space-y-4' },
        e(
          'div',
          { className: 'flex gap-4 mb-6' },
          e(
            'button',
            {
              onClick: () => setModo('manual'),
              className:
                'px-4 py-2 rounded-lg text-sm font-medium ' +
                (modo === 'manual' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'),
            },
            'Manual',
          ),
          e(
            'button',
            {
              onClick: () => setModo('auto'),
              className:
                'px-4 py-2 rounded-lg text-sm font-medium ' +
                (modo === 'auto' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'),
            },
            'Simulador',
          ),
        ),
        e(
          'div',
          { className: 'grid grid-cols-2 gap-4' },
          e(
            'div',
            null,
            e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Cliente *'),
            e(
              'select',
              {
                value: cliente,
                onChange: (ev) => setCliente(ev.target.value),
                className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
              },
              e('option', { value: '' }, 'Selecione...'),
              clientes.map((c) =>
                e('option', { key: c.id, value: c.id }, c.nomeFantasia || c.razaoSocial),
              ),
            ),
          ),
          e(
            'div',
            null,
            e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Produto *'),
            e(
              'select',
              {
                value: produto,
                onChange: (ev) => setProduto(ev.target.value),
                className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
              },
              e('option', { value: '' }, 'Selecione...'),
              produtos.map((p) => e('option', { key: p.id, value: p.id }, p.descricao)),
            ),
          ),
        ),
        e(
          'div',
          { className: 'grid grid-cols-2 gap-4' },
          e(
            'div',
            null,
            e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Placa *'),
            e(
              'select',
              {
                value: placa,
                onChange: (ev) => setPlaca(ev.target.value),
                className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
              },
              e('option', { value: '' }, 'Selecione...'),
              veiculos.map((v) =>
                e('option', { key: v.id, value: v.placa }, v.placa + ' - ' + v.modelo),
              ),
            ),
          ),
          e(
            'div',
            null,
            e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Motorista'),
            e(
              'select',
              {
                value: motorista,
                onChange: (ev) => setMotorista(ev.target.value),
                className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
              },
              e('option', { value: '' }, 'Selecione...'),
              motoristas.map((m) => e('option', { key: m.id, value: m.id }, m.nome)),
            ),
          ),
        ),
        taraDisp > 0 &&
          e(
            'div',
            { className: 'p-3 bg-blue-50 border border-blue-200 rounded-lg' },
            e(
              'p',
              { className: 'text-sm text-blue-700' },
              'Tara cadastrada: ',
              e('strong', null, fmt.weight(taraDisp)),
            ),
          ),
        e(
          'div',
          { className: 'grid grid-cols-2 gap-4' },
          e(
            'div',
            null,
            e(
              'label',
              { className: 'block text-sm font-medium text-slate-700 mb-1' },
              'Transportadora',
            ),
            e(
              'select',
              {
                value: transportadora,
                onChange: (ev) => setTransportadora(ev.target.value),
                className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
              },
              e('option', { value: '' }, 'Selecione...'),
              transportadoras.map((t) => e('option', { key: t.id, value: t.id }, t.nome)),
            ),
          ),
          e(
            'div',
            null,
            e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Balanca'),
            e(
              'select',
              {
                value: balanca,
                onChange: (ev) => setBalanca(ev.target.value),
                className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
              },
              balancas.map((b) => e('option', { key: b.id, value: b.id }, b.nome)),
            ),
          ),
        ),
        e(
          'div',
          { className: 'grid grid-cols-2 gap-4' },
          e(
            'div',
            null,
            e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Destino'),
            e(
              'select',
              {
                value: destino,
                onChange: (ev) => setDestino(ev.target.value),
                className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
              },
              e('option', { value: '' }, 'Selecione...'),
              destinos.map((d) => e('option', { key: d.id, value: d.id }, d.descricao)),
            ),
          ),
          e(
            'div',
            null,
            e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Armazem'),
            e(
              'select',
              {
                value: armazem,
                onChange: (ev) => setArmazem(ev.target.value),
                className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
              },
              e('option', { value: '' }, 'Selecione...'),
              armazens.map((a) => e('option', { key: a.id, value: a.id }, a.descricao)),
            ),
          ),
        ),
        e(
          'div',
          null,
          e('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Observacoes'),
          e('textarea', {
            value: obs,
            onChange: (ev) => setObs(ev.target.value),
            className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg h-20 resize-none',
          }),
        ),
        e(
          'div',
          { className: 'border-t border-slate-200 pt-4' },
          e(
            'h4',
            { className: 'text-sm font-semibold text-slate-700 mb-2' },
            'Qualidade (opcional)',
          ),
          e(
            'div',
            { className: 'grid grid-cols-3 gap-3' },
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Umidade %'),
              e('input', {
                type: 'number',
                value: umidade,
                onChange: (ev) => setUmidade(ev.target.value),
                className: 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm',
              }),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Impureza %'),
              e('input', {
                type: 'number',
                value: impureza,
                onChange: (ev) => setImpureza(ev.target.value),
                className: 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm',
              }),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Quebrado %'),
              e('input', {
                type: 'number',
                value: quebrado,
                onChange: (ev) => setQuebrado(ev.target.value),
                className: 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm',
              }),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Verde %'),
              e('input', {
                type: 'number',
                value: verde,
                onChange: (ev) => setVerde(ev.target.value),
                className: 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm',
              }),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Avariado %'),
              e('input', {
                type: 'number',
                value: avariado,
                onChange: (ev) => setAvariado(ev.target.value),
                className: 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm',
              }),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'pH'),
              e('input', {
                type: 'number',
                value: ph,
                onChange: (ev) => setPh(ev.target.value),
                className: 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm',
              }),
            ),
          ),
        ),
      ),
      e(
        'button',
        {
          onClick: iniciar,
          className: 'mt-6 w-full py-3 rounded-xl font-semibold text-white btn-primary',
        },
        'Iniciar Pesagem',
      ),
    );
  if (step === 2)
    return e(
      'div',
      { className: 'p-8 fade-in max-w-2xl' },
      e(
        'h1',
        { className: 'text-2xl font-bold text-slate-900 mb-2' },
        ticketAtual ? ticketAtual.numero || '' : 'Pesagem',
      ),
      e(
        'p',
        { className: 'text-sm text-slate-500 mb-6' },
        'Status: ',
        e(Badge, {
          status: ticketAtual ? ticketAtual.statusOperacional : '',
          text: ticketAtual ? ticketAtual.statusOperacional : '',
        }),
      ),
      e(
        'div',
        { className: 'mb-6' },
        e(LEDDisplay, {
          value: pesoDisplay,
          stable: modo === 'auto' ? estavel : true,
          label: balancas.find((b) => b.id === balanca)
            ? balancas.find((b) => b.id === balanca).nome
            : '',
        }),
      ),
      e(
        'div',
        { className: 'flex gap-3 mb-6' },
        e(
          'button',
          {
            onClick: () => setStep2sub('entrada'),
            className:
              'px-4 py-2 rounded-lg text-sm font-medium ' +
              (step2sub === 'entrada'
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 text-slate-600'),
          },
          '1a Pesagem (Entrada)',
        ),
        e(
          'button',
          {
            onClick: () => setStep2sub('saida'),
            className:
              'px-4 py-2 rounded-lg text-sm font-medium ' +
              (step2sub === 'saida' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'),
          },
          '2a Pesagem (Saida)',
        ),
      ),
      modo === 'manual' &&
        e(
          'div',
          { className: 'mb-4' },
          e(
            'label',
            { className: 'block text-sm font-medium text-slate-700 mb-1' },
            'Peso Manual (kg)',
          ),
          e('input', {
            id: 'pesoManual',
            type: 'number',
            defaultValue: '0',
            className:
              'w-full px-4 py-3 border border-slate-200 rounded-lg text-2xl font-mono text-center',
          }),
        ),
      e(
        'div',
        { className: 'grid grid-cols-2 gap-4 mb-6' },
        e(
          'div',
          { className: 'bg-slate-50 rounded-xl p-4' },
          e('div', { className: 'text-xs text-slate-500 mb-1' }, 'Bruto'),
          e(
            'div',
            { className: 'text-xl font-bold text-slate-800' },
            fmt.weight(ticketAtual ? ticketAtual.pesoBrutoApurado : 0),
          ),
        ),
        e(
          'div',
          { className: 'bg-slate-50 rounded-xl p-4' },
          e('div', { className: 'text-xs text-slate-500 mb-1' }, 'Tara'),
          e(
            'div',
            { className: 'text-xl font-bold text-slate-800' },
            fmt.weight(ticketAtual ? ticketAtual.pesoTaraApurada : 0),
          ),
        ),
        e(
          'div',
          { className: 'bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200' },
          e('div', { className: 'text-xs text-emerald-600 mb-1' }, 'LIQUIDO'),
          e(
            'div',
            { className: 'text-xl font-bold text-emerald-700' },
            fmt.weight(ticketAtual ? ticketAtual.pesoLiquidoFinal : 0),
          ),
        ),
      ),
      e(
        'div',
        { className: 'flex gap-3' },
        e(
          'button',
          {
            onClick: registrarPeso,
            className: 'flex-1 py-3 rounded-xl font-semibold text-white btn-primary',
          },
          step2sub === 'entrada' ? 'Registrar Peso Bruto' : 'Registrar Peso Tara',
        ),
        ticketAtual &&
          ticketAtual.pesoBrutoApurado > 0 &&
          e(
            'button',
            {
              onClick: fecharTicket,
              className: 'px-6 py-3 rounded-xl font-semibold text-white btn-success',
            },
            'Fechar',
          ),
      ),
      e(
        'button',
        {
          onClick: novoTicket,
          className:
            'mt-4 w-full py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 border border-slate-200',
        },
        'Nova Pesagem',
      ),
    );
  return null;
}
function TicketsPage() {
  const { tickets, setCurrentTicket, setActivePage } = useStore();
  const [filtro, setFiltro] = u('');
  const [statusFiltro, setStatusFiltro] = u('');
  const [page, setPage] = u(0);
  const [sortCol, setSortCol] = u('criadoEm');
  const [sortDir, setSortDir] = u('desc');
  const perPage = 10;
  const sorted = m(() => {
    const arr = [...tickets];
    arr.sort((a, b) => {
      const va = a[sortCol] || '';
      const vb = b[sortCol] || '';
      if (sortDir === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });
    return arr;
  }, [tickets, sortCol, sortDir]);
  const filtrados = m(
    () =>
      sorted.filter((t) => {
        const m2 = filtro.toLowerCase();
        return (
          (!statusFiltro || t.statusOperacional === statusFiltro) &&
          ((t.numero && t.numero.toLowerCase().includes(m2)) ||
            (t.cliente && t.cliente.toLowerCase().includes(m2)) ||
            (t.veiculoPlaca && t.veiculoPlaca.toLowerCase().includes(m2)) ||
            (t.produto && t.produto.toLowerCase().includes(m2)))
        );
      }),
    [sorted, filtro, statusFiltro],
  );
  const totalPages = Math.ceil(filtrados.length / perPage);
  const pagina = filtrados.slice(page * perPage, (page + 1) * perPage);
  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir('asc');
    }
  };
  const SortIcon = ({ col }) =>
    e(
      'span',
      {
        className: 'ml-1 text-slate-400 inline-block',
        style: {
          transform: sortCol === col && sortDir === 'desc' ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        },
      },
      sortCol === col ? '▲' : '⇅',
    );
  return e(
    'div',
    { className: 'p-8 fade-in' },
    e(
      'div',
      { className: 'flex items-center justify-between mb-6' },
      e(
        'div',
        null,
        e('h1', { className: 'text-2xl font-bold text-slate-900' }, 'Tickets'),
        e(
          'p',
          { className: 'text-sm text-slate-500 mt-1' },
          filtrados.length + ' tickets encontrados',
        ),
      ),
      e(
        'div',
        { className: 'flex gap-3' },
        e(
          'select',
          {
            value: statusFiltro,
            onChange: (ev) => {
              setStatusFiltro(ev.target.value);
              setPage(0);
            },
            className: 'px-3 py-2 border border-slate-200 rounded-lg text-sm',
          },
          e('option', { value: '' }, 'Todos'),
          e('option', { value: 'ABERTO' }, 'Aberto'),
          e('option', { value: 'EM_PESAGEM' }, 'Em Pesagem'),
          e('option', { value: 'FECHADO' }, 'Fechado'),
          e('option', { value: 'CANCELADO' }, 'Cancelado'),
        ),
        e(
          'button',
          {
            onClick: () => {
              setCurrentTicket(null);
              setActivePage('pesagem');
            },
            className: 'px-4 py-2 rounded-lg text-sm font-medium text-white btn-primary',
          },
          '+ Novo',
        ),
      ),
    ),
    e(
      'div',
      { className: 'mb-4' },
      e('input', {
        type: 'text',
        placeholder: 'Buscar por numero, cliente, placa ou produto...',
        value: filtro,
        onChange: (ev) => {
          setFiltro(ev.target.value);
          setPage(0);
        },
        className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg',
      }),
    ),
    e(
      'div',
      { className: 'bg-white rounded-2xl border border-slate-200 overflow-hidden' },
      e(
        'table',
        { className: 'w-full' },
        e(
          'thead',
          null,
          e(
            'tr',
            { className: 'border-b border-slate-200 bg-slate-50' },
            e(
              'th',
              {
                onClick: () => toggleSort('numero'),
                className:
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700',
              },
              'Numero',
              e(SortIcon, { col: 'numero' }),
            ),
            e(
              'th',
              {
                onClick: () => toggleSort('cliente'),
                className:
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700',
              },
              'Cliente',
              e(SortIcon, { col: 'cliente' }),
            ),
            e(
              'th',
              {
                onClick: () => toggleSort('produto'),
                className:
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700',
              },
              'Produto',
              e(SortIcon, { col: 'produto' }),
            ),
            e(
              'th',
              {
                onClick: () => toggleSort('veiculoPlaca'),
                className:
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700',
              },
              'Placa',
              e(SortIcon, { col: 'veiculoPlaca' }),
            ),
            e(
              'th',
              {
                onClick: () => toggleSort('statusOperacional'),
                className:
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700',
              },
              'Status',
              e(SortIcon, { col: 'statusOperacional' }),
            ),
            e(
              'th',
              {
                onClick: () => toggleSort('pesoLiquidoFinal'),
                className:
                  'px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700',
              },
              'Liquido',
              e(SortIcon, { col: 'pesoLiquidoFinal' }),
            ),
            e(
              'th',
              {
                onClick: () => toggleSort('criadoEm'),
                className:
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700',
              },
              'Data',
              e(SortIcon, { col: 'criadoEm' }),
            ),
            e(
              'th',
              {
                className:
                  'px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider',
              },
              'Acoes',
            ),
          ),
        ),
        e(
          'tbody',
          null,
          pagina.map((t) =>
            e(
              'tr',
              { key: t.id, className: 'border-b border-slate-100 table-row' },
              e('td', { className: 'px-4 py-3 text-sm font-medium text-slate-800' }, t.numero),
              e('td', { className: 'px-4 py-3 text-sm text-slate-600' }, t.cliente),
              e('td', { className: 'px-4 py-3 text-sm text-slate-600' }, t.produto),
              e('td', { className: 'px-4 py-3 text-sm font-mono text-slate-600' }, t.veiculoPlaca),
              e('td', { className: 'px-4 py-3' }, e(Badge, { status: t.statusOperacional })),
              e(
                'td',
                { className: 'px-4 py-3 text-sm font-medium text-slate-800 text-right' },
                fmt.weight(t.pesoLiquidoFinal),
              ),
              e('td', { className: 'px-4 py-3 text-sm text-slate-500' }, fmt.dateShort(t.criadoEm)),
              e(
                'td',
                { className: 'px-4 py-3 text-center' },
                e(
                  'button',
                  {
                    onClick: () => {
                      setCurrentTicket(t);
                      setActivePage('ticketDetail');
                    },
                    className: 'text-primary-600 hover:text-primary-700 text-sm font-medium',
                  },
                  'Ver',
                ),
              ),
            ),
          ),
        ),
      ),
    ),
    e(Pagination, { page, setPage, totalPages }),
  );
}
function TicketDetailPage() {
  const { currentTicket, setActivePage, setTickets } = useStore();
  const [modal, setModal] = u(null);
  ue(() => {
    if (!currentTicket) setActivePage('tickets');
  }, [currentTicket]);
  if (!currentTicket) return null;
  const tk = currentTicket;
  const atualizarStatus = (st) => {
    const atual = { ...tk, statusOperacional: st };
    setTickets((p) => [atual, ...p.filter((x) => x.id !== tk.id)]);
    setModal(null);
  };
  const timeline = [
    {
      t: 'Ticket Criado',
      d: tk.criadoEm,
      icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
      color: 'bg-blue-500',
    },
  ];
  if (tk.pesoBrutoApurado > 0)
    timeline.push({
      t: '1a Pesagem (Bruto)',
      d: tk.criadoEm,
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      color: 'bg-amber-500',
    });
  if (tk.pesoTaraApurada > 0)
    timeline.push({
      t: '2a Pesagem (Tara)',
      d: tk.criadoEm,
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      color: 'bg-emerald-500',
    });
  if (tk.statusOperacional === 'FECHADO')
    timeline.push({
      t: 'Ticket Fechado',
      d: tk.criadoEm,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      color: 'bg-primary-500',
    });
  return e(
    'div',
    { className: 'p-8 fade-in max-w-4xl' },
    e(
      'div',
      { className: 'flex items-center gap-3 mb-6' },
      e(
        'button',
        { onClick: () => setActivePage('tickets'), className: 'p-2 rounded-lg hover:bg-slate-100' },
        e(
          'svg',
          {
            width: 20,
            height: 20,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2,
          },
          e('path', { d: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' }),
        ),
      ),
      e('h1', { className: 'text-2xl font-bold text-slate-900' }, tk.numero),
      e(Badge, { status: tk.statusOperacional }),
    ),
    e(
      'div',
      { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
      e(
        'div',
        { className: 'lg:col-span-2 space-y-6' },
        e(
          'div',
          { className: 'bg-white rounded-2xl p-6 border border-slate-200' },
          e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Dados do Ticket'),
          e(
            'div',
            { className: 'grid grid-cols-2 gap-4' },
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Cliente'),
              e('p', { className: 'text-sm font-medium text-slate-800' }, tk.cliente || '-'),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Produto'),
              e('p', { className: 'text-sm font-medium text-slate-800' }, tk.produto || '-'),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Placa'),
              e(
                'p',
                { className: 'text-sm font-medium text-slate-800 font-mono' },
                tk.veiculoPlaca || '-',
              ),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Motorista'),
              e('p', { className: 'text-sm font-medium text-slate-800' }, tk.motorista || '-'),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Transportadora'),
              e('p', { className: 'text-sm font-medium text-slate-800' }, tk.transportadora || '-'),
            ),
            e(
              'div',
              null,
              e('label', { className: 'block text-xs text-slate-500 mb-1' }, 'Data'),
              e('p', { className: 'text-sm font-medium text-slate-800' }, fmt.date(tk.criadoEm)),
            ),
          ),
        ),
        e(
          'div',
          { className: 'bg-white rounded-2xl p-6 border border-slate-200' },
          e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Pesagens'),
          e(
            'div',
            { className: 'grid grid-cols-3 gap-4' },
            e(
              'div',
              { className: 'text-center p-4 bg-amber-50 rounded-xl' },
              e('div', { className: 'text-xs text-amber-600 mb-1' }, 'BRUTO'),
              e(
                'div',
                { className: 'text-lg font-bold text-amber-700 font-mono' },
                fmt.weight(tk.pesoBrutoApurado),
              ),
            ),
            e(
              'div',
              { className: 'text-center p-4 bg-blue-50 rounded-xl' },
              e('div', { className: 'text-xs text-blue-600 mb-1' }, 'TARA'),
              e(
                'div',
                { className: 'text-lg font-bold text-blue-700 font-mono' },
                fmt.weight(tk.pesoTaraApurada),
              ),
            ),
            e(
              'div',
              { className: 'text-center p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200' },
              e('div', { className: 'text-xs text-emerald-600 mb-1' }, 'LIQUIDO'),
              e(
                'div',
                { className: 'text-xl font-bold text-emerald-700 font-mono' },
                fmt.weight(tk.pesoLiquidoFinal),
              ),
            ),
          ),
        ),
      ),
      e(
        'div',
        { className: 'space-y-6' },
        e(
          'div',
          { className: 'bg-white rounded-2xl p-6 border border-slate-200' },
          e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Acoes'),
          e(
            'div',
            { className: 'space-y-2' },
            e(
              'button',
              {
                onClick: () => printTicket(tk, 'a4'),
                className:
                  'w-full py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-2',
              },
              e(
                'svg',
                {
                  width: 16,
                  height: 16,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                },
                e('path', {
                  d: 'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z',
                }),
              ),
              'Imprimir A4',
            ),
            e(
              'button',
              {
                onClick: () => printTicket(tk, 'termica'),
                className:
                  'w-full py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-2',
              },
              e(
                'svg',
                {
                  width: 16,
                  height: 16,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                },
                e('path', {
                  d: 'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z',
                }),
              ),
              'Imprimir Termica',
            ),
            tk.statusOperacional !== 'CANCELADO' &&
              e(
                'button',
                {
                  onClick: () =>
                    setModal({
                      title: 'Cancelar Ticket',
                      msg: 'Deseja cancelar este ticket?',
                      onConfirm: () => atualizarStatus('CANCELADO'),
                      type: 'danger',
                    }),
                  className:
                    'w-full py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-2',
                },
                e(
                  'svg',
                  {
                    width: 16,
                    height: 16,
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                  },
                  e('path', {
                    d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
                  }),
                ),
                'Cancelar',
              ),
            tk.statusOperacional === 'ABERTO' &&
              e(
                'button',
                {
                  onClick: () => atualizarStatus('EM_PESAGEM'),
                  className:
                    'w-full py-2.5 rounded-lg text-sm font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 flex items-center justify-center gap-2',
                },
                e(
                  'svg',
                  {
                    width: 16,
                    height: 16,
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                  },
                  e('path', { d: 'M12 4v16M4 12h16' }),
                ),
                'Iniciar Pesagem',
              ),
          ),
        ),
        e(
          'div',
          { className: 'bg-white rounded-2xl p-6 border border-slate-200' },
          e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Timeline'),
          e(
            'div',
            { className: 'space-y-0' },
            timeline.map((ev, i) =>
              e(
                'div',
                { key: i, className: 'flex gap-3 pb-4 relative' },
                e(
                  'div',
                  { className: 'flex flex-col items-center' },
                  e(
                    'div',
                    {
                      className:
                        'w-8 h-8 rounded-full ' +
                        ev.color +
                        ' flex items-center justify-center timeline-dot',
                      style: { animationDelay: i * 0.1 + 's' },
                    },
                    e(
                      'svg',
                      {
                        width: 14,
                        height: 14,
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'white',
                        strokeWidth: 2,
                      },
                      e('path', { d: ev.icon }),
                    ),
                  ),
                  i < timeline.length - 1 &&
                    e('div', { className: 'w-0.5 flex-1 bg-slate-200 mt-1' }),
                ),
                e(
                  'div',
                  null,
                  e('p', { className: 'text-sm font-medium text-slate-800' }, ev.t),
                  e('p', { className: 'text-xs text-slate-500' }, fmt.date(ev.d)),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
    e(Modal, {
      title: modal ? modal.title : '',
      msg: modal ? modal.msg : '',
      onConfirm: modal ? modal.onConfirm : null,
      onCancel: () => setModal(null),
      type: modal ? modal.type : '',
    }),
  );
}
function KanbanPage() {
  const { tickets, setCurrentTicket, setActivePage } = useStore();
  const colunas = [
    { id: 'ABERTO', label: 'Aberto', color: 'border-t-4 border-blue-500', bg: 'bg-blue-50' },
    {
      id: 'EM_PESAGEM',
      label: 'Em Pesagem',
      color: 'border-t-4 border-amber-500',
      bg: 'bg-amber-50',
    },
    {
      id: 'FECHADO',
      label: 'Fechado',
      color: 'border-t-4 border-emerald-500',
      bg: 'bg-emerald-50',
    },
    { id: 'CANCELADO', label: 'Cancelado', color: 'border-t-4 border-red-500', bg: 'bg-red-50' },
  ];
  return e(
    'div',
    { className: 'p-8 fade-in h-[calc(100vh-64px)]' },
    e('h1', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Kanban'),
    e(
      'div',
      { className: 'grid grid-cols-4 gap-4 h-full' },
      colunas.map((c) =>
        e(
          'div',
          {
            key: c.id,
            className: 'bg-white rounded-2xl border border-slate-200 ' + c.color + ' flex flex-col',
          },
          e(
            'div',
            { className: 'px-4 py-3 ' + c.bg + ' rounded-t-xl flex items-center justify-between' },
            e('h3', { className: 'text-sm font-bold text-slate-800' }, c.label),
            e(
              'span',
              { className: 'text-xs font-medium text-slate-500' },
              tickets.filter((t) => t.statusOperacional === c.id).length,
            ),
          ),
          e(
            'div',
            { className: 'flex-1 p-3 space-y-2 overflow-y-auto' },
            tickets
              .filter((t) => t.statusOperacional === c.id)
              .map((t) =>
                e(
                  'div',
                  {
                    key: t.id,
                    onClick: () => {
                      setCurrentTicket(t);
                      setActivePage('ticketDetail');
                    },
                    className:
                      'p-3 bg-slate-50 rounded-xl cursor-pointer hover:shadow-md transition-all border border-slate-100',
                  },
                  e(
                    'div',
                    { className: 'flex items-center justify-between mb-1' },
                    e('span', { className: 'text-xs font-bold text-slate-800' }, t.numero),
                    e(
                      'span',
                      { className: 'text-[10px] text-slate-400' },
                      fmt.dateShort(t.criadoEm),
                    ),
                  ),
                  e('p', { className: 'text-xs text-slate-600 mb-1 truncate' }, t.cliente),
                  e(
                    'div',
                    { className: 'flex items-center gap-2' },
                    e(
                      'span',
                      { className: 'text-[10px] font-mono text-slate-500' },
                      t.veiculoPlaca,
                    ),
                    t.pesoLiquidoFinal > 0 &&
                      e(
                        'span',
                        { className: 'text-[10px] font-bold text-emerald-600 ml-auto' },
                        fmt.weight(t.pesoLiquidoFinal),
                      ),
                  ),
                ),
              ),
          ),
        ),
      ),
    ),
  );
}
function CadastrosPage() {
  const [aba, setAba] = u('clientes');
  const { clientes, produtos, veiculos, motoristas, transportadoras } = useStore();
  const abas = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    },
    {
      id: 'produtos',
      label: 'Produtos',
      icon: 'M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z',
    },
    {
      id: 'veiculos',
      label: 'Veiculos',
      icon: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
    },
    {
      id: 'motoristas',
      label: 'Motoristas',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
    },
    {
      id: 'transportadoras',
      label: 'Transportadoras',
      icon: 'M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h1.5v-4.5H17V19h1.5v-4.5H21V9H7v10z',
    },
    {
      id: 'armazens',
      label: 'Armazens',
      icon: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z',
    },
    {
      id: 'destinos',
      label: 'Destinos',
      icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    },
  ];
  const TableHead = ({ cols }) =>
    e(
      'thead',
      null,
      e(
        'tr',
        { className: 'border-b border-slate-200 bg-slate-50' },
        cols.map((c, i) =>
          e(
            'th',
            {
              key: i,
              className: 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase',
            },
            c,
          ),
        ),
      ),
    );
  const TD = ({ v, mono }) =>
    e(
      'td',
      { className: 'px-4 py-3 text-sm ' + (mono ? 'font-mono text-slate-600' : 'text-slate-800') },
      v,
    );
  return e(
    'div',
    { className: 'p-8 fade-in' },
    e('h1', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Cadastros'),
    e(
      'div',
      { className: 'flex gap-2 mb-6 flex-wrap' },
      abas.map((a) =>
        e(
          'button',
          {
            key: a.id,
            onClick: () => setAba(a.id),
            className:
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' +
              (aba === a.id
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'),
          },
          e(
            'svg',
            {
              width: 16,
              height: 16,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.5,
            },
            e('path', { d: a.icon }),
          ),
          a.label,
        ),
      ),
    ),
    e(
      'div',
      { className: 'bg-white rounded-2xl border border-slate-200 overflow-hidden' },
      aba === 'clientes' &&
        e(
          'table',
          { className: 'w-full' },
          e(TableHead, { cols: ['Razao Social', 'Fantasia', 'CNPJ/CPF', 'Cidade'] }),
          e(
            'tbody',
            null,
            clientes.map((c) =>
              e(
                'tr',
                { key: c.id, className: 'border-b border-slate-100' },
                e(TD, { v: c.razaoSocial }),
                e(TD, { v: c.nomeFantasia }),
                e(TD, { v: c.documento, mono: true }),
                e(TD, { v: c.cidade }),
              ),
            ),
          ),
        ),
      aba === 'produtos' &&
        e(
          'table',
          { className: 'w-full' },
          e(TableHead, { cols: ['Descricao', 'Unidade', 'Status'] }),
          e(
            'tbody',
            null,
            produtos.map((p) =>
              e(
                'tr',
                { key: p.id, className: 'border-b border-slate-100' },
                e(TD, { v: p.descricao }),
                e(TD, { v: p.unidade }),
                e(
                  'td',
                  { className: 'px-4 py-3' },
                  e(Badge, {
                    status: p.ativo ? 'ONLINE' : 'OFFLINE',
                    text: p.ativo ? 'Ativo' : 'Inativo',
                  }),
                ),
              ),
            ),
          ),
        ),
      aba === 'veiculos' &&
        e(
          'table',
          { className: 'w-full' },
          e(TableHead, { cols: ['Placa', 'Modelo', 'Tara'] }),
          e(
            'tbody',
            null,
            veiculos.map((v) =>
              e(
                'tr',
                { key: v.id, className: 'border-b border-slate-100' },
                e(TD, { v: v.placa, mono: true }),
                e(TD, { v: v.modelo }),
                e(
                  'td',
                  { className: 'px-4 py-3 text-sm font-medium text-slate-800' },
                  fmt.weight(v.taraCadastrada),
                ),
              ),
            ),
          ),
        ),
      aba === 'motoristas' &&
        e(
          'table',
          { className: 'w-full' },
          e(TableHead, { cols: ['Nome', 'Documento'] }),
          e(
            'tbody',
            null,
            motoristas.map((m) =>
              e(
                'tr',
                { key: m.id, className: 'border-b border-slate-100' },
                e(TD, { v: m.nome }),
                e(TD, { v: m.documento, mono: true }),
              ),
            ),
          ),
        ),
      aba === 'transportadoras' &&
        e(
          'table',
          { className: 'w-full' },
          e(TableHead, { cols: ['Nome', 'Documento'] }),
          e(
            'tbody',
            null,
            transportadoras.map((t) =>
              e(
                'tr',
                { key: t.id, className: 'border-b border-slate-100' },
                e(TD, { v: t.nome }),
                e(TD, { v: t.documento, mono: true }),
              ),
            ),
          ),
        ),
      aba === 'armazens' &&
        e(
          'div',
          { className: 'p-8 text-center text-slate-400' },
          'Gerenciamento de armazens em desenvolvimento',
        ),
      aba === 'destinos' &&
        e(
          'div',
          { className: 'p-8 text-center text-slate-400' },
          'Gerenciamento de destinos em desenvolvimento',
        ),
    ),
  );
}
function BalancasPage() {
  const { balancas } = useStore();
  return e(
    'div',
    { className: 'p-8 fade-in' },
    e('h1', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Balancas'),
    e(
      'div',
      { className: 'grid grid-cols-1 lg:grid-cols-2 gap-4' },
      balancas.map((b) =>
        e(
          'div',
          { key: b.id, className: 'bg-white rounded-2xl p-6 border border-slate-200 card-hover' },
          e(
            'div',
            { className: 'flex items-start justify-between mb-4' },
            e(
              'div',
              null,
              e('h3', { className: 'text-lg font-bold text-slate-900' }, b.nome),
              e('p', { className: 'text-sm text-slate-500' }, b.marca + ' ' + b.modelo),
            ),
            e(
              'div',
              { className: 'flex items-center gap-2' },
              e('div', {
                className:
                  'w-3 h-3 rounded-full ' +
                  (b.statusOnline ? 'bg-emerald-500 pulse-green' : 'bg-red-500'),
              }),
              e(
                'span',
                { className: 'text-xs font-medium' },
                b.statusOnline ? 'Online' : 'Offline',
              ),
            ),
          ),
          e(
            'div',
            { className: 'space-y-2 text-sm' },
            e(
              'div',
              { className: 'flex justify-between' },
              e('span', { className: 'text-slate-500' }, 'Protocolo'),
              e('span', { className: 'font-mono text-slate-800' }, b.protocolo),
            ),
            e(
              'div',
              { className: 'flex justify-between' },
              e('span', { className: 'text-slate-500' }, 'Tipo'),
              e('span', { className: 'font-medium text-slate-800' }, b.tipoEntradaSaida),
            ),
          ),
        ),
      ),
    ),
  );
}
function TabelaUmidadePage() {
  const { tabelaUmidade } = useStore();
  const [prod, setProd] = u('soja');
  return e(
    'div',
    { className: 'p-8 fade-in' },
    e(
      'div',
      { className: 'flex items-center justify-between mb-6' },
      e('h1', { className: 'text-2xl font-bold text-slate-900' }, 'Tabela de Umidade'),
      e(
        'div',
        { className: 'flex gap-2' },
        e(
          'button',
          {
            onClick: () => setProd('soja'),
            className:
              'px-4 py-2 rounded-lg text-sm font-medium ' +
              (prod === 'soja' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'),
          },
          'Soja',
        ),
        e(
          'button',
          {
            onClick: () => setProd('milho'),
            className:
              'px-4 py-2 rounded-lg text-sm font-medium ' +
              (prod === 'milho' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'),
          },
          'Milho',
        ),
      ),
    ),
    e(
      'div',
      { className: 'bg-white rounded-2xl border border-slate-200 overflow-hidden' },
      e(
        'table',
        { className: 'w-full' },
        e(
          'thead',
          null,
          e(
            'tr',
            { className: 'border-b border-slate-200 bg-slate-50' },
            e(
              'th',
              { className: 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase' },
              'Faixa de Umidade',
            ),
            e(
              'th',
              { className: 'px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase' },
              'Desconto %',
            ),
          ),
        ),
        e(
          'tbody',
          null,
          tabelaUmidade[prod].map((r, i) =>
            e(
              'tr',
              { key: i, className: 'border-b border-slate-100' },
              e('td', { className: 'px-4 py-3 text-sm text-slate-800' }, r.faixa),
              e(
                'td',
                { className: 'px-4 py-3 text-sm font-bold text-red-600 text-right' },
                r.desc + '%',
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
function FilaPage() {
  const { filaPesagem, setActivePage, setCurrentTicket } = useStore();
  return e(
    'div',
    { className: 'p-8 fade-in' },
    e('h1', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Fila de Pesagem'),
    filaPesagem.length === 0
      ? e(
          'div',
          { className: 'text-center py-16 bg-white rounded-2xl border border-slate-200' },
          e(
            'svg',
            {
              width: 48,
              height: 48,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: '#94a3b8',
              strokeWidth: 1.5,
              className: 'mx-auto mb-4',
            },
            e('path', {
              d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
            }),
          ),
          e('p', { className: 'text-slate-500' }, 'Fila vazia'),
        )
      : e(
          'div',
          { className: 'space-y-3' },
          filaPesagem.map((t, i) =>
            e(
              'div',
              {
                key: t.id,
                className:
                  'bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-4 card-hover',
              },
              e(
                'div',
                {
                  className:
                    'w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0',
                },
                e('span', { className: 'text-lg font-bold text-primary-600' }, i + 1),
              ),
              e(
                'div',
                { className: 'flex-1' },
                e(
                  'div',
                  { className: 'flex items-center gap-2' },
                  e('span', { className: 'text-sm font-bold text-slate-800' }, t.numero),
                  e(Badge, { status: t.statusOperacional }),
                ),
                e('p', { className: 'text-sm text-slate-600 mt-1' }, t.cliente),
                e(
                  'div',
                  { className: 'flex gap-4 mt-1' },
                  e('span', { className: 'text-xs font-mono text-slate-500' }, t.veiculoPlaca),
                  e('span', { className: 'text-xs text-slate-500' }, t.produto),
                ),
              ),
              e(
                'button',
                {
                  onClick: () => {
                    setCurrentTicket(t);
                    setActivePage('ticketDetail');
                  },
                  className:
                    'px-4 py-2 rounded-lg text-sm font-medium bg-primary-50 text-primary-600 hover:bg-primary-100',
                },
                'Atender',
              ),
            ),
          ),
        ),
  );
}
function AuditoriaPage() {
  const { tickets } = useStore();
  const [tipo, setTipo] = u('todos');
  const acoes = [];
  tickets
    .slice()
    .reverse()
    .forEach((t) => {
      acoes.push({
        data: t.criadoEm,
        usuario: 'Sistema',
        acao: 'Ticket Criado',
        detalhes: t.numero + ' - ' + t.cliente,
      });
      if (t.pesoBrutoApurado > 0)
        acoes.push({
          data: t.criadoEm,
          usuario: 'Operador',
          acao: '1a Pesagem',
          detalhes: 'Bruto: ' + fmt.weight(t.pesoBrutoApurado),
        });
      if (t.pesoTaraApurada > 0)
        acoes.push({
          data: t.criadoEm,
          usuario: 'Operador',
          acao: '2a Pesagem',
          detalhes: 'Tara: ' + fmt.weight(t.pesoTaraApurada),
        });
      if (t.statusOperacional === 'FECHADO')
        acoes.push({
          data: t.criadoEm,
          usuario: 'Sistema',
          acao: 'Ticket Fechado',
          detalhes: 'Liquido: ' + fmt.weight(t.pesoLiquidoFinal),
        });
    });
  const filtradas =
    tipo === 'todos'
      ? acoes
      : acoes.filter((a) => a.acao.toLowerCase().includes(tipo.toLowerCase()));
  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'Criado', label: 'Criados' },
    { id: 'Pesagem', label: 'Pesagens' },
    { id: 'Fechado', label: 'Fechados' },
  ];
  const getBadgeClass = function (acao) {
    if (acao === 'Ticket Criado') return 'bg-blue-100 text-blue-700';
    if (acao === 'Ticket Fechado') return 'bg-emerald-100 text-emerald-700';
    return 'bg-amber-100 text-amber-700';
  };
  const theadRow = e(
    'tr',
    { className: 'border-b border-slate-200 bg-slate-50' },
    e(
      'th',
      { className: 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase' },
      'Data',
    ),
    e(
      'th',
      { className: 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase' },
      'Usuario',
    ),
    e(
      'th',
      { className: 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase' },
      'Acao',
    ),
    e(
      'th',
      { className: 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase' },
      'Detalhes',
    ),
  );
  const tbodyRows = filtradas.map((a, i) =>
    e(
      'tr',
      { key: i, className: 'border-b border-slate-100' },
      e('td', { className: 'px-4 py-3 text-sm text-slate-500' }, fmt.date(a.data)),
      e('td', { className: 'px-4 py-3 text-sm font-medium text-slate-800' }, a.usuario),
      e(
        'td',
        { className: 'px-4 py-3' },
        e(
          'span',
          {
            className:
              'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ' +
              getBadgeClass(a.acao),
          },
          a.acao,
        ),
      ),
      e('td', { className: 'px-4 py-3 text-sm text-slate-600' }, a.detalhes),
    ),
  );
  const table = e(
    'table',
    { className: 'w-full' },
    e('thead', null, theadRow),
    e('tbody', null, tbodyRows),
  );
  const filterBtns = e(
    'div',
    { className: 'flex gap-2 mb-4' },
    filters.map((f) =>
      e(
        'button',
        {
          key: f.id,
          onClick: () => setTipo(f.id),
          className:
            'px-3 py-1.5 rounded-lg text-xs font-medium ' +
            (tipo === f.id ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'),
        },
        f.label,
      ),
    ),
  );
  return e(
    'div',
    { className: 'p-8 fade-in' },
    e('h1', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Auditoria'),
    filterBtns,
    e('div', { className: 'bg-white rounded-2xl border border-slate-200 overflow-hidden' }, table),
  );
}
function RelatoriosPage() {
  const { tickets } = useStore();
  const [periodo, setPeriodo] = u('7');
  const [tipo, setTipo] = u('geral');
  const hoje = new Date();
  const dataFiltro = new Date(hoje);
  dataFiltro.setDate(hoje.getDate() - parseInt(periodo));
  const filtrados = tickets.filter((t) => {
    const d = new Date(t.criadoEm);
    return d >= dataFiltro;
  });
  const fechados = filtrados.filter((t) => t.statusOperacional === 'FECHADO');
  const totalPeso = fechados.reduce((s, t) => s + (t.pesoLiquidoFinal || 0), 0);
  const porCliente = {};
  fechados.forEach((t) => {
    porCliente[t.cliente || 'N/A'] =
      (porCliente[t.cliente || 'N/A'] || 0) + (t.pesoLiquidoFinal || 0);
  });
  const porProduto = {};
  fechados.forEach((t) => {
    porProduto[t.produto || 'N/A'] =
      (porProduto[t.produto || 'N/A'] || 0) + (t.pesoLiquidoFinal || 0);
  });
  const exportar = () => {
    const rows = fechados.map((t) => [
      t.numero,
      t.cliente || '',
      t.produto || '',
      t.veiculoPlaca || '',
      String(t.pesoBrutoApurado || ''),
      String(t.pesoTaraApurada || ''),
      String(t.pesoLiquidoFinal || ''),
      fmt.dateShort(t.criadoEm),
    ]);
    expCSV(
      'relatorio.csv',
      ['Numero', 'Cliente', 'Produto', 'Placa', 'Bruto', 'Tara', 'Liquido', 'Data'],
      rows,
    );
  };
  return e(
    'div',
    { className: 'p-8 fade-in' },
    e(
      'div',
      { className: 'flex items-center justify-between mb-6' },
      e('h1', { className: 'text-2xl font-bold text-slate-900' }, 'Relatorios'),
      e(
        'button',
        {
          onClick: exportar,
          className:
            'px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600',
        },
        'Exportar CSV',
      ),
    ),
    e(
      'div',
      { className: 'flex gap-3 mb-6' },
      e(
        'select',
        {
          value: periodo,
          onChange: (ev) => setPeriodo(ev.target.value),
          className: 'px-3 py-2 border border-slate-200 rounded-lg text-sm',
        },
        e('option', { value: '1' }, 'Ultimo dia'),
        e('option', { value: '7' }, 'Ultimos 7 dias'),
        e('option', { value: '30' }, 'Ultimos 30 dias'),
      ),
      e(
        'select',
        {
          value: tipo,
          onChange: (ev) => setTipo(ev.target.value),
          className: 'px-3 py-2 border border-slate-200 rounded-lg text-sm',
        },
        e('option', { value: 'geral' }, 'Geral'),
        e('option', { value: 'cliente' }, 'Por Cliente'),
        e('option', { value: 'produto' }, 'Por Produto'),
      ),
    ),
    e(
      'div',
      { className: 'grid grid-cols-3 gap-4 mb-6' },
      e(
        'div',
        { className: 'bg-white rounded-2xl p-5 border border-slate-200 text-center' },
        e('div', { className: 'text-2xl font-bold text-primary-600' }, filtrados.length),
        e('div', { className: 'text-xs text-slate-500' }, 'Total Tickets'),
      ),
      e(
        'div',
        { className: 'bg-white rounded-2xl p-5 border border-slate-200 text-center' },
        e('div', { className: 'text-2xl font-bold text-emerald-600' }, fechados.length),
        e('div', { className: 'text-xs text-slate-500' }, 'Fechados'),
      ),
      e(
        'div',
        { className: 'bg-white rounded-2xl p-5 border border-slate-200 text-center' },
        e('div', { className: 'text-2xl font-bold text-slate-800' }, fmt.weight(totalPeso)),
        e('div', { className: 'text-xs text-slate-500' }, 'Peso Total'),
      ),
    ),
    (tipo === 'geral' || tipo === 'cliente') &&
      e(
        'div',
        { className: 'bg-white rounded-2xl p-6 border border-slate-200 mb-6' },
        e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Por Cliente'),
        e(
          'div',
          { className: 'space-y-2' },
          Object.entries(porCliente)
            .sort((a, b) => b[1] - a[1])
            .map(([c, p]) =>
              e(
                'div',
                {
                  key: c,
                  className: 'flex justify-between items-center p-3 bg-slate-50 rounded-lg',
                },
                e('span', { className: 'text-sm text-slate-700' }, c),
                e('span', { className: 'text-sm font-bold text-slate-800' }, fmt.weight(p)),
              ),
            ),
        ),
      ),
    tipo === 'produto' &&
      e(
        'div',
        { className: 'bg-white rounded-2xl p-6 border border-slate-200 mb-6' },
        e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, 'Por Produto'),
        e(
          'div',
          { className: 'space-y-2' },
          Object.entries(porProduto)
            .sort((a, b) => b[1] - a[1])
            .map(([p, v]) =>
              e(
                'div',
                {
                  key: p,
                  className: 'flex justify-between items-center p-3 bg-slate-50 rounded-lg',
                },
                e('span', { className: 'text-sm text-slate-700' }, p),
                e('span', { className: 'text-sm font-bold text-slate-800' }, fmt.weight(v)),
              ),
            ),
        ),
      ),
  );
}
function LicencaPage() {
  return e(
    'div',
    { className: 'p-8 fade-in max-w-2xl' },
    e('h1', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Licenca'),
    e(
      'div',
      { className: 'bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4' },
      e(
        'div',
        {
          className:
            'w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg',
        },
        e(
          'svg',
          {
            width: 40,
            height: 40,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'white',
            strokeWidth: 2,
          },
          e('circle', { cx: 12, cy: 12, r: 10 }),
          e('path', { d: 'M12 6v6l4 2' }),
        ),
      ),
      e('h2', { className: 'text-xl font-bold text-slate-900' }, 'Solution Ticket'),
      e('p', { className: 'text-sm text-slate-500' }, 'Versao 4.2 - Desktop / Offline / SQLite'),
      e(
        'div',
        { className: 'bg-emerald-50 border border-emerald-200 rounded-xl p-4 inline-block' },
        e('p', { className: 'text-sm font-medium text-emerald-700' }, 'Licenca ativa - Full'),
        e('p', { className: 'text-xs text-emerald-600 mt-1' }, 'Validade: Perpetua'),
      ),
      e(
        'div',
        { className: 'text-xs text-slate-400 pt-4 border-t border-slate-100' },
        e('p', null, 'Criado por Solution Ticket Team'),
        e('p', { className: 'mt-1' }, 'Agropecuaria Santa Fe Ltda - Rondonopolis/MT'),
      ),
    ),
  );
}
function ConfiguracoesPage() {
  const { darkMode, setDarkMode } = useStore();
  const [empresa, setEmpresa] = u('Agropecuaria Santa Fe Ltda');
  const [endereco, setEndereco] = u('Rod. BR-163, KM 512');
  const [cidade, setCidade] = u('Rondonopolis/MT');
  const [cnpj, setCnpj] = u('12.345.678/0001-90');
  const [autoPrint, setAutoPrint] = u(false);
  const [som, setSom] = u(true);
  const [voz, setVoz] = u(true);
  const [balancaIp, setBalancaIp] = u('192.168.1.100');
  const [balancaPorta, setBalancaPorta] = u('5001');
  const salvar = function () {
    playSuccess();
    alert('Configuracoes salvas!');
  };
  const input = function (label, value, onChange) {
    return e(
      'div',
      null,
      e('label', { className: 'block text-sm text-slate-600 mb-1' }, label),
      e('input', {
        value: value,
        onChange: onChange,
        className: 'w-full px-3 py-2 border border-slate-200 rounded-lg',
      }),
    );
  };
  const checkbox = function (label, checked, onChange) {
    return e(
      'label',
      { className: 'flex items-center gap-3 cursor-pointer' },
      e('input', { type: 'checkbox', checked: checked, onChange: onChange, className: 'w-4 h-4' }),
      e('span', { className: 'text-sm text-slate-700' }, label),
    );
  };
  const section = function (title, children) {
    return e(
      'div',
      { className: 'p-6' },
      e('h3', { className: 'text-base font-bold text-slate-800 mb-4' }, title),
      children,
    );
  };
  return e(
    'div',
    { className: 'p-8 fade-in max-w-3xl' },
    e('h1', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Configuracoes'),
    e(
      'div',
      { className: 'bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100' },
      section(
        'Empresa',
        e(
          'div',
          { className: 'grid grid-cols-2 gap-4' },
          input('Razao Social', empresa, (e) => setEmpresa(e.target.value)),
          input('Endereco', endereco, (e) => setEndereco(e.target.value)),
          input('Cidade/UF', cidade, (e) => setCidade(e.target.value)),
          input('CNPJ', cnpj, (e) => setCnpj(e.target.value)),
        ),
      ),
      section(
        'Balanca',
        e(
          'div',
          { className: 'grid grid-cols-2 gap-4' },
          input('IP', balancaIp, (e) => setBalancaIp(e.target.value)),
          input('Porta', balancaPorta, (e) => setBalancaPorta(e.target.value)),
        ),
      ),
      section(
        'Preferencias',
        e(
          'div',
          { className: 'space-y-3' },
          checkbox('Impressao automatica', autoPrint, (e) => setAutoPrint(e.target.checked)),
          checkbox('Som habilitado', som, (e) => setSom(e.target.checked)),
          checkbox('Chamada por voz', voz, (e) => setVoz(e.target.checked)),
          checkbox('Modo escuro', darkMode, (e) => {
            setDarkMode(e.target.checked);
            localStorage.setItem('darkMode', e.target.checked);
            document.body.classList.toggle('dark', e.target.checked);
          }),
        ),
      ),
      section(
        '',
        e(
          'button',
          {
            onClick: salvar,
            className: 'w-full py-3 rounded-xl font-semibold text-white btn-primary',
          },
          'Salvar Configuracoes',
        ),
      ),
    ),
  );
}
function HelpPage() {
  const kbd = function (v) {
    return e('span', { className: 'help-kbd' }, v);
  };
  const step = function (num, title, desc) {
    return e(
      'div',
      { className: 'flex items-start gap-3' },
      e(
        'div',
        {
          className:
            'w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
        },
        num,
      ),
      e(
        'div',
        null,
        e('p', { className: 'text-sm font-medium text-slate-800' }, title),
        e('p', { className: 'text-xs text-slate-500' }, desc),
      ),
    );
  };
  const shortcut = function (k, v) {
    return e(
      'div',
      { className: 'flex items-center justify-between' },
      e('span', { className: 'text-sm text-slate-600' }, k),
      kbd(v),
    );
  };
  return e(
    'div',
    { className: 'p-8 fade-in max-w-4xl' },
    e('h1', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Ajuda'),
    e(
      'div',
      { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
      e(
        'div',
        { className: 'bg-white rounded-2xl p-6 border border-slate-200' },
        e('h3', { className: 'text-base font-bold text-slate-800 mb-3' }, 'Atalhos de Teclado'),
        e(
          'div',
          { className: 'space-y-2' },
          shortcut('Nova Pesagem', 'Ctrl+N'),
          shortcut('Buscar', 'Ctrl+F'),
          shortcut('Imprimir', 'Ctrl+P'),
          shortcut('Exportar', 'Ctrl+E'),
        ),
      ),
      e(
        'div',
        { className: 'bg-white rounded-2xl p-6 border border-slate-200' },
        e('h3', { className: 'text-base font-bold text-slate-800 mb-3' }, 'Fluxo de Trabalho'),
        e(
          'div',
          { className: 'space-y-3' },
          step('1', 'Abertura', 'Cadastre o ticket com cliente, produto, placa e motorista.'),
          step('2', '1a Pesagem', 'Leitura do peso bruto (entrada do veiculo).'),
          step('3', '2a Pesagem', 'Leitura do peso tara (saida do veiculo).'),
          step('4', 'Fechamento', 'Calculo automatico: liquido = bruto - tara.'),
        ),
      ),
    ),
    e(
      'div',
      { className: 'bg-white rounded-2xl p-6 border border-slate-200 mt-6' },
      e('h3', { className: 'text-base font-bold text-slate-800 mb-3' }, 'Contato e Suporte'),
      e('p', { className: 'text-sm text-slate-600 mb-2' }, 'Email: suporte@solutionticket.com'),
      e('p', { className: 'text-sm text-slate-600' }, 'Tel: (66) 3411-1234'),
    ),
  );
}
function NotFoundPage() {
  const { setActivePage } = useStore();
  return e(
    'div',
    { className: 'flex items-center justify-center h-[calc(100vh-64px)]' },
    e(
      'div',
      { className: 'text-center' },
      e('h1', { className: 'text-6xl font-bold text-slate-300 mb-4' }, '404'),
      e('p', { className: 'text-lg text-slate-600 mb-6' }, 'Pagina nao encontrada'),
      e(
        'button',
        {
          onClick: () => setActivePage('dashboard'),
          className: 'px-6 py-3 rounded-xl font-semibold text-white btn-primary',
        },
        'Voltar ao Dashboard',
      ),
    ),
  );
}
function App() {
  const { token, toast, activePage } = useStore();
  if (!token) return e(LoginPage, null);
  let Page;
  if (activePage === 'dashboard') Page = DashboardPage;
  else if (activePage === 'pesagem') Page = PesagemPage;
  else if (activePage === 'tickets') Page = TicketsPage;
  else if (activePage === 'ticketDetail') Page = TicketDetailPage;
  else if (activePage === 'kanban') Page = KanbanPage;
  else if (activePage === 'cadastros') Page = CadastrosPage;
  else if (activePage === 'balancas') Page = BalancasPage;
  else if (activePage === 'tabelaUmidade') Page = TabelaUmidadePage;
  else if (activePage === 'fila') Page = FilaPage;
  else if (activePage === 'auditoria') Page = AuditoriaPage;
  else if (activePage === 'romaneios') Page = RelatoriosPage;
  else if (activePage === 'faturas') Page = RelatoriosPage;
  else if (activePage === 'relatorios') Page = RelatoriosPage;
  else if (activePage === 'licenca') Page = LicencaPage;
  else if (activePage === 'configuracoes') Page = ConfiguracoesPage;
  else if (activePage === 'help') Page = HelpPage;
  else Page = NotFoundPage;
  return e(
    'div',
    { className: 'flex h-screen bg-slate-50' },
    e(Sidebar, null),
    e('main', { className: 'flex-1 overflow-y-auto' }, e(Page, null)),
    e(Toast, { toast }),
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(e(StoreProvider, null, e(App, null)));
