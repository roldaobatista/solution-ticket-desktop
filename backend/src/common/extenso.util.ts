// Converte numero em extenso em portugues-BR (reais e centavos)

const UNIDADES = ['', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const DEZ_A_DEZENOVE = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];
const DEZENAS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
];
const CENTENAS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function grupoExtenso(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const partes: string[] = [];
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(DEZ_A_DEZENOVE[resto - 10]);
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      if (u === 0) partes.push(DEZENAS[d]);
      else partes.push(`${DEZENAS[d]} e ${UNIDADES[u]}`);
    }
  }
  return partes.join(' e ');
}

function inteiroExtenso(n: number): string {
  if (n === 0) return 'zero';
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const unidades = n % 1000;
  const partes: string[] = [];
  if (milhoes > 0) partes.push(milhoes === 1 ? 'um milhao' : `${grupoExtenso(milhoes)} milhoes`);
  if (milhares > 0) partes.push(milhares === 1 ? 'mil' : `${grupoExtenso(milhares)} mil`);
  if (unidades > 0) partes.push(grupoExtenso(unidades));
  return partes.join(' e ');
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function numeroParaExtenso(valor: number): string {
  if (valor == null || isNaN(valor)) return '';
  const negativo = valor < 0;
  const abs = Math.abs(valor);
  const inteiros = Math.floor(abs);
  const centavos = Math.round((abs - inteiros) * 100);

  const partes: string[] = [];
  if (inteiros > 0) {
    const ext = inteiroExtenso(inteiros);
    partes.push(`${ext} ${inteiros === 1 ? 'real' : 'reais'}`);
  }
  if (centavos > 0) {
    const ext = inteiroExtenso(centavos);
    partes.push(`${ext} ${centavos === 1 ? 'centavo' : 'centavos'}`);
  }
  if (partes.length === 0) return 'Zero reais';

  const resultado = partes.join(' e ');
  return (negativo ? 'Menos ' : '') + capitalize(resultado);
}
