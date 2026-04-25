// Gera um .ico 256x256 azul solido (BMP embutido no container ICO).
// Formato ICO: header (6 bytes) + 1 entry (16 bytes) + BITMAPINFOHEADER (40) + XOR + AND masks.
const fs = require('fs');
const path = require('path');

const W = 256;
const H = 256;

function buildIco() {
  const headerSize = 40; // BITMAPINFOHEADER
  const xorSize = W * H * 4; // BGRA
  const andSize = (W * H) / 8; // 1bpp mask
  const dibSize = headerSize + xorSize + andSize;

  const buf = Buffer.alloc(6 + 16 + dibSize);
  let o = 0;
  // ICONDIR
  buf.writeUInt16LE(0, o);
  o += 2; // reserved
  buf.writeUInt16LE(1, o);
  o += 2; // type = icon
  buf.writeUInt16LE(1, o);
  o += 2; // count

  // ICONDIRENTRY
  buf.writeUInt8(0, o);
  o += 1; // width 0 = 256
  buf.writeUInt8(0, o);
  o += 1; // height 0 = 256
  buf.writeUInt8(0, o);
  o += 1; // colors
  buf.writeUInt8(0, o);
  o += 1; // reserved
  buf.writeUInt16LE(1, o);
  o += 2; // planes
  buf.writeUInt16LE(32, o);
  o += 2; // bpp
  buf.writeUInt32LE(dibSize, o);
  o += 4; // size
  buf.writeUInt32LE(6 + 16, o);
  o += 4; // offset

  // BITMAPINFOHEADER
  buf.writeUInt32LE(40, o);
  o += 4; // size
  buf.writeInt32LE(W, o);
  o += 4; // width
  buf.writeInt32LE(H * 2, o);
  o += 4; // height (XOR+AND)
  buf.writeUInt16LE(1, o);
  o += 2; // planes
  buf.writeUInt16LE(32, o);
  o += 2; // bpp
  buf.writeUInt32LE(0, o);
  o += 4; // compression
  buf.writeUInt32LE(xorSize, o);
  o += 4;
  buf.writeInt32LE(0, o);
  o += 4;
  buf.writeInt32LE(0, o);
  o += 4;
  buf.writeUInt32LE(0, o);
  o += 4;
  buf.writeUInt32LE(0, o);
  o += 4;

  // XOR pixels (BGRA), bottom-up. Azul solido com leve gradient diagonal
  for (let y = H - 1; y >= 0; y--) {
    for (let x = 0; x < W; x++) {
      const t = (x + (H - 1 - y)) / (W + H);
      const b = Math.round(180 + 60 * t); // 180..240
      const g = Math.round(80 + 40 * t);
      const r = Math.round(20 + 30 * t);
      buf.writeUInt8(b, o++); // B
      buf.writeUInt8(g, o++); // G
      buf.writeUInt8(r, o++); // R
      buf.writeUInt8(255, o++); // A
    }
  }
  // AND mask = zeros (tudo opaco)
  for (let i = 0; i < andSize; i++) buf.writeUInt8(0, o++);

  return buf;
}

const out = path.join(__dirname, 'assets', 'icon.ico');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buildIco());
console.log('icon.ico gerado em', out, 'tamanho=', fs.statSync(out).size);
