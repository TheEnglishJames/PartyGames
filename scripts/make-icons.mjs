// Generates the PWA icons (a wedding couple silhouette and a heart on pink) without any image tooling.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

const inCircle = (u, v, cx, cy, r) => (u - cx) ** 2 + (v - cy) ** 2 <= r * r;

// Heart from the classic implicit curve; s is the half-width in grid units.
function inHeart(u, v, cx, cy, s) {
  const x = (u - cx) / s;
  const y = (cy - v) / s;
  return (x * x + y * y - 1) ** 3 - x * x * y * y * y <= 0;
}

// Bride's gown: a trapezoid that widens towards the bottom of the icon. grow adds a halo.
function inGown(u, v, grow = 0) {
  if (v < 41 - grow) return false;
  const half = 5 + ((v - 41) / 59) * 17 + grow;
  return Math.abs(u - 63) <= half;
}

const PINK = [0xff, 0x3d, 0x8b];
const PLUM = [0x14, 0x10, 0x1f];
const GOLD = [0xff, 0xb8, 0x00];

// Design grid is 100x100; the figures stay inside the maskable safe zone (radius 40 around the centre).
function colorAt(u, v) {
  if (inHeart(u, v, 50, 18, 5.5)) return GOLD;
  // Bride: gown, head and updo.
  if (inGown(u, v) || inCircle(u, v, 63, 35, 9) || inCircle(u, v, 71, 28, 4.5)) return PLUM;
  // A pink halo around the bride cuts into the groom where they overlap.
  if (inGown(u, v, 1.8) || inCircle(u, v, 63, 35, 10.8) || inCircle(u, v, 71, 28, 6.3)) return PINK;
  // Groom: head and suit body, bleeding off the bottom edge.
  if (inCircle(u, v, 38, 35, 9.5) || inRoundRect(u, v, 28, 45, 48, 110, 9)) return PLUM;
  return PINK;
}

function icon(size) {
  const s = size / 100;
  const n = 3; // 3x3 samples per pixel for soft edges
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const rgb = colorAt((x + (i + 0.5) / n) / s, (y + (j + 0.5) / n) / s);
          for (let c = 0; c < 3; c++) sum[c] += rgb[c];
        }
      }
      raw.set(sum.map((c) => Math.round(c / (n * n))), y * (size * 3 + 1) + 1 + x * 3);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), icon(size));
}
console.log('icons written');
