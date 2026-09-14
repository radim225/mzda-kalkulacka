import zlib from "node:zlib";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32 } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

function chunk(tag, data) {
  const t = Buffer.from(tag);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0);
  return Buffer.concat([len, t, data, crc]);
}

function writePng(path, width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(path);
    stream.on("finish", resolve);
    stream.on("error", reject);
    stream.end(png);
  });
}

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function roundedRectSdf(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx) - (hw - r);
  const dy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - r;
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function paint(size, { maskable = false } = {}) {
  const data = Buffer.alloc(size * size * 4);
  const pad = maskable ? size * 0.18 : size * 0.06;
  const cx = size / 2;
  const cy = size / 2;
  const hw = size / 2 - pad;
  const hh = size / 2 - pad;
  const radius = hw * 0.28;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = roundedRectSdf(x + 0.5, y + 0.5, cx, cy, hw, hh, radius);
      const edge = clamp01(0.5 - d);
      const inner = clamp01((8 - d) / 8);

      const gx = x / size;
      const gy = y / size;
      const bgR = mix(12, 21, gy);
      const bgG = mix(18, 42, gx);
      const bgB = mix(32, 48, gy);

      let r = bgR;
      let g = bgG;
      let b = bgB;
      let a = 255;

      const coin = Math.hypot(x + 0.5 - cx, y + 0.5 - (cy - size * 0.04)) - size * 0.22;
      const coinEdge = clamp01(0.6 - Math.abs(coin));
      const coinFill = clamp01(0.5 - coin);
      const mint = [94, 224, 181];
      const mintDark = [18, 90, 72];
      r = mix(r, mintDark[0], coinFill * 0.95);
      g = mix(g, mintDark[1], coinFill * 0.95);
      b = mix(b, mintDark[2], coinFill * 0.95);
      r = mix(r, mint[0], coinEdge * 0.9);
      g = mix(g, mint[1], coinEdge * 0.9);
      b = mix(b, mint[2], coinEdge * 0.9);

      const barW = size * 0.035;
      const barGap = size * 0.07;
      const bars = [-1.1, 0, 1.1];
      const heights = [0.18, 0.28, 0.22];
      for (let i = 0; i < 3; i++) {
        const bx = cx + bars[i] * barGap;
        const top = cy + size * 0.08 - heights[i] * size;
        const bot = cy + size * 0.14;
        const dx = Math.abs(x + 0.5 - bx) - barW;
        const dy = Math.abs(y + 0.5 - (top + bot) / 2) - (bot - top) / 2;
        const bd = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
        const fill = clamp01(0.6 - bd);
        r = mix(r, 238, fill);
        g = mix(g, 246, fill);
        b = mix(b, 242, fill);
      }

      if (!maskable) {
        a = Math.round(edge * 255);
        r = mix(0, r, edge);
        g = mix(0, g, edge);
        b = mix(0, b, edge);
      } else {
        const full = clamp01(edge);
        r = mix(12, r, full);
        g = mix(18, g, full);
        b = mix(32, b, full);
      }

      const o = (y * size + x) * 4;
      data[o] = Math.round(r);
      data[o + 1] = Math.round(g);
      data[o + 2] = Math.round(b);
      data[o + 3] = a;
    }
  }
  return data;
}

await mkdir(outDir, { recursive: true });
await writePng(join(outDir, "icon-192.png"), 192, 192, paint(192));
await writePng(join(outDir, "icon-512.png"), 512, 512, paint(512));
await writePng(join(outDir, "icon-512-maskable.png"), 512, 512, paint(512, { maskable: true }));
await writePng(join(outDir, "apple-touch-icon.png"), 180, 180, paint(180, { maskable: true }));
console.log("icons written to", outDir);
