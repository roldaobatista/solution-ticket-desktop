// Gera icon.ico 256x256 com silhueta de caminhao sobre balanca, gradient azul escuro.
// Escreve apenas um PNG 256x256 embrulhado como .ico (Windows aceita PNG dentro de ICO desde Vista).
// Usa canvas puro do Node via @napi-rs/canvas se disponivel; senao, desenha via buffer RGBA manual e salva BMP dentro do ICO.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 256;

// --- 1. Gera pixels RGBA manualmente (formato simples) ---

function gradient(y) {
  // Gradient vertical: topo #0f2147 -> baixo #2563eb
  const t = y / (SIZE - 1);
  const r = Math.round(0x0f + (0x25 - 0x0f) * t);
  const g = Math.round(0x21 + (0x63 - 0x21) * t);
  const b = Math.round(0x47 + (0xeb - 0x47) * t);
  return [r, g, b];
}

// Silhueta de caminhao tombado visto de lado + balanca embaixo (bloco horizontal).
// Coordenadas sobre um grid 256x256.
function isTruck(x, y) {
  // Caminhao ocupa parte central
  const cabLeft = 56,
    cabRight = 108,
    cabTop = 110,
    cabBottom = 170;
  const bodyLeft = 108,
    bodyRight = 200,
    bodyTop = 90,
    bodyBottom = 170;
  // Cabine
  if (x >= cabLeft && x <= cabRight && y >= cabTop && y <= cabBottom) return true;
  // Carroceria
  if (x >= bodyLeft && x <= bodyRight && y >= bodyTop && y <= bodyBottom) return true;
  // Rodas (circulos)
  const wheels = [
    { cx: 78, cy: 178, r: 14 },
    { cx: 160, cy: 178, r: 14 },
    { cx: 188, cy: 178, r: 14 },
  ];
  for (const w of wheels) {
    const dx = x - w.cx,
      dy = y - w.cy;
    if (dx * dx + dy * dy <= w.r * w.r) return true;
  }
  // Janela da cabine (recorte)
  if (x >= cabLeft + 8 && x <= cabRight - 8 && y >= cabTop + 8 && y <= cabTop + 30) return false;
  return false;
}

function isScale(x, y) {
  // Base da balanca (linha horizontal grande embaixo do caminhao)
  const left = 32,
    right = 224,
    top = 194,
    bottom = 214;
  if (x >= left && x <= right && y >= top && y <= bottom) return true;
  // Pes da balanca
  if (((x >= 40 && x <= 52) || (x >= 204 && x <= 216)) && y >= 214 && y <= 230) return true;
  return false;
}

function makeRGBA() {
  const buf = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    const [gr, gg, gb] = gradient(y);
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      if (isTruck(x, y)) {
        // Branco com leve sombra
        buf[i] = 240;
        buf[i + 1] = 248;
        buf[i + 2] = 255;
        buf[i + 3] = 255;
      } else if (isScale(x, y)) {
        // Vermelho Balancas Solution
        buf[i] = 220;
        buf[i + 1] = 38;
        buf[i + 2] = 38;
        buf[i + 3] = 255;
      } else {
        buf[i] = gr;
        buf[i + 1] = gg;
        buf[i + 2] = gb;
        buf[i + 3] = 255;
      }
    }
  }
  return buf;
}

// --- 2. Codifica como PNG (minimalista) ---

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typ = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typ, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typ, data, crc]);
}

function encodePNG(rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT: filter byte 0 por linha
  const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0;
    rgba.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- 3. Embrulha PNG como .ico ---

function encodeICO(pngBuf) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type ICO
  header.writeUInt16LE(1, 4); // count

  const dir = Buffer.alloc(16);
  dir[0] = 0; // width 256 (0 = 256)
  dir[1] = 0; // height 256
  dir[2] = 0; // palette
  dir[3] = 0; // reserved
  dir.writeUInt16LE(1, 4); // planes
  dir.writeUInt16LE(32, 6); // bpp
  dir.writeUInt32LE(pngBuf.length, 8);
  dir.writeUInt32LE(6 + 16, 12); // offset

  return Buffer.concat([header, dir, pngBuf]);
}

// --- Main ---

const rgba = makeRGBA();
const png = encodePNG(rgba);
const ico = encodeICO(png);
const out = path.join(__dirname, 'icon.ico');
fs.writeFileSync(out, ico);
console.log(`Icone gerado: ${out} (${ico.length} bytes)`);
